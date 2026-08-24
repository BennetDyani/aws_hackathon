import { Invoice } from '@/lib/types';

// Use globalThis to persist invoices across Next.js hot reloads
const globalInvoices = globalThis as unknown as {
  __trustagent_invoices?: Invoice[];
};

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'INV-1048',
    supplier_id: 'SUP-001',
    supplier_name: 'ABC Office Solutions',
    amount: 185000,
    currency: 'ZAR',
    date: '2026-08-19',
    due_date: '2026-08-22',
    bank_account: '****9917',  // DIFFERENT from historical ****4821
    bank_name: 'Capitec Bank', // DIFFERENT from historical First National Bank
    description: 'Bulk office equipment order - urgent delivery',
    line_items: [
      {
        description: 'Ergonomic office chairs (x25)',
        quantity: 25,
        unit_price: 4500,
        total: 112500,
      },
      {
        description: 'Standing desk converters (x15)',
        quantity: 15,
        unit_price: 3500,
        total: 52500,
      },
      {
        description: 'Delivery and installation',
        quantity: 1,
        unit_price: 20000,
        total: 20000,
      },
    ],
    status: 'SUBMITTED',
    urgency: 'IMMEDIATE',
    submitted_by: 'procurement@company.co.za',
  },
];

if (!globalInvoices.__trustagent_invoices) {
  globalInvoices.__trustagent_invoices = [...DEFAULT_INVOICES];
}

const invoices = globalInvoices.__trustagent_invoices;

export function getInvoiceById(id: string): Invoice | null {
  return invoices.find((i) => i.id === id) || null;
}

export function updateInvoiceStatus(id: string, status: Invoice['status']): boolean {
  const invoice = invoices.find((i) => i.id === id);
  if (invoice) {
    invoice.status = status;
    return true;
  }
  return false;
}

export function addInvoice(invoice: Invoice): void {
  // Replace if same ID exists, otherwise push
  const existingIndex = invoices.findIndex((i) => i.id === invoice.id);
  if (existingIndex >= 0) {
    invoices[existingIndex] = invoice;
  } else {
    invoices.push(invoice);
  }
}

export function getAllInvoices(): Invoice[] {
  return invoices;
}
