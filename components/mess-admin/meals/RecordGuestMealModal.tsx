'use client';

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';

interface RecordGuestMealModalProps {
  tenantSlug: string;
  members: Array<{ id: string; name: string; memberCode?: string | null }>;
  defaultRatePoisha: string;
  defaultDate: string;
  isOpen: boolean;
  onClose: () => void;
  onRecorded: () => void;
}

export function RecordGuestMealModal({
  tenantSlug,
  members,
  defaultRatePoisha,
  defaultDate,
  isOpen,
  onClose,
  onRecorded,
}: RecordGuestMealModalProps) {
  const [hostMembershipId, setHostMembershipId] = useState(members[0]?.id || '');
  const [guestName, setGuestName] = useState('');
  const [dateString, setDateString] = useState(defaultDate);
  const [mealType, setMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER'>('LUNCH');
  const [count, setCount] = useState(1);
  const [rateTaka, setRateTaka] = useState(
    (Number(defaultRatePoisha || 8000) / 100).toFixed(2)
  );
  const [isPaid, setIsPaid] = useState(false);
  const [paymentNote, setPaymentNote] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostMembershipId) {
      setError('Please select a host resident.');
      return;
    }
    if (!guestName.trim()) {
      setError('Guest name or reference is required.');
      return;
    }
    if (count < 1) {
      setError('Guest meal count must be at least 1.');
      return;
    }

    const unitPoisha = Math.round(parseFloat(rateTaka || '0') * 100);
    if (isNaN(unitPoisha) || unitPoisha < 0) {
      setError('Unit rate must be a valid non-negative number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostMembershipId,
          guestName: guestName.trim(),
          dateString,
          mealType,
          count,
          unitRatePoisha: unitPoisha,
          isPaid,
          paymentNote: paymentNote.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to record guest meal');
      }

      onRecorded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error recording guest meal');
    } finally {
      setLoading(false);
    }
  };

  const totalTaka = (count * parseFloat(rateTaka || '0')).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Record Guest Meal</h2>
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

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Host Resident <span className="text-destructive">*</span>
            </label>
            <select
              value={hostMembershipId}
              onChange={(e) => setHostMembershipId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
            >
              <option value="">Select host member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.memberCode ? `(${m.memberCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Guest Name / Reference <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Friend Tanvir or Uncle"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                required
                value={dateString}
                onChange={(e) => setDateString(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Meal Type <span className="text-destructive">*</span>
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Count of Meals <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value || '1', 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Rate per Meal (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rateTaka}
                onChange={(e) => setRateTaka(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Total Charge:</span>
            <span className="text-sm font-bold text-foreground">৳{totalTaka}</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span className="text-xs font-medium text-foreground">
                Mark as Paid by Guest Immediately
              </span>
            </label>
            {isPaid && (
              <input
                type="text"
                placeholder="Payment note (e.g. Paid cash to manager)"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Additional remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Record Meal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
