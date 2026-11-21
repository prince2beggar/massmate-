'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { MemberDto } from '@/server/members/member-service';
import type { MembershipStatus } from '@/types/database';

interface ChangeStatusModalProps {
  tenantSlug: string;
  member: MemberDto | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged: (member: MemberDto) => void;
}

export function ChangeStatusModal({
  tenantSlug,
  member,
  isOpen,
  onClose,
  onStatusChanged,
}: ChangeStatusModalProps) {
  const [newStatus, setNewStatus] = useState<MembershipStatus>(
    member?.status || 'ACTIVE'
  );
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory reason is required for membership status changes.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/v1/mess/${tenantSlug}/members/${member.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            reason: reason.trim(),
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update status');
      }

      onStatusChanged(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = member.roleSlug === 'owner';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Change Membership Status
              </h3>
              <p className="text-xs text-slate-500">{member.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isOwner && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Owner Protection Safeguard:</span>
              <p>
                This member holds the Owner role. Deactivating or archiving is
                prohibited if this is the only active Owner of this mess.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Target Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as MembershipStatus)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 bg-white"
            >
              <option value="ACTIVE">ACTIVE (Active Resident)</option>
              <option value="PENDING">PENDING (Awaiting Activation)</option>
              <option value="SUSPENDED">SUSPENDED (Temporarily Blocked)</option>
              <option value="LEFT">LEFT (Archived / Departed)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Mandatory Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain why this status is being updated (will be recorded in the audit trail)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Confirm Status Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
