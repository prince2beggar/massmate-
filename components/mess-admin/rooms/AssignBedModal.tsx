'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Calendar,
  DollarSign,
  BedDouble,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface AssignBedModalProps {
  tenantSlug: string;
  roomId: string;
  roomNumber: string;
  defaultRent: number;
  beds: Array<{ id: string; bedNumber: string; status: string }>;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: (assignment: any) => void;
}

export function AssignBedModal({
  tenantSlug,
  roomId,
  roomNumber,
  defaultRent,
  beds,
  isOpen,
  onClose,
  onAssigned,
}: AssignBedModalProps) {
  const availBed = beds.find((b) => b.status === 'AVAILABLE');
  const [members, setMembers] = useState<Array<{ id: string; name: string; phone: string | null }>>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState(availBed?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyRent, setMonthlyRent] = useState(String(defaultRent || 0));
  const [notes, setNotes] = useState('');

  const [fetchingMembers, setFetchingMembers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    fetch(`/api/v1/mess/${tenantSlug}/members?status=ACTIVE&limit=100`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success && json.data?.members) {
          setMembers(json.data.members);
          if (json.data.members.length > 0) {
            setSelectedMemberId((curr) => curr || json.data.members[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFetchingMembers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, tenantSlug]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError('Please select an active resident to assign.');
      return;
    }
    const rent = parseFloat(monthlyRent);
    if (isNaN(rent) || rent < 0) {
      setError('Agreed rent must be a valid non-negative number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/rooms/${roomId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: selectedMemberId,
          bedId: selectedBedId || undefined,
          startDate,
          monthlyRent: rent,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to assign bed to member.');
      }

      onAssigned(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign member to bed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Assign Resident to Room {roomNumber}</h2>
              <p className="text-xs text-muted-foreground">
                Allocate bed slot, establish agreed monthly rent, and set start date
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

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Select Active Resident <span className="text-destructive">*</span>
            </label>
            {fetchingMembers ? (
              <div className="p-2 text-xs text-muted-foreground">Loading residents...</div>
            ) : members.length === 0 ? (
              <div className="p-3 text-xs rounded-lg border border-border bg-muted/20 text-muted-foreground">
                No available active residents found. Add a member in the Member Directory first.
              </div>
            ) : (
              <select
                required
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.phone || 'No phone'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Select Bed Slot
              </label>
              <div className="relative">
                <BedDouble className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {beds.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={b.status === 'OCCUPIED'}
                    >
                      {b.bedNumber} {b.status === 'OCCUPIED' ? '(Occupied)' : '(Vacant)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Move-in / Start Date <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Agreed Monthly Seat Rent (৳) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                min="0"
                step="50"
                required
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Standard room default is ৳{defaultRent}. Custom agreed rent overrides standard.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Assignment Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Optional notes (e.g. advance deposit, key handed over)"
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
              disabled={loading || members.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{loading ? 'Assigning...' : 'Confirm Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
