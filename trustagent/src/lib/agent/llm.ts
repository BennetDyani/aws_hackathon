import { TOOL_DEFINITIONS } from './tools';

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  // Gemini-only: an opaque per-call token some models attach to the first
  // function call in a turn. Must be echoed back verbatim when that turn is
  // replayed into a later request, or the API rejects the conversation.
  thoughtSignature?: string;
}

export interface LLMMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  toolName?: string;
}

export interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
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

const RATE_LIMIT_RETRIES = 3;

// Groq returns 429s with "Please try again in Xs" once per-minute token limits
// are hit; a multi-step tool-calling investigation can trip this mid-run.
async function fetchWithRateLimitRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, init);
    if (response.status !== 429 || attempt >= RATE_LIMIT_RETRIES) return response;

    const body = await response.text();
    const waitMatch = body.match(/try again in ([\d.]+)s/i);
    const waitMs = waitMatch ? Math.ceil(parseFloat(waitMatch[1]) * 1000) : 2 ** attempt * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitMs + 250));
  }
}

async function completeWithGroq(systemPrompt: string, messages: LLMMessage[]): Promise<LLMResponse> {
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const response = await fetchWithRateLimitRetry('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getRequiredEnv('GROQ_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      // gpt-oss models emit a "reasoning" trace on every call by default,
      // which burns through free-tier tokens-per-minute limits fast across
      // the ~7 sequential tool calls a single investigation makes.
      ...(model.includes('gpt-oss') ? { reasoning_effort: 'low' } : {}),
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
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getRequiredEnv('GEMINI_API_KEY')}`;
  const response = await fetchWithRateLimitRetry(url, {
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
                id: message.toolCallId,
                name: message.toolName,
                response: { result: parseJsonObject(message.content) },
              },
            }],
          };
        }

        const parts: Array<Record<string, unknown>> = [];
        if (message.content) parts.push({ text: message.content });
        for (const toolCall of message.toolCalls || []) {
          parts.push({
            functionCall: { name: toolCall.name, args: toolCall.input, id: toolCall.id },
            ...(toolCall.thoughtSignature ? { thoughtSignature: toolCall.thoughtSignature } : {}),
          });
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

  type GeminiPart = { text?: string; thoughtSignature?: string; functionCall?: { id?: string; name: string; args?: Record<string, unknown> } };

  return {
    content: (parts as GeminiPart[]).filter((part) => part.text).map((part) => part.text).join('\n'),
    toolCalls: (parts as GeminiPart[])
      .filter((part) => part.functionCall)
      .map((part, index) => ({
        id: part.functionCall!.id || `gemini-tool-${index}`,
        name: part.functionCall!.name,
        input: part.functionCall!.args || {},
        thoughtSignature: part.thoughtSignature,
      })),
  };
}

export async function completeLLM(systemPrompt: string, messages: LLMMessage[]): Promise<LLMResponse> {
  return getProvider() === 'gemini'
    ? completeWithGemini(systemPrompt, messages)
    : completeWithGroq(systemPrompt, messages);
}

// ============================================================
// Structured invoice field extraction (used by the upload route to read
// arbitrary invoice documents — PDF-extracted text, markdown, plain text —
// instead of relying on brittle format-specific regexes).
// ============================================================

export interface ExtractedInvoiceFields {
  invoice_number: string | null;
  supplier_name: string | null;
  amount: number | null;
  currency: string | null;
  invoice_date: string | null;
  due_date: string | null;
  bank_account_last4: string | null;
  bank_name: string | null;
  urgency: 'NORMAL' | 'HIGH' | 'IMMEDIATE';
  description: string | null;
  line_items: Array<{ description: string; quantity: number; unit_price: number; total: number }>;
  warnings: string[];
}

const EXTRACTION_SYSTEM_PROMPT = `You are a document data-extraction assistant. Extract structured invoice fields from the raw text of an uploaded supplier invoice. Respond with ONLY a JSON object matching this exact shape, no prose, no markdown fences:
{
  "invoice_number": string or null,
  "supplier_name": string or null,
  "amount": number or null (the final total due, not the subtotal; no currency symbols or thousands separators),
  "currency": string or null (3-letter code, default "ZAR" if not stated),
  "invoice_date": string or null (ISO format YYYY-MM-DD),
  "due_date": string or null (ISO format YYYY-MM-DD),
  "bank_account_last4": string or null (the last 4 digits only of the bank account number, digits only),
  "bank_name": string or null,
  "urgency": "NORMAL" | "HIGH" | "IMMEDIATE" (IMMEDIATE if marked urgent/immediate priority, HIGH if marked high priority, otherwise NORMAL),
  "description": string or null (one short line summarizing what the invoice is for),
  "line_items": array of { "description": string, "quantity": number, "unit_price": number, "total": number },
  "warnings": array of short strings — note any field above you could not confidently find in the text
}
If a field cannot be found in the text, use null (or an empty array for line_items) and add a note to "warnings". Do not guess or fabricate values.`;

function normalizeExtractedFields(raw: Record<string, unknown>): ExtractedInvoiceFields {
  const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const urgency = raw.urgency === 'IMMEDIATE' || raw.urgency === 'HIGH' ? raw.urgency : 'NORMAL';
  const lineItems = Array.isArray(raw.line_items)
    ? (raw.line_items as Array<Record<string, unknown>>).map((li) => ({
        description: str(li.description) || '',
        quantity: num(li.quantity) || 1,
        unit_price: num(li.unit_price) || 0,
        total: num(li.total) || 0,
      }))
    : [];
  const warnings = Array.isArray(raw.warnings) ? raw.warnings.filter((w): w is string => typeof w === 'string') : [];

  return {
    invoice_number: str(raw.invoice_number),
    supplier_name: str(raw.supplier_name),
    amount: num(raw.amount),
    currency: str(raw.currency) || 'ZAR',
    invoice_date: str(raw.invoice_date),
    due_date: str(raw.due_date),
    bank_account_last4: str(raw.bank_account_last4),
    bank_name: str(raw.bank_name),
    urgency,
    description: str(raw.description),
    line_items: lineItems,
    warnings,
  };
}

async function extractWithGroq(rawText: string): Promise<string> {
  const response = await fetchWithRateLimitRetry('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getRequiredEnv('GROQ_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: rawText },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Groq extraction API error: ${await response.text()}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No extraction response from Groq');
  return content;
}

async function extractWithGemini(rawText: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getRequiredEnv('GEMINI_API_KEY')}`;
  const response = await fetchWithRateLimitRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: EXTRACTION_SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: rawText }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) throw new Error(`Gemini extraction API error: ${await response.text()}`);
  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
  if (!text) throw new Error('No extraction response from Gemini');
  return text;
}

export async function extractInvoiceFields(rawText: string): Promise<ExtractedInvoiceFields> {
  // Guard against extremely long documents blowing the token budget.
  const truncated = rawText.slice(0, 12000);
  const raw = getProvider() === 'gemini' ? await extractWithGemini(truncated) : await extractWithGroq(truncated);
  return normalizeExtractedFields(parseJsonObject(raw));
}