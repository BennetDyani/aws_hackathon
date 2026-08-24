import { Investigation, Evidence, ActivityEntry, DashboardMetrics } from '@/lib/types';

// Use globalThis to persist data across Next.js hot reloads in dev mode
const globalStore = globalThis as unknown as {
  __trustagent_investigations?: Map<string, Investigation>;
  __trustagent_counter?: number;
  __trustagent_initialized?: boolean;
};

if (!globalStore.__trustagent_investigations) {
  globalStore.__trustagent_investigations = new Map();
}
if (globalStore.__trustagent_counter === undefined) {
  globalStore.__trustagent_counter = 0;
}

const investigations = globalStore.__trustagent_investigations;

function getCounter(): number {
  return globalStore.__trustagent_counter || 0;
}

function incrementCounter(): number {
  globalStore.__trustagent_counter = (globalStore.__trustagent_counter || 0) + 1;
  return globalStore.__trustagent_counter;
}

export function createInvestigation(
  invoiceId: string,
  supplierId: string
): Investigation {
  const counter = incrementCounter();
  const id = `INV-${String(counter).padStart(3, '0')}`;

  const investigation: Investigation = {
    id,
    case_type: 'SUPPLIER_INVOICE',
    status: 'PENDING',
    risk_score: null,
    risk_level: null,
    summary: null,
    recommendation: null,
    recommended_action: null,
    invoice_id: invoiceId,
    supplier_id: supplierId,
    evidence: [],
    activity_log: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  investigations.set(id, investigation);
  return investigation;
}

export function getInvestigation(id: string): Investigation | null {
  return investigations.get(id) || null;
}

export function getAllInvestigations(): Investigation[] {
  return Array.from(investigations.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function updateInvestigation(
  id: string,
  updates: Partial<Investigation>
): Investigation | null {
  const investigation = investigations.get(id);
  if (!investigation) return null;

  Object.assign(investigation, updates, { updated_at: new Date().toISOString() });
  return investigation;
}

export function addActivity(id: string, entry: ActivityEntry): void {
  const investigation = investigations.get(id);
  if (investigation) {
    investigation.activity_log.push(entry);
    investigation.updated_at = new Date().toISOString();
  }
}

export function addEvidence(id: string, evidence: Evidence): void {
  const investigation = investigations.get(id);
  if (investigation) {
    investigation.evidence.push(evidence);
    investigation.updated_at = new Date().toISOString();
  }
}

export function getDashboardMetrics(): DashboardMetrics {
  const all = getAllInvestigations();
  return {
    total: all.length,
    high_risk: all.filter(
      (i) => i.risk_level === 'HIGH' || i.risk_level === 'CRITICAL'
    ).length,
    action_required: all.filter((i) => i.status === 'ACTION_REQUIRED').length,
    on_hold: all.filter(
      (i) => i.status === 'CLOSED' && i.recommended_action === 'HOLD_PAYMENT'
    ).length,
  };
}

// Initialize with some demo data for the dashboard
export function initializeDemoData(): void {
  if (globalStore.__trustagent_initialized) return; // Already initialized
  globalStore.__trustagent_initialized = true;

  // Add a pre-completed low-risk investigation for dashboard variety
  const counter = incrementCounter();
  const demoInv: Investigation = {
    id: `INV-${String(counter).padStart(3, '0')}`,
    case_type: 'SUPPLIER_INVOICE',
    status: 'CLOSED',
    risk_score: 15,
    risk_level: 'LOW',
    summary: 'Routine invoice from Metro Cleaning Services. All details match historical records.',
    recommendation: 'Approve payment - no anomalies detected.',
    recommended_action: 'APPROVE_PAYMENT',
    invoice_id: 'INV-1047',
    supplier_id: 'SUP-002',
    evidence: [
      {
        id: 'EVD-D01',
        investigation_id: `INV-${String(counter).padStart(3, '0')}`,
        type: 'VERIFICATION',
        description: 'Bank account matches historical records',
        detail: 'Account ****7733 matches all previous transactions.',
        severity: 'LOW',
        source: 'Transaction History',
        risk_contribution: 0,
        timestamp: '2026-08-18T10:15:00Z',
      },
    ],
    activity_log: [
      {
        timestamp: '2026-08-18T10:14:00Z',
        action: 'Investigation started',
        detail: 'Automated investigation for INV-1047',
        tool_used: null,
        status: 'COMPLETED',
      },
      {
        timestamp: '2026-08-18T10:14:02Z',
        action: 'Invoice analyzed',
        detail: 'No anomalies detected',
        tool_used: 'analyze_invoice',
        status: 'COMPLETED',
      },
      {
        timestamp: '2026-08-18T10:15:00Z',
        action: 'Investigation completed',
        detail: 'Low risk - approved for payment',
        tool_used: null,
        status: 'COMPLETED',
      },
    ],
    created_at: '2026-08-18T10:14:00Z',
    updated_at: '2026-08-18T10:15:00Z',
  };
  investigations.set(demoInv.id, demoInv);
}

// Initialize on module load
initializeDemoData();
