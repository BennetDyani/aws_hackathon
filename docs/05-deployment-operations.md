# TrustAgent — Deployment & Operations Guide

**Version:** 1.0  
**Date:** 2026-08-19  
**Author:** TrustAgent Development Team  
**Status:** Approved for MVP

---

## 1. Overview

TrustAgent MVP runs as a local Next.js development server. This guide covers setup, configuration, running, troubleshooting, and future production deployment considerations.

---

## 2. Prerequisites

### 2.1 System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x | 10.x |
| RAM | 2 GB available | 4 GB available |
| Disk | 500 MB | 1 GB |
| Network | Required (Bedrock API) | Stable connection |
| OS | Windows/Linux/macOS | Any |

### 2.2 AWS Requirements

| Requirement | Detail |
|-------------|--------|
| AWS Region | us-east-1 (N. Virginia) |
| Bedrock Access | Model `us.anthropic.claude-sonnet-4-6` enabled |
| IAM Permissions | `bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream` |
| Authentication | IAM role (EC2) or temporary credentials |

---

## 3. Installation

### 3.1 Clone and Install

```bash
# Navigate to project directory
cd trustagent

# Install dependencies
npm install
```

### 3.2 Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Verify dependencies installed
ls node_modules/.package-lock.json
# Should exist
```

---

## 4. Configuration

### 4.1 AWS Credentials

#### Option A: EC2 Instance IAM Role (Recommended for Hackathon RDP)

No configuration needed. The instance IAM role provides credentials automatically.

Verify access:
```bash
aws sts get-caller-identity
aws bedrock list-foundation-models --region us-east-1 --query "modelSummaries[?modelId=='us.anthropic.claude-sonnet-4-6'].modelId"
```

#### Option B: Manual Credentials (VS Code Browser / Local CLI)

Set environment variables before starting the application:

**PowerShell:**
```powershell
$env:AWS_ACCESS_KEY_ID = "<from workshop page>"
$env:AWS_SECRET_ACCESS_KEY = "<from workshop page>"
$env:AWS_SESSION_TOKEN = "<from workshop page>"
$env:AWS_DEFAULT_REGION = "us-east-1"
```

**Bash/Zsh:**
```bash
export AWS_ACCESS_KEY_ID="<from workshop page>"
export AWS_SECRET_ACCESS_KEY="<from workshop page>"
export AWS_SESSION_TOKEN="<from workshop page>"
export AWS_DEFAULT_REGION="us-east-1"
```

**Important:** These credentials expire periodically. If you receive `ExpiredTokenException` or `AccessDeniedException`, obtain fresh credentials from the Workshop Studio event page.

### 4.2 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_DEFAULT_REGION` | Yes | — | Must be `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Conditional | — | Required if not using IAM role |
| `AWS_SECRET_ACCESS_KEY` | Conditional | — | Required if not using IAM role |
| `AWS_SESSION_TOKEN` | Conditional | — | Required for temporary credentials |
| `BEDROCK_MODEL_ID` | No | `us.anthropic.claude-sonnet-4-6` | Override AI model |
| `PORT` | No | `3000` | Development server port |

### 4.3 Application Configuration

No `.env` file is required for the MVP. All configuration uses sensible defaults or AWS credential chain.

---

## 5. Running the Application

### 5.1 Development Mode

```bash
npm run dev
```

**Output:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in Xs
```

Open `http://localhost:3000` in your browser.

### 5.2 Production Build (Optional)

```bash
# Build
npm run build

# Start production server
npm run start
```

### 5.3 Verify Running

```bash
# Health check
curl http://localhost:3000/api/investigations

# Expected: JSON response with investigations array
```

---

## 6. Operations

### 6.1 Monitoring

For the hackathon MVP, monitoring is via:

| Channel | What to Watch |
|---------|---------------|
| Terminal (server) | API request logs, Bedrock call timing, errors |
| Browser Console | Client-side errors, SSE connection status |
| Browser Network Tab | API response times, SSE event flow |

### 6.2 Logs

Next.js logs to stdout/stderr in the terminal where `npm run dev` is running.

Key log indicators:
```
[ENGINE] Starting investigation INV-001          → Investigation started
[BEDROCK] Converse API call (attempt 1)          → Model request
[TOOL] Executing: analyze_invoice                → Tool execution
[ENGINE] Investigation complete: score=87        → Completion
[ERROR] Bedrock API error: ...                   → Failure
```

### 6.3 Health Indicators

| Indicator | Healthy | Unhealthy |
|-----------|---------|-----------|
| Server starts | "Ready in Xs" message | Compilation errors |
| Dashboard loads | Metrics visible | Blank page or error |
| Investigation starts | First event within 3s | Timeout or no events |
| Investigation completes | Complete event within 30s | Hangs or errors |
| Bedrock connectivity | Tools execute, response received | Timeout, auth errors |

### 6.4 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `ExpiredTokenException` | AWS temp credentials expired | Get fresh credentials from Workshop Studio |
| `AccessDeniedException` | Wrong model ID or permissions | Verify model ID: `us.anthropic.claude-sonnet-4-6` |
| `ECONNREFUSED` | Server not running | Run `npm run dev` |
| Port 3000 in use | Another process on port | Kill process or use `PORT=3001 npm run dev` |
| SSE not updating | Browser caching | Hard refresh (Ctrl+Shift+R) |
| TypeScript errors | Missing types | Run `npm run build` to see full errors |
| Bedrock timeout | Network or rate limit | Wait 60s, retry. Check network connectivity |
| Blank dashboard | API error | Check terminal for server errors |

### 6.5 Restarting

```bash
# Stop: Ctrl+C in terminal running dev server

# Restart
npm run dev
```

**Note:** In-memory data resets on restart. All investigations are lost. This is expected for the MVP.

---

## 7. Data Management

### 7.1 Data Lifecycle

```
Server Start → Mock data loaded into memory
     ↓
Investigation created → Added to in-memory store
     ↓
Investigation runs → Evidence, activity, risk added
     ↓
Action taken → Status updated in memory
     ↓
Server Stop → ALL DATA LOST
```

### 7.2 Demo Reset

To reset the demo to initial state:
1. Stop the dev server (Ctrl+C)
2. Restart (`npm run dev`)

All investigations are cleared. Mock data reloads fresh.

### 7.3 Demo Data

Pre-loaded mock data includes:
- 1 suspicious invoice (INV-1048)
- 1 supplier (ABC Office Solutions)
- 5 historical transactions
- 4 company policies
- Optionally: 1-2 pre-completed investigations for dashboard variety

---

## 8. Security Operations

### 8.1 Access Control

| Layer | Control |
|-------|---------|
| Network | Local-only (localhost:3000) |
| Authentication | None (demo environment) |
| Authorization | Human-in-the-loop for actions |
| Data | Synthetic mock data only |
| Secrets | AWS credentials via env/IAM role |

### 8.2 Security Checklist

- [ ] No real financial data in the application
- [ ] No hardcoded AWS credentials in source code
- [ ] No public network exposure
- [ ] Human approval required for payment actions
- [ ] No public S3 buckets (none used)

---

## 9. Performance Baseline

### 9.1 Expected Performance (MVP)

| Operation | Expected Latency |
|-----------|-----------------|
| Dashboard load | < 500ms |
| Create investigation | < 200ms |
| Bedrock API call (per tool iteration) | 2-5s |
| Full investigation (5-8 tool calls) | 15-30s |
| Action execution | < 200ms |
| SSE event delivery | < 100ms after generation |

### 9.2 Rate Limiting

Bedrock calls are naturally rate-limited by the sequential tool-use loop:
- One Converse call at a time
- Each call waits for response before next
- Effective rate: ~0.2-0.5 RPS (well under 1 RPS limit)

---

## 10. Future Production Deployment (Post-Hackathon)

### 10.1 Production Architecture (Reference Only)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CloudFront  │────►│  ECS/Fargate │────►│  Bedrock     │
│  (CDN)       │     │  (Next.js)   │     │  us-east-1   │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │  DynamoDB    │
                     │  (State)     │
                     └──────────────┘
```

### 10.2 Production Considerations (Not Implemented)

| Concern | Solution |
|---------|----------|
| Persistence | DynamoDB or Aurora |
| Authentication | Amazon Cognito |
| Scaling | ECS auto-scaling |
| CDN | CloudFront |
| Monitoring | CloudWatch |
| Secrets | AWS Secrets Manager |
| CI/CD | CodePipeline |
| Multi-tenancy | Tenant isolation in data layer |

---

## 11. Runbook: Demo Day

### 11.1 Pre-Demo Setup (5 minutes before)

```bash
# 1. Verify AWS credentials
aws sts get-caller-identity

# 2. Start application
npm run dev

# 3. Open browser to http://localhost:3000

# 4. Verify dashboard loads

# 5. Verify Bedrock connectivity (optional quick test)
# The first investigation will confirm this
```

### 11.2 Demo Script

1. **Open Dashboard** — Show metrics overview
2. **Explain** — "We have a suspicious invoice that needs investigation"
3. **Start Investigation** — Submit INV-1048
4. **Narrate** — Point out each investigation step as it appears
5. **Show Evidence** — Walk through each finding
6. **Show Risk Score** — Explain the scoring
7. **Show Recommendation** — "The AI recommends holding payment"
8. **Approve Action** — Click Hold Payment, confirm
9. **Show Result** — Status updated, audit trail complete
10. **Return to Dashboard** — Metrics updated

### 11.3 If Things Go Wrong

| Problem | Recovery |
|---------|----------|
| Investigation hangs | Refresh page, restart server, try again |
| Credentials expired | Grab fresh credentials, restart server |
| Server crash | `npm run dev` again |
| Browser issue | Hard refresh or new incognito window |
| Bedrock error | Wait 30s, retry. If persistent, explain and show architecture |

---

## 12. Appendix: Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type check
npx tsc --noEmit

# Check AWS identity
aws sts get-caller-identity

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1 --output table

# Kill process on port 3000 (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Kill process on port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9
```
