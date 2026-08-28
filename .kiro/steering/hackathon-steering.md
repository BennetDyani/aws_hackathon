---
inclusion: always
---

# LS Symposium Hackathon — Kiro Steering Guide

## Hackathon Environment

- AWS Region: **us-east-1 (N. Virginia)** — ALL resources must be created in this region

- The EC2 instance IAM role already has permissions for Bedrock, S3, Lambda, ECR, IAM, CodeBuild, and SSM

- A dedicated `agentcore-agent-role` IAM role exists for Bedrock AgentCore deployments

## AWS Credentials

**If using the Ubuntu Desktop (Kiro RDP):** Credentials are provided automatically via the instance IAM role — no configuration needed.

**If using VS Code in browser or Kiro CLI locally:** You need to configure credentials manually. Copy the temporary credentials from your Workshop Studio event page and paste them into your terminal or Kiro chat:

```bash
export AWS_ACCESS_KEY_ID="<from workshop page>"
export AWS_SECRET_ACCESS_KEY="<from workshop page>"
export AWS_SESSION_TOKEN="<from workshop page>"
export AWS_DEFAULT_REGION="us-east-1"
```

```powershell
$Env:AWS_DEFAULT_REGION="us-east-1"
$Env:AWS_ACCESS_KEY_ID="<from workshop page>"
$Env:AWS_SECRET_ACCESS_KEY="<from workshop page>"
$Env:AWS_SESSION_TOKEN="<from workshop page>"
```

These credentials expire periodically — if you get authentication errors, grab fresh credentials from the Workshop Studio event page.

## Available Bedrock Models

Only these models are enabled — do NOT use others. Always use the exact model IDs shown:

- All Amazon Nova models (e.g. `amazon.nova-pro-v1:0`, `amazon.nova-lite-v1:0`, `amazon.nova-micro-v1:0`)
- `us.anthropic.claude-sonnet-4-5-20250929-v1:0` (Claude Sonnet 4.5)
- `us.anthropic.claude-sonnet-4-6` (Claude Sonnet 4.6)
- `us.anthropic.claude-opus-4-5-20251101-v1:0` (Claude Opus 4.5)
- `us.anthropic.claude-opus-4-6-v1` (Claude Opus 4.6)
- `us.anthropic.claude-opus-4-7` (Claude Opus 4.7)
- `us.anthropic.claude-opus-4-1-20250805-v1:0` (Claude Opus 4.1)
- `us.anthropic.claude-haiku-4-5-20251001-v1:0` (Claude Haiku 4.5)
- `us.meta.llama4-maverick-17b-instruct-v1:0` (Llama 4 Maverick 17B)
- `us.mistral.pixtral-large-2502-v1:0` (Pixtral Large 25.02)
- `stability.sd3-5-large-v1:0` (Stable Diffusion 3.5 Large)

Non-Amazon models require the `us.` cross-region inference profile prefix. Amazon models work without a prefix.

Older model versions like `anthropic.claude-sonnet-4-20250514-v1:0` (Sonnet 4.0) are explicitly denied and will return access errors.

## Mandatory Constraints

1. **Region lock**: Always use `us-east-1`
2. **S3 security**: NEVER create public S3 buckets
3. **No sensitive data**: Use synthetic/mock data only
4. **Rate limiting**: Keep Bedrock requests below 1 RPS
5. **No large/GPU instances**: Denied by account policy
6. **No marketplace AMIs**
7. **No reservations**
