# TrustAgent — Test Plan

**Version:** 1.0  
**Date:** 2026-08-19  
**Author:** TrustAgent Development Team  
**Status:** Approved for MVP

---

## 1. Test Strategy

### 1.1 Approach

Given the 2-hour hackathon constraint, testing follows a **risk-based, pragmatic approach**:

- **Critical path testing** over full coverage
- **Manual integration testing** over automated unit tests
- **End-to-end demo verification** as the primary quality gate
- **Deterministic components tested first** (risk calculator, data layer)
- **AI components tested via integration** (not mocked in tests)

### 1.2 Test Pyramid (MVP Adaptation)

```
        ┌─────────────────┐
        │   E2E Demo      │  ← Primary verification
        │   (Manual)      │
        ├─────────────────┤
        │  Integration    │  ← API route + engine tests
        │  (Manual/curl)  │
        ├─────────────────┤
        │  Unit Tests     │  ← Risk calculator only
        │  (Automated)    │
        └─────────────────┘
```

### 1.3 Testing Scope

| Component | Test Type | Priority |
|-----------|----------|----------|
| Risk Calculator | Unit (automated) | Must |
| Mock Data Layer | Smoke (manual) | Must |
| Investigation Engine | Integration (manual) | Must |
| API Routes | Integration (curl) | Must |
| SSE Streaming | Integration (browser) | Must |
| UI Components | Visual (manual) | Should |
| End-to-End Flow | Demo walkthrough (manual) | Must |
| Error Handling | Exploratory (manual) | Should |

---

## 2. Unit Tests

### 2.1 Risk Calculator Tests

**File:** `src/lib/risk/__tests__/calculator.test.ts`

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Empty indicators | `[]` | score: 0, level: LOW |
| Single low indicator | `[{type: "OTHER"}]` | score: 5, level: LOW |
| Bank mismatch only | `[{type: "BANK_ACCOUNT_MISMATCH"}]` | score: 30, level: MEDIUM |
| Demo scenario indicators | `[BANK_ACCOUNT_MISMATCH, UNUSUAL_AMOUNT, URGENCY_INDICATOR, POLICY_VIOLATION]` | score: 85, level: CRITICAL |
| Score capped at 100 | All indicators combined | score: 100, level: CRITICAL |
| Medium range | `[UNUSUAL_AMOUNT, URGENCY_INDICATOR]` | score: 30, level: MEDIUM |
| High range | `[BANK_ACCOUNT_MISMATCH, UNUSUAL_AMOUNT, URGENCY_INDICATOR]` | score: 60, level: HIGH |
| Unknown indicator type | `[{type: "UNKNOWN"}]` | score: 5, level: LOW (defaults to OTHER) |

### 2.2 Data Layer Tests

| Test Case | Verification |
|-----------|-------------|
| Supplier lookup by ID | Returns correct supplier record |
| Transaction history by supplier | Returns all historical transactions |
| Invoice lookup by ID | Returns correct invoice |
| Policy lookup by category | Returns relevant policies |
| Non-existent ID | Returns null/empty |

---

## 3. Integration Tests

### 3.1 API Route Tests

Execute manually via curl or fetch during development.

#### GET /api/investigations

```bash
# Test: Returns list of investigations
curl http://localhost:3000/api/investigations

# Expected: 200, JSON with investigations array and metrics object
# Verify: metrics.total matches array length
```

#### GET /api/investigations/[id]

```bash
# Test: Returns single investigation
curl http://localhost:3000/api/investigations/INV-001

# Expected: 200, JSON with full investigation object
# Verify: All fields present, evidence array populated after investigation

# Test: Non-existent ID
curl http://localhost:3000/api/investigations/INV-999

# Expected: 404, error message
```

#### POST /api/investigations

```bash
# Test: Create new investigation
curl -X POST http://localhost:3000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{"invoice_id": "INV-1048"}'

# Expected: 201, investigation with PENDING status
# Verify: id generated, timestamps set, linked to invoice

# Test: Invalid invoice ID
curl -X POST http://localhost:3000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{"invoice_id": "INVALID"}'

# Expected: 400 or 404, error message
```

#### POST /api/investigate (SSE)

```bash
# Test: Start investigation stream
curl -N http://localhost:3000/api/investigate \
  -H "Content-Type: application/json" \
  -d '{"investigation_id": "INV-001"}'

# Expected: SSE stream with events:
#   - Multiple 'activity' events
#   - One or more 'evidence' events
#   - One 'risk' event
#   - One 'recommendation' event
#   - One 'complete' event
# Verify: Events arrive in logical order, all required data present
```

#### POST /api/actions

```bash
# Test: Approve hold payment
curl -X POST http://localhost:3000/api/actions \
  -H "Content-Type: application/json" \
  -d '{"investigation_id": "INV-001", "action": "HOLD_PAYMENT", "approved_by": "Test User"}'

# Expected: 200, success: true, new_status: "CLOSED"
# Verify: Investigation status updated, invoice status updated

# Test: Invalid action
curl -X POST http://localhost:3000/api/actions \
  -H "Content-Type: application/json" \
  -d '{"investigation_id": "INV-001", "action": "INVALID_ACTION"}'

# Expected: 400, error message
```

### 3.2 Investigation Engine Integration Test

| Step | Verification |
|------|-------------|
| Engine receives investigation context | No crash, returns stream |
| Bedrock Converse API called | Response received (check logs) |
| Model uses tool_use in response | At least 3 tools called |
| Tools execute without error | All return valid results |
| Tool results sent back to model | Loop continues |
| Investigation completes | Final response with recommendation |
| Activity events emitted | Minimum 5 activity entries |
| Evidence collected | Minimum 3 evidence items |
| Risk score calculated | Score between 0-100, level assigned |
| Recommendation generated | Non-empty recommendation string |

### 3.3 SSE Stream Integration Test

| Test Case | Verification |
|-----------|-------------|
| Connection established | EventSource opens without error |
| Events received in order | activity → evidence → risk → recommendation → complete |
| Event data parseable | JSON.parse succeeds on all data |
| Stream closes after complete | EventSource readyState changes to CLOSED |
| UI updates on each event | Corresponding component re-renders |

---

## 4. End-to-End Demo Test

### 4.1 Primary Demo Flow (Critical)

This is the **mandatory** test that must pass before the demo.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open http://localhost:3000 | Dashboard loads with metrics |
| 2 | View dashboard metrics | Shows correct counts |
| 3 | Click "New Investigation" or select demo invoice | Investigation creation form/action visible |
| 4 | Submit INV-1048 for investigation | Investigation created, redirected to workspace |
| 5 | Investigation starts automatically | Activity feed begins populating |
| 6 | Watch activity feed | Steps appear: "Invoice analyzed", "Supplier identified", etc. |
| 7 | Evidence appears | Bank mismatch, unusual amount, etc. displayed |
| 8 | Risk score calculated | Score ~87, level CRITICAL displayed |
| 9 | Recommendation shown | "Hold payment and verify banking details" |
| 10 | "Hold Payment" button visible | Button is active and clickable |
| 11 | Click "Hold Payment" | Confirmation dialog appears |
| 12 | Confirm action | Status updates to "PAYMENT ON HOLD" |
| 13 | Investigation status updates | Status shows CLOSED |
| 14 | Return to dashboard | Metrics updated (on_hold count incremented) |

**Pass Criteria:** All 14 steps complete successfully in a single uninterrupted flow.

### 4.2 Timing Requirements

| Metric | Target | Maximum |
|--------|--------|---------|
| Dashboard load | < 1s | 3s |
| Investigation creation | < 1s | 2s |
| First activity event | < 3s | 5s |
| Full investigation | < 30s | 45s |
| Action execution | < 1s | 2s |

### 4.3 Visual Verification

| Element | Check |
|---------|-------|
| Dashboard | Professional layout, readable metrics, clean list |
| Activity Feed | Timestamps, checkmarks, logical flow |
| Risk Score | Prominently displayed, color-coded (red for CRITICAL) |
| Evidence List | Structured cards, severity indicators, sources |
| Action Panel | Clear recommendation, visible button, confirmation |
| Status Updates | Reflects current state accurately |

---

## 5. Error Scenario Tests

### 5.1 Graceful Degradation

| Scenario | Expected Behavior |
|----------|------------------|
| Bedrock API timeout | Error message displayed, investigation marked as failed |
| Bedrock rate limit hit | Retry with backoff or clear error message |
| Invalid investigation ID | 404 page or error toast |
| Network interruption during SSE | Reconnection attempt or clear error state |
| Model returns unexpected format | Error handling catches, investigation fails gracefully |

### 5.2 Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Double-click "Hold Payment" | Idempotent — only one action executed |
| Navigate away during investigation | Investigation continues server-side |
| Refresh during investigation | Current state loaded from store |
| Multiple investigations created | Each tracked independently |

---

## 6. Security Tests

| Test | Verification |
|------|-------------|
| Hold payment requires explicit user action | No automatic execution by AI |
| Confirmation dialog appears before action | Cannot bypass confirmation |
| No real financial data exposed | All data is synthetic/mock |
| No sensitive data in console/network | Check browser dev tools |

---

## 7. Performance Tests

| Test | Target | Method |
|------|--------|--------|
| Page load (dashboard) | < 1s | Browser network tab |
| API response (list) | < 100ms | curl timing |
| SSE first event | < 3s | Browser console timestamp |
| Full investigation | < 30s | Start to complete event |
| Bedrock API latency | < 5s per call | Server logs |

---

## 8. Test Environment

| Component | Configuration |
|-----------|--------------|
| Runtime | Node.js 18+ (local) |
| Browser | Chrome/Edge (latest) |
| API Testing | curl / browser fetch |
| AWS Region | us-east-1 |
| Model | us.anthropic.claude-sonnet-4-6 |
| Data | In-memory mock data |

---

## 9. Test Execution Checklist

### Pre-Demo Checklist

- [ ] `npm run dev` starts without errors
- [ ] No TypeScript compilation errors
- [ ] Dashboard loads at http://localhost:3000
- [ ] Dashboard metrics display correctly
- [ ] Can create new investigation
- [ ] Investigation SSE stream works
- [ ] Activity feed populates in real-time
- [ ] Evidence items display
- [ ] Risk score displays with correct color
- [ ] Recommendation is visible
- [ ] "Hold Payment" button works
- [ ] Confirmation dialog appears
- [ ] Status updates after approval
- [ ] Dashboard reflects updated metrics
- [ ] No console errors during entire flow
- [ ] Investigation completes within 30 seconds

### Post-Demo Verification

- [ ] Investigation report accessible
- [ ] All evidence has sources
- [ ] Risk score matches expected (~87 for demo scenario)
- [ ] Audit trail complete (all steps logged)

---

## 10. Known Limitations

| Limitation | Impact | Acceptance |
|-----------|--------|-----------|
| No automated E2E tests | Manual verification required | Acceptable for hackathon |
| No load testing | Single-user only | Acceptable for demo |
| No cross-browser testing | Chrome/Edge only | Acceptable for demo |
| No accessibility testing | May have a11y gaps | Acceptable for hackathon |
| AI output non-deterministic | Exact wording may vary between runs | Acceptable — risk score is deterministic |

---

## 11. Bug Severity Classification

| Severity | Definition | Action |
|----------|-----------|--------|
| P0 — Blocker | Demo flow cannot complete | Must fix immediately |
| P1 — Critical | Feature broken but workaround exists | Fix if time permits |
| P2 — Major | Visual/UX issue, demo still works | Fix if time permits |
| P3 — Minor | Cosmetic issue | Defer |

**For the hackathon: Only P0 bugs are mandatory fixes.**
