import { NextRequest } from 'next/server';
import { getInvestigation } from '@/lib/data/store';
import { runInvestigation } from '@/lib/agent/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { investigation_id } = body;

    if (!investigation_id) {
      return new Response(JSON.stringify({ error: 'investigation_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const investigation = getInvestigation(investigation_id);
    if (!investigation) {
      return new Response(JSON.stringify({ error: `Investigation ${investigation_id} not found` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: { type: string; data: unknown }) => {
          const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          await runInvestigation(
            investigation_id,
            investigation.invoice_id,
            investigation.supplier_id,
            (event) => {
              sendEvent(event);
            }
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          sendEvent({ type: 'error', data: { message: errorMessage } });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error starting investigation:', error);
    return new Response(JSON.stringify({ error: 'Failed to start investigation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
