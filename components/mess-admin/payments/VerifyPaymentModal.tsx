'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';

interface VerifyPaymentModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payment: any | null;
}

export function VerifyPaymentModal({
  tenantSlug,
  isOpen,
  onClose,
  onSuccess,
  payment,
}: VerifyPaymentModalProps) {
  const [decision, setDecision] = useState<'CONFIRM' | 'REJECT'>('CONFIRM');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setError('A rejection reason is mandatory when rejecting a payment.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/payments/${payment.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rejectionReason: decision === 'REJECT' ? rejectionReason.trim() : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to verify payment');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Verify Payment Voucher</h2>
            <p className="text-xs text-slate-500">
              Audit member money deposit and credit to monthly bill
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Member:</span>
              <span className="font-semibold text-slate-900">
                {payment.memberName} {payment.memberCode ? `(${payment.memberCode})` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Date:</span>
              <span className="font-semibold text-slate-900">{payment.paymentDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold text-emerald-800">{payment.paymentMethod}</span>
            </div>
            {payment.transactionId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{payment.transactionId}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="text-slate-700 font-semibold">Amount to Verify:</span>
              <span className="font-black text-emerald-700 text-sm">
                ৳{payment.amountTaka?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {payment.receiptUrl && (
              <div className="pt-1 border-t border-slate-200 flex items-center gap-1">
                <span className="text-slate-500">Proof: </span>
                <a
                  href={payment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  View Attachment <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Verification Decision *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('CONFIRM')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                  decision === 'CONFIRM'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Confirm Payment
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                  decision === 'REJECT'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="h-4 w-4 text-rose-600" />
                Reject Deposit
              </button>
            </div>
          </div>

          {decision === 'REJECT' && (
            <div className="space-y-1 animate-in fade-in duration-200">
              <label className="block text-xs font-semibold text-rose-700">
                Reason for Rejection *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Explain why this payment is rejected (e.g. invalid TrxID, funds not received in bKash account)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-rose-300 p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

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
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition ${
                decision === 'CONFIRM'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit {decision === 'CONFIRM' ? 'Confirmation' : 'Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
