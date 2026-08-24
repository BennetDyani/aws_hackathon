'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Investigation, ActivityEntry, Evidence, Invoice } from '@/lib/types';
import ActivityFeed from '@/components/ActivityFeed';
import RiskScore from '@/components/RiskScore';
import EvidenceList from '@/components/EvidenceList';
import ActionPanel from '@/components/ActionPanel';
import InvoiceCard from '@/components/InvoiceCard';

export default function InvestigationWorkspace() {
  const params = useParams();
  const router = useRouter();
  const investigationId = params.id as string;

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchInvestigation();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [investigationId]);

  async function fetchInvestigation() {
    try {
      const res = await fetch(`/api/investigations/${investigationId}`);
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setInvestigation(data.investigation);
      setInvoice(data.invoice);
      setActivities(data.investigation.activity_log || []);
      setEvidence(data.investigation.evidence || []);

      // If already has activity, mark as started
      if (data.investigation.activity_log?.length > 0) {
        setHasStarted(true);
      }
    } catch (error) {
      console.error('Failed to fetch investigation:', error);
    }
  }

  async function startInvestigation() {
    setIsInvestigating(true);
    setHasStarted(true);

    try {
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investigation_id: investigationId }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              handleSSEEvent(eventType, data);
            } catch {
              // Skip malformed JSON
            }
            eventType = '';
          }
        }
      }
    } catch (error) {
      console.error('Investigation stream error:', error);
    } finally {
      setIsInvestigating(false);
      // Refresh full state
      fetchInvestigation();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleSSEEvent(type: string, data: any) {
    switch (type) {
      case 'activity':
        setActivities((prev) => [...prev, data as ActivityEntry]);
        break;
      case 'evidence':
        setEvidence((prev) => [...prev, data as Evidence]);
        break;
      case 'risk':
        setInvestigation((prev) =>
          prev ? { ...prev, risk_score: data.risk_score, risk_level: data.risk_level } : prev
        );
        break;
      case 'recommendation':
        setInvestigation((prev) =>
          prev
            ? {
                ...prev,
                recommendation: data.recommendation,
                recommended_action: data.recommended_action,
                status: 'ACTION_REQUIRED',
              }
            : prev
        );
        break;
      case 'complete':
        setInvestigation((prev) =>
          prev ? { ...prev, status: data.status } : prev
        );
        break;
      case 'error':
        console.error('Investigation error:', data.message);
        break;
    }
  }

  function handleActionComplete() {
    fetchInvestigation();
  }

  if (!investigation) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading investigation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Investigation {investigation.id}
            </h1>
            <p className="text-sm text-gray-500">
              Invoice {investigation.invoice_id} • {investigation.supplier_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            investigation.status === 'PENDING' ? 'bg-gray-100 text-gray-800' :
            investigation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
            investigation.status === 'ACTION_REQUIRED' ? 'bg-red-100 text-red-800' :
            investigation.status === 'CLOSED' ? 'bg-purple-100 text-purple-800' :
            'bg-green-100 text-green-800'
          }`}>
            {investigation.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Start button for PENDING investigations */}
      {investigation.status === 'PENDING' && !hasStarted && (
        <div className="card p-8 text-center border-brand-200 bg-brand-50">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Ready to Investigate</h2>
          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            TrustAgent will analyze the invoice, check supplier history, verify company policies,
            and assess the risk level of this transaction.
          </p>
          <button
            onClick={startInvestigation}
            disabled={isInvestigating}
            className="mt-6 btn-primary px-8 py-3 text-base"
          >
            {isInvestigating ? 'Starting Investigation...' : 'Start AI Investigation'}
          </button>
        </div>
      )}

      {/* Main content grid */}
      {hasStarted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Activity + Evidence */}
          <div className="lg:col-span-2 space-y-6">
            <ActivityFeed activities={activities} isLive={isInvestigating} />
            <EvidenceList evidence={evidence} />
          </div>

          {/* Right column - Risk + Invoice + Action */}
          <div className="space-y-6">
            {/* Risk Score */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">Risk Assessment</h3>
              <RiskScore
                score={investigation.risk_score}
                level={investigation.risk_level}
                size="lg"
              />
            </div>

            {/* Action Panel */}
            <ActionPanel
              investigationId={investigation.id}
              recommendation={investigation.recommendation}
              recommendedAction={investigation.recommended_action}
              status={investigation.status}
              onActionComplete={handleActionComplete}
            />

            {/* Invoice Details */}
            {invoice && <InvoiceCard invoice={invoice} />}
          </div>
        </div>
      )}
    </div>
  );
}
