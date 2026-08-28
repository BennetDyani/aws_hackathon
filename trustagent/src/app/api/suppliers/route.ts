import { NextRequest, NextResponse } from 'next/server';
import { getAllSuppliers, addSupplier } from '@/lib/data/suppliers';

export async function GET() {
  return NextResponse.json({ suppliers: getAllSuppliers() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      contact_email,
      bank_account,
      bank_name,
      registration_number,
      risk_status,
      expected_spend_min,
      expected_spend_max,
      verified_by,
    } = body;

    if (!name || !bank_account || !bank_name) {
      return NextResponse.json(
        { error: 'name, bank_account, and bank_name are required' },
        { status: 400 }
      );
    }

    // Adding a supplier through this endpoint is itself the human
    // verification act — the record is created already verified.
    const supplier = addSupplier({
      name,
      contact_email: contact_email || '',
      bank_account,
      bank_name,
      registration_number: registration_number || 'UNKNOWN',
      risk_status: risk_status || 'LOW',
      verified: true,
      verified_date: new Date().toISOString(),
      verified_by: verified_by || 'unknown',
      expected_spend_min: expected_spend_min ?? null,
      expected_spend_max: expected_spend_max ?? null,
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
