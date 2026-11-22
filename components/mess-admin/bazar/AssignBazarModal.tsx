'use client';

import React, { useState } from 'react';
import { X, CalendarPlus, Loader2, AlertCircle } from 'lucide-react';

interface MemberOption {
  id: string;
  name: string;
  memberCode?: string | null;
}

interface AssignBazarModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  members: MemberOption[];
  defaultDate?: string;
}

export function AssignBazarModal({
  tenantSlug,
  isOpen,
  onClose,
  onSuccess,
  members,
  defaultDate,
}: AssignBazarModalProps) {
  const [assignedDate, setAssignedDate] = useState<string>(
    defaultDate || new Date().toISOString().split('T')[0]
  );
  const [assignedMembershipId, setAssignedMembershipId] = useState<string>(members[0]?.id || '');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!assignedDate) {
      setError('Please select a date.');
      return;
    }
    if (!assignedMembershipId) {
      setError('Please select a member for bazar duty.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/expenses/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedDate,
          assignedMembershipId,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to assign bazar duty');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the assignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Assign Bazar Duty</h2>
              <p className="text-xs text-slate-500">Schedule a member for upcoming market shopping</p>
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
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duty Date *
            </label>
            <input
              type="date"
              required
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign Member *
            </label>
            <select
              value={assignedMembershipId}
              onChange={(e) => setAssignedMembershipId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.memberCode ? `(${m.memberCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duty Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Meat & Spices purchase for weekend feast"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Duty Rota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
