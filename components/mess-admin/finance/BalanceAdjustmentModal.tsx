'use client';

import React, { useState } from 'react';
import { X, SlidersHorizontal, Loader2, AlertCircle } from 'lucide-react';

interface MemberOption {
  id: string;
  name: string;
  memberCode?: string | null;
}

interface BalanceAdjustmentModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  members: MemberOption[];
  defaultMembershipId?: string;
  defaultBillId?: string;
}

export function BalanceAdjustmentModal({
  tenantSlug,
  isOpen,
  onClose,
  onSuccess,
  members,
  defaultMembershipId,
  defaultBillId,
}: BalanceAdjustmentModalProps) {
  const [membershipId, setMembershipId] = useState<string>(
    defaultMembershipId || members[0]?.id || ''
  );
  const [amountTaka, setAmountTaka] = useState<number | ''>('');
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [reason, setReason] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!membershipId) {
      setError('Please select a resident member.');
      return;
    }
    const numAmount = Number(amountTaka);
    if (!numAmount || numAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (!reason.trim()) {
      setError('A reason is mandatory for auditable adjustments.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/finance/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId,
          billId: defaultBillId || undefined,
          amountTaka: numAmount,
          type,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to apply adjustment');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error applying balance adjustment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Adjust Member Balance</h2>
              <p className="text-xs text-slate-500">Apply a traceable credit waiver or debit adjustment</p>
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
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resident Member *
            </label>
            <select
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.memberCode ? `(${m.memberCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adjustment Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="CREDIT">Credit (Waiver / Discount)</option>
                <option value="DEBIT">Debit (Extra Fine / Charge)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (BDT ৳) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="e.g. 200.00"
                value={amountTaka}
                onChange={(e) =>
                  setAmountTaka(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Reason *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain the reason for adjustment (e.g. absent for 10 days with prior permission, waived wifi portion)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
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
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
