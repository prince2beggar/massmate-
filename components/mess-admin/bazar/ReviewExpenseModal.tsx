'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';

interface ReviewExpenseModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: any | null;
}

export function ReviewExpenseModal({
  tenantSlug,
  isOpen,
  onClose,
  onSuccess,
  expense,
}: ReviewExpenseModalProps) {
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !expense) return null;

  const totalTaka = Number(expense.totalAmountPoisha || 0) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setError('A rejection reason is mandatory when rejecting an expense.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/expenses/${expense.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rejectionReason: decision === 'REJECT' ? rejectionReason.trim() : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to submit expense review');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Review & Verify Expense</h2>
            <p className="text-xs text-slate-500">
              Audit voucher items and record an official approval or rejection
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Details Overview */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Purchaser:</span>
                <span className="font-semibold text-slate-900">
                  {expense.purchaser?.user?.name || expense.purchaserMembershipId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Purchase Date:</span>
                <span className="font-semibold text-slate-900">{expense.purchaseDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Category:</span>
                <span className="font-semibold text-emerald-800">
                  {expense.category?.name || 'General'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Method:</span>
                <span className="font-semibold text-slate-900">{expense.paymentMethod}</span>
              </div>
            </div>

            {expense.vendorName && (
              <div className="text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-500">Vendor: </span>
                <span className="font-semibold text-slate-900">{expense.vendorName}</span>
              </div>
            )}

            {expense.receiptUrl && (
              <div className="text-xs pt-1 border-t border-slate-200 flex items-center gap-2">
                <span className="text-slate-500">Receipt Voucher: </span>
                <a
                  href={expense.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  View Attachment <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Itemized Breakdown</span>
              <span className="text-xs text-slate-500">
                {expense.items?.length || 0} line items
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Unit Price</th>
                    <th className="px-4 py-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expense.items?.map((it: any) => {
                    const lineTaka = Number(it.lineTotalPoisha || 0) / 100;
                    const unitTaka = Number(it.unitPricePoisha || 0) / 100;
                    return (
                      <tr key={it.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2 font-medium text-slate-800">{it.itemName}</td>
                        <td className="px-4 py-2 text-right text-slate-600">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-600">
                          ৳{unitTaka.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-900">
                          ৳{lineTaka.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700">Total Approved Amount:</span>
              <span className="text-sm font-bold text-emerald-700">
                ৳{totalTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Decision Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Audit Decision *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVE')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                  decision === 'APPROVE'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Approve Expense
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                  decision === 'REJECT'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="h-4 w-4 text-rose-600" />
                Reject Expense
              </button>
            </div>
          </div>

          {decision === 'REJECT' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="block text-xs font-semibold text-rose-700">
                Reason for Rejection * (Mandatory for audit records)
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain why this expense is rejected (e.g. invalid receipt, duplicate submission, incorrect amount)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-rose-300 p-3 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

          <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Financial Governance Policy:</strong> Purchasers cannot self-approve their own
              expenses. An independent mess manager or supervisor must audit this voucher.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50 transition ${
                decision === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm {decision === 'APPROVE' ? 'Approval' : 'Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
