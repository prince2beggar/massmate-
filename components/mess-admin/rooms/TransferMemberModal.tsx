'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  Calendar,
  DollarSign,
  BedDouble,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface TransferMemberModalProps {
  tenantSlug: string;
  currentRoomId: string;
  currentRoomNumber: string;
  assignment: any; // { id, memberName, bedId, bedNumber, monthlyRent }
  isOpen: boolean;
  onClose: () => void;
  onTransferred: (result: any) => void;
}

export function TransferMemberModal({
  tenantSlug,
  currentRoomId,
  currentRoomNumber,
  assignment,
  isOpen,
  onClose,
  onTransferred,
}: TransferMemberModalProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newRent, setNewRent] = useState(String(assignment?.monthlyRent || 0));
  const [notes, setNotes] = useState('');

  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    fetch(`/api/v1/mess/${tenantSlug}/rooms?limit=100`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success && json.data?.rooms) {
          // Exclude current room if no other beds or allow other beds
          const otherRooms = json.data.rooms.filter(
            (r: any) => r.id !== currentRoomId || r.vacantBeds > 0
          );
          setRooms(otherRooms);
          if (otherRooms.length > 0) {
            const target = otherRooms.find((r: any) => r.id !== currentRoomId) || otherRooms[0];
            setSelectedRoomId((curr) => curr || target.id);
            setNewRent((curr) => curr !== '0' ? curr : String(target.defaultRent || assignment?.monthlyRent || 0));
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingRooms(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, tenantSlug, currentRoomId, assignment?.monthlyRent]);

  // When selectedRoomId changes, fetch beds for that room
  useEffect(() => {
    if (selectedRoomId) {
      fetch(`/api/v1/mess/${tenantSlug}/rooms/${selectedRoomId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.beds) {
            const vacantBeds = json.data.beds.filter((b: any) => b.status === 'AVAILABLE');
            setAvailableBeds(vacantBeds);
            if (vacantBeds.length > 0) {
              setSelectedBedId(vacantBeds[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [selectedRoomId, tenantSlug]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      setError('Please select a destination room.');
      return;
    }
    const rent = parseFloat(newRent);
    if (isNaN(rent) || rent < 0) {
      setError('New monthly rent must be a non-negative amount.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/v1/mess/${tenantSlug}/rooms/${currentRoomId}/assignments/${assignment.id}/transfer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newRoomId: selectedRoomId,
            newBedId: selectedBedId || undefined,
            transferDate,
            newMonthlyRent: rent,
            notes: notes.trim() || undefined,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to transfer resident.');
      }

      onTransferred(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process resident transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Transfer Resident
              </h2>
              <p className="text-xs text-muted-foreground">
                Move {assignment?.memberName} from Room {currentRoomNumber} to another room
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
            <div className="font-medium text-foreground">Current Allocation:</div>
            <div className="text-muted-foreground">
              Room {currentRoomNumber} &bull; Current Bed: {assignment?.bedNumber || 'Seat'} &bull; Current Rent: ৳{assignment?.monthlyRent}/mo
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Destination Room <span className="text-destructive">*</span>
            </label>
            {loadingRooms ? (
              <div className="p-2 text-xs text-muted-foreground">Loading rooms...</div>
            ) : rooms.length === 0 ? (
              <div className="p-3 text-xs rounded-lg border border-border bg-destructive/10 text-destructive">
                No rooms with vacancies available for transfer.
              </div>
            ) : (
              <select
                required
                value={selectedRoomId}
                onChange={(e) => {
                  setSelectedRoomId(e.target.value);
                  const rm = rooms.find((r) => r.id === e.target.value);
                  if (rm) setNewRent(String(rm.defaultRent));
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({r.name || 'Standard'}) &bull; {r.vacantBeds} bed(s) vacant &bull; Default ৳{r.defaultRent}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Destination Bed Slot
              </label>
              <div className="relative">
                <BedDouble className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {availableBeds.length === 0 ? (
                    <option value="">Any Available Bed</option>
                  ) : (
                    availableBeds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Effective Transfer Date <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  required
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              New Agreed Monthly Rent (৳) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                min="0"
                step="50"
                required
                value={newRent}
                onChange={(e) => setNewRent(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Transfer Notes & Reason
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="e.g. Swapped to single bed, moved for study group"
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
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted text-foreground transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rooms.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{submitting ? 'Transferring...' : 'Execute Transfer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
