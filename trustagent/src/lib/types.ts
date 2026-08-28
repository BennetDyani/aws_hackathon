// ============================================================
// TrustAgent — Core Type Definitions
// ============================================================

// --- Enumerations ---

export type CaseType = 'SUPPLIER_INVOICE';

export type InvestigationStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ACTION_REQUIRED'
  | 'CLOSED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Action = 'HOLD_PAYMENT' | 'APPROVE_PAYMENT' | 'ESCALATE' | 'REQUEST_VERIFICATION';

export type EvidenceType =
  | 'ANOMALY'
  | 'POLICY_VIOLATION'
  | 'MISMATCH'
  | 'PATTERN'
  | 'VERIFICATION';

export type EvidenceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type InvoiceStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ON_HOLD';

export type Urgency = 'NORMAL' | 'HIGH' | 'IMMEDIATE';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'ON_HOLD';

// --- Entities ---

export interface Investigation {
  id: string;
  case_type: CaseType;
  status: InvestigationStatus;
  risk_score: number | null;
  risk_level: RiskLevel | null;
  summary: string | null;
  recommendation: string | null;
  recommended_action: Action | null;
  invoice_id: string;
  supplier_id: string;
  evidence: Evidence[];
  activity_log: ActivityEntry[];
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  bank_account: string;
  bank_name: string;
  registration_number: string;
  risk_status: 'LOW' | 'MEDIUM' | 'HIGH';
  verified: boolean;
  verified_date: string | null;
  verified_by: string | null;
  expected_spend_min: number | null;
  expected_spend_max: number | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  supplier_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  bank_account: string;
  date: string;
  status: TransactionStatus;
  description: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  supplier_id: string;
  supplier_name: string;
  amount: number;
  currency: string;
  date: string;
  due_date: string;
  bank_account: string;
  bank_name: string;
  description: string;
  line_items: LineItem[];
  status: InvoiceStatus;
  urgency: Urgency;
  submitted_by: string;
  supplier_match_status?: 'MATCHED_EXISTING' | 'NEW_SUPPLIER';
  supplier_match_confidence?: number;
}

export interface Evidence {
  id: string;
  investigation_id: string;
  type: EvidenceType;
  description: string;
  detail: string;
  severity: EvidenceSeverity;
  source: string;
  risk_contribution: number;
  timestamp: string;
}

export interface Policy {
  id: string;
  name: string;
  category: 'PAYMENT' | 'SUPPLIER' | 'COMPLIANCE';
  rule: string;
  description: string;
  severity: EvidenceSeverity;
  action: string;
}

export interface ActivityEntry {
  timestamp: string;
  action: string;
  detail: string;
  tool_used: string | null;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
}

// --- API Response Types ---

export interface DashboardMetrics {
  total: number;
  high_risk: number;
  action_required: number;
  on_hold: number;
}

export interface InvestigationListResponse {
  investigations: Investigation[];
  metrics: DashboardMetrics;
}

export interface InvestigationResponse {
  investigation: Investigation;
}

export interface ActionRequest {
  investigation_id: string;
  action: Action;
  approved_by: string;
}

export interface ActionResponse {
  success: boolean;
  action: Action;
  investigation_id: string;
  new_status: InvestigationStatus;
  message: string;
  timestamp: string;
}

// --- SSE Event Types ---

export interface SSEActivityEvent {
  timestamp: string;
  action: string;
  detail: string;
  tool_used: string | null;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
}

export interface SSEEvidenceEvent {
  id: string;
  type: EvidenceType;
  description: string;
  detail: string;
  severity: EvidenceSeverity;
  source: string;
  risk_contribution: number;
}

export interface SSERiskEvent {
  risk_score: number;
  risk_level: RiskLevel;
}

export interface SSERecommendationEvent {
  recommendation: string;
  recommended_action: Action;
}

export interface SSECompleteEvent {
  status: InvestigationStatus;
  investigation_id: string;
}

// --- Risk Calculator Types ---

export interface RiskIndicator {
  type: string;
  description: string;
  severity: EvidenceSeverity;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  indicators: Array<RiskIndicator & { weight: number }>;
}
