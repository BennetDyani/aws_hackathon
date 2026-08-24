import { Supplier } from '@/lib/types';

export const suppliers: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'ABC Office Solutions',
    contact_email: 'accounts@abcoffice.co.za',
    bank_account: '****4821',
    bank_name: 'First National Bank',
    registration_number: '2019/123456/07',
    risk_status: 'LOW',
    verified: true,
    verified_date: '2026-02-15',
  },
  {
    id: 'SUP-002',
    name: 'Metro Cleaning Services',
    contact_email: 'billing@metrocleaning.co.za',
    bank_account: '****7733',
    bank_name: 'Standard Bank',
    registration_number: '2020/654321/07',
    risk_status: 'LOW',
    verified: true,
    verified_date: '2026-05-20',
  },
  {
    id: 'SUP-003',
    name: 'Digital Print Co',
    contact_email: 'invoices@digitalprint.co.za',
    bank_account: '****2190',
    bank_name: 'Absa Bank',
    registration_number: '2018/998877/07',
    risk_status: 'MEDIUM',
    verified: true,
    verified_date: '2025-11-10',
  },
];

export function getSupplierById(id: string): Supplier | null {
  return suppliers.find((s) => s.id === id) || null;
}

export function getSupplierByName(name: string): Supplier | null {
  return suppliers.find((s) => s.name.toLowerCase().includes(name.toLowerCase())) || null;
}
