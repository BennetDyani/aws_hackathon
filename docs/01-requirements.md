# TrustAgent — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-08-19  
**Author:** TrustAgent Development Team  
**Status:** Approved for MVP

---

## 1. Executive Summary

TrustAgent is an AI-powered investigation and risk assessment platform that transforms suspicious activity alerts into full investigations. Unlike traditional fraud detection that stops at "this looks suspicious," TrustAgent gathers evidence, assesses risk, explains findings, and recommends controlled actions — with mandatory human approval for irreversible decisions.

**Product Positioning:**

> AI that investigates before your business acts.

---

## 2. Problem Statement

Businesses today receive fraud/risk alerts but lack automated investigation capability. Finance teams must manually:

- Cross-reference supplier details against historical records
- Identify bank account changes
- Compare transaction amounts to historical patterns
- Check compliance with company policies
- Document findings for audit trails

This manual process is slow, inconsistent, and prone to human error — especially under time pressure from urgent payment requests.

---

## 3. Target Users

| User Role | Need |
|-----------|------|
| Finance Analyst | Investigate suspicious invoices before payment |
| Finance Manager | Approve/reject recommended actions |
| Compliance Officer | Review investigation audit trails |
| CFO | Dashboard visibility into risk posture |

**MVP Primary User:** Finance Analyst reviewing a flagged supplier invoice.

---

## 4. MVP Scope

### 4.1 In Scope

| Feature | Description |
|---------|-------------|
| Dashboard | Summary metrics (total investigations, high-risk, action required, on hold) |
| Invoice submission | Submit or select a suspicious invoice for investigation |
| AI investigation | Autonomous agent investigates using defined tools |
| Real-time activity feed | Visible investigation progress steps |
| Evidence display | Structured findings with sources and severity |
| Risk scoring | Deterministic, weighted risk calculation |
| Recommendation | Agent-generated recommended action |
| Human approval | User must authorize irreversible actions |
| Payment hold | Execute hold action after approval |
| Investigation report | Complete audit trail of the investigation |

### 4.2 Out of Scope (Future)

- User authentication and authorization
- Real banking system integration
- Multiple investigation types (insurance, cyber, procurement)
- Team collaboration features
- Email/Slack notifications
- Persistent database storage
- Multi-tenant architecture
- Batch investigation processing
- API key management
- Role-based access control

---

## 5. Functional Requirements

### FR-1: Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Display total investigation count | Must |
| FR-1.2 | Display high-risk case count | Must |
| FR-1.3 | Display cases requiring action | Must |
| FR-1.4 | Display payments on hold count | Must |
| FR-1.5 | List recent investigations with status | Must |
| FR-1.6 | Navigate to individual investigation | Must |

### FR-2: Investigation Creation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Submit invoice for investigation | Must |
| FR-2.2 | Pre-loaded demo invoice available | Must |
| FR-2.3 | Investigation created with PENDING status | Must |
| FR-2.4 | Unique investigation ID generated | Must |

### FR-3: AI Investigation Agent

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Agent receives invoice and creates investigation plan | Must |
| FR-3.2 | Agent autonomously selects and executes tools | Must |
| FR-3.3 | Agent analyzes invoice for anomalies | Must |
| FR-3.4 | Agent looks up supplier information | Must |
| FR-3.5 | Agent retrieves transaction history | Must |
| FR-3.6 | Agent checks company policies | Must |
| FR-3.7 | Agent identifies risk indicators | Must |
| FR-3.8 | Agent generates evidence-based findings | Must |
| FR-3.9 | Agent produces risk assessment | Must |
| FR-3.10 | Agent recommends appropriate action | Must |

### FR-4: Investigation Tools

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | `analyze_invoice` — Parse and identify anomalies | Must |
| FR-4.2 | `lookup_supplier` — Retrieve supplier record | Must |
| FR-4.3 | `get_supplier_transaction_history` — Past transactions | Must |
| FR-4.4 | `check_company_policy` — Relevant policy lookup | Must |
| FR-4.5 | `calculate_risk` — Deterministic risk scoring | Must |
| FR-4.6 | `create_investigation_report` — Final report | Must |
| FR-4.7 | `hold_payment` — Place payment on hold | Must |
| FR-4.8 | `notify_finance_team` — Send notification | Should |

### FR-5: Risk Assessment

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Weighted risk scoring model | Must |
| FR-5.2 | Risk indicators with defined weights | Must |
| FR-5.3 | Risk levels: LOW (0-29), MEDIUM (30-59), HIGH (60-79), CRITICAL (80-100) | Must |
| FR-5.4 | Each finding includes risk contribution | Must |
| FR-5.5 | Total risk score capped at 100 | Must |

### FR-6: Evidence & Explainability

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Each finding includes description | Must |
| FR-6.2 | Each finding includes evidence source | Must |
| FR-6.3 | Each finding includes severity level | Must |
| FR-6.4 | Each finding includes risk contribution score | Must |
| FR-6.5 | Each finding includes recommended response | Should |

### FR-7: Human-in-the-Loop Actions

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Agent recommends action but cannot execute without approval | Must |
| FR-7.2 | User sees recommendation with supporting evidence | Must |
| FR-7.3 | User clicks to approve recommended action | Must |
| FR-7.4 | Confirmation dialog before irreversible action | Must |
| FR-7.5 | Action executes only after user confirmation | Must |
| FR-7.6 | Case status updates after action | Must |

### FR-8: Investigation Report

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8.1 | Complete investigation timeline | Must |
| FR-8.2 | All evidence collected | Must |
| FR-8.3 | Risk score and level | Must |
| FR-8.4 | Recommendation and outcome | Must |
| FR-8.5 | Approval record (who, when) | Should |

---

## 6. Non-Functional Requirements

| ID | Requirement | Category |
|----|-------------|----------|
| NFR-1 | Investigation completes within 30 seconds | Performance |
| NFR-2 | UI updates in real-time during investigation | Performance |
| NFR-3 | Professional enterprise-grade UI | Usability |
| NFR-4 | Clear information hierarchy | Usability |
| NFR-5 | Responsive layout | Usability |
| NFR-6 | No sensitive/real data in the system | Security |
| NFR-7 | Human approval required for financial actions | Security |
| NFR-8 | Bedrock API calls below 1 RPS | Compliance |
| NFR-9 | All resources in us-east-1 | Compliance |
| NFR-10 | Investigation audit trail maintained | Auditability |

---

## 7. User Stories

### US-1: Finance Analyst Investigates Invoice

> As a finance analyst, I want to submit a suspicious invoice for AI investigation, so that I can make an informed decision about whether to release payment.

**Acceptance Criteria:**
- I can submit an invoice for investigation
- The AI agent investigates autonomously
- I see investigation progress in real-time
- I receive evidence-based findings
- I receive a risk score
- I receive a recommended action
- I can approve or reject the recommendation

### US-2: Finance Analyst Holds Payment

> As a finance analyst, I want to place a suspicious payment on hold after reviewing the investigation, so that potentially fraudulent payments are stopped.

**Acceptance Criteria:**
- I see a clear recommendation with supporting evidence
- I can click to hold the payment
- I must confirm before the action executes
- The case status updates to reflect the hold
- An audit record is created

### US-3: Finance Manager Reviews Dashboard

> As a finance manager, I want to see a summary of all investigations, so that I understand the current risk posture.

**Acceptance Criteria:**
- I see total investigation count
- I see high-risk case count
- I see cases requiring my action
- I see current payments on hold
- I can navigate to any individual case

---

## 8. Constraints

| Constraint | Detail |
|-----------|--------|
| Time | 2-hour hackathon build |
| Region | us-east-1 only |
| Models | Only approved Bedrock models |
| Data | Synthetic/mock only |
| Infrastructure | No GPU instances, no marketplace AMIs |
| Storage | No public S3 buckets |
| Rate limit | Bedrock < 1 RPS |

---

## 9. Success Criteria

The MVP is successful if the following end-to-end flow works in a single continuous demonstration:

1. ✅ Invoice submitted/selected
2. ✅ Investigation started
3. ✅ Agent investigates autonomously (visible steps)
4. ✅ Evidence gathered and displayed
5. ✅ Risk score calculated and shown
6. ✅ Recommendation generated
7. ✅ User approves HOLD PAYMENT
8. ✅ Status updates to PAYMENT ON HOLD
9. ✅ Investigation report available

---

## 10. Assumptions

- The demo runs locally on the developer's machine
- AWS credentials are available via IAM role or manual configuration
- Bedrock Claude Sonnet 4.6 is accessible in us-east-1
- No persistent storage needed (in-memory is acceptable)
- Single-user operation (no concurrency requirements)
- No authentication needed for the demo

---

## 11. Dependencies

| Dependency | Type | Risk |
|-----------|------|------|
| Amazon Bedrock access | External | Medium — credentials must be valid |
| Claude Sonnet 4.6 model availability | External | Low — listed as approved |
| Node.js runtime | Local | Low — standard dev environment |
| Network connectivity | Infrastructure | Low |

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| Investigation | An AI-conducted review of suspicious activity |
| Evidence | A specific finding with source attribution |
| Risk Score | Numeric 0-100 assessment of threat level |
| Risk Level | Classification: LOW, MEDIUM, HIGH, CRITICAL |
| Human-in-the-Loop | Requirement for human approval before action |
| Tool | A function the AI agent can call during investigation |
| Hold | Placing a payment in suspended state pending verification |
