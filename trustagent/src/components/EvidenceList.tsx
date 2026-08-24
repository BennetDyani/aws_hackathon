'use client';

import { Evidence } from '@/lib/types';

interface EvidenceListProps {
  evidence: Evidence[];
}

const severityStyles: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default function EvidenceList({ evidence }: EvidenceListProps) {
  if (evidence.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Evidence</h3>
        <p className="text-sm text-gray-400 text-center py-4">
          No evidence collected yet
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">
          Evidence ({evidence.length} items)
        </h3>
      </div>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {evidence.map((item) => (
          <div key={item.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severityStyles[item.severity]}`}>
                    {item.severity}
                  </span>
                  <span className="text-xs text-gray-400">
                    Source: {item.source}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-red-600">
                  +{item.risk_contribution}
                </span>
                <p className="text-xs text-gray-400">risk points</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
