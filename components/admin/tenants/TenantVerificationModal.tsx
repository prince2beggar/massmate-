'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { VerificationStatus, VerificationDocumentType } from '@/types/database';
import { cn } from '@/lib/utils';

interface TenantVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  currentStatus: VerificationStatus;
  documentType?: VerificationDocumentType | null;
  documentNumberMasked?: string | null;
  onReviewed: (newStatus: VerificationStatus) => void;
}

export function TenantVerificationModal({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  currentStatus,
  documentType,
  documentNumberMasked,
  onReviewed,
}: TenantVerificationModalProps) {
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUIRED'>('APPROVED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === 'REJECTED' && notes.trim().length < 5) {
      setError('Please provide a mandatory reason for rejection.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/super-admin/tenants/${tenantId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
        body: JSON.stringify({
          decision,
          notes: notes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update verification status.');
      }

      onReviewed(decision);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit verification review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-indigo-50/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tenant Verification Review</h2>
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

          {/* Submission Details Card */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Current Status:</span>
              <span className="font-semibold text-slate-800">{currentStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Document Type:</span>
              <span className="font-mono text-slate-700">{documentType || 'Trade License / NID'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Document Number:</span>
              <span className="font-mono text-slate-700">{documentNumberMasked || '••••••••1234'}</span>
            </div>
            <div className="pt-1 text-[10px] text-slate-400">
              🔒 Privacy Protected: Raw document files are kept in private storage and accessible only via signed reviewer sessions.
            </div>
          </div>

          {/* Decision Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Verification Decision *
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border p-2.5 text-center text-xs font-semibold transition-all cursor-pointer',
                  decision === 'APPROVED'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                <CheckCircle2 className="h-4 w-4 mb-1 text-emerald-600" />
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('ADDITIONAL_INFO_REQUIRED')}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border p-2.5 text-center text-xs font-semibold transition-all cursor-pointer',
                  decision === 'ADDITIONAL_INFO_REQUIRED'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-400/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                <AlertCircle className="h-4 w-4 mb-1 text-amber-600" />
                <span>Need Info</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border p-2.5 text-center text-xs font-semibold transition-all cursor-pointer',
                  decision === 'REJECTED'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-400/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                <XCircle className="h-4 w-4 mb-1 text-rose-600" />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Notes / Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Review Notes / Decision Reason *
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Valid trade license confirmed with physical address verification..."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Recorded alongside your reviewer ID in the platform compliance log.
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Decision</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
