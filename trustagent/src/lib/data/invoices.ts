import { Invoice } from '@/lib/types';

// Use globalThis to persist invoices across Next.js hot reloads
const globalInvoices = globalThis as unknown as {
  __trustagent_invoices?: Invoice[];
};

const DEFAULT_INVOICES: Invoice[] = [];

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
