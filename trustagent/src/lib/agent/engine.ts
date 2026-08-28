import { INVESTIGATION_SYSTEM_PROMPT, buildInvestigationUserPrompt } from './prompts';
import { handleToolCall, ToolResult } from './tool-handlers';
import { addActivity, getInvestigation, updateInvestigation } from '@/lib/data/store';
import { Action, ActivityEntry, RiskLevel } from '@/lib/types';
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

// Deterministic fallback used only when the model never calls
// create_investigation_report itself (observed intermittently — the model
// sometimes stops after calculate_risk with a plain text summary instead of
// finalizing). Ensures every investigation reaches an actionable outcome
// instead of getting stuck at IN_PROGRESS with no recommendation.
function buildFallbackRecommendation(riskLevel: RiskLevel | null): { action: Action; text: string } {
  switch (riskLevel) {
    case 'CRITICAL':
    case 'HIGH':
      return {
        action: 'HOLD_PAYMENT',
        text: `Risk level is ${riskLevel}. Recommend holding payment pending independent verification.`,
      };
    case 'MEDIUM':
      return {
        action: 'REQUEST_VERIFICATION',
        text: 'Risk level is MEDIUM. Recommend requesting additional verification before processing.',
      };
    case 'LOW':
      return {
        action: 'APPROVE_PAYMENT',
        text: 'Risk level is LOW. No significant issues found; recommend normal processing.',
      };
    default:
      return {
        action: 'ESCALATE',
        text: 'Investigation could not reach a risk determination automatically. Recommend escalation for manual review.',
      };
  }
}

function finalizeWithFallbackReport(investigationId: string, callback: EventCallback): void {
  const investigation = getInvestigation(investigationId);
  if (!investigation) return;

  const { action, text } = buildFallbackRecommendation(investigation.risk_level);
  const summary =
    investigation.evidence.length > 0
      ? `Automated summary: ${investigation.evidence.length} evidence item(s) identified. ${text}`
      : `No risk indicators were identified during this investigation. ${text}`;

  updateInvestigation(investigationId, {
    summary,
    recommendation: text,
    recommended_action: action,
    status: 'ACTION_REQUIRED',
  });

  emitActivity(
    investigationId,
    'Investigation report generated (auto-finalized)',
    'The AI agent did not explicitly finalize a report; findings were auto-compiled from gathered evidence.',
    null,
    callback
  );

  callback({
    type: 'recommendation',
    data: { recommendation: text, recommended_action: action },
  });
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
    let reportGenerated = false;
    let nudgedForReport = false;

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

        // The model gave a final text answer without ever calling
        // create_investigation_report. Give it exactly one nudge to finish
        // properly before falling back to a deterministic report below.
        if (!reportGenerated && !nudgedForReport) {
          nudgedForReport = true;
          messages.push({
            role: 'user',
            content:
              'You have not yet called create_investigation_report. Based on all the evidence and risk score already gathered, call create_investigation_report now to finalize your findings.',
          });
          continue;
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
          reportGenerated = true;
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

    if (!reportGenerated) {
      finalizeWithFallbackReport(investigationId, onEvent);
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
