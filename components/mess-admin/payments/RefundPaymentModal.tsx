'use client';

import React, { useState } from 'react';
import { X, RotateCcw, AlertOctagon, Loader2 } from 'lucide-react';

interface RefundPaymentModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payment: any | null;
}

export function RefundPaymentModal({
  tenantSlug,
  isOpen,
  onClose,
  onSuccess,
  payment,
}: RefundPaymentModalProps) {
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('A refund reason is mandatory to maintain an immutable audit trail.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/payments/${payment.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to process refund');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during refund processing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Refund / Reverse Payment</h2>
              <p className="text-xs text-slate-500">Record a traceable return of member funds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Member:</span>
              <span className="font-semibold text-slate-900">{payment.memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount:</span>
              <span className="font-bold text-slate-900">
                ৳{payment.amountTaka?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold text-slate-700">{payment.paymentMethod}</span>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-2.5 text-xs text-amber-900 flex items-start gap-2">
            <AlertOctagon className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <span>
              Refunding this payment will revert the paid credit on the member&apos;s bill and update
              their balance. The record is preserved as <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">REFUNDED</code>.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Refund / Reversal *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain why this payment is being refunded (e.g. resident overpaid, incorrect account, double credited)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
