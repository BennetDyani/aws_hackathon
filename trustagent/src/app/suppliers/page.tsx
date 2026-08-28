'use client';

import { useEffect, useState } from 'react';
import { Supplier } from '@/lib/types';
import SupplierForm from '@/components/SupplierForm';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  }

  function openCreate() {
    setEditingSupplier(undefined);
    setFormMode('create');
  }

  function openEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormMode('edit');
  }

  function closeForm() {
    setFormMode(null);
    setEditingSupplier(undefined);
  }

  function formatRange(supplier: Supplier): string {
    if (supplier.expected_spend_min == null || supplier.expected_spend_max == null) {
      return 'Not set';
    }
    return `R${supplier.expected_spend_min.toLocaleString()} – R${supplier.expected_spend_max.toLocaleString()}`;
  }

  const sortedSuppliers = [...suppliers].sort((a, b) => Number(a.verified) - Number(b.verified));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Human-verified suppliers and their expected spending ranges. Unverified suppliers were
            auto-created from an uploaded invoice and need review.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Supplier
        </button>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">All Suppliers ({suppliers.length})</h2>
        </div>
        {sortedSuppliers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No suppliers yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedSuppliers.map((supplier) => (
              <div key={supplier.id} className="px-4 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{supplier.name}</span>
                    <span className="font-mono text-xs text-gray-400">{supplier.id}</span>
                    <span className={supplier.verified ? 'badge-low' : 'badge-high'}>
                      {supplier.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {supplier.bank_name} · <span className="font-mono">{supplier.bank_account}</span>
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-500">Expected spend</p>
                  <p className="font-medium text-gray-900">{formatRange(supplier)}</p>
                </div>
                <button onClick={() => openEdit(supplier)} className="btn-secondary text-sm">
                  {supplier.verified ? 'Edit' : 'Verify'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {formMode && (
        <SupplierForm mode={formMode} supplier={editingSupplier} onClose={closeForm} onSaved={fetchSuppliers} />
      )}
    </div>
  );
}
