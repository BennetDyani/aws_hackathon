import { NextRequest, NextResponse } from 'next/server';
import { getAllInvestigations, getDashboardMetrics, createInvestigation } from '@/lib/data/store';
import { getInvoiceById } from '@/lib/data/invoices';

export async function GET() {
  const investigations = getAllInvestigations();
  const metrics = getDashboardMetrics();

  return NextResponse.json({ investigations, metrics });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_id } = body;

    if (!invoice_id) {
      return NextResponse.json(
        { error: 'invoice_id is required' },
        { status: 400 }
      );
    }

    const invoice = getInvoiceById(invoice_id);
    if (!invoice) {
      return NextResponse.json(
        { error: `Invoice ${invoice_id} not found` },
        { status: 404 }
      );
    }

    const investigation = createInvestigation(invoice_id, invoice.supplier_id);

    return NextResponse.json({ investigation }, { status: 201 });
  } catch (error) {
    console.error('Error creating investigation:', error);
    return NextResponse.json(
      { error: 'Failed to create investigation' },
      { status: 500 }
    );
  }
}
