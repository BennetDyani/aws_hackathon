import { NextRequest, NextResponse } from 'next/server';
import { getInvestigation } from '@/lib/data/store';
import { getInvoiceById } from '@/lib/data/invoices';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const investigation = getInvestigation(params.id);

  if (!investigation) {
    return NextResponse.json(
      { error: `Investigation ${params.id} not found` },
      { status: 404 }
    );
  }

  const invoice = getInvoiceById(investigation.invoice_id);

  if (!invoice) {
    return NextResponse.json(
      { error: `Invoice ${investigation.invoice_id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({ investigation, invoice });
}
