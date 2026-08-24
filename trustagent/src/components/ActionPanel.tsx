'use client';

import { useState } from 'react';
import { Action, InvestigationStatus } from '@/lib/types';

interface ActionPanelProps {
  investigationId: string;
  recommendation: string | null;
  recommendedAction: Action | null;
  status: InvestigationStatus;
  onActionComplete: () => void;
}

export default function ActionPanel({
  investigationId,
  recommendation,
  recommendedAction,
  status,
  onActionComplete,
}: ActionPanelProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  if (status === 'CLOSED') {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-800">Action Completed</h3>
            <p className="text-sm text-green-600">
              {actionResult || 'Payment has been placed on hold'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendation || !recommendedAction || status !== 'ACTION_REQUIRED') {
    return null;
  }

  const handleApprove = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigation_id: investigationId,
          action: recommendedAction,
          approved_by: 'Finance Analyst',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActionResult(data.message);
        setIsConfirming(false);
        onActionComplete();
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="card border-red-200 bg-red-50">
      <div className="p-6">
        <h3 className="text-sm font-semibold text-red-900 uppercase tracking-wide">
          Recommended Action
        </h3>
        <p className="mt-2 text-sm text-red-800">{recommendation}</p>

        <div className="mt-4">
          {!isConfirming ? (
            <button
              onClick={() => setIsConfirming(true)}
              className="btn-danger w-full text-center"
            >
              {recommendedAction === 'HOLD_PAYMENT' ? 'Hold Payment' : recommendedAction}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-white border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-900">
                  Confirm: {recommendedAction === 'HOLD_PAYMENT' ? 'Hold Payment' : recommendedAction}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  This will place the payment on hold and notify the finance team.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={isExecuting}
                  className="btn-danger flex-1 text-center"
                >
                  {isExecuting ? 'Executing...' : 'Confirm Hold'}
                </button>
                <button
                  onClick={() => setIsConfirming(false)}
                  className="btn-secondary flex-1 text-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
