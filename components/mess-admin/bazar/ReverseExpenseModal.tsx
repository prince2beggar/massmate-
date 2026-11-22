'use client';

import React, { useState } from 'react';
import { X, RotateCcw, AlertOctagon, Loader2 } from 'lucide-react';

interface ReverseExpenseModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: any | null;
}

export function ReverseExpenseModal({
  tenantSlug,
  isOpen,
  onClose,
  onSuccess,
  expense,
}: ReverseExpenseModalProps) {
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !expense) return null;

  const totalTaka = Number(expense.totalAmountPoisha || 0) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('A reversal reason is mandatory to maintain an immutable audit trail.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/expenses/${expense.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to reverse expense');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during reversal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reverse Expense</h2>
              <p className="text-xs text-slate-500">
                Cancel an approved expense with an immutable audit entry
              </p>
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
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Expense Ref:</span>
              <span className="font-mono text-slate-900">{expense.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Amount:</span>
              <span className="font-bold text-slate-900">
                ৳{totalTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Purchaser:</span>
              <span className="font-semibold text-slate-800">
                {expense.purchaser?.user?.name || expense.purchaserMembershipId}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertOctagon className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <strong>Reversal Notice:</strong> Reversing this expense will remove it from the
              approved meal calculation and monthly totals. The record is preserved in the database
              as <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">REVERSED</code> for
              financial accountability.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Reversal *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain why this approved expense is being reversed (e.g. incorrect price recorded, double counted with petty cash)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

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
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Reversal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
