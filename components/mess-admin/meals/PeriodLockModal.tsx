'use client';

import React, { useState } from 'react';
import { X, Lock, Unlock, AlertCircle, RefreshCw } from 'lucide-react';

interface PeriodLockModalProps {
  tenantSlug: string;
  monthString: string;
  isCurrentlyLocked: boolean;
  finalMealRateTaka: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PeriodLockModal({
  tenantSlug,
  monthString,
  isCurrentlyLocked,
  finalMealRateTaka,
  isOpen,
  onClose,
  onSuccess,
}: PeriodLockModalProps) {
  const [noteOrReason, setNoteOrReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentlyLocked && !noteOrReason.trim()) {
      setError('A mandatory reason is required to unlock a closed billing period.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const action = isCurrentlyLocked ? 'unlock' : 'lock';
      const body = isCurrentlyLocked
        ? { action, month: monthString, reason: noteOrReason.trim() }
        : { action, month: monthString, notes: noteOrReason.trim() || undefined };

      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to ${action} period`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {isCurrentlyLocked ? (
              <Unlock className="w-5 h-5 text-amber-500" />
            ) : (
              <Lock className="w-5 h-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold text-foreground">
              {isCurrentlyLocked ? 'Unlock Billing Period' : 'Lock & Finalize Month'}
            </h2>
          </div>
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

          <div className="p-3.5 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Billing Month:</span>
              <span className="text-foreground font-bold">{monthString}</span>
            </div>
            {!isCurrentlyLocked && (
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Calculated Meal Rate:</span>
                <span className="text-foreground font-bold">৳{finalMealRateTaka.toFixed(2)} / meal</span>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground pt-1">
              {isCurrentlyLocked
                ? 'Unlocking this month allows authorized staff to modify meal entries and recalculate rates. Any changes will be recorded in the audit log.'
                : 'Locking freezes the meal rate calculation, preventing further modifications to member meal counts and meal-offs for this month.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              {isCurrentlyLocked ? (
                <>
                  Reason for Unlocking <span className="text-destructive">*</span>
                </>
              ) : (
                'Closing Notes (Optional)'
              )}
            </label>
            <textarea
              required={isCurrentlyLocked}
              rows={3}
              placeholder={
                isCurrentlyLocked
                  ? 'Mandatory reason for unlocking...'
                  : 'Optional notes for month-end reconciliation...'
              }
              value={noteOrReason}
              onChange={(e) => setNoteOrReason(e.target.value)}
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
                isCurrentlyLocked
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isCurrentlyLocked ? 'Confirm Unlock' : 'Lock Period'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
