'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Home,
  DollarSign,
  Tag,
  AlertCircle,
  Eye,
  Phone,
  Check,
} from 'lucide-react';

interface CreateListingModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: (listing: any) => void;
}

const COMMON_FACILITIES = [
  'Attached Bathroom',
  'Private Balcony',
  'Air Conditioning',
  'High-Speed WiFi',
  'Daily Room Cleaning',
  'Drinking Water Filter',
  'Mess Meals Included',
  'Study Desk & Chair',
];

export function CreateListingModal({
  tenantSlug,
  isOpen,
  onClose,
  onListingCreated,
}: CreateListingModalProps) {
  const [title, setTitle] = useState('');
  const [roomId, setRoomId] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    'High-Speed WiFi',
  ]);
  const [capacity, setCapacity] = useState('1');
  const [dailyRate, setDailyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('3500');
  const [houseRules, setHouseRules] = useState(
    'No smoking indoors. Visitors allowed until 10:00 PM.'
  );
  const [isPublic, setIsPublic] = useState(true);
  const [contactMethod, setContactMethod] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/v1/mess/${tenantSlug}/rooms?limit=100`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.rooms) {
            setRooms(json.data.rooms);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, tenantSlug]);

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
    if (!title.trim()) {
      setError('Listing title is required');
      return;
    }
    const dRate = dailyRate.trim() ? parseFloat(dailyRate) : null;
    const mRate = monthlyRate.trim() ? parseFloat(monthlyRate) : null;

    if (dRate === null && mRate === null) {
      setError('Please specify either a daily rate or a monthly rate.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/rental/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          roomId: roomId || undefined,
          description: description.trim() || undefined,
          facilities: selectedFacilities,
          capacity: parseInt(capacity, 10) || 1,
          houseRules: houseRules.trim() || undefined,
          dailyRate: dRate,
          monthlyRate: mRate,
          isPublic,
          contactMethod: contactMethod.trim() || undefined,
          status,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create rental listing.');
      }

      onListingCreated(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create listing.');
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
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Create Rental Listing
              </h2>
              <p className="text-xs text-muted-foreground">
                Offer vacant beds or rooms for short-term guests and boarders
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

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Listing Headline / Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Furnished AC Single Bed near Dhanmondi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Link to Room (Optional)
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">No specific room linked</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({r.name || 'Standard'} &bull; {r.vacantBeds} vacant)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Guest Capacity (Persons)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Daily Rate (৳ / day)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  placeholder="Optional daily guest rate"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Monthly Rate (৳ / month)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 3500"
                  value={monthlyRate}
                  onChange={(e) => setMonthlyRate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Included Amenities & Perks
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

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Description & Highlights
            </label>
            <textarea
              rows={2}
              placeholder="Provide directions, cleanliness details, or building amenities"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                House Rules
              </label>
              <input
                type="text"
                placeholder="Gate closing hours, guests policy"
                value={houseRules}
                onChange={(e) => setHouseRules(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Public Contact Method
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. Call / WhatsApp 017..."
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary/20"
              />
              <label htmlFor="isPublic" className="text-xs font-medium text-foreground cursor-pointer">
                Publish on public mess portal
              </label>
            </div>

            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              >
                <option value="PUBLISHED">Published (Active)</option>
                <option value="DRAFT">Save as Draft</option>
              </select>
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Listing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
