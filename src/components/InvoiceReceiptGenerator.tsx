import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { InvoiceReceipt, InvoiceItem, CurrencyCode } from '../types/index.ts';
import { calculateInvoiceTotals } from '../utils/proptechLogic.ts';
import {
  evaluatePaymentVerification,
  formatCurrencyAmount,
  summarizeFinancialsByCurrency,
} from '../utils/estateDeskLogic.ts';
import {
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Building2,
  X,
  AlertTriangle,
  Upload,
  ShieldCheck,
  Download,
} from 'lucide-react';

export const InvoiceReceiptGenerator: React.FC = () => {
  const {
    invoices,
    createInvoiceReceipt,
    submitPaymentScreenshot,
    verifyPaymentConfirmation,
    currentUser,
    currencies,
    isMobileFrameMode,
  } = useApp();

  const [selectedDocId, setSelectedDocId] = useState<string>(invoices[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Payment submission / reconciliation modal
  const [screenshotRef, setScreenshotRef] = useState('NIP-20261111-90412');
  const [verifyMethod, setVerifyMethod] = useState<'verified_bank_transfer' | 'verified_gateway' | 'verified_cash'>('verified_bank_transfer');
  const [verifyRef, setVerifyRef] = useState('NIBSS-VERIFIED-99102');

  // Creation form
  const [docType, setDocType] = useState<'invoice' | 'receipt'>('invoice');
  const [currency, setCurrency] = useState<CurrencyCode>('NGN');
  const [tenantName, setTenantName] = useState('Sarah Ade Johnson');
  const [rentPeriod, setRentPeriod] = useState('Dec 2026 – Dec 2027');
  const [watermarkText, setWatermarkText] = useState('OFFICIAL INVOICE');
  const [notes, setNotes] = useState('Remit payment directly to EstateDesk Escrow Account.');
  const [items, setItems] = useState<Array<{ id: string; description: string; category: InvoiceItem['category']; amount: number }>>([
    { id: '1', description: 'Annual Rent Renewal - Penthouse 4B', category: 'Rent', amount: 18000000 },
    { id: '2', description: 'Annual Service Charge & Power', category: 'Service Charge', amount: 3500000 },
  ]);

  const selectedDoc = invoices.find((inv) => inv.id === selectedDocId) || invoices[0];
  const currencySummaries = summarizeFinancialsByCurrency(invoices);
  const canVerifyPayments = currentUser.role === 'landlord' || currentUser.role === 'agent' || currentUser.role === 'super_admin';
  const canCreateDocs = currentUser.role === 'landlord' || currentUser.role === 'agent' || currentUser.role === 'facility_manager';

  const { subtotal, taxAmount, totalAmount } = calculateInvoiceTotals(items, 7.5);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: 'Facility Levy', category: 'Facility Repair', amount: 250000 },
    ]);
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoiceReceipt({
      type: docType,
      propertyId: 'prop_1',
      unitId: 'unit_101',
      landlordId: 'usr_landlord_1',
      tenantId: 'usr_tenant_1',
      tenantName,
      rentPeriod,
      currency,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '2026-12-04',
      items: items.map((i) => ({ ...i })),
      subtotal,
      taxRatePercent: 7.5,
      taxAmount,
      totalAmount,
      verificationStatus: docType === 'receipt' ? 'verified_bank_transfer' : 'unpaid',
      verifiedBy: docType === 'receipt' ? currentUser.name : undefined,
      verifiedAt: docType === 'receipt' ? new Date().toISOString().split('T')[0] : undefined,
      status: docType === 'receipt' ? 'paid' : 'unpaid',
      watermarkText: docType === 'receipt' ? 'VERIFIED & PAID' : watermarkText || 'OFFICIAL INVOICE',
      notes,
      generatedByRole: currentUser.role,
    });
    setShowCreateModal(false);
  };

  const handleExportCSV = () => {
    const header = ['DocNumber', 'Type', 'Tenant', 'Currency', 'TotalAmount', 'VerificationStatus', 'Status', 'PaymentReference'];
    const rows = invoices.map((d) => [
      d.docNumber,
      d.type,
      d.tenantName,
      d.currency,
      String(d.totalAmount),
      d.verificationStatus,
      d.status,
      d.paymentReference || 'N/A',
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estatedesk-financial-ledger.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedVerification = selectedDoc ? evaluatePaymentVerification(selectedDoc) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Multi-Currency Invoices, Payment Verification & Receipts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Currencies remain strictly separated without silent conversion. Screenshots alone never mark rent paid.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {canCreateDocs && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Issue Invoice / Receipt
            </button>
          )}
        </div>
      </div>

      {/* Separated Multi-Currency Totals Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currencySummaries.map((grp) => (
          <div key={grp.currency} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white font-mono">{grp.currency} Ledger Totals</span>
              <span className="text-[11px] text-slate-400">Currency-isolated</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono tabular-nums">
              <div>
                <p className="font-sans text-slate-500">Confirmed</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyAmount(grp.confirmedTotal, grp.currency, currencies)}
                </p>
              </div>
              <div>
                <p className="font-sans text-slate-500">Unverified Hold</p>
                <p className="font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrencyAmount(grp.pendingVerificationTotal, grp.currency, currencies)}
                </p>
              </div>
              <div>
                <p className="font-sans text-slate-500">Unpaid / Due</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {formatCurrencyAmount(grp.unpaidTotal, grp.currency, currencies)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Split View */}
      <div className={`grid gap-6 ${isMobileFrameMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Left List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Financial Documents ({invoices.length})
          </h2>

          <div className="space-y-2">
            {invoices.map((doc) => {
              const ver = evaluatePaymentVerification(doc);
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedDoc?.id === doc.id
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{doc.docNumber}</span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        ver.isConfirmedPaid
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : doc.verificationStatus === 'unverified_screenshot'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {doc.verificationStatus === 'unverified_screenshot' ? 'Unverified Hold' : doc.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                    {doc.tenantName}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="capitalize">{doc.type} · {doc.issueDate}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrencyAmount(doc.totalAmount, doc.currency, currencies)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Preview & Verification Controls */}
        {selectedDoc && selectedVerification && (
          <div className={`${isMobileFrameMode ? '' : 'lg:col-span-2'} space-y-4`}>
            {/* Verification Status Banner & Actions */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  {selectedVerification.isConfirmedPaid ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className="font-bold text-slate-900 dark:text-white">{selectedVerification.badgeLabel}</span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
              </div>

              {!selectedVerification.isConfirmedPaid && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                  <p className="text-slate-500">
                    Verification Policy: Submitting a transfer screenshot places the invoice on <strong>Unverified Hold</strong> (excluded from confirmed income). An authorized Landlord or Agent must reconcile bank settlement or payment gateway reference to unlock the official receipt.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Tenant / Payer Screenshot Upload */}
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 space-y-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">1. Submit Transfer Proof (Stays Unverified)</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={screenshotRef}
                          onChange={(e) => setScreenshotRef(e.target.value)}
                          placeholder="Transfer ref..."
                          className="flex-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => submitPaymentScreenshot(selectedDoc.id, screenshotRef, 'Bank Transfer')}
                          className="px-3 py-1.5 rounded bg-amber-600 text-white font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          Submit Slip
                        </button>
                      </div>
                    </div>

                    {/* Authorized Landlord/Agent Verification */}
                    {canVerifyPayments && (
                      <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-2">
                        <p className="font-semibold text-emerald-900 dark:text-emerald-200">2. Authorized Reconciliation (Unlocks Receipt)</p>
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={verifyMethod}
                            onChange={(e) => setVerifyMethod(e.target.value as any)}
                            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                          >
                            <option value="verified_bank_transfer">Bank Statement Match</option>
                            <option value="verified_gateway">Gateway Webhook (Paystack)</option>
                            <option value="verified_cash">Authorized Cash Audit</option>
                          </select>
                          <input
                            type="text"
                            value={verifyRef}
                            onChange={(e) => setVerifyRef(e.target.value)}
                            className="flex-1 min-w-[110px] px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => verifyPaymentConfirmation(selectedDoc.id, verifyMethod, verifyRef)}
                            className="px-3 py-1.5 rounded bg-emerald-600 text-white font-semibold text-[11px] flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Confirm Paid
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Official Printable Paper Document */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xs space-y-6 overflow-hidden">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-4 select-none">
                <span className="text-4xl sm:text-6xl font-black uppercase tracking-widest text-slate-900 dark:text-white transform -rotate-12 whitespace-nowrap">
                  {selectedDoc.watermarkText}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">EstateDesk Financial Record</span>
                  </div>
                  <p className="text-xs text-slate-500">Currency: {selectedDoc.currency} · Rent Period: {selectedDoc.rentPeriod || 'Standard Term'}</p>
                </div>

                <div className="sm:text-right space-y-0.5">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    {selectedVerification.canIssueOfficialReceipt ? 'Official Verified Receipt' : 'Rent / Fee Invoice'}
                  </p>
                  <p className="text-lg font-black font-mono text-slate-900 dark:text-white">{selectedDoc.docNumber}</p>
                  <p className="text-xs text-slate-500 font-mono">Issued {selectedDoc.issueDate} · Due {selectedDoc.dueDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Billed Party</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedDoc.tenantName}</p>
                  <p className="text-slate-500">Unit ID: {selectedDoc.unitId}</p>
                </div>
                <div className="sm:text-right">
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Verification & Reference</p>
                  <p className={`font-bold ${selectedVerification.isConfirmedPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedVerification.badgeLabel}
                  </p>
                  {selectedDoc.paymentReference && (
                    <p className="font-mono text-[11px] text-slate-500">Ref: {selectedDoc.paymentReference}</p>
                  )}
                  {selectedDoc.verifiedBy && (
                    <p className="text-[11px] text-slate-400">Confirmed by {selectedDoc.verifiedBy} ({selectedDoc.verifiedAt})</p>
                  )}
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2">Description</th>
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Amount ({selectedDoc.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedDoc.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-slate-900 dark:text-white">{item.description}</td>
                      <td className="py-2.5 text-slate-500">{item.category}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatCurrencyAmount(item.amount, selectedDoc.currency, currencies)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col items-end gap-1 text-xs font-mono tabular-nums">
                <div className="flex justify-between w-64 text-slate-500">
                  <span className="font-sans">Subtotal:</span>
                  <span>{formatCurrencyAmount(selectedDoc.subtotal, selectedDoc.currency, currencies)}</span>
                </div>
                <div className="flex justify-between w-64 text-slate-500">
                  <span className="font-sans">VAT ({selectedDoc.taxRatePercent}%):</span>
                  <span>{formatCurrencyAmount(selectedDoc.taxAmount, selectedDoc.currency, currencies)}</span>
                </div>
                <div className="flex justify-between w-64 pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
                  <span className="font-sans">Total ({selectedDoc.currency}):</span>
                  <span>{formatCurrencyAmount(selectedDoc.totalAmount, selectedDoc.currency, currencies)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
                {selectedDoc.notes}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateDocument} className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Issue Multi-Currency Document</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Type</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value as any)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Verified Receipt</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono">
                  {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Tenant / Client</label>
                <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Rent Period</label>
                <input value={rentPeriod} onChange={(e) => setRentPeriod(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Line Items</span>
                <button type="button" onClick={handleAddItem} className="text-slate-900 dark:text-white font-semibold underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <input value={item.description} onChange={(e) => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, description: e.target.value } : x)))} className="flex-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
                  <input type="number" value={item.amount} onChange={(e) => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, amount: Number(e.target.value) } : x)))} className="w-32 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-right" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))} className="text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">Issue Document</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
