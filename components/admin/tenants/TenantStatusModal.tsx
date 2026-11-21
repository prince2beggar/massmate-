'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import type { TenantStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface TenantStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  currentStatus: TenantStatus;
  onStatusChanged: (newStatus: TenantStatus) => void;
}

export function TenantStatusModal({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  currentStatus,
  onStatusChanged,
}: TenantStatusModalProps) {
  const [targetStatus, setTargetStatus] = useState<TenantStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSuspension = targetStatus === 'SUSPENDED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Please provide a descriptive reason (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/super-admin/tenants/${tenantId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
        body: JSON.stringify({
          status: targetStatus,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update tenant status.');
      }

      onStatusChanged(targetStatus);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update tenant status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between border-b px-6 py-4',
            isSuspension ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-slate-50 border-slate-100 text-slate-900'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border',
                isSuspension ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
              )}
            >
              {isSuspension ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold">
                {isSuspension ? 'Suspend Tenant Account' : 'Change Tenant Status'}
              </h2>
              <p className="text-[11px] text-slate-500">Target: {tenantName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* New Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select New Operational Status *
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as TenantStatus)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ACTIVE">ACTIVE — Normal live operations</option>
              <option value="PENDING">PENDING — Under platform review</option>
              <option value="SUSPENDED">SUSPENDED — Block member & admin access</option>
              <option value="INACTIVE">INACTIVE — Archived / decommissioned</option>
            </select>
          </div>

          {isSuspension && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-[11px] text-rose-800 leading-relaxed">
              <span className="font-bold">Security Notice:</span> Suspending a mess immediately prevents
              its managers and residents from accessing tenant routes and APIs, returning an HTTP 403
              TenantSuspended response.
            </div>
          )}

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandatory Governance Reason *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the audit rationale for this status alteration (e.g. Terms violation, requested pause, pending ID review)..."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Recorded in the immutable platform audit ledger with your administrator identity.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50',
                isSuspension ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Confirm Status Change</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
