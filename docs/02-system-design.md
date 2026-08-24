# TrustAgent — System Design Document

**Version:** 1.0  
**Date:** 2026-08-19  
**Author:** TrustAgent Development Team  
**Status:** Approved for MVP

---

## 1. System Overview

TrustAgent is a single full-stack web application built with Next.js that provides an AI-powered investigation workflow. The system integrates with Groq or Gemini for LLM-based reasoning and uses in-memory data stores for the MVP.

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                           │
│                                                                  │
│  ┌─────────────┐  ┌──────────────────────┐  ┌───────────────┐  │
│  │  Dashboard   │  │ Investigation        │  │  Report View  │  │
│  │  Page        │  │ Workspace            │  │               │  │
│  └─────────────┘  └──────────────────────┘  └───────────────┘  │
│         │                    │                       │           │
│         └────────────────────┼───────────────────────┘           │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │   REST / SSE       │                        │
│                    │   API Calls        │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTP
┌──────────────────────────────┼───────────────────────────────────┐
│                        SERVER (Next.js API Routes)                │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐ │
│  │                    API Layer                                 │ │
│  │  /api/investigations  /api/investigate  /api/actions         │ │
│  └───────────────────────────┬────────────────────────────────┘ │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐ │
│  │              Investigation Engine                            │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │ Orchestrator │  │ Tool Router  │  │ Report Generator │  │ │
│  │  └──────┬──────┘  └──────┬───────┘  └──────────────────┘  │ │
│  │         │                 │                                  │ │
│  │  ┌──────▼──────┐  ┌──────▼───────────────────────────────┐ │ │
│  │  │  Bedrock    │  │          Tool Implementations          │ │ │
│  │  │  Client     │  │                                       │ │ │
│  │  │  (Converse) │  │  analyze_invoice    lookup_supplier   │ │ │
│  │  └──────┬──────┘  │  get_history        check_policy     │ │ │
│  │         │         │  calculate_risk     hold_payment      │ │ │
│  │         │         │  create_report      notify_team       │ │ │
│  │         │         └───────────────────────┬───────────────┘ │ │
│  │         │                                 │                  │ │
│  └─────────┼─────────────────────────────────┼──────────────────┘ │
│            │                                 │                   │
│  ┌─────────▼─────────┐  ┌───────────────────▼───────────────┐  │
│  │  Amazon Bedrock    │  │        In-Memory Data Store        │  │
│  │  us-east-1         │  │                                   │  │
│  │                    │  │  Suppliers  Transactions  Policies │  │
│  │  Claude Sonnet 4.6 │  │  Invoices  Investigations         │  │
│  └────────────────────┘  └───────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Descriptions

| Component | Responsibility |
|-----------|---------------|
| Dashboard Page | Summary metrics, investigation list, navigation |
| Investigation Workspace | Real-time investigation view, evidence, risk, actions |
| Report View | Full investigation audit trail |
| API Layer | HTTP endpoints, request validation, response formatting |
| Investigation Engine | Agent orchestration, tool dispatch, state management |
| Orchestrator | Bedrock Converse loop, tool-use cycle management |
| Tool Router | Maps tool calls to implementations, validates parameters |
| Tool Implementations | Business logic for each investigation tool |
| Bedrock Client | AWS SDK calls to Converse API |
| In-Memory Data Store | Mock business data and investigation state |

### 2.3 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + Next.js 14 App Router | Full-stack in one project, SSE support |
| Styling | Tailwind CSS | Fast professional styling, no component lib overhead |
| Language | TypeScript | Type safety, better DX |
| Backend | Next.js API Routes | Co-located with frontend, simple deployment |
| AI | Amazon Bedrock Converse API | Native tool-use support, managed service |
| Model | `us.anthropic.claude-sonnet-4-6` | Fast, reliable tool-use, approved model |
| AWS SDK | `@aws-sdk/client-bedrock-runtime` | Official SDK for Bedrock |
| Data Store | In-memory (Node.js Maps/Arrays) | Zero infrastructure, sufficient for demo |
| Streaming | Server-Sent Events (SSE) | Real-time UI updates, simple implementation |

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│  Supplier    │       │  Investigation   │       │   Evidence   │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id           │◄──┐   │ id               │──────►│ id           │
│ name         │   │   │ case_type        │       │ investigation│
│ contact_email│   │   │ status           │       │   _id        │
│ bank_account │   │   │ risk_score       │       │ type         │
│ bank_name    │   │   │ risk_level       │       │ description  │
│ registration │   │   │ summary          │       │ severity     │
│ risk_status  │   │   │ recommendation   │       │ source       │
│ verified     │   │   │ invoice_id       │       │ risk_contrib │
└──────────────┘   │   │ supplier_id      │──┐   │ timestamp    │
                   │   │ created_at       │  │   └──────────────┘
                   │   │ updated_at       │  │
┌──────────────┐   │   │ activity_log[]   │  │   ┌──────────────┐
│ Transaction  │   │   └──────────────────┘  │   │   Policy     │
├──────────────┤   │                         │   ├──────────────┤
│ id           │   │                         │   │ id           │
│ supplier_id  │───┘                         │   │ name         │
│ invoice_id   │                             │   │ category     │
│ amount       │         ┌──────────────┐    │   │ rule         │
│ bank_account │         │   Invoice    │    │   │ description  │
│ date         │         ├──────────────┤    │   │ severity     │
│ status       │         │ id           │◄───┘   │ action       │
│ description  │         │ supplier_id  │        └──────────────┘
└──────────────┘         │ amount       │
                         │ currency     │
                         │ date         │
                         │ due_date     │
                         │ bank_account │
                         │ description  │
                         │ status       │
                         │ urgency      │
                         └──────────────┘
```

### 3.2 Entity Definitions

#### Investigation

```typescript
interface Investigation {
  id: string;                    // e.g., "INV-001"
  case_type: CaseType;          // "SUPPLIER_INVOICE"
  status: InvestigationStatus;  // PENDING | IN_PROGRESS | COMPLETED | ACTION_REQUIRED | CLOSED
  risk_score: number | null;    // 0-100
  risk_level: RiskLevel | null; // LOW | MEDIUM | HIGH | CRITICAL
  summary: string | null;
  recommendation: string | null;
  recommended_action: Action | null;
  invoice_id: string;
  supplier_id: string;
  evidence: Evidence[];
  activity_log: ActivityEntry[];
  created_at: string;           // ISO 8601
  updated_at: string;           // ISO 8601
}
```

#### Supplier

```typescript
interface Supplier {
  id: string;                   // e.g., "SUP-001"
  name: string;
  contact_email: string;
  bank_account: string;         // Current bank account on file
  bank_name: string;
  registration_number: string;
  risk_status: "LOW" | "MEDIUM" | "HIGH";
  verified: boolean;
  verified_date: string | null;
}
```

#### Transaction

```typescript
interface Transaction {
  id: string;                   // e.g., "TXN-001"
  supplier_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  bank_account: string;         // Bank account used for this transaction
  date: string;                 // ISO 8601
  status: "COMPLETED" | "PENDING" | "FAILED" | "ON_HOLD";
  description: string;
}
```

#### Invoice

```typescript
interface Invoice {
  id: string;                   // e.g., "INV-1048"
  supplier_id: string;
  supplier_name: string;
  amount: number;
  currency: string;
  date: string;                 // ISO 8601
  due_date: string;
  bank_account: string;         // Bank account on invoice
  bank_name: string;
  description: string;
  line_items: LineItem[];
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ON_HOLD";
  urgency: "NORMAL" | "HIGH" | "IMMEDIATE";
  submitted_by: string;
}
```

#### Evidence

```typescript
interface Evidence {
  id: string;
  investigation_id: string;
  type: EvidenceType;           // ANOMALY | POLICY_VIOLATION | MISMATCH | PATTERN | VERIFICATION
  description: string;
  detail: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source: string;               // Which tool/data source produced this
  risk_contribution: number;    // Points added to risk score
  timestamp: string;
}
```

#### Policy

```typescript
interface Policy {
  id: string;                   // e.g., "POL-001"
  name: string;
  category: string;             // "PAYMENT" | "SUPPLIER" | "COMPLIANCE"
  rule: string;                 // Machine-readable rule description
  description: string;          // Human-readable description
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  action: string;               // Required action when violated
}
```

#### ActivityEntry

```typescript
interface ActivityEntry {
  timestamp: string;            // ISO 8601
  action: string;               // e.g., "Invoice analyzed"
  detail: string;               // Additional context
  tool_used: string | null;     // Which tool was called
  status: "COMPLETED" | "IN_PROGRESS" | "FAILED";
}
```

### 3.3 Enumerations

```typescript
type CaseType = "SUPPLIER_INVOICE";  // Extensible for future types

type InvestigationStatus = 
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ACTION_REQUIRED"
  | "CLOSED";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type Action = "HOLD_PAYMENT" | "APPROVE_PAYMENT" | "ESCALATE" | "REQUEST_VERIFICATION";

type EvidenceType = 
  | "ANOMALY"
  | "POLICY_VIOLATION"
  | "MISMATCH"
  | "PATTERN"
  | "VERIFICATION";
```

---

## 4. API Design

### 4.1 API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/investigations` | List all investigations |
| GET | `/api/investigations/[id]` | Get single investigation |
| POST | `/api/investigations` | Create new investigation |
| POST | `/api/investigate` | Start AI investigation (SSE stream) |
| POST | `/api/actions` | Execute approved action |

### 4.2 Endpoint Specifications

#### GET /api/investigations

**Response 200:**
```json
{
  "investigations": [
    {
      "id": "INV-001",
      "case_type": "SUPPLIER_INVOICE",
      "status": "COMPLETED",
      "risk_score": 87,
      "risk_level": "CRITICAL",
      "summary": "High-risk supplier invoice with multiple anomalies",
      "invoice_id": "INV-1048",
      "supplier_id": "SUP-001",
      "created_at": "2026-08-19T13:42:00Z",
      "updated_at": "2026-08-19T13:42:09Z"
    }
  ],
  "metrics": {
    "total": 5,
    "high_risk": 2,
    "action_required": 1,
    "on_hold": 1
  }
}
```

#### GET /api/investigations/[id]

**Response 200:**
```json
{
  "investigation": {
    "id": "INV-001",
    "case_type": "SUPPLIER_INVOICE",
    "status": "ACTION_REQUIRED",
    "risk_score": 87,
    "risk_level": "CRITICAL",
    "summary": "High-risk supplier invoice detected...",
    "recommendation": "Hold payment and independently verify supplier banking details.",
    "recommended_action": "HOLD_PAYMENT",
    "invoice_id": "INV-1048",
    "supplier_id": "SUP-001",
    "evidence": [...],
    "activity_log": [...],
    "created_at": "2026-08-19T13:42:00Z",
    "updated_at": "2026-08-19T13:42:09Z"
  }
}
```

#### POST /api/investigations

**Request:**
```json
{
  "invoice_id": "INV-1048"
}
```

**Response 201:**
```json
{
  "investigation": {
    "id": "INV-001",
    "case_type": "SUPPLIER_INVOICE",
    "status": "PENDING",
    "invoice_id": "INV-1048",
    "supplier_id": "SUP-001",
    "created_at": "2026-08-19T13:42:00Z"
  }
}
```

#### POST /api/investigate

Starts the AI investigation. Returns a Server-Sent Events stream.

**Request:**
```json
{
  "investigation_id": "INV-001"
}
```

**Response: SSE Stream (text/event-stream)**

```
event: activity
data: {"timestamp":"2026-08-19T13:42:01Z","action":"Investigation started","tool_used":null,"status":"COMPLETED"}

event: activity
data: {"timestamp":"2026-08-19T13:42:03Z","action":"Invoice analyzed","tool_used":"analyze_invoice","status":"COMPLETED"}

event: activity
data: {"timestamp":"2026-08-19T13:42:04Z","action":"Supplier identified","tool_used":"lookup_supplier","status":"COMPLETED"}

event: evidence
data: {"id":"EVD-001","type":"MISMATCH","description":"Bank account mismatch","severity":"HIGH","risk_contribution":30}

event: risk
data: {"risk_score":87,"risk_level":"CRITICAL"}

event: recommendation
data: {"recommendation":"Hold payment and verify banking details","recommended_action":"HOLD_PAYMENT"}

event: complete
data: {"status":"ACTION_REQUIRED","investigation_id":"INV-001"}
```

#### POST /api/actions

**Request:**
```json
{
  "investigation_id": "INV-001",
  "action": "HOLD_PAYMENT",
  "approved_by": "Finance Analyst"
}
```

**Response 200:**
```json
{
  "success": true,
  "action": "HOLD_PAYMENT",
  "investigation_id": "INV-001",
  "new_status": "CLOSED",
  "message": "Payment placed on hold. Finance team notified.",
  "timestamp": "2026-08-19T13:45:00Z"
}
```

---

## 5. Agent Architecture

### 5.1 Bedrock Converse Tool-Use Loop

```
┌────────────────────────────────────────────────┐
│              Agent Orchestration Loop           │
│                                                │
│  1. System prompt + investigation context      │
│           │                                    │
│           ▼                                    │
│  2. Call Bedrock Converse API                  │
│           │                                    │
│           ▼                                    │
│  3. Response contains tool_use?               │
│           │                                    │
│      ┌────┴────┐                              │
│      │ YES     │ NO                           │
│      ▼         ▼                              │
│  4. Execute    5. Extract final               │
│     tool(s)      response                     │
│      │              │                         │
│      ▼              ▼                         │
│  6. Append      7. Return investigation       │
│     tool           result                     │
│     results                                   │
│      │                                        │
│      └──────► Back to step 2                  │
│                                                │
└────────────────────────────────────────────────┘
```

### 5.2 Tool Definitions (Bedrock Format)

```typescript
const tools: Tool[] = [
  {
    toolSpec: {
      name: "analyze_invoice",
      description: "Analyze an invoice for anomalies, unusual patterns, and red flags",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            invoice_id: { type: "string", description: "The invoice ID to analyze" }
          },
          required: ["invoice_id"]
        }
      }
    }
  },
  {
    toolSpec: {
      name: "lookup_supplier",
      description: "Look up supplier details including registration, verification status, and current banking information",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            supplier_id: { type: "string", description: "The supplier ID to look up" }
          },
          required: ["supplier_id"]
        }
      }
    }
  },
  {
    toolSpec: {
      name: "get_supplier_transaction_history",
      description: "Retrieve historical transactions for a supplier including amounts, dates, and bank accounts used",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            supplier_id: { type: "string", description: "The supplier ID" }
          },
          required: ["supplier_id"]
        }
      }
    }
  },
  {
    toolSpec: {
      name: "check_company_policy",
      description: "Check company policies relevant to a specific category (PAYMENT, SUPPLIER, COMPLIANCE)",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            category: { type: "string", description: "Policy category to check" },
            context: { type: "string", description: "Context for policy lookup" }
          },
          required: ["category"]
        }
      }
    }
  },
  {
    toolSpec: {
      name: "calculate_risk",
      description: "Calculate risk score based on identified indicators. Returns deterministic score.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            indicators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" }
                }
              },
              description: "Array of risk indicators identified during investigation"
            }
          },
          required: ["indicators"]
        }
      }
    }
  },
  {
    toolSpec: {
      name: "create_investigation_report",
      description: "Generate a structured investigation report with all findings",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            investigation_id: { type: "string" },
            summary: { type: "string" },
            findings: { type: "array", items: { type: "object" } },
            risk_score: { type: "number" },
            risk_level: { type: "string" },
            recommendation: { type: "string" },
            recommended_action: { type: "string" }
          },
          required: ["investigation_id", "summary", "findings", "risk_score", "risk_level", "recommendation", "recommended_action"]
        }
      }
    }
  },
  {
    toolSpec: {
      name: "hold_payment",
      description: "Place a payment on hold. NOTE: This requires human approval before execution.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            invoice_id: { type: "string" },
            reason: { type: "string" }
          },
          required: ["invoice_id", "reason"]
        }
      }
    }
  },
  {
    toolSpec: {
      name: "notify_finance_team",
      description: "Send a notification to the finance team about investigation findings",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            message: { type: "string" },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
            investigation_id: { type: "string" }
          },
          required: ["message", "priority", "investigation_id"]
        }
      }
    }
  }
];
```

### 5.3 System Prompt

```
You are TrustAgent, an AI investigation agent specializing in financial risk assessment.

Your role is to conduct thorough investigations of suspicious financial activity. You must:

1. Analyze the submitted invoice for anomalies
2. Look up the supplier's information
3. Review the supplier's transaction history
4. Compare current invoice details against historical patterns
5. Check relevant company policies
6. Identify all risk indicators
7. Calculate a risk score
8. Generate a clear recommendation

Investigation principles:
- Be thorough: check all available data sources
- Be evidence-based: every finding must cite its source
- Be transparent: explain your reasoning
- Be decisive: provide a clear recommendation
- Never execute financial actions without human approval

You have access to investigation tools. Use them systematically to build your case.
Always call calculate_risk with all identified indicators before making your final recommendation.
Always call create_investigation_report to document your findings.

If the risk is HIGH or CRITICAL and involves payment, recommend HOLD_PAYMENT.
Do NOT call hold_payment directly — recommend it for human approval.
```

---

## 6. Risk Assessment Engine

### 6.1 Scoring Model

```typescript
const RISK_WEIGHTS: Record<string, number> = {
  BANK_ACCOUNT_MISMATCH: 30,
  UNUSUAL_AMOUNT: 20,
  URGENCY_INDICATOR: 10,
  POLICY_VIOLATION: 25,
  SUPPLIER_NOT_VERIFIED: 15,
  BANK_DETAILS_CHANGED: 30,
  AMOUNT_EXCEEDS_THRESHOLD: 15,
  NEW_BANK_ACCOUNT: 20,
  PATTERN_ANOMALY: 10,
  OTHER: 5,
};

const RISK_LEVELS = {
  LOW: { min: 0, max: 29 },
  MEDIUM: { min: 30, max: 59 },
  HIGH: { min: 60, max: 79 },
  CRITICAL: { min: 80, max: 100 },
};
```

### 6.2 Scoring Algorithm

```
total_score = 0
for each indicator:
  weight = RISK_WEIGHTS[indicator.type] or RISK_WEIGHTS["OTHER"]
  total_score += weight

risk_score = min(total_score, 100)
risk_level = classify(risk_score)
```

---

## 7. Real-Time Communication

### 7.1 SSE Event Types

| Event | Purpose | Payload |
|-------|---------|---------|
| `activity` | Investigation step completed | ActivityEntry |
| `evidence` | Evidence item found | Evidence |
| `risk` | Risk score calculated | { risk_score, risk_level } |
| `recommendation` | Final recommendation | { recommendation, recommended_action } |
| `complete` | Investigation finished | { status, investigation_id } |
| `error` | Error occurred | { message } |

### 7.2 Client-Side Handling

The frontend uses `EventSource` to subscribe to the investigation stream. Each event type updates the corresponding UI section (activity feed, evidence list, risk display, recommendation panel).

---

## 8. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| AI executing financial actions | Human-in-the-loop required for all irreversible actions |
| Prompt injection | System prompt instructs agent to never execute actions directly |
| Data exposure | Mock data only; no real financial information |
| API security | Local-only deployment for MVP; no public exposure |
| Model safety | Using approved Bedrock model with guardrails |

---

## 9. Scalability Considerations (Post-MVP)

These are not implemented but the architecture supports them:

| Concern | Future Solution |
|---------|----------------|
| Persistent storage | PostgreSQL or DynamoDB |
| Multi-user | Authentication + RBAC |
| Multiple case types | Extensible CaseType enum + type-specific tool sets |
| High throughput | Queue-based investigation processing |
| Audit compliance | Immutable event log |
| Real integrations | Tool abstraction layer with adapter pattern |

---

## 10. Project Structure

```
trustagent/
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout with global styles
│   │   ├── page.tsx                        # Dashboard page
│   │   ├── investigations/
│   │   │   └── [id]/
│   │   │       └── page.tsx                # Investigation workspace
│   │   └── api/
│   │       ├── investigations/
│   │       │   ├── route.ts                # GET list, POST create
│   │       │   └── [id]/
│   │       │       └── route.ts            # GET single investigation
│   │       ├── investigate/
│   │       │   └── route.ts                # POST start investigation (SSE)
│   │       └── actions/
│   │           └── route.ts                # POST execute action
│   ├── components/
│   │   ├── Dashboard.tsx                   # Metrics + investigation list
│   │   ├── InvestigationWorkspace.tsx      # Main investigation view
│   │   ├── ActivityFeed.tsx                # Real-time step display
│   │   ├── RiskScore.tsx                   # Risk gauge/display
│   │   ├── EvidenceList.tsx                # Evidence cards
│   │   ├── ActionPanel.tsx                 # Recommendation + approve button
│   │   ├── InvoiceCard.tsx                 # Invoice details display
│   │   └── MetricCard.tsx                  # Dashboard metric card
│   ├── lib/
│   │   ├── types.ts                        # All TypeScript interfaces
│   │   ├── agent/
│   │   │   ├── engine.ts                   # Bedrock Converse orchestration loop
│   │   │   ├── tools.ts                    # Tool definitions for Bedrock
│   │   │   ├── tool-handlers.ts            # Tool implementation functions
│   │   │   └── prompts.ts                  # System prompts
│   │   ├── data/
│   │   │   ├── store.ts                    # In-memory data store manager
│   │   │   ├── suppliers.ts                # Supplier mock data
│   │   │   ├── transactions.ts             # Transaction history mock data
│   │   │   ├── policies.ts                 # Company policy mock data
│   │   │   └── invoices.ts                 # Invoice mock data
│   │   └── risk/
│   │       └── calculator.ts               # Deterministic risk scoring
│   └── styles/
│       └── globals.css                     # Tailwind + custom styles
└── public/
    └── (static assets if needed)
```

---

## 11. Deployment (MVP)

For the hackathon demo:

```bash
# Local development server
npm run dev
# Accessible at http://localhost:3000
```

No cloud deployment required. The application runs locally and connects to Bedrock in us-east-1 via AWS credentials.
