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

$Env:AWS_DEFAULT_REGION="us-east-1"
$Env:AWS_ACCESS_KEY_ID="ASIATZCVA4REMDRYIX4R"
$Env:AWS_SECRET_ACCESS_KEY="vId000D8Q1nCSvaECHLYwm1ZM5BG9n6nwKg87vsN"
$Env:AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEKz//////////wEaCXVzLWVhc3QtMSJHMEUCIQCHxt2EBsWdBTVG870ixNUONCc+3RYL1Sy/wCG6/gsAtwIgTz9b5PvE9DYRdaqcsF2HY1ZoQfFyp1RCZhf2N2C5/aIqmQIIdBABGgwyNjAwMjM4Mzc3NjgiDPgIPJQIhLPfP4Idair2AYRmk9WKSvjZoCfoNibvEK4mcv4Ej78NkNH21SdhdklBEZezFc7oXlodEuFW28PKhHNb2AYoZFRkiYvNLf2tIBZrTe7K/NoLQh59nAjmNLuNdLnk2wELsh6HAo9td1U8UAYpKZT+07CIPUQuq78o62sWoL1YH93uwoL5ICmL0TMbu+LI0RAHUSmDWzuvZ9biMczbvFZ+oi2QjbV9Eo6te8Oa245huBNYSDFjtvvK9KEoPfaDHpaRcuGjCorh3oM7SkRPPTAb3muyqR9850Z9VRD2Eo6J3/RDD8ubxTjRcTxIH/Wil/6V1EO9/GBqzbLrorU6mDKMLjDFm5bUBjqdAaXRjugse1/0M1TmaQ1yECYvKZ3JL5modEDv4iERjdq2nRPiUyXQE+fF2f27E8QcA85EuRzwq8LTyE0oa8Xb6My94C8QQLVdvUNtx3mQfBMcdx7D8xOL9v1aIY7nhaKixgW3rFnBgPvCV9VcpOZISMg1WB7NQxdu1F2fN1C94us2uuHszknI+uvGFxon81mhDyMNEyeaag2ls21hCmQ="
$Env:AWS_DEFAULT_REGION="us-east-1"
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
