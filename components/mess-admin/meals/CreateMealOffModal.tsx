'use client';

import React, { useState } from 'react';
import { X, CalendarOff, AlertCircle, RefreshCw } from 'lucide-react';

interface CreateMealOffModalProps {
  tenantSlug: string;
  members: Array<{ id: string; name: string; memberCode?: string | null }>;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateMealOffModal({
  tenantSlug,
  members,
  isOpen,
  onClose,
  onCreated,
}: CreateMealOffModalProps) {
  const [membershipId, setMembershipId] = useState(members[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mealTypes, setMealTypes] = useState<string[]>([
    'BREAKFAST',
    'LUNCH',
    'DINNER',
  ]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleMealType = (type: string) => {
    if (mealTypes.includes(type)) {
      if (mealTypes.length === 1) return; // Keep at least one
      setMealTypes(mealTypes.filter((t) => t !== type));
    } else {
      setMealTypes([...mealTypes, type]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membershipId) {
      setError('Please select a resident member.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start date and end date are required.');
      return;
    }
    if (startDate > endDate) {
      setError('Start date cannot be after end date.');
      return;
    }
    if (!reason.trim()) {
      setError('Please specify a reason for the meal-off request.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/off-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId,
          startDate,
          endDate,
          mealTypes,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit meal-off request');
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">Request Meal-Off</h2>
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
              Resident Member <span className="text-destructive">*</span>
            </label>
            <select
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
            >
              <option value="">Select resident member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.memberCode ? `(${m.memberCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Start Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate || endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                End Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Applicable Meals
            </label>
            <div className="flex items-center gap-2">
              {['BREAKFAST', 'LUNCH', 'DINNER'].map((type) => {
                const active = mealTypes.includes(type);
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => toggleMealType(type)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Reason for Absence <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Visiting hometown, exams, or family event..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
