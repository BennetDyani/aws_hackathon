import { Investigation, Evidence, ActivityEntry, DashboardMetrics } from '@/lib/types';

// Use globalThis to persist data across Next.js hot reloads in dev mode
const globalStore = globalThis as unknown as {
  __trustagent_investigations?: Map<string, Investigation>;
  __trustagent_counter?: number;
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
