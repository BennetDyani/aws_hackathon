import { NextRequest, NextResponse } from 'next/server';
import { Invoice } from '@/lib/types';
import { addInvoice } from '@/lib/data/invoices';

// Parse markdown invoice content to extract key fields
function parseMarkdownInvoice(content: string, filename: string): Partial<Invoice> {
  const invoice: Partial<Invoice> = {
    currency: 'ZAR',
    status: 'SUBMITTED',
    line_items: [],
  };

  // Extract invoice number
  const invMatch = content.match(/\*\*Invoice Number:\*\*\s*(INV-\d+)/i)
    || content.match(/Invoice\s*(?:Number|No|#)[:\s]*(INV-\d+)/i);
  if (invMatch) invoice.id = invMatch[1];

  // Extract date
  const dateMatch = content.match(/\*\*Date:\*\*\s*(\d{1,2}\s+\w+\s+\d{4})/i)
    || content.match(/Date[:\s]*(\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) {
    const d = new Date(dateMatch[1]);
    invoice.date = d.toISOString().split('T')[0];
  }

  // Extract due date
  const dueMatch = content.match(/\*\*Due Date:\*\*\s*(\d{1,2}\s+\w+\s+\d{4})/i)
    || content.match(/Due\s*Date[:\s]*(\d{4}-\d{2}-\d{2})/i);
  if (dueMatch) {
    const d = new Date(dueMatch[1]);
    invoice.due_date = d.toISOString().split('T')[0];
  }

  // Extract priority/urgency
  const priorityMatch = content.match(/\*\*Priority:\*\*\s*(\w+)/i);
  if (priorityMatch) {
    const p = priorityMatch[1].toUpperCase();
    if (p === 'IMMEDIATE' || p === 'URGENT') invoice.urgency = 'IMMEDIATE';
    else if (p === 'HIGH') invoice.urgency = 'HIGH';
    else invoice.urgency = 'NORMAL';
  }

  // Extract supplier name from "From" section
  const supplierMatch = content.match(/\*\*(.+?)\*\*\s*\nRegistration/m)
    || content.match(/From \(Supplier\)\s*\n\n\*\*(.+?)\*\*/m);
  if (supplierMatch) invoice.supplier_name = supplierMatch[1];

  // Extract bank account (last 4 digits pattern)
  const bankAcctMatch = content.match(/Account Number[|\s:]*[^\*]*\*\*(\d{4})\*\*/i)
    || content.match(/\*\*(\d{4})\*\*/);
  if (bankAcctMatch) invoice.bank_account = `****${bankAcctMatch[1]}`;

  // Extract bank name
  const bankNameMatch = content.match(/\|\s*Bank\s*\|\s*(.+?)\s*\|/i);
  if (bankNameMatch) invoice.bank_name = bankNameMatch[1].trim();

  // Extract total amount
  const totalMatch = content.match(/\*\*Total Due\*\*\s*\|\s*\*\*R\s*([\d,]+(?:\.\d{2})?)\*\*/i)
    || content.match(/Total Due[^R]*R\s*([\d,]+(?:\.\d{2})?)/i)
    || content.match(/\*\*R\s*([\d,]+(?:\.\d{2})?)\*\*/);
  if (totalMatch) {
    invoice.amount = parseFloat(totalMatch[1].replace(/,/g, ''));
  }

  // Extract line items from markdown table
  const lineItemRegex = /\|\s*\d+\s*\|\s*(.+?)\s*\|\s*[\d,]+\s*\|\s*R\s*([\d,]+(?:\.\d{2})?)\s*\|\s*R\s*([\d,]+(?:\.\d{2})?)\s*\|/g;
  let match;
  while ((match = lineItemRegex.exec(content)) !== null) {
    const total = parseFloat(match[3].replace(/,/g, ''));
    if (total > 0) {
      invoice.line_items!.push({
        description: match[1].trim(),
        quantity: 1,
        unit_price: parseFloat(match[2].replace(/,/g, '')),
        total,
      });
    }
  }

  // Extract notes
  const notesMatch = content.match(/## Notes\s*\n\n([\s\S]*?)(?:\n---|\n\*|$)/);
  if (notesMatch) invoice.description = notesMatch[1].trim().substring(0, 200);

  // Fallback ID from filename
  if (!invoice.id) {
    const fnMatch = filename.match(/(INV-\d+)/i);
    if (fnMatch) invoice.id = fnMatch[1];
    else invoice.id = `INV-${Date.now().toString().slice(-4)}`;
  }

  return invoice;
}

// Parse JSON invoice
function parseJsonInvoice(content: string): Partial<Invoice> {
  try {
    const data = JSON.parse(content);
    return {
      id: data.invoice_id || data.id,
      supplier_name: data.supplier?.name || data.supplier_name,
      amount: data.total || data.amount,
      currency: data.currency || 'ZAR',
      date: data.invoice_date || data.date,
      due_date: data.due_date,
      bank_account: data.bank_details?.account_number || data.bank_account,
      bank_name: data.bank_details?.bank_name || data.bank_name,
      description: data.notes || data.description || '',
      urgency: (data.urgency || data.priority || 'NORMAL').toUpperCase() as 'NORMAL' | 'HIGH' | 'IMMEDIATE',
      status: 'SUBMITTED',
      line_items: (data.line_items || []).map((li: { description?: string; item?: string; quantity?: number; unit_price?: number; total?: number }) => ({
        description: li.description || li.item || '',
        quantity: li.quantity || 1,
        unit_price: li.unit_price || 0,
        total: li.total || 0,
      })),
    };
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const content = await file.text();
    const filename = file.name.toLowerCase();

    let parsedInvoice: Partial<Invoice>;

    if (filename.endsWith('.json')) {
      parsedInvoice = parseJsonInvoice(content);
    } else {
      // Treat as markdown/text
      parsedInvoice = parseMarkdownInvoice(content, file.name);
    }

    // Build the full invoice with defaults
    const invoice: Invoice = {
      id: parsedInvoice.id || `INV-${Date.now().toString().slice(-4)}`,
      supplier_id: 'SUP-001', // Default to known supplier for demo
      supplier_name: parsedInvoice.supplier_name || 'Unknown Supplier',
      amount: parsedInvoice.amount || 0,
      currency: parsedInvoice.currency || 'ZAR',
      date: parsedInvoice.date || new Date().toISOString().split('T')[0],
      due_date: parsedInvoice.due_date || new Date().toISOString().split('T')[0],
      bank_account: parsedInvoice.bank_account || '****0000',
      bank_name: parsedInvoice.bank_name || 'Unknown Bank',
      description: parsedInvoice.description || file.name,
      line_items: parsedInvoice.line_items || [],
      status: 'SUBMITTED',
      urgency: parsedInvoice.urgency || 'NORMAL',
      submitted_by: 'upload@trustcorp.co.za',
    };

    // Try to match supplier by name
    if (invoice.supplier_name.toLowerCase().includes('abc office')) {
      invoice.supplier_id = 'SUP-001';
    } else if (invoice.supplier_name.toLowerCase().includes('metro')) {
      invoice.supplier_id = 'SUP-002';
    } else if (invoice.supplier_name.toLowerCase().includes('digital print')) {
      invoice.supplier_id = 'SUP-003';
    }

    // Add to the in-memory store
    addInvoice(invoice);

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        supplier_name: invoice.supplier_name,
        amount: invoice.amount,
        currency: invoice.currency,
        urgency: invoice.urgency,
        bank_account: invoice.bank_account,
        bank_name: invoice.bank_name,
        date: invoice.date,
        due_date: invoice.due_date,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process uploaded file' },
      { status: 500 }
    );
  }
}
