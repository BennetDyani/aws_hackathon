import { Supplier } from '@/lib/types';

// Use globalThis to persist suppliers across Next.js hot reloads
const globalSuppliers = globalThis as unknown as {
  __trustagent_suppliers?: Supplier[];
  __trustagent_supplier_counter?: number;
};

const DEFAULT_SUPPLIERS: Supplier[] = [
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
    verified_by: 'finance@company.co.za',
    expected_spend_min: 15000,
    expected_spend_max: 40000,
    created_at: '2026-02-15T00:00:00Z',
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
    verified_by: 'finance@company.co.za',
    expected_spend_min: 10000,
    expected_spend_max: 20000,
    created_at: '2026-05-20T00:00:00Z',
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
    verified_by: 'finance@company.co.za',
    expected_spend_min: null,
    expected_spend_max: null,
    created_at: '2025-11-10T00:00:00Z',
  },
];

if (!globalSuppliers.__trustagent_suppliers) {
  globalSuppliers.__trustagent_suppliers = [...DEFAULT_SUPPLIERS];
}
if (globalSuppliers.__trustagent_supplier_counter === undefined) {
  globalSuppliers.__trustagent_supplier_counter = DEFAULT_SUPPLIERS.length;
}

const suppliers = globalSuppliers.__trustagent_suppliers;

function nextSupplierId(): string {
  globalSuppliers.__trustagent_supplier_counter = (globalSuppliers.__trustagent_supplier_counter || 0) + 1;
  return `SUP-${String(globalSuppliers.__trustagent_supplier_counter).padStart(3, '0')}`;
}

export function getAllSuppliers(): Supplier[] {
  return suppliers;
}

export function getSupplierById(id: string): Supplier | null {
  return suppliers.find((s) => s.id === id) || null;
}

export function addSupplier(input: Omit<Supplier, 'id' | 'created_at'>): Supplier {
  const supplier: Supplier = {
    ...input,
    id: nextSupplierId(),
    created_at: new Date().toISOString(),
  };
  suppliers.push(supplier);
  return supplier;
}

export function updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
  const supplier = suppliers.find((s) => s.id === id);
  if (!supplier) return null;
  Object.assign(supplier, updates);
  return supplier;
}

// Normalizes a supplier name for matching: lowercase, strip punctuation and
// generic business-entity words that add noise ("Pty Ltd", "Solutions", ...).
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(pty|ltd|inc|llc|corp|co|solutions|services|group|company)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  const tokensA = na.split(' ');
  const tokensB = nb.split(' ');
  const setB = new Set(tokensB);
  const intersection = tokensA.filter((token) => setB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

const MATCH_THRESHOLD = 0.5;

// Fuzzy-matches an uploaded invoice's supplier name against known suppliers.
// Returns null when nothing resembles it closely enough — callers should
// treat that as a genuinely new/unverified supplier rather than guessing.
export function findSupplierMatch(name: string): { supplier: Supplier | null; confidence: number } {
  let best: Supplier | null = null;
  let bestScore = 0;

  for (const supplier of suppliers) {
    const score = nameSimilarity(name, supplier.name);
    if (score > bestScore) {
      bestScore = score;
      best = supplier;
    }
  }

  return bestScore >= MATCH_THRESHOLD ? { supplier: best, confidence: bestScore } : { supplier: null, confidence: bestScore };
}
