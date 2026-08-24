import { TOOL_DEFINITIONS } from './tools';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: Array<{ id: string; name: string; input: Record<string, unknown> }>;
  toolCallId?: string;
  toolName?: string;
}

export interface LLMResponse {
  content: string;
  toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }>;
}

type ToolSpec = {
  name: string;
  description: string;
  inputSchema: { json: Record<string, unknown> };
};

const toolSpecs = TOOL_DEFINITIONS.map((tool) => tool.toolSpec as ToolSpec);

function getProvider(): 'groq' | 'gemini' {
  const provider = (process.env.LLM_PROVIDER || 'groq').toLowerCase();
  if (provider !== 'groq' && provider !== 'gemini') {
    throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
  }
  return provider;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

async function completeWithGroq(systemPrompt: string, messages: LLMMessage[]): Promise<LLMResponse> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getRequiredEnv('GROQ_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => {
          if (message.role === 'tool') {
            return {
              role: 'tool',
              tool_call_id: message.toolCallId,
              content: message.content,
            };
          }
          return {
            role: message.role,
            content: message.content,
            ...(message.toolCalls
              ? {
                  tool_calls: message.toolCalls.map((toolCall) => ({
                    id: toolCall.id,
                    type: 'function',
                    function: { name: toolCall.name, arguments: JSON.stringify(toolCall.input) },
                  })),
                }
              : {}),
          };
        }),
      ],
      tools: toolSpecs.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema.json,
        },
      })),
      tool_choice: 'auto',
    }),
  });

  if (!response.ok) throw new Error(`Groq API error: ${await response.text()}`);
  const data = await response.json();
  const message = data.choices?.[0]?.message;
  if (!message) throw new Error('No response message from Groq');

  return {
    content: message.content || '',
    toolCalls: (message.tool_calls || []).map((toolCall: { id: string; function: { name: string; arguments: string } }) => ({
      id: toolCall.id,
      name: toolCall.function.name,
      input: parseJsonObject(toolCall.function.arguments),
    })),
  };
}

async function completeWithGemini(systemPrompt: string, messages: LLMMessage[]): Promise<LLMResponse> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getRequiredEnv('GEMINI_API_KEY')}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map((message) => {
        if (message.role === 'tool') {
          return {
            role: 'user',
            parts: [{
              functionResponse: {
                name: message.toolName,
                response: { result: parseJsonObject(message.content) },
              },
            }],
          };
        }

        const parts: Array<Record<string, unknown>> = [];
        if (message.content) parts.push({ text: message.content });
        for (const toolCall of message.toolCalls || []) {
          parts.push({ functionCall: { name: toolCall.name, args: toolCall.input } });
        }
        return { role: message.role === 'assistant' ? 'model' : 'user', parts };
      }),
      tools: [{ functionDeclarations: toolSpecs.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema.json,
      })) }],
      generationConfig: { temperature: 0 },
    }),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${await response.text()}`);
  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];

  return {
    content: parts.filter((part: { text?: string }) => part.text).map((part: { text: string }) => part.text).join('\n'),
    toolCalls: parts.filter((part: { functionCall?: { name: string; args?: Record<string, unknown> } }) => part.functionCall).map((part: { functionCall: { name: string; args?: Record<string, unknown> } }, index: number) => ({
      id: `gemini-tool-${index}`,
      name: part.functionCall.name,
      input: part.functionCall.args || {},
    })),
  };
}

export async function completeLLM(systemPrompt: string, messages: LLMMessage[]): Promise<LLMResponse> {
  return getProvider() === 'gemini'
    ? completeWithGemini(systemPrompt, messages)
    : completeWithGroq(systemPrompt, messages);
}