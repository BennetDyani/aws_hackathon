import { Transaction } from '@/lib/types';

export const transactions: Transaction[] = [
  // ABC Office Solutions — historical transactions with CONSISTENT bank account ****4821
  {
    id: 'TXN-001',
    supplier_id: 'SUP-001',
    invoice_id: 'INV-1041',
    amount: 22500,
    currency: 'ZAR',
    bank_account: '****4821',
    date: '2026-03-15',
    status: 'COMPLETED',
    description: 'Office supplies - Q1 2026',
  },
  {
    id: 'TXN-002',
    supplier_id: 'SUP-001',
    invoice_id: 'INV-1043',
    amount: 18750,
    currency: 'ZAR',
    bank_account: '****4821',
    date: '2026-04-22',
    status: 'COMPLETED',
    description: 'Printer cartridges and paper',
  },
  {
    id: 'TXN-003',
    supplier_id: 'SUP-001',
    invoice_id: 'INV-1044',
    amount: 31200,
    currency: 'ZAR',
    bank_account: '****4821',
    date: '2026-05-10',
    status: 'COMPLETED',
    description: 'Office furniture - 5 desks',
  },
  {
    id: 'TXN-004',
    supplier_id: 'SUP-001',
    invoice_id: 'INV-1045',
    amount: 27800,
    currency: 'ZAR',
    bank_account: '****4821',
    date: '2026-06-18',
    status: 'COMPLETED',
    description: 'IT peripherals and accessories',
  },
  {
    id: 'TXN-005',
    supplier_id: 'SUP-001',
    invoice_id: 'INV-1046',
    amount: 24300,
    currency: 'ZAR',
    bank_account: '****4821',
    date: '2026-07-05',
    status: 'COMPLETED',
    description: 'Monthly office supplies',
  },
  // Metro Cleaning Services
  {
    id: 'TXN-006',
    supplier_id: 'SUP-002',
    invoice_id: 'INV-1047',
    amount: 15000,
    currency: 'ZAR',
    bank_account: '****7733',
    date: '2026-07-01',
    status: 'COMPLETED',
    description: 'Monthly cleaning - July',
  },
];

export function getTransactionsBySupplier(supplierId: string): Transaction[] {
  return transactions.filter((t) => t.supplier_id === supplierId);
}

export function getTransactionById(id: string): Transaction | null {
  return transactions.find((t) => t.id === id) || null;
}
