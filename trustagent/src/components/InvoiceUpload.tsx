'use client';

import { useState, useRef } from 'react';

interface UploadedInvoice {
  id: string;
  supplier_name: string;
  amount: number;
  currency: string;
  urgency: string;
  bank_account: string;
  bank_name: string;
  date: string;
  due_date: string;
}

interface InvoiceUploadProps {
  onInvestigationCreated: (investigationId: string) => void;
}

export default function InvoiceUpload({ onInvestigationCreated }: InvoiceUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [uploadedInvoice, setUploadedInvoice] = useState<UploadedInvoice | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setUploadedInvoice(null);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setUploadedInvoice(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadedInvoice(data.invoice);
      } else {
        setError(data.error || 'Failed to parse invoice');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartInvestigation = async () => {
    if (!uploadedInvoice) return;
    setIsStarting(true);

    try {
      const res = await fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: uploadedInvoice.id }),
      });
      const data = await res.json();
      if (data.investigation) {
        setIsOpen(false);
        setFile(null);
        setUploadedInvoice(null);
        onInvestigationCreated(data.investigation.id);
      }
    } catch (err) {
      console.error('Failed to create investigation:', err);
      setError('Failed to start investigation.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setUploadedInvoice(null);
    setError(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        Upload Invoice
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upload Invoice for Investigation</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Upload file */}
        {!uploadedInvoice && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Upload a supplier invoice document to analyze. Supported formats: PDF, Markdown, JSON, CSV, DOCX.
            </p>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-brand-500 bg-brand-50'
                  : file
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
              }`}
            >
              {file ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-brand-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">MD, PDF, JSON, CSV, DOCX up to 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.json,.csv,.docx,.doc,.xlsx,.xls,.md,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="btn-primary flex-1 text-center"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Upload & Parse'
                )}
              </button>
              <button onClick={handleClose} className="btn-secondary">
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Step 2: Show parsed invoice + start investigation */}
        {uploadedInvoice && (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Parsed Invoice Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Invoice ID</span>
                  <p className="font-mono font-medium">{uploadedInvoice.id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Supplier</span>
                  <p className="font-medium">{uploadedInvoice.supplier_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Amount</span>
                  <p className="font-bold text-lg">
                    R{uploadedInvoice.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Urgency</span>
                  <p className={`font-medium ${
                    uploadedInvoice.urgency === 'IMMEDIATE' ? 'text-red-600' :
                    uploadedInvoice.urgency === 'HIGH' ? 'text-orange-600' :
                    'text-gray-900'
                  }`}>
                    {uploadedInvoice.urgency}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Bank Account</span>
                  <p className="font-mono">{uploadedInvoice.bank_account}</p>
                </div>
                <div>
                  <span className="text-gray-500">Bank</span>
                  <p className="font-medium">{uploadedInvoice.bank_name}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleStartInvestigation}
                disabled={isStarting}
                className="btn-primary flex-1 text-center"
              >
                {isStarting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Starting...
                  </span>
                ) : (
                  'Start Investigation'
                )}
              </button>
              <button
                onClick={() => { setUploadedInvoice(null); setFile(null); }}
                className="btn-secondary"
              >
                Upload Different File
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
