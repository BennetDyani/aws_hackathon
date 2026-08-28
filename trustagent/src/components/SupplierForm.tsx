'use client';

import { useState } from 'react';
import { Supplier } from '@/lib/types';

interface SupplierFormProps {
  mode: 'create' | 'edit';
  supplier?: Supplier;
  onClose: () => void;
  onSaved: () => void;
}

export default function SupplierForm({ mode, supplier, onClose, onSaved }: SupplierFormProps) {
  const [name, setName] = useState(supplier?.name || '');
  const [contactEmail, setContactEmail] = useState(supplier?.contact_email || '');
  const [bankAccount, setBankAccount] = useState(supplier?.bank_account || '');
  const [bankName, setBankName] = useState(supplier?.bank_name || '');
  const [registrationNumber, setRegistrationNumber] = useState(supplier?.registration_number || '');
  const [expectedSpendMin, setExpectedSpendMin] = useState(
    supplier?.expected_spend_min != null ? String(supplier.expected_spend_min) : ''
  );
  const [expectedSpendMax, setExpectedSpendMax] = useState(
    supplier?.expected_spend_max != null ? String(supplier.expected_spend_max) : ''
  );
  const [verified, setVerified] = useState(supplier?.verified ?? true);
  const [verifiedBy, setVerifiedBy] = useState(supplier?.verified_by || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const body = {
      name,
      contact_email: contactEmail,
      bank_account: bankAccount,
      bank_name: bankName,
      registration_number: registrationNumber,
      expected_spend_min: expectedSpendMin === '' ? null : Number(expectedSpendMin),
      expected_spend_max: expectedSpendMax === '' ? null : Number(expectedSpendMax),
      ...(mode === 'edit' ? { verified, verified_by: verifiedBy } : { verified_by: verifiedBy }),
    };

    try {
      const res = await fetch(mode === 'create' ? '/api/suppliers' : `/api/suppliers/${supplier!.id}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save supplier');
        return;
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save supplier:', err);
      setError('Failed to save supplier. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'Add Supplier' : `Edit Supplier — ${supplier?.id}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Supplier Name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label className={labelClass}>Contact Email</label>
            <input
              type="email"
              className={inputClass}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Bank Account</label>
              <input
                className={inputClass}
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="****1234"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Bank Name</label>
              <input className={inputClass} value={bankName} onChange={(e) => setBankName(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Registration Number</label>
            <input
              className={inputClass}
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Expected Spend Min (R)</label>
              <input
                type="number"
                className={inputClass}
                value={expectedSpendMin}
                onChange={(e) => setExpectedSpendMin(e.target.value)}
                placeholder="Not set"
              />
            </div>
            <div>
              <label className={labelClass}>Expected Spend Max (R)</label>
              <input
                type="number"
                className={inputClass}
                value={expectedSpendMax}
                onChange={(e) => setExpectedSpendMax(e.target.value)}
                placeholder="Not set"
              />
            </div>
          </div>

          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <input
                id="verified-checkbox"
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="verified-checkbox" className="text-sm text-gray-700">
                Verified
              </label>
            </div>
          )}

          <div>
            <label className={labelClass}>{mode === 'create' ? 'Verified By' : 'Verified/Updated By'}</label>
            <input
              className={inputClass}
              value={verifiedBy}
              onChange={(e) => setVerifiedBy(e.target.value)}
              placeholder="your email"
              required={mode === 'create' || verified}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSaving} className="btn-primary flex-1 text-center">
              {isSaving ? 'Saving...' : mode === 'create' ? 'Add Supplier' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
