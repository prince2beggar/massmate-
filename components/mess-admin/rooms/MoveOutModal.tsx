'use client';

import React, { useState } from 'react';
import {
  X,
  LogOut,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface MoveOutModalProps {
  tenantSlug: string;
  currentRoomId: string;
  currentRoomNumber: string;
  assignment: any; // { id, memberName, bedNumber, startDate }
  isOpen: boolean;
  onClose: () => void;
  onMovedOut: (result: any) => void;
}

const COMMON_REASONS = [
  'Graduation / Finished Academic Term',
  'Job / Office Relocation',
  'Moving to Family Residence',
  'Found Private Apartment',
  'Financial / Budgetary Reasons',
  'Personal / Other Reasons',
];

export function MoveOutModal({
  tenantSlug,
  currentRoomId,
  currentRoomNumber,
  assignment,
  isOpen,
  onClose,
  onMovedOut,
}: MoveOutModalProps) {
  const [moveOutDate, setMoveOutDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason =
      selectedReason === 'Personal / Other Reasons' && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    if (!finalReason) {
      setError('A mandatory move-out reason must be recorded.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/v1/mess/${tenantSlug}/rooms/${currentRoomId}/assignments/${assignment.id}/move-out`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moveOutDate,
            moveOutReason: finalReason,
            notes: notes.trim() || undefined,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to record move-out.');
      }

      onMovedOut(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process move-out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-destructive/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/20 text-destructive">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Move Out Resident
              </h2>
              <p className="text-xs text-muted-foreground">
                Vacate {assignment?.memberName} from Room {currentRoomNumber} and release bed slot
              </p>
            </div>
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

          <div className="p-3 text-xs rounded-lg border border-border bg-muted/20 space-y-1">
            <div className="font-medium text-foreground">Resident Summary:</div>
            <div className="text-muted-foreground">
              {assignment?.memberName} &bull; Room {currentRoomNumber} &bull; Bed: {assignment?.bedNumber || 'Seat'} &bull; Since: {assignment?.startDate ? new Date(assignment.startDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Move-out Departure Date <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                required
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Mandatory Move-out Reason <span className="text-destructive">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {selectedReason === 'Personal / Other Reasons' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Specific Reason Details <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Explain reason for departure"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Handover & Clearance Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Keys returned, room inspected, deposit clearance"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{loading ? 'Recording...' : 'Confirm Move Out'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
