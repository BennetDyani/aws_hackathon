// Shared tool definitions converted by each LLM provider adapter.

export const TOOL_DEFINITIONS = [
  {
    toolSpec: {
      name: 'analyze_invoice',
      description:
        'Analyze an invoice for anomalies, unusual patterns, and red flags. Returns the invoice details and any immediate red flags identified.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            invoice_id: {
              type: 'string',
              description: 'The invoice ID to analyze',
            },
          },
          required: ['invoice_id'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'lookup_supplier',
      description:
        'Look up supplier details including registration, verification status, current banking information on file, and (when set) the expected spending range for this supplier.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            supplier_id: {
              type: 'string',
              description: 'The supplier ID to look up',
            },
          },
          required: ['supplier_id'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'get_supplier_transaction_history',
      description:
        'Retrieve historical transactions for a supplier including amounts, dates, bank accounts used, and payment status.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            supplier_id: {
              type: 'string',
              description: 'The supplier ID to get history for',
            },
          },
          required: ['supplier_id'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'check_company_policy',
      description:
        'Check company policies relevant to a specific category. Returns all applicable policies and their requirements.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description:
                'Policy category to check: PAYMENT, SUPPLIER, or COMPLIANCE',
            },
          },
          required: ['category'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'calculate_risk',
      description:
        'Calculate a deterministic risk score based on identified risk indicators. Must be called with ALL indicators found during the investigation.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            indicators: {
              type: 'array',
              description: 'Array of risk indicators identified during investigation',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    description:
                      'Indicator type: BANK_ACCOUNT_MISMATCH, UNUSUAL_AMOUNT, URGENCY_INDICATOR, POLICY_VIOLATION, SUPPLIER_NOT_VERIFIED, BANK_DETAILS_CHANGED, AMOUNT_EXCEEDS_THRESHOLD, NEW_BANK_ACCOUNT, PATTERN_ANOMALY, CONFIRMED_MATCH (zero-weight — use for a checked dimension that came back clean, so the evidence log explains why, not just what is wrong), OTHER',
                  },
                  description: {
                    type: 'string',
                    description: 'Human-readable description of this indicator',
                  },
                  severity: {
                    type: 'string',
                    description: 'Severity: LOW, MEDIUM, HIGH, or CRITICAL',
                  },
                },
                required: ['type', 'description', 'severity'],
              },
            },
          },
          required: ['indicators'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'create_investigation_report',
      description:
        'Generate and save the final structured investigation report with all findings, evidence, and recommendations.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            investigation_id: {
              type: 'string',
              description: 'The investigation ID',
            },
            summary: {
              type: 'string',
              description: 'Brief summary of findings',
            },
            findings: {
              type: 'array',
              description: 'Array of finding objects',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  evidence: { type: 'string' },
                  severity: { type: 'string' },
                  source: { type: 'string' },
                },
              },
            },
            risk_score: { type: 'number', description: 'Final risk score 0-100' },
            risk_level: {
              type: 'string',
              description: 'Risk level: LOW, MEDIUM, HIGH, or CRITICAL',
            },
            recommendation: {
              type: 'string',
              description: 'Recommended action in plain language',
            },
            recommended_action: {
              type: 'string',
              description:
                'Action code: HOLD_PAYMENT, APPROVE_PAYMENT, ESCALATE, or REQUEST_VERIFICATION',
            },
          },
          required: [
            'investigation_id',
            'summary',
            'findings',
            'risk_score',
            'risk_level',
            'recommendation',
            'recommended_action',
          ],
        },
      },
    },
  },
];
