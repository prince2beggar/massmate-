'use client';

import React, { useState } from 'react';
import {
  X,
  Save,
  BedDouble,
  DollarSign,
  Building,
  Layers,
  AlertCircle,
  Check,
} from 'lucide-react';

interface EditRoomModalProps {
  tenantSlug: string;
  room: any;
  isOpen: boolean;
  onClose: () => void;
  onRoomUpdated: (updatedRoom: any) => void;
}

const COMMON_FACILITIES = [
  'Attached Bath',
  'Balcony',
  'Air Conditioning (AC)',
  'High-Speed WiFi',
  'Geyser / Hot Water',
  'Study Desk & Chair',
  'Wardrobe / Closet',
  'Daily Room Cleaning',
];

export function EditRoomModal({
  tenantSlug,
  room,
  isOpen,
  onClose,
  onRoomUpdated,
}: EditRoomModalProps) {
  const [roomNumber, setRoomNumber] = useState(room.roomNumber || '');
  const [name, setName] = useState(room.name || '');
  const [floor, setFloor] = useState(room.floor || '');
  const [building, setBuilding] = useState(room.building || '');
  const [capacity, setCapacity] = useState(String(room.capacity || 2));
  const [defaultRent, setDefaultRent] = useState(String(room.defaultRent || 0));
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    room.facilities || []
  );
  const [status, setStatus] = useState<string>(room.status || 'AVAILABLE');
  const [description, setDescription] = useState(room.description || '');
  const [internalNotes, setInternalNotes] = useState(room.internalNotes || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      setError('Room number is required');
      return;
    }
    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 1) {
      setError('Capacity must be at least 1 bed');
      return;
    }
    if (cap < (room.occupancy || 0)) {
      setError(
        `Cannot reduce capacity to ${cap} beds. Room currently has ${room.occupancy} active occupant(s). Transfer or move them out first.`
      );
      return;
    }
    const rent = parseFloat(defaultRent);
    if (isNaN(rent) || rent < 0) {
      setError('Default rent must be a non-negative amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: roomNumber.trim(),
          name: name.trim() || undefined,
          floor: floor.trim() || undefined,
          building: building.trim() || undefined,
          capacity: cap,
          defaultRent: rent,
          facilities: selectedFacilities,
          status,
          description: description.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update room');
      }

      onRoomUpdated(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Edit Room {room.roomNumber}</h2>
              <p className="text-xs text-muted-foreground">
                Update capacity, facilities, and rent configuration
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Room Number / Code <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Room Nickname / Label
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Floor / Level
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Building / Block
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Total Capacity (Beds) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={room.occupancy || 1}
                max="20"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Current active occupants: {room.occupancy || 0}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Default Monthly Seat Rent (৳) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={defaultRent}
                  onChange={(e) => setDefaultRent(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Room Facilities & Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COMMON_FACILITIES.map((fac) => {
                const isSelected = selectedFacilities.includes(fac);
                return (
                  <button
                    key={fac}
                    type="button"
                    onClick={() => toggleFacility(fac)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs text-left transition ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-card text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span className="truncate">{fac}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Room Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied (Full)</option>
                <option value="MAINTENANCE">Under Maintenance</option>
                <option value="INACTIVE">Inactive / Offline</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Room Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Internal Staff Notes
            </label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
