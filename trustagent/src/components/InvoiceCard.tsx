'use client';

import { Invoice } from '@/lib/types';

interface InvoiceCardProps {
  invoice: Invoice;
}

export default function InvoiceCard({ invoice }: InvoiceCardProps) {
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Invoice Details</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Invoice ID</span>
            <p className="font-mono font-medium text-gray-900">{invoice.id}</p>
          </div>
          <div>
            <span className="text-gray-500">Supplier</span>
            <p className="font-medium text-gray-900">{invoice.supplier_name}</p>
          </div>
          <div>
            <span className="text-gray-500">Amount</span>
            <p className="font-bold text-gray-900 text-lg">
              R{invoice.amount.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <p className={`font-medium ${invoice.status === 'ON_HOLD' ? 'text-red-600' : 'text-gray-900'}`}>
              {invoice.status}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Invoice Date</span>
            <p className="font-medium text-gray-900">{invoice.date}</p>
          </div>
          <div>
            <span className="text-gray-500">Due Date</span>
            <p className="font-medium text-gray-900">{invoice.due_date}</p>
          </div>
          <div>
            <span className="text-gray-500">Bank Account</span>
            <p className="font-mono font-medium text-gray-900">{invoice.bank_account}</p>
          </div>
          <div>
            <span className="text-gray-500">Bank</span>
            <p className="font-medium text-gray-900">{invoice.bank_name}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Urgency</span>
            <p className={`font-medium ${invoice.urgency === 'IMMEDIATE' ? 'text-red-600' : 'text-gray-900'}`}>
              {invoice.urgency}
              {invoice.urgency === 'IMMEDIATE' && ' ⚠'}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Description</span>
            <p className="font-medium text-gray-900">{invoice.description}</p>
          </div>
        </div>

        {invoice.line_items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Line Items</p>
            <div className="space-y-1">
              {invoice.line_items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-600">{item.description}</span>
                  <span className="text-gray-900 font-medium">
                    R{item.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
