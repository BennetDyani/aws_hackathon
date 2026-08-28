import { NextRequest, NextResponse } from 'next/server';
import { getDocumentProxy, extractText } from 'unpdf';
import { Invoice } from '@/lib/types';
import { addInvoice } from '@/lib/data/invoices';
import { addSupplier, findSupplierMatch } from '@/lib/data/suppliers';
import { extractInvoiceFields, ExtractedInvoiceFields } from '@/lib/agent/llm';

// Fallback-only parser for markdown/text invoices, used when the LLM
// extraction call fails (e.g. API outage or rate limit) so an upload still
// produces a best-effort result instead of erroring out entirely. Tuned to
// the specific markdown template used by this project's sample invoices —
// it will not generalize to arbitrary layouts, which is exactly why the
// LLM-based extraction below is the primary path.
function parseMarkdownInvoice(content: string, filename: string): Partial<Invoice> {
  const invoice: Partial<Invoice> = {
    currency: 'ZAR',
    status: 'SUBMITTED',
    line_items: [],
  };

  const invMatch = content.match(/\*\*Invoice Number:\*\*\s*(INV-\d+)/i)
    || content.match(/Invoice\s*(?:Number|No|#)[:\s]*(INV-\d+)/i);
  if (invMatch) invoice.id = invMatch[1];

  const dateMatch = content.match(/\*\*Date:\*\*\s*(\d{1,2}\s+\w+\s+\d{4})/i)
    || content.match(/Date[:\s]*(\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) {
    const d = new Date(dateMatch[1]);
    invoice.date = d.toISOString().split('T')[0];
  }

  const dueMatch = content.match(/\*\*Due Date:\*\*\s*(\d{1,2}\s+\w+\s+\d{4})/i)
    || content.match(/Due\s*Date[:\s]*(\d{4}-\d{2}-\d{2})/i);
  if (dueMatch) {
    const d = new Date(dueMatch[1]);
    invoice.due_date = d.toISOString().split('T')[0];
  }

  const priorityMatch = content.match(/\*\*Priority:\*\*\s*(\w+)/i);
  if (priorityMatch) {
    const p = priorityMatch[1].toUpperCase();
    if (p === 'IMMEDIATE' || p === 'URGENT') invoice.urgency = 'IMMEDIATE';
    else if (p === 'HIGH') invoice.urgency = 'HIGH';
    else invoice.urgency = 'NORMAL';
  }

  const supplierMatch = content.match(/\*\*(.+?)\*\*\s*\nRegistration/m)
    || content.match(/From \(Supplier\)\s*\n\n\*\*(.+?)\*\*/m);
  if (supplierMatch) invoice.supplier_name = supplierMatch[1];

  const bankAcctMatch = content.match(/Account Number[|\s:]*[^\*]*\*\*(\d{4})\*\*/i)
    || content.match(/\*\*(\d{4})\*\*/);
  if (bankAcctMatch) invoice.bank_account = `****${bankAcctMatch[1]}`;

  const bankNameMatch = content.match(/\|\s*Bank\s*\|\s*(.+?)\s*\|/i);
  if (bankNameMatch) invoice.bank_name = bankNameMatch[1].trim();

  const totalMatch = content.match(/\*\*Total Due\*\*\s*\|\s*\*\*R\s*([\d,]+(?:\.\d{2})?)\*\*/i)
    || content.match(/Total Due[^R]*R\s*([\d,]+(?:\.\d{2})?)/i)
    || content.match(/\*\*R\s*([\d,]+(?:\.\d{2})?)\*\*/);
  if (totalMatch) {
    invoice.amount = parseFloat(totalMatch[1].replace(/,/g, ''));
  }

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

  const notesMatch = content.match(/## Notes\s*\n\n([\s\S]*?)(?:\n---|\n\*|$)/);
  if (notesMatch) invoice.description = notesMatch[1].trim().substring(0, 200);

  if (!invoice.id) {
    const fnMatch = filename.match(/(INV-\d+)/i);
    if (fnMatch) invoice.id = fnMatch[1];
    else invoice.id = `INV-${Date.now().toString().slice(-4)}`;
  }

  return invoice;
}

// Parse JSON invoice — structured data, no LLM needed.
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

function extractedFieldsToInvoice(extracted: ExtractedInvoiceFields, filename: string): Partial<Invoice> {
  return {
    id: extracted.invoice_number || undefined,
    supplier_name: extracted.supplier_name || undefined,
    amount: extracted.amount ?? undefined,
    currency: extracted.currency || 'ZAR',
    date: extracted.invoice_date || undefined,
    due_date: extracted.due_date || undefined,
    bank_account: extracted.bank_account_last4 ? `****${extracted.bank_account_last4}` : undefined,
    bank_name: extracted.bank_name || undefined,
    description: extracted.description || filename,
    line_items: extracted.line_items,
    status: 'SUBMITTED',
    urgency: extracted.urgency,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    let parsedInvoice: Partial<Invoice>;
    const parseWarnings: string[] = [];

    if (filename.endsWith('.json')) {
      const content = await file.text();
      parsedInvoice = parseJsonInvoice(content);
    } else if (filename.endsWith('.pdf')) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfDoc = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdfDoc, { mergePages: true });

      try {
        const extracted = await extractInvoiceFields(text);
        parsedInvoice = extractedFieldsToInvoice(extracted, file.name);
        parseWarnings.push(...extracted.warnings);
      } catch (err) {
        console.error('PDF invoice extraction failed:', err);
        return NextResponse.json(
          { error: 'Could not extract invoice data from this PDF. Please try again or use a different format.' },
          { status: 422 }
        );
      }
    } else {
      // markdown / plain text / CSV
      const content = await file.text();
      try {
        const extracted = await extractInvoiceFields(content);
        parsedInvoice = extractedFieldsToInvoice(extracted, file.name);
        parseWarnings.push(...extracted.warnings);
      } catch (err) {
        console.error('LLM extraction failed, falling back to pattern-based parser:', err);
        parsedInvoice = parseMarkdownInvoice(content, file.name);
        parseWarnings.push('AI extraction was unavailable — used basic pattern matching as a fallback. Please verify all fields carefully.');
      }
    }

    // Flag when critical fields couldn't be found at all, before defaults
    // paper over them below — otherwise a failed extraction silently looks
    // like a legitimate R0 invoice from "Unknown Supplier".
    const criticalMissing: string[] = [];
    if (!parsedInvoice.supplier_name) criticalMissing.push('supplier name');
    if (!parsedInvoice.amount) criticalMissing.push('invoice amount');
    if (!parsedInvoice.bank_account) criticalMissing.push('bank account number');
    if (criticalMissing.length > 0) {
      parseWarnings.push(`Could not confidently extract: ${criticalMissing.join(', ')}. Please verify manually before investigating.`);
    }

    // Build the full invoice with defaults
    const invoice: Invoice = {
      id: parsedInvoice.id || `INV-${Date.now().toString().slice(-4)}`,
      supplier_id: '', // resolved below via supplier matching
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

    // Match against known suppliers by name. If nothing resembles it closely
    // enough, this is a genuinely new supplier — auto-register it as
    // UNVERIFIED using the bank details straight off this invoice, rather
    // than misattributing it to an unrelated existing supplier (which would
    // always trip a false bank-account-mismatch flag).
    const match = findSupplierMatch(invoice.supplier_name);
    if (match.supplier) {
      invoice.supplier_id = match.supplier.id;
      invoice.supplier_match_status = 'MATCHED_EXISTING';
      invoice.supplier_match_confidence = match.confidence;
    } else {
      const newSupplier = addSupplier({
        name: invoice.supplier_name,
        contact_email: 'unverified@unknown.co.za',
        bank_account: invoice.bank_account,
        bank_name: invoice.bank_name,
        registration_number: 'UNKNOWN',
        risk_status: 'MEDIUM',
        verified: false,
        verified_date: null,
        verified_by: null,
        expected_spend_min: null,
        expected_spend_max: null,
      });
      invoice.supplier_id = newSupplier.id;
      invoice.supplier_match_status = 'NEW_SUPPLIER';
      invoice.supplier_match_confidence = 0;
    }

    // Add to the in-memory store
    addInvoice(invoice);

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        supplier_id: invoice.supplier_id,
        supplier_name: invoice.supplier_name,
        supplier_match_status: invoice.supplier_match_status,
        amount: invoice.amount,
        currency: invoice.currency,
        urgency: invoice.urgency,
        bank_account: invoice.bank_account,
        bank_name: invoice.bank_name,
        date: invoice.date,
        due_date: invoice.due_date,
      },
      parse_warnings: parseWarnings,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process uploaded file' },
      { status: 500 }
    );
  }
}
