'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface ReviewBookingModalProps {
  tenantSlug: string;
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onReviewed: (result: any) => void;
}

export function ReviewBookingModal({
  tenantSlug,
  booking,
  isOpen,
  onClose,
  onReviewed,
}: ReviewBookingModalProps) {
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setError('A mandatory reason must be provided when rejecting a booking request.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/v1/mess/${tenantSlug}/rental/bookings/${booking.id}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            reason: decision === 'REJECT' ? rejectionReason.trim() : undefined,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit booking review.');
      }

      onReviewed(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to review booking request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Review Guest Booking Request
            </h2>
            <p className="text-xs text-muted-foreground">
              Approve or reject reservation request
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Guest Details Summary */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Guest Name:</span>
              <span className="font-semibold text-foreground">{booking.guestName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span className="text-foreground">{booking.guestPhone}</span>
            </div>
            {booking.guestEmail && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-foreground">{booking.guestEmail}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Check-in:</span>
              <span className="text-foreground">
                {new Date(booking.checkInDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Check-out:</span>
              <span className="text-foreground">
                {new Date(booking.checkOutDate).toLocaleDateString()} ({booking.durationDays} days)
              </span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span className="text-muted-foreground">Total Charge:</span>
              <span className="text-emerald-600 font-bold">৳{booking.totalAmount}</span>
            </div>
            {booking.message && (
              <div className="pt-2 border-t border-border text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Message:</span> &ldquo;{booking.message}&rdquo;
              </div>
            )}
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVE')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
                  decision === 'APPROVE'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-semibold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
                  decision === 'REJECT'
                    ? 'border-destructive bg-destructive/10 text-destructive font-semibold'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {decision === 'REJECT' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Reason for Rejection <span className="text-destructive">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Explain why this request is declined (e.g. space reserved, maintenance)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted text-foreground transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition disabled:opacity-50 ${
                decision === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-destructive hover:bg-destructive/90'
              }`}
            >
              <span>{loading ? 'Processing...' : `Confirm ${decision === 'APPROVE' ? 'Approval' : 'Rejection'}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
