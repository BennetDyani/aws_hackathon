import { INVESTIGATION_SYSTEM_PROMPT, buildInvestigationUserPrompt } from './prompts';
import { handleToolCall, ToolResult } from './tool-handlers';
import { addActivity, updateInvestigation } from '@/lib/data/store';
import { ActivityEntry } from '@/lib/types';
import { completeLLM, LLMMessage } from './llm';

const MAX_ITERATIONS = 12;

interface InvestigationEvent {
  type: 'activity' | 'evidence' | 'risk' | 'recommendation' | 'complete' | 'error';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

type EventCallback = (event: InvestigationEvent) => void;

function emitActivity(
  investigationId: string,
  action: string,
  detail: string,
  toolUsed: string | null,
  callback: EventCallback
): void {
  const entry: ActivityEntry = {
    timestamp: new Date().toISOString(),
    action,
    detail,
    tool_used: toolUsed,
    status: 'COMPLETED',
  };
  addActivity(investigationId, entry);
  callback({ type: 'activity', data: entry });
}

export async function runInvestigation(
  investigationId: string,
  invoiceId: string,
  supplierId: string,
  onEvent: EventCallback
): Promise<void> {
  // Update status to IN_PROGRESS
  updateInvestigation(investigationId, { status: 'IN_PROGRESS' });

  // Emit start event
  emitActivity(investigationId, 'Investigation started', `Beginning investigation for invoice ${invoiceId}`, null, onEvent);

  // Build conversation messages
  const messages: LLMMessage[] = [{
    role: 'user',
    content: buildInvestigationUserPrompt(invoiceId, supplierId),
  }];

  try {
    let iteration = 0;

    while (iteration < MAX_ITERATIONS) {
      iteration++;

      const response = await completeLLM(INVESTIGATION_SYSTEM_PROMPT, messages);
      messages.push({ role: 'assistant', content: response.content, toolCalls: response.toolCalls });

      if (response.toolCalls.length === 0) {
        if (response.content) {
          emitActivity(
            investigationId,
            'Investigation analysis complete',
            response.content.substring(0, 200),
            null,
            onEvent
          );
        }
        break;
      }

      // Process each tool call
      const toolResults: LLMMessage[] = [];

      for (const toolCall of response.toolCalls) {
        const toolName = toolCall.name || 'unknown';
        const toolInput = toolCall.input;

        // Execute the tool
        let result: ToolResult;
        try {
          result = handleToolCall(toolName, toolInput, investigationId);
        } catch (err) {
          result = {
            success: false,
            data: { error: `Tool execution error: ${err}` },
            activityDescription: `Error executing ${toolName}`,
          };
        }

        // Emit activity event
        emitActivity(
          investigationId,
          result.activityDescription,
          JSON.stringify(result.data).substring(0, 150),
          toolName,
          onEvent
        );

        // If it was calculate_risk, emit a risk event
        if (toolName === 'calculate_risk' && result.success) {
          onEvent({
            type: 'risk',
            data: {
              risk_score: result.data.risk_score,
              risk_level: result.data.risk_level,
            },
          });
        }

        // If it was create_investigation_report, emit recommendation
        if (toolName === 'create_investigation_report' && result.success) {
          onEvent({
            type: 'recommendation',
            data: {
              recommendation: result.data.recommendation,
              recommended_action: result.data.recommended_action,
            },
          });
        }

        // Build tool result for the conversation
        toolResults.push({
          role: 'tool',
          content: JSON.stringify(result.data),
          toolCallId: toolCall.id,
          toolName,
        });
      }

      // Add tool results to conversation
      messages.push(...toolResults);
    }

    // Emit completion
    emitActivity(investigationId, 'Investigation completed', 'All investigation steps finished', null, onEvent);

    onEvent({
      type: 'complete',
      data: { status: 'ACTION_REQUIRED', investigation_id: investigationId },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ENGINE] Investigation error:', errorMessage);

    updateInvestigation(investigationId, { status: 'COMPLETED' });

    emitActivity(investigationId, 'Investigation error', errorMessage, null, onEvent);

    onEvent({
      type: 'error',
      data: { message: errorMessage },
    });
  }
}
