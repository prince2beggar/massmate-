'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Calculator, Loader2, AlertCircle } from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
  code: string;
  allocationRule: string;
  defaultAmountTaka?: number | null;
}

interface GenerateBillsModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: CategoryOption[];
  defaultMonth: string;
}

interface ChargeRow {
  categoryId: string;
  totalAmountTaka: number | '';
  allocationRule: string;
  notes: string;
}

export function GenerateBillsModal({
  tenantSlug,
  isOpen,
  onClose,
  onSuccess,
  categories,
  defaultMonth,
}: GenerateBillsModalProps) {
  const [monthString, setMonthString] = useState(defaultMonth);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const [charges, setCharges] = useState<ChargeRow[]>([
    {
      categoryId: categories.find((c) => c.code === 'ELECTRICITY')?.id || categories[0]?.id || '',
      totalAmountTaka: '',
      allocationRule: 'EQUAL_PER_MEMBER',
      notes: '',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCharge = () => {
    setCharges((prev) => [
      ...prev,
      {
        categoryId: categories[0]?.id || '',
        totalAmountTaka: '',
        allocationRule: 'EQUAL_PER_MEMBER',
        notes: '',
      },
    ]);
  };

  const handleRemoveCharge = (index: number) => {
    if (charges.length <= 1) return;
    setCharges((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChargeChange = (index: number, field: keyof ChargeRow, value: any) => {
    setCharges((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const totalCalculatedTaka = charges.reduce((sum, ch) => {
    const amt = typeof ch.totalAmountTaka === 'number' ? ch.totalAmountTaka : 0;
    return sum + amt;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!monthString) {
      setError('Please select a billing period (month).');
      return;
    }

    const cleanedCharges = charges.map((ch) => ({
      categoryId: ch.categoryId,
      totalAmountTaka: Number(ch.totalAmountTaka) || 0,
      allocationRule: ch.allocationRule as any,
      notes: ch.notes.trim() || undefined,
    }));

    for (let i = 0; i < cleanedCharges.length; i++) {
      if (cleanedCharges[i].totalAmountTaka <= 0) {
        setError(`Charge #${i + 1} must have an amount greater than ৳0.`);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/finance/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthString,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
          charges: cleanedCharges,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to generate monthly bills');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error generating monthly bills.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Generate Monthly Bills</h2>
              <p className="text-xs text-slate-500">
                Calculate utilities, rent, and overheads across all residents
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Period (Month) *
              </label>
              <input
                type="month"
                required
                value={monthString}
                onChange={(e) => setMonthString(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Charges List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-900">Period Charges to Allocate</span>
              <button
                type="button"
                onClick={handleAddCharge}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Charge
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {charges.map((ch, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60"
                >
                  <div className="flex-1 w-full">
                    <select
                      value={ch.categoryId}
                      onChange={(e) => handleChargeChange(idx, 'categoryId', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.allocationRule})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-32">
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="Total ৳"
                      value={ch.totalAmountTaka}
                      onChange={(e) =>
                        handleChargeChange(
                          idx,
                          'totalAmountTaka',
                          e.target.value === '' ? '' : parseFloat(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <select
                      value={ch.allocationRule}
                      onChange={(e) =>
                        handleChargeChange(idx, 'allocationRule', e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="EQUAL_PER_MEMBER">Equal Split</option>
                      <option value="PER_ROOM">Per Room</option>
                      <option value="FIXED_AMOUNT">Fixed Per Member</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCharge(idx)}
                    disabled={charges.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-100 p-3">
              <span className="text-xs font-semibold text-slate-700">Total Billed Pool:</span>
              <span className="text-base font-bold text-emerald-700">
                ৳{totalCalculatedTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Billing Run Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. November general utility split + wifi"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
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
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate Draft Bills
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
