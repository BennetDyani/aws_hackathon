import { Policy } from '@/lib/types';

export const policies: Policy[] = [
  {
    id: 'POL-001',
    name: 'Supplier Bank Account Change Verification',
    category: 'SUPPLIER',
    rule: 'Any change to supplier banking details must be independently verified via phone call to the supplier using contact details from original onboarding records before processing payment.',
    description: 'When a supplier changes their banking details, the change must be verified independently before any payments are processed to the new account.',
    severity: 'CRITICAL',
    action: 'HOLD payment and verify banking details independently before processing.',
  },
  {
    id: 'POL-002',
    name: 'Large Transaction Threshold',
    category: 'PAYMENT',
    rule: 'Transactions exceeding R100,000 require dual authorization from Finance Manager and Department Head.',
    description: 'Any single payment above R100,000 must be approved by both the Finance Manager and the relevant Department Head.',
    severity: 'HIGH',
    action: 'Escalate for dual authorization before processing.',
  },
  {
    id: 'POL-003',
    name: 'Supplier Transaction Pattern Monitoring',
    category: 'COMPLIANCE',
    rule: 'Any invoice exceeding 3x the supplier historical average must be flagged for review.',
    description: 'Transactions that significantly deviate from established patterns must be reviewed before processing.',
    severity: 'HIGH',
    action: 'Flag for investigation and review before payment.',
  },
  {
    id: 'POL-004',
    name: 'Urgent Payment Request Protocol',
    category: 'PAYMENT',
    rule: 'Payment requests marked as IMMEDIATE or urgent must undergo additional scrutiny as this is a common social engineering tactic.',
    description: 'Urgency indicators in payment requests are a known fraud signal and require additional verification.',
    severity: 'MEDIUM',
    action: 'Apply additional verification steps before processing urgent requests.',
  },
];

export function getPoliciesByCategory(category: string): Policy[] {
  return policies.filter(
    (p) => p.category.toLowerCase() === category.toLowerCase()
  );
}

export function getAllPolicies(): Policy[] {
  return policies;
}

export function getPolicyById(id: string): Policy | null {
  return policies.find((p) => p.id === id) || null;
}
