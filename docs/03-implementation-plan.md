# TrustAgent — Implementation Plan

**Version:** 1.0  
**Date:** 2026-08-19  
**Author:** TrustAgent Development Team  
**Status:** Approved

---

## 1. Implementation Strategy

### 1.1 Approach

**Inside-out, vertical slice:**

Build the core investigation engine first, then wrap it with API routes, then build the UI on top. This ensures the most complex and highest-risk component (Bedrock integration) is validated early, before investing time in UI polish.

### 1.2 Guiding Principles

- Working software over documentation
- Vertical slice over horizontal layers
- Validate risky integrations first
- One continuous demo flow before any polish
- Mock everything that isn't core to the demo

---

## 2. Task Breakdown

### Phase 1: Foundation (15 minutes)

| Task | Description | Dependencies | Risk |
|------|-------------|--------------|------|
| 1.1 | Initialize Next.js project with TypeScript | None | Low |
| 1.2 | Install dependencies (AWS SDK, Tailwind) | 1.1 | Low |
| 1.3 | Configure Tailwind CSS | 1.2 | Low |
| 1.4 | Create TypeScript type definitions | 1.1 | Low |
| 1.5 | Create project directory structure | 1.1 | Low |

**Exit Criteria:** `npm run dev` starts successfully, Tailwind compiles, TypeScript compiles.

---

### Phase 2: Data Layer (10 minutes)

| Task | Description | Dependencies | Risk |
|------|-------------|--------------|------|
| 2.1 | Create in-memory data store manager | 1.4 | Low |
| 2.2 | Create supplier mock data (SUP-001: ABC Office Solutions) | 2.1 | Low |
| 2.3 | Create transaction history (5 historical transactions) | 2.1, 2.2 | Low |
| 2.4 | Create company policy data (payment, supplier policies) | 2.1 | Low |
| 2.5 | Create suspicious invoice (INV-1048, R185,000) | 2.1, 2.2 | Low |

**Exit Criteria:** All mock data importable and typed correctly.

**Mock Data Design:**

Supplier "ABC Office Solutions":
- Previous bank account: ending 4821
- Current invoice bank account: ending 9917 (MISMATCH)
- Historical average: ~R25,000
- Current invoice: R185,000 (7.4x average — ANOMALY)
- Verification status: verified 6 months ago
- Bank details last changed: not verified after change

---

### Phase 3: Risk Calculator (10 minutes)

| Task | Description | Dependencies | Risk |
|------|-------------|--------------|------|
| 3.1 | Implement risk weight configuration | 1.4 | Low |
| 3.2 | Implement scoring algorithm | 3.1 | Low |
| 3.3 | Implement risk level classification | 3.2 | Low |
| 3.4 | Unit test with known indicators → expected score | 3.3 | Low |

**Exit Criteria:** `calculate_risk([bank_mismatch, unusual_amount, urgency, policy_violation])` → score 85, level CRITICAL.

---

### Phase 4: Investigation Engine (25 minutes) ⚠️ HIGHEST RISK

| Task | Description | Dependencies | Risk |
|------|-------------|--------------|------|
| 4.1 | Create Bedrock client configuration | 1.2 | Medium |
| 4.2 | Define tool specifications (Bedrock format) | 1.4 | Low |
| 4.3 | Implement tool handler functions | 2.1-2.5, 3.1-3.3 | Medium |
| 4.4 | Implement Converse API orchestration loop | 4.1, 4.2 | **High** |
| 4.5 | Implement tool dispatch (route calls to handlers) | 4.3, 4.4 | Medium |
| 4.6 | Implement activity event emission | 4.4 | Low |
| 4.7 | Implement error handling and timeout | 4.4 | Medium |
| 4.8 | Test complete tool-use loop with Bedrock | 4.1-4.7 | **High** |

**Exit Criteria:** Calling the engine with INV-1048 triggers a multi-step investigation, calls all relevant tools, and produces a risk assessment + recommendation.

**Risk Mitigation:**
- If Bedrock is unavailable: fall back to a deterministic mock investigation that simulates the tool calls
- If tool-use loop is unstable: limit to 10 iterations max
- If model doesn't call tools correctly: strengthen system prompt with explicit instruction

---

### Phase 5: API Routes (15 minutes)

| Task | Description | Dependencies | Risk |
|------|-------------|--------------|------|
| 5.1 | GET /api/investigations — list all | 2.1 | Low |
| 5.2 | GET /api/investigations/[id] — single | 2.1 | Low |
| 5.3 | POST /api/investigations — create new | 2.1, 2.5 | Low |
| 5.4 | POST /api/investigate — SSE stream | 4.4-4.6 | **Medium** |
| 5.5 | POST /api/actions — execute action | 2.1 | Low |
| 5.6 | Test API routes with curl/fetch | 5.1-5.5 | Low |

**Exit Criteria:** All endpoints return correct responses. SSE stream emits events during investigation.

**SSE Implementation Notes:**
- Use `ReadableStream` with `TextEncoder` in Next.js Route Handler
- Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- Emit events as investigation progresses via callback from engine

---

### Phase 6: User Interface (25 minutes)

| Task | Description | Dependencies | Risk |
|------|-------------|--------------|------|
| 6.1 | Create root layout with navigation | 1.3 | Low |
| 6.2 | Create MetricCard component | 1.3 | Low |
| 6.3 | Create Dashboard page (metrics + list) | 5.1, 6.2 | Low |
| 6.4 | Create ActivityFeed component | 1.4 | Low |
| 6.5 | Create RiskScore component | 1.4 | Low |
| 6.6 | Create EvidenceList component | 1.4 | Low |
| 6.7 | Create InvoiceCard component | 1.4 | Low |
| 6.8 | Create ActionPanel component | 1.4 | Low |
| 6.9 | Create InvestigationWorkspace page | 6.4-6.8, 5.2 | Medium |
| 6.10 | Wire SSE subscription in workspace | 5.4, 6.9 | Medium |
| 6.11 | Wire action approval flow | 5.5, 6.8 | Low |

**Exit Criteria:** Dashboard shows metrics and list. Investigation workspace displays real-time activity, evidence, risk score, and action button.

---

### Phase 7: Integration & Polish (10 minutes)

| Task | Description | Dependencies | Risk |
|------|-------------|--------------|------|
| 7.1 | End-to-end demo flow test | All above | Medium |
| 7.2 | Fix critical bugs | 7.1 | Variable |
| 7.3 | UI polish (spacing, colors, readability) | 7.1 | Low |
| 7.4 | Error state handling | 7.1 | Low |

**Exit Criteria:** Complete demo flow works: submit invoice → investigate → evidence → risk → approve hold → status update.

---

## 3. Dependency Graph

```
Phase 1 (Foundation)
    │
    ├──► Phase 2 (Data Layer)
    │        │
    │        ├──► Phase 3 (Risk Calculator)
    │        │        │
    │        │        └──► Phase 4 (Investigation Engine) ⚠️
    │        │                  │
    │        └─────────────────►│
    │                           │
    │                           ▼
    │                    Phase 5 (API Routes)
    │                           │
    │                           ▼
    └───────────────────► Phase 6 (UI)
                                │
                                ▼
                         Phase 7 (Integration)
```

---

## 4. Critical Path

The critical path is:

```
Foundation → Data Layer → Risk Calculator → Investigation Engine → API Routes → UI → Integration
```

The **Investigation Engine (Phase 4)** is the highest-risk item and the longest task. If it encounters issues, the entire timeline shifts.

**Contingency:** If Bedrock integration fails after 30 minutes of effort, implement a mock engine that simulates the tool-use loop with predetermined steps and a 1-second delay between each. This preserves the demo flow while removing the AI dependency.

---

## 5. Time Budget

| Phase | Estimated Time | Cumulative |
|-------|---------------|-----------|
| Phase 1: Foundation | 15 min | 15 min |
| Phase 2: Data Layer | 10 min | 25 min |
| Phase 3: Risk Calculator | 10 min | 35 min |
| Phase 4: Investigation Engine | 25 min | 60 min |
| Phase 5: API Routes | 15 min | 75 min |
| Phase 6: UI | 25 min | 100 min |
| Phase 7: Integration | 10 min | 110 min |
| **Buffer** | **10 min** | **120 min** |

**Total: 120 minutes (2 hours)**

---

## 6. Dependencies (External)

| Dependency | Required For | Fallback |
|-----------|-------------|----------|
| Node.js 18+ | All | Pre-installed on dev machine |
| npm | Package installation | Pre-installed |
| AWS credentials | Bedrock API calls | IAM role or manual config |
| Bedrock us-east-1 | AI investigation | Mock engine fallback |
| Network connectivity | Bedrock + npm install | Cache packages if possible |

---

## 7. Definition of Done

A task is complete when:

1. Code compiles without TypeScript errors
2. The feature works as described in the task
3. No console errors in browser or server
4. The feature integrates with adjacent components

The **project** is done when:

1. The full demo flow works end-to-end
2. The UI is professional and readable
3. The risk assessment is explainable
4. Human approval is enforced
5. Investigation report is generated

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Bedrock API unavailable | Low | Critical | Mock engine fallback |
| Tool-use loop infinite/unstable | Medium | High | Max 10 iterations, timeout |
| Model doesn't follow tool-use pattern | Medium | High | Detailed system prompt, few-shot examples |
| SSE doesn't work in Next.js | Low | Medium | Fall back to polling |
| Time overrun on engine | Medium | High | Strict 30-min timebox, then use mock |
| TypeScript compilation issues | Low | Low | Fix incrementally |
| Tailwind configuration issues | Low | Low | Use inline styles as fallback |

---

## 9. Quality Gates

| Gate | Checkpoint | Must Pass Before |
|------|-----------|-----------------|
| G1 | `npm run dev` starts cleanly | Phase 2 |
| G2 | Mock data loads and types correctly | Phase 3 |
| G3 | Risk calculator returns correct scores | Phase 4 |
| G4 | Bedrock responds with tool_use calls | Phase 5 |
| G5 | Full investigation completes via engine | Phase 5 |
| G6 | API returns correct responses | Phase 6 |
| G7 | SSE stream delivers events to client | Phase 7 |
| G8 | End-to-end demo flow works | Ship |
