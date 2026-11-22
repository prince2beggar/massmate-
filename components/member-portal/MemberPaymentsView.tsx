'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Receipt,
  Printer,
  X,
  Send,
  Building2,
  ShieldCheck,
  Info,
  DollarSign,
  Smartphone,
  Landmark,
  Banknote,
} from 'lucide-react';
import type {
  MemberPaymentRecordDto,
  MemberPaymentReceiptDto,
} from '@/server/member-portal/member-portal-service';

interface MemberPaymentsViewProps {
  tenantSlug: string;
  initialData?: MemberPaymentRecordDto[] | null;
}

const METHOD_ICONS: Record<string, React.ElementType> = {
  BKASH: Smartphone,
  NAGAD: Smartphone,
  ROCKET: Smartphone,
  BANK_TRANSFER: Landmark,
  CASH: Banknote,
  ONLINE_GATEWAY: CreditCard,
  OTHER: CreditCard,
};

const METHOD_LABELS: Record<string, string> = {
  BKASH: 'bKash Mobile',
  NAGAD: 'Nagad Mobile',
  ROCKET: 'Rocket Mobile',
  BANK_TRANSFER: 'Bank Transfer',
  CASH: 'Cash Payment',
  ONLINE_GATEWAY: 'Online Gateway',
  OTHER: 'Other Method',
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  REFUNDED: { label: 'Refunded', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  PARTIAL: { label: 'Partial', color: 'bg-blue-100 text-blue-800 border-blue-200' },
};

export function MemberPaymentsView({ tenantSlug, initialData }: MemberPaymentsViewProps) {
  const [payments, setPayments] = useState<MemberPaymentRecordDto[] | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Submit Payment Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [amountTaka, setAmountTaka] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER' | 'CASH'>('BKASH');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Official Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<MemberPaymentReceiptDto | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const fetchPayments = useCallback(() => {
    let url = `/api/v1/portal/${tenantSlug}/payments`;
    if (statusFilter !== 'ALL') url += `?status=${statusFilter}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch payments.');
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setPayments(json.data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Error fetching payment history.');
        setLoading(false);
      });
  }, [tenantSlug, statusFilter]);

  useEffect(() => {
    if (initialData && statusFilter === 'ALL') return;
    fetchPayments();
  }, [initialData, statusFilter, fetchPayments]);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const parsedAmount = parseFloat(amountTaka);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid positive payment amount.');
      return;
    }

    if (['BKASH', 'NAGAD', 'ROCKET', 'BANK_TRANSFER'].includes(paymentMethod)) {
      if (!transactionId || transactionId.trim().length < 4) {
        setSubmitError('Transaction/Reference ID is required for mobile banking or bank payments (minimum 4 characters).');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountTaka: parsedAmount,
          paymentMethod,
          transactionId: transactionId.trim() || undefined,
          paymentDate,
          receiptUrl: receiptUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit payment voucher.');
      }

      setSubmitSuccess(
        'Payment voucher submitted successfully! It is now pending administrative verification before balance update.'
      );
      setAmountTaka('');
      setTransactionId('');
      setReceiptUrl('');
      setNotes('');
      fetchPayments();
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReceipt = async (paymentId: string) => {
    setReceiptError(null);
    setSelectedReceipt(null);
    setReceiptLoading(true);

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/payments/${paymentId}/receipt`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || 'Failed to load official receipt.');
      }
      setSelectedReceipt(json.data);
    } catch (err: any) {
      setReceiptError(err.message || 'Error fetching receipt.');
    } finally {
      setReceiptLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Receipts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track confirmed payments, submit deposit vouchers, and print verified official receipts.
          </p>
        </div>

        <button
          onClick={() => {
            setSubmitError(null);
            setSubmitSuccess(null);
            setIsSubmitModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors w-fit"
        >
          <Plus className="h-4 w-4" />
          Submit Payment Voucher
        </button>
      </div>

      {/* 2. Online Payment Gateway Status Alert */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-start gap-4 shadow-sm print:hidden">
        <Info className="h-5 w-5 text-slate-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-900">
            Payment Methods: Mobile Banking (bKash/Nagad) & Cash
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Direct card checkout is currently not enabled for this mess. Please send money to the mess manager&apos;s
            official bKash/Nagad number or hand over cash, then submit your transaction voucher below. All submissions
            are verified before your ledger balance is credited.
          </p>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3 print:hidden">
        {(['ALL', 'CONFIRMED', 'PENDING', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab === 'ALL'
              ? 'All Transactions'
              : tab === 'CONFIRMED'
              ? 'Confirmed'
              : tab === 'PENDING'
              ? 'Pending Review'
              : 'Rejected'}
          </button>
        ))}
      </div>

      {/* 4. Payment History List */}
      {loading && !payments ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-500">Loading payment records...</p>
        </div>
      ) : error && !payments ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-lg font-semibold text-rose-800">Failed to load payments</h3>
          <p className="text-sm text-rose-600">{error}</p>
          <button
            onClick={fetchPayments}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      ) : (payments || []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 print:hidden">
          <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No payment records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter !== 'ALL'
              ? `No transactions found under '${statusFilter}'.`
              : 'You have not submitted any payments for this mess yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4 text-right">Amount (BDT)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(payments || []).map((p) => {
                  const MethodIcon = METHOD_ICONS[p.paymentMethod] || CreditCard;
                  const badge = STATUS_BADGES[p.status] || { label: p.status, color: 'bg-slate-100 text-slate-700' };

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {p.paymentDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MethodIcon className="h-4 w-4 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-800">
                            {METHOD_LABELS[p.paymentMethod] || p.paymentMethod}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {p.transactionId ? p.transactionId : <span className="text-slate-400">Cash Handover</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ৳{p.amountTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {p.rejectionReason && (
                          <div className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={p.rejectionReason}>
                            Reason: {p.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {p.isOfficialReceiptAvailable ? (
                          <button
                            onClick={() => handleOpenReceipt(p.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            <span>View Receipt</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not Verified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Submit Payment Voucher Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Submit Payment Voucher</h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Amount in Taka (BDT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="500000"
                    required
                    value={amountTaka}
                    onChange={(e) => setAmountTaka(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['BKASH', 'NAGAD', 'ROCKET', 'BANK_TRANSFER', 'CASH'] as const).map((method) => {
                    const Icon = METHOD_ICONS[method];
                    const isSelected = paymentMethod === method;
                    return (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                        <span className="truncate">{METHOD_LABELS[method]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transaction ID */}
              {paymentMethod !== 'CASH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Transaction / Reference ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 9J47K89PQL"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Copy the exact transaction ID from your SMS or banking app.
                  </p>
                </div>
              )}

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Slip / Voucher Link (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Deposit Slip / Screenshot URL (Optional)
                </label>
                <input
                  type="url"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes for Manager (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid for November room rent"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Advisory Box */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                <strong>Notice:</strong> Your payment voucher will be submitted for verification.
                The balance will be reflected once an administrator confirms the transaction.
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Submit Voucher
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Official Confirmed Receipt Modal / Printable Receipt */}
      {(selectedReceipt || receiptLoading || receiptError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up print:border-none print:shadow-none print:max-w-none">
            {/* Modal Header (Hidden on Print) */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Official Payment Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedReceipt && (
                  <button
                    onClick={handlePrintReceipt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-600" />
                    Print
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedReceipt(null);
                    setReceiptError(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {receiptLoading ? (
              <div className="p-16 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                <p className="text-xs font-medium text-slate-500">Retrieving official receipt...</p>
              </div>
            ) : receiptError ? (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                <p className="text-sm font-semibold text-rose-800">{receiptError}</p>
              </div>
            ) : selectedReceipt ? (
              <div className="p-6 sm:p-8 space-y-6">
                {/* Receipt Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-emerald-600 print:text-black" />
                      <h4 className="font-bold text-slate-900 text-lg">{selectedReceipt.tenantName}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{selectedReceipt.messAddress}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 print:border-black print:text-black">
                      {selectedReceipt.receiptNumber}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Date: {selectedReceipt.paymentDate}</p>
                  </div>
                </div>

                {/* Verified Stamp Badge */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                        Official Payment Verified
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Confirmed on {selectedReceipt.verifiedAt}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200">
                    PAID
                  </span>
                </div>

                {/* Resident & Transaction Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Received From:</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedReceipt.memberName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Member ID:</span>
                    <span className="font-semibold text-slate-700">{selectedReceipt.memberCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Room Allocation:</span>
                    <span className="font-semibold text-slate-700">
                      {selectedReceipt.roomNumber
                        ? `Room ${selectedReceipt.roomNumber} (Bed ${selectedReceipt.bedLabel || 'A'})`
                        : 'Resident'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Payment Method:</span>
                    <span className="font-semibold text-slate-700">{selectedReceipt.paymentMethod}</span>
                  </div>
                  {selectedReceipt.transactionId && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block font-medium">Transaction ID:</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedReceipt.transactionId}</span>
                    </div>
                  )}
                </div>

                {/* Amount Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Amount Received
                  </span>
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    ৳{selectedReceipt.amountTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs font-medium text-slate-600 italic pt-1">
                    ({selectedReceipt.amountInWords})
                  </div>
                </div>

                {/* Signatures on Print */}
                <div className="hidden print:grid grid-cols-2 gap-8 pt-10 text-xs text-slate-600 border-t border-slate-300">
                  <div>
                    <div className="border-b border-slate-400 w-36 mb-1"></div>
                    <p className="font-semibold text-slate-800">Received By</p>
                    <p className="text-[10px] text-slate-400">Authorized Manager</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="border-b border-slate-400 w-36 mb-1"></div>
                    <p className="font-semibold text-slate-800">Mess Seal</p>
                    <p className="text-[10px] text-slate-400">Officially Valid</p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-2 text-center text-[10px] text-slate-400">
                  Official digital transaction receipt issued by MessMate multi-tenant billing engine.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
