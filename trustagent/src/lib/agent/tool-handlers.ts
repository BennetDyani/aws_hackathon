import { getInvoiceById } from '@/lib/data/invoices';
import { getSupplierById } from '@/lib/data/suppliers';
import { getTransactionsBySupplier } from '@/lib/data/transactions';
import { getPoliciesByCategory } from '@/lib/data/policies';
import { calculateRisk } from '@/lib/risk/calculator';
import { updateInvestigation, addEvidence } from '@/lib/data/store';
import { RiskIndicator, Evidence, RiskLevel, Action } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolInput = Record<string, any>;

export interface ToolResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  activityDescription: string;
}

let evidenceCounter = 0;

function generateEvidenceId(): string {
  evidenceCounter++;
  return `EVD-${String(evidenceCounter).padStart(3, '0')}`;
}

export function handleToolCall(
  toolName: string,
  input: ToolInput,
  investigationId: string
): ToolResult {
  switch (toolName) {
    case 'analyze_invoice':
      return handleAnalyzeInvoice(input);
    case 'lookup_supplier':
      return handleLookupSupplier(input);
    case 'get_supplier_transaction_history':
      return handleGetTransactionHistory(input);
    case 'check_company_policy':
      return handleCheckPolicy(input);
    case 'calculate_risk':
      return handleCalculateRisk(input, investigationId);
    case 'create_investigation_report':
      return handleCreateReport(input, investigationId);
    default:
      return {
        success: false,
        data: { error: `Unknown tool: ${toolName}` },
        activityDescription: `Unknown tool called: ${toolName}`,
      };
  }
}

function handleAnalyzeInvoice(input: ToolInput): ToolResult {
  const invoice = getInvoiceById(input.invoice_id);
  if (!invoice) {
    return {
      success: false,
      data: { error: `Invoice ${input.invoice_id} not found` },
      activityDescription: 'Failed to analyze invoice - not found',
    };
  }

  const supplier = getSupplierById(invoice.supplier_id);

  const redFlags = [];
  if (invoice.urgency === 'IMMEDIATE') {
    redFlags.push('Payment urgency marked as IMMEDIATE — common social engineering tactic');
  }

  // Prefer a supplier-specific expected spending range over the flat
  // company-wide threshold — a large invoice that's normal for THIS
  // supplier isn't itself a fraud signal.
  if (supplier?.verified && supplier.expected_spend_min != null && supplier.expected_spend_max != null) {
    if (invoice.amount > supplier.expected_spend_max) {
      redFlags.push(
        `Amount R${invoice.amount.toLocaleString()} exceeds this supplier's expected spending range (R${supplier.expected_spend_min.toLocaleString()}–R${supplier.expected_spend_max.toLocaleString()})`
      );
    }
  } else if (invoice.amount > 100000) {
    redFlags.push(
      `Amount R${invoice.amount.toLocaleString()} exceeds R100,000 large transaction threshold (no supplier-specific spending range on file)`
    );
  }

  if (!supplier) {
    redFlags.push('No supplier record found for this invoice');
  } else if (!supplier.verified) {
    redFlags.push(
      'Supplier is not yet verified — no confirmed banking history on file; treat as new-supplier onboarding, not a bank-account change'
    );
  }

  return {
    success: true,
    data: {
      invoice_id: invoice.id,
      supplier_name: invoice.supplier_name,
      supplier_id: invoice.supplier_id,
      amount: invoice.amount,
      currency: invoice.currency,
      date: invoice.date,
      due_date: invoice.due_date,
      bank_account: invoice.bank_account,
      bank_name: invoice.bank_name,
      description: invoice.description,
      urgency: invoice.urgency,
      line_items: invoice.line_items,
      red_flags: redFlags,
      status: invoice.status,
      supplier_verified: supplier?.verified ?? false,
      expected_spend_range: supplier
        ? { min: supplier.expected_spend_min, max: supplier.expected_spend_max }
        : null,
    },
    activityDescription: 'Invoice analyzed',
  };
}

function handleLookupSupplier(input: ToolInput): ToolResult {
  const supplier = getSupplierById(input.supplier_id);
  if (!supplier) {
    return {
      success: false,
      data: { error: `Supplier ${input.supplier_id} not found` },
      activityDescription: 'Failed to look up supplier - not found',
    };
  }

  return {
    success: true,
    data: {
      id: supplier.id,
      name: supplier.name,
      contact_email: supplier.contact_email,
      bank_account_on_file: supplier.bank_account,
      bank_name_on_file: supplier.bank_name,
      registration_number: supplier.registration_number,
      risk_status: supplier.risk_status,
      verified: supplier.verified,
      verified_date: supplier.verified_date,
      expected_spend_min: supplier.expected_spend_min,
      expected_spend_max: supplier.expected_spend_max,
    },
    activityDescription: 'Supplier identified',
  };
}

function handleGetTransactionHistory(input: ToolInput): ToolResult {
  const transactions = getTransactionsBySupplier(input.supplier_id);

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const averageAmount = transactions.length > 0 ? totalAmount / transactions.length : 0;
  const bankAccounts = Array.from(new Set(transactions.map((t) => t.bank_account)));

  return {
    success: true,
    data: {
      supplier_id: input.supplier_id,
      transaction_count: transactions.length,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        currency: t.currency,
        bank_account: t.bank_account,
        date: t.date,
        status: t.status,
        description: t.description,
      })),
      summary: {
        total_amount: totalAmount,
        average_amount: Math.round(averageAmount),
        bank_accounts_used: bankAccounts,
        most_recent_transaction: transactions.length > 0 ? transactions[transactions.length - 1].date : null,
      },
    },
    activityDescription: 'Supplier history retrieved',
  };
}

function handleCheckPolicy(input: ToolInput): ToolResult {
  const policies = getPoliciesByCategory(input.category);

  return {
    success: true,
    data: {
      category: input.category,
      policies_found: policies.length,
      policies: policies.map((p) => ({
        id: p.id,
        name: p.name,
        rule: p.rule,
        description: p.description,
        severity: p.severity,
        required_action: p.action,
      })),
    },
    activityDescription: `Company policy reviewed (${input.category})`,
  };
}

function handleCalculateRisk(input: ToolInput, investigationId: string): ToolResult {
  const indicators: RiskIndicator[] = (input.indicators || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ind: any) => ({
      type: ind.type,
      description: ind.description,
      severity: ind.severity || 'MEDIUM',
    })
  );

  const result = calculateRisk(indicators);

  // Store evidence for each indicator
  for (const indicator of result.indicators) {
    const evidence: Evidence = {
      id: generateEvidenceId(),
      investigation_id: investigationId,
      type: indicator.type.includes('MISMATCH') ? 'MISMATCH' :
            indicator.type.includes('POLICY') ? 'POLICY_VIOLATION' :
            indicator.type.includes('PATTERN') || indicator.type.includes('UNUSUAL') ? 'PATTERN' :
            indicator.type.includes('NOT_VERIFIED') || indicator.type === 'CONFIRMED_MATCH' ? 'VERIFICATION' :
            'ANOMALY',
      description: indicator.description,
      detail: indicator.description,
      severity: indicator.severity,
      source: `Risk Calculator (weight: ${indicator.weight})`,
      risk_contribution: indicator.weight,
      timestamp: new Date().toISOString(),
    };
    addEvidence(investigationId, evidence);
  }

  // Update investigation with risk score
  updateInvestigation(investigationId, {
    risk_score: result.score,
    risk_level: result.level,
  });

  return {
    success: true,
    data: {
      risk_score: result.score,
      risk_level: result.level,
      indicators_assessed: result.indicators.length,
      breakdown: result.indicators.map((i) => ({
        type: i.type,
        description: i.description,
        weight: i.weight,
      })),
    },
    activityDescription: `Risk assessed: ${result.score}/100 (${result.level})`,
  };
}

function handleCreateReport(input: ToolInput, investigationId: string): ToolResult {
  const riskLevel = input.risk_level as RiskLevel;
  const recommendedAction = input.recommended_action as Action;

  updateInvestigation(investigationId, {
    summary: input.summary,
    recommendation: input.recommendation,
    recommended_action: recommendedAction,
    risk_score: input.risk_score,
    risk_level: riskLevel,
    status: 'ACTION_REQUIRED',
  });

  return {
    success: true,
    data: {
      report_generated: true,
      investigation_id: investigationId,
      summary: input.summary,
      risk_score: input.risk_score,
      risk_level: input.risk_level,
      recommendation: input.recommendation,
      recommended_action: input.recommended_action,
      findings_count: input.findings?.length || 0,
    },
    activityDescription: 'Investigation report generated',
  };
}
