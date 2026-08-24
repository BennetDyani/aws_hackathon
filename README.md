# TrustAgent — AI-Powered Financial Risk Investigation Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)

## 🎯 What is TrustAgent?

**TrustAgent** is an AI-powered investigation and risk assessment platform that transforms suspicious activity alerts into full investigations. Unlike traditional fraud detection systems that stop at raising an alert, TrustAgent automatically conducts comprehensive investigations using an autonomous AI agent.

**Product Positioning:** *"AI that investigates before your business acts."*

### The Problem TrustAgent Solves

Finance teams today receive fraud/risk alerts but lack automated investigation capabilities. When a suspicious invoice arrives, analysts must manually:

- Cross-reference supplier details against historical records
- Identify unexpected bank account changes  
- Compare transaction amounts to historical patterns
- Check compliance with company policies
- Document findings for audit trails

This manual process is **slow, inconsistent, and prone to human error** — especially under time pressure from urgent payment requests.

## ✨ Key Features

- **🤖 Autonomous AI Investigation** — Claude-powered agent investigates invoices automatically using defined tools
- **📊 Risk Scoring** — Deterministic, weighted risk calculation (0-100 scale: LOW → MEDIUM → HIGH → CRITICAL)
- **🔍 Evidence-Based Findings** — Each discovery includes description, source attribution, severity, and risk contribution
- **⏱️ Real-Time Activity Feed** — Watch investigation progress as the AI works through each step
- **👥 Human-in-the-Loop Approval** — AI recommends actions, but humans must approve all financial decisions
- **📋 Complete Audit Trail** — Full investigation reports with timestamps, evidence, and decision records
- **⚡ Fast Processing** — Investigations complete within 30 seconds

## 🏗️ Architecture & Tech Stack

### Frontend
- **React 18.3** — Modern UI library
- **Next.js 14.2** �� Full-stack framework with API routes and SSE support
- **TypeScript 5.5** — Type-safe development
- **Tailwind CSS 3.4** — Professional styling
- **Server-Sent Events (SSE)** — Real-time investigation updates

### Backend
- **Next.js API Routes** — Serverless backend co-located with frontend
- **Amazon Bedrock** — Managed AI service for Claude Sonnet 4.6
- **Tool-Use Architecture** — Agent has access to 8 specialized investigation tools

### AI & Investigation Engine
- **Claude Sonnet 4.6** — Latest Anthropic model from AWS Bedrock
- **Native Tool-Use** — Bedrock's Converse API with integrated tool calling
- **Deterministic Risk Scoring** — Weighted algorithm based on identified risk indicators

### Data
- **In-Memory Store** — Mock business data (suppliers, transactions, policies, invoices)
- **No Persistence Required** — Sufficient for MVP demonstration

## 📋 Investigation Tools

The AI agent has access to these specialized tools:

| Tool | Purpose |
|------|---------|
| `analyze_invoice` | Parse invoice and identify anomalies, unusual patterns, red flags |
| `lookup_supplier` | Retrieve supplier details, registration, verification status, banking info |
| `get_supplier_transaction_history` | Historical transactions with amounts, dates, bank accounts |
| `check_company_policy` | Lookup relevant compliance and payment policies |
| `calculate_risk` | Deterministic risk scoring based on identified indicators |
| `create_investigation_report` | Generate structured audit trail with findings |
| `hold_payment` | Place payment on hold (requires human approval) |
| `notify_finance_team` | Send notification with investigation results |

## 🎬 Quick Start

### Prerequisites

- **Node.js** 14.x or higher
- **npm** or yarn
- **AWS Credentials** configured (IAM role or manual configuration)
- **Bedrock Access** to Claude Sonnet 4.6 in `us-east-1`

### Installation

```bash
# Clone the repository
git clone https://github.com/BennetDyani/aws_hackathon.git
cd aws_hackathon

# Navigate to the TrustAgent application
cd trustagent

# Install dependencies
npm install
```

### Development

```bash
# Start development server (hot reload enabled)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application will be available immediately.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Code Quality

```bash
# Run linter
npm run lint
```

## 🔄 Investigation Workflow

```
1. User submits/selects suspicious invoice
          ↓
2. Investigation created with PENDING status
          ↓
3. AI agent begins autonomous investigation
          ↓
4. Agent executes tools sequentially:
   • Analyze invoice for anomalies
   • Look up supplier information
   • Retrieve transaction history
   • Check company policies
   • Calculate risk score
   ↓
5. Evidence collected and displayed in real-time
          ↓
6. Risk score calculated and shown (0-100)
          ↓
7. Recommendation generated (e.g., "HOLD_PAYMENT")
          ↓
8. User reviews evidence and risk score
          ↓
9. User approves or rejects recommendation
          ↓
10. Action executed (if approved)
          ↓
11. Investigation report generated
          ↓
12. Complete audit trail available for review
```

## 📊 Risk Scoring

Risk scores are calculated using a deterministic, weighted model:

```
CRITICAL: 80-100  🔴 Immediate action required
HIGH:     60-79   🟠 High risk, action recommended
MEDIUM:   30-59   🟡 Moderate risk, review advised
LOW:      0-29    🟢 Low risk, normal processing
```

Each identified risk indicator (bank account mismatch, unusual amount, policy violation, etc.) contributes a specific number of points, capped at 100.

## 📁 Project Structure

```
trustagent/
├── src/
│   ├── app/
│   │   ├── page.tsx                        # Dashboard
│   │   ├── investigations/[id]/page.tsx    # Investigation workspace
│   │   └── api/
│   │       ├── investigations/             # List/create investigations
│   │       ├── investigate/                # Start AI investigation (SSE)
│   │       └── actions/                    # Execute approved actions
│   ├── components/
│   │   ├── Dashboard.tsx                   # Metrics + investigation list
│   │   ├── InvestigationWorkspace.tsx      # Main investigation view
│   │   ├── ActivityFeed.tsx                # Real-time step display
│   │   ├── RiskScore.tsx                   # Risk gauge/display
│   │   ├── EvidenceList.tsx                # Evidence cards
│   │   └── ActionPanel.tsx                 # Recommendation + approval
│   ├── lib/
│   │   ├── agent/                          # AI orchestration & tools
│   │   ├── data/                           # Mock data store
│   │   └── risk/                           # Risk calculation engine
│   └── styles/                             # Tailwind + custom CSS
├── docs/
│   ├── 01-requirements.md                  # Detailed PRD
│   ├── 02-system-design.md                 # Architecture & design
│   ├── 03-implementation-plan.md           # Development roadmap
│   ├── 04-test-plan.md                     # Testing strategy
│   └── 05-deployment-operations.md         # Deployment guide
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

## 🎯 MVP Scope (Hackathon)

### In Scope ✅
- Dashboard with summary metrics
- Invoice submission for investigation
- Autonomous AI investigation workflow
- Real-time activity feed showing investigation progress
- Evidence collection and display
- Risk scoring (0-100 deterministic calculation)
- Recommendation generation
- Human-in-the-loop action approval
- Payment hold functionality
- Complete investigation reports with audit trail

### Out of Scope (Future) 📋
- User authentication and RBAC
- Real banking system integration
- Persistent database storage
- Multi-tenant architecture
- Email/Slack notifications
- Batch processing
- Multiple investigation types

## 🔐 Security & Design Principles

- **Human-in-the-Loop** — AI recommends actions but cannot execute financial decisions without human approval
- **Evidence-Based** — Every finding includes source, severity, and risk contribution
- **Transparent** — Complete audit trail of all investigation steps
- **Deterministic Scoring** — Reproducible, weighted risk calculations
- **Mock Data Only** — No real financial information in the system

## 📚 Documentation

Full documentation is available in the `/docs` directory:

- **[01-requirements.md](docs/01-requirements.md)** — Product Requirements Document (PRD) with detailed functional requirements
- **[02-system-design.md](docs/02-system-design.md)** — System architecture, API design, data models, and implementation details
- **[03-implementation-plan.md](docs/03-implementation-plan.md)** — Development roadmap and implementation tasks
- **[04-test-plan.md](docs/04-test-plan.md)** — Testing strategy and test cases
- **[05-deployment-operations.md](docs/05-deployment-operations.md)** — Deployment guide and operational procedures

## 🚀 Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Investigation Duration | < 30 seconds |
| UI Responsiveness | Real-time updates |
| API Rate Limit | < 1 request/second to Bedrock |
| Security | No real data, human approval required |
| Deployment Region | us-east-1 only |

## 🛠️ Development

### Environment Setup

```bash
# Install dependencies
npm install

# Set AWS credentials
export AWS_REGION=us-east-1
# Configure credentials via IAM role or AWS CLI

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## 📊 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/investigations` | List all investigations with metrics |
| GET | `/api/investigations/[id]` | Get detailed investigation view |
| POST | `/api/investigations` | Create new investigation |
| POST | `/api/investigate` | Start investigation (SSE stream) |
| POST | `/api/actions` | Execute approved action |

## 🎓 Technology Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Amazon Bedrock Guide](https://docs.aws.amazon.com/bedrock/)
- [Claude API Documentation](https://docs.anthropic.com/claude)
- [React 18 Features](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📝 License

This project is part of an AWS Hackathon.

## 👤 Author

**BennetDyani**

## 🤝 Contributing

This is a hackathon project. For contributions or questions, please open an issue or discussion.

---

**For a complete end-to-end demonstration, refer to the [Product Requirements Document](docs/01-requirements.md) for the exact user flow and acceptance criteria.**

