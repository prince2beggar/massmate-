'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ReviewMealOffModalProps {
  tenantSlug: string;
  request: any;
  isOpen: boolean;
  onClose: () => void;
  onReviewed: () => void;
}

export function ReviewMealOffModal({
  tenantSlug,
  request,
  isOpen,
  onClose,
  onReviewed,
}: ReviewMealOffModalProps) {
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === 'REJECTED' && !reviewNote.trim()) {
      setError('A reason note is required when rejecting a meal-off request.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/v1/mess/${tenantSlug}/meals/off-requests/${request.id}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            reviewNote: reviewNote.trim() || undefined,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to review request');
      }

      onReviewed();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Review Meal-Off Request</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Request Info Box */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Resident:</span>
              <span className="text-foreground font-semibold">{request.memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Dates:</span>
              <span className="text-foreground font-semibold">
                {request.startDate} &rarr; {request.endDate}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Meals:</span>
              <span className="text-foreground">
                {request.mealTypes?.join(', ') || 'All Meals'}
              </span>
            </div>
            <div className="pt-1 text-muted-foreground">
              <span className="font-medium text-foreground">Reason: </span>
              {request.reason}
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Review Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition ${
                  decision === 'APPROVED'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-semibold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Approve Request</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition ${
                  decision === 'REJECTED'
                    ? 'border-destructive bg-destructive/10 text-destructive font-semibold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <XCircle className="w-4 h-4 text-destructive" />
                <span>Reject Request</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Review Remarks {decision === 'REJECTED' && <span className="text-destructive">*</span>}
            </label>
            <textarea
              required={decision === 'REJECTED'}
              rows={3}
              placeholder={
                decision === 'REJECTED'
                  ? 'Mandatory reason for rejection...'
                  : 'Optional note to resident...'
              }
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg text-white transition shadow-sm ${
                decision === 'APPROVED'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-destructive hover:bg-destructive/90'
              }`}
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm {decision === 'APPROVED' ? 'Approval' : 'Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
