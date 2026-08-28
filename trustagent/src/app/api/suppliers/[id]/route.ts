import { NextRequest, NextResponse } from 'next/server';
import { getSupplierById, updateSupplier } from '@/lib/data/suppliers';
import { Supplier } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supplier = getSupplierById(params.id);
  if (!supplier) {
    return NextResponse.json({ error: `Supplier ${params.id} not found` }, { status: 404 });
  }
  return NextResponse.json({ supplier });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const existing = getSupplierById(params.id);
    if (!existing) {
      return NextResponse.json({ error: `Supplier ${params.id} not found` }, { status: 404 });
    }

    const updates: Partial<Supplier> = { ...body };

    // Flipping an auto-created unverified supplier to verified is the
    // verification act — stamp who/when unless the caller already did.
    if (body.verified === true && !existing.verified) {
      updates.verified_date = body.verified_date || new Date().toISOString();
      updates.verified_by = body.verified_by || 'unknown';
    }

    const supplier = updateSupplier(params.id, updates);
    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}
