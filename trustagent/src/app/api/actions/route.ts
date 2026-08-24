import { NextRequest, NextResponse } from 'next/server';
import { getInvestigation, updateInvestigation, addActivity } from '@/lib/data/store';
import { updateInvoiceStatus } from '@/lib/data/invoices';
import { Action } from '@/lib/types';

const VALID_ACTIONS: Action[] = ['HOLD_PAYMENT', 'APPROVE_PAYMENT', 'ESCALATE', 'REQUEST_VERIFICATION'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { investigation_id, action, approved_by } = body;

    if (!investigation_id || !action || !approved_by) {
      return NextResponse.json(
        { error: 'investigation_id, action, and approved_by are required' },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const investigation = getInvestigation(investigation_id);
    if (!investigation) {
      return NextResponse.json(
        { error: `Investigation ${investigation_id} not found` },
        { status: 404 }
      );
    }

    // Execute the action
    const timestamp = new Date().toISOString();
    let message = '';

    switch (action) {
      case 'HOLD_PAYMENT':
        updateInvoiceStatus(investigation.invoice_id, 'ON_HOLD');
        updateInvestigation(investigation_id, { status: 'CLOSED' });
        addActivity(investigation_id, {
          timestamp,
          action: 'Payment placed on hold',
          detail: `Approved by ${approved_by}. Payment for invoice ${investigation.invoice_id} has been placed on hold pending verification.`,
          tool_used: 'hold_payment',
          status: 'COMPLETED',
        });
        message = 'Payment placed on hold. Finance team notified.';
        break;

      case 'APPROVE_PAYMENT':
        updateInvoiceStatus(investigation.invoice_id, 'APPROVED');
        updateInvestigation(investigation_id, { status: 'CLOSED' });
        addActivity(investigation_id, {
          timestamp,
          action: 'Payment approved',
          detail: `Approved by ${approved_by}. Payment for invoice ${investigation.invoice_id} has been released.`,
          tool_used: null,
          status: 'COMPLETED',
        });
        message = 'Payment approved and released.';
        break;

      case 'ESCALATE':
        updateInvestigation(investigation_id, { status: 'ACTION_REQUIRED' });
        addActivity(investigation_id, {
          timestamp,
          action: 'Case escalated',
          detail: `Escalated by ${approved_by}. Case requires senior review.`,
          tool_used: null,
          status: 'COMPLETED',
        });
        message = 'Case escalated to senior management.';
        break;

      case 'REQUEST_VERIFICATION':
        updateInvestigation(investigation_id, { status: 'ACTION_REQUIRED' });
        addActivity(investigation_id, {
          timestamp,
          action: 'Verification requested',
          detail: `Requested by ${approved_by}. Awaiting independent verification of supplier details.`,
          tool_used: null,
          status: 'COMPLETED',
        });
        message = 'Verification request sent. Awaiting confirmation.';
        break;
    }

    const updatedInvestigation = getInvestigation(investigation_id);

    return NextResponse.json({
      success: true,
      action,
      investigation_id,
      new_status: updatedInvestigation?.status || 'CLOSED',
      message,
      timestamp,
    });
  } catch (error) {
    console.error('Error executing action:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
