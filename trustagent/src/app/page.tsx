'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Investigation, DashboardMetrics } from '@/lib/types';
import MetricCard from '@/components/MetricCard';
import RiskScore from '@/components/RiskScore';
import InvoiceUpload from '@/components/InvoiceUpload';

export default function Dashboard() {
  const router = useRouter();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total: 0,
    high_risk: 0,
    action_required: 0,
    on_hold: 0,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/investigations');
      const data = await res.json();
      setInvestigations(data.investigations);
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to fetch investigations:', error);
    }
  }

  function handleInvestigationCreated(investigationId: string) {
    router.push(`/investigations/${investigationId}`);
  }

  async function handleNewInvestigation() {
    setIsCreating(true);
    try {
      const res = await fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: 'INV-1048' }),
      });
      const data = await res.json();
      if (data.investigation) {
        router.push(`/investigations/${data.investigation.id}`);
      }
    } catch (error) {
      console.error('Failed to create investigation:', error);
    } finally {
      setIsCreating(false);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ACTION_REQUIRED: 'bg-red-100 text-red-800',
    CLOSED: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investigation Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered investigation and risk assessment platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <InvoiceUpload onInvestigationCreated={handleInvestigationCreated} />
          <button
            onClick={handleNewInvestigation}
            disabled={isCreating}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {isCreating ? 'Creating...' : 'Quick Demo'}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Investigations"
          value={metrics.total}
          color="text-brand-600"
          icon={
            <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <MetricCard
          title="High Risk"
          value={metrics.high_risk}
          color="text-red-600"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <MetricCard
          title="Action Required"
          value={metrics.action_required}
          color="text-orange-600"
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Payments On Hold"
          value={metrics.on_hold}
          color="text-purple-600"
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
      </div>

      {/* Suspicious Invoice Alert */}
      <div className="card border-orange-200 bg-orange-50 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-900">Suspicious Invoice Pending Review</h3>
            <p className="text-sm text-orange-700 mt-1">
              Invoice <span className="font-mono font-medium">INV-1048</span> from ABC Office Solutions
              for <span className="font-bold">R185,000</span> has been submitted with IMMEDIATE urgency.
              This invoice requires investigation before payment can be released.
            </p>
            <button
              onClick={handleNewInvestigation}
              disabled={isCreating}
              className="mt-3 text-sm font-medium text-orange-800 hover:text-orange-900 underline"
            >
              Upload Invoice & Investigate →
            </button>
          </div>
        </div>
      </div>

      {/* Investigation List */}
      <div className="card">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Recent Investigations</h2>
        </div>
        {investigations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No investigations yet. Start one by clicking "New Investigation".
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {investigations.map((inv) => (
              <button
                key={inv.id}
                onClick={() => router.push(`/investigations/${inv.id}`)}
                className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
              >
                <div className="flex-shrink-0">
                  <RiskScore score={inv.risk_score} level={inv.risk_level} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-gray-900">{inv.id}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[inv.status]}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {inv.summary || `Investigation for invoice ${inv.invoice_id}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(inv.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
