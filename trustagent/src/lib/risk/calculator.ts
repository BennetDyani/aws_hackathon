import { RiskIndicator, RiskLevel, RiskResult } from '@/lib/types';

// Deterministic risk weights
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
  CONFIRMED_MATCH: 0,
};

function classifyRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

export function calculateRisk(indicators: RiskIndicator[]): RiskResult {
  let totalScore = 0;
  const scoredIndicators: Array<RiskIndicator & { weight: number }> = [];

  for (const indicator of indicators) {
    const weight = indicator.type in RISK_WEIGHTS ? RISK_WEIGHTS[indicator.type] : RISK_WEIGHTS['OTHER'];
    totalScore += weight;
    scoredIndicators.push({ ...indicator, weight });
  }

  const score = Math.min(totalScore, 100);
  const level = classifyRiskLevel(score);

  return {
    score,
    level,
    indicators: scoredIndicators,
  };
}

export function getRiskWeights(): Record<string, number> {
  return { ...RISK_WEIGHTS };
}
