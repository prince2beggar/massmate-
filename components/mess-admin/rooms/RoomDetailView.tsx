'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  ArrowLeft,
  Edit,
  UserPlus,
  ArrowRightLeft,
  LogOut,
  Building,
  Layers,
  Calendar,
  CheckCircle2,
  Users,
  Wrench,
  Clock,
  DollarSign,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { EditRoomModal } from './EditRoomModal';
import { AssignBedModal } from './AssignBedModal';
import { TransferMemberModal } from './TransferMemberModal';
import { MoveOutModal } from './MoveOutModal';

interface RoomDetailViewProps {
  tenantSlug: string;
  roomId: string;
  initialRoom?: any;
}

export function RoomDetailView({ tenantSlug, roomId, initialRoom }: RoomDetailViewProps) {
  const [room, setRoom] = useState<any | null>(initialRoom || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'beds' | 'history' | 'rental'>('beds');

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<any | null>(null);
  const [moveOutTarget, setMoveOutTarget] = useState<any | null>(null);

  const isInitialMount = React.useRef(true);

  const fetchRoom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/rooms/${roomId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to load room details');
      }
      setRoom(json.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching room');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, roomId]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchRoom();
  }, [fetchRoom]);

  if (loading) {
    return (
      <div className="p-12 text-center rounded-xl border border-border bg-card">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">Loading room details...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="p-8 text-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <h3 className="text-base font-semibold">Error Loading Room</h3>
        <p className="text-sm mt-1">{error || 'Room record not found.'}</p>
        <Link
          href={`/mess/${tenantSlug}/rooms`}
          className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-background text-foreground border border-border hover:bg-muted transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Room Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/mess/${tenantSlug}/rooms`}
            className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Room {room.roomNumber}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  room.status === 'AVAILABLE'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : room.status === 'OCCUPIED'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                }`}
              >
                {room.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {[room.name, room.floor, room.building].filter(Boolean).join(' • ') || 'Standard Resident Room'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {room.vacantBeds > 0 && room.status !== 'MAINTENANCE' && (
            <button
              onClick={() => setIsAssignOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign Resident</span>
            </button>
          )}
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Room</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Total Capacity</span>
          <div className="text-xl font-bold text-foreground mt-1">
            {room.capacity} Beds
          </div>
          <span className="text-[11px] text-muted-foreground">Configured slots</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Current Occupancy</span>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {room.occupancy} Active
          </div>
          <span className="text-[11px] text-muted-foreground">
            {room.vacantBeds} bed(s) vacant
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Default Monthly Rent</span>
          <div className="text-xl font-bold text-foreground mt-1">
            ৳{room.defaultRent}
          </div>
          <span className="text-[11px] text-muted-foreground">Per resident seat</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Facilities</span>
          <div className="text-xl font-bold text-foreground mt-1">
            {room.facilities?.length || 0}
          </div>
          <span className="text-[11px] text-muted-foreground">Attached amenities</span>
        </div>
      </div>

      {/* Facilities and Notes Box */}
      {room.facilities && room.facilities.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Amenities & Facilities
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {room.facilities.map((fac: string) => (
              <span
                key={fac}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-muted text-muted-foreground border border-border"
              >
                <Tag className="w-3 h-3 text-primary" />
                {fac}
              </span>
            ))}
          </div>
          {room.internalNotes && (
            <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Staff Notes:</span> {room.internalNotes}
            </div>
          )}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('beds')}
            className={`pb-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'beds'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Beds & Active Residents ({room.beds?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Assignment History ({room.assignmentHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('rental')}
            className={`pb-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'rental'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Short-term Rental Listings ({room.rentalListings?.length || 0})
          </button>
        </div>
      </div>

      {/* Tab 1: Beds & Occupants */}
      {activeTab === 'beds' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room.beds?.map((bed: any) => {
              const occupant = bed.currentOccupant;
              return (
                <div
                  key={bed.id}
                  className={`p-5 rounded-xl border transition ${
                    occupant
                      ? 'border-border bg-card'
                      : 'border-dashed border-border bg-muted/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-lg ${
                          occupant
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}
                      >
                        <BedDouble className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {bed.bedNumber}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {occupant ? 'Currently Occupied' : 'Vacant Slot'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        occupant
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-emerald-500/10 text-emerald-600'
                      }`}
                    >
                      {occupant ? 'Occupied' : 'Available'}
                    </span>
                  </div>

                  {occupant ? (
                    <div className="mt-4 pt-3 border-t border-border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Resident Name:</span>
                        <Link
                          href={`/mess/${tenantSlug}/members/${occupant.membershipId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {occupant.name}
                        </Link>
                      </div>
                      {occupant.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Contact Phone:</span>
                          <span className="text-foreground">{occupant.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Move-in Date:</span>
                        <span className="text-foreground">
                          {new Date(occupant.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Agreed Monthly Rent:</span>
                        <span className="font-semibold text-foreground">
                          ৳{occupant.monthlyRent}
                        </span>
                      </div>

                      {/* Action buttons on occupied bed */}
                      <div className="pt-3 mt-2 border-t border-border flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            setTransferTarget({
                              id: occupant.assignmentId,
                              memberName: occupant.name,
                              bedNumber: bed.bedNumber,
                              monthlyRent: occupant.monthlyRent,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Transfer</span>
                        </button>
                        <button
                          onClick={() =>
                            setMoveOutTarget({
                              id: occupant.assignmentId,
                              memberName: occupant.name,
                              bedNumber: bed.bedNumber,
                              startDate: occupant.startDate,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Move Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Rent: ৳{bed.rentAmount || room.defaultRent}/mo
                      </span>
                      <button
                        onClick={() => setIsAssignOpen(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Assign Slot</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Assignment History */}
      {activeTab === 'history' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Historical Room Occupancy Log
            </h3>
            <p className="text-xs text-muted-foreground">
              Traceable records of all past and current resident assignments
            </p>
          </div>
          {room.assignmentHistory?.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No historical assignments recorded for this room yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Resident</th>
                    <th className="px-4 py-3 font-medium">Start Date</th>
                    <th className="px-4 py-3 font-medium">End Date</th>
                    <th className="px-4 py-3 font-medium">Monthly Rent</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {room.assignmentHistory.map((hist: any) => (
                    <tr key={hist.id} className="hover:bg-muted/20 transition">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{hist.memberName}</span>
                        {hist.memberPhone && (
                          <div className="text-[11px] text-muted-foreground">{hist.memberPhone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(hist.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {hist.endDate ? new Date(hist.endDate).toLocaleDateString() : 'Current (Active)'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        ৳{hist.monthlyRent}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            hist.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : hist.status === 'TRANSFERRED'
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {hist.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {hist.moveOutReason || hist.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Rental Listings */}
      {activeTab === 'rental' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Short-Term Rental Offers for Room {room.roomNumber}
              </h3>
              <p className="text-xs text-muted-foreground">
                Spaces published for guest accommodation and prospective boarders
              </p>
            </div>
            <Link
              href={`/mess/${tenantSlug}/rental`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
            >
              <span>Manage All Listings</span>
            </Link>
          </div>

          {room.rentalListings?.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-lg text-sm text-muted-foreground">
              No short-term rental listings created for this room.
            </div>
          ) : (
            <div className="space-y-3">
              {room.rentalListings.map((l: any) => (
                <div
                  key={l.id}
                  className="p-3.5 rounded-lg border border-border flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{l.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      Status: {l.status} &bull; Daily: ৳{l.dailyRate || 'N/A'} &bull; Monthly: ৳{l.monthlyRate || 'N/A'}
                    </span>
                  </div>
                  <Link
                    href={`/mess/${tenantSlug}/rental`}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    View in Rental
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <EditRoomModal
        tenantSlug={tenantSlug}
        room={room}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onRoomUpdated={(updated) => {
          setRoom(updated);
          fetchRoom();
        }}
      />

      <AssignBedModal
        tenantSlug={tenantSlug}
        roomId={room.id}
        roomNumber={room.roomNumber}
        defaultRent={room.defaultRent}
        beds={room.beds || []}
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onAssigned={() => fetchRoom()}
      />

      {transferTarget && (
        <TransferMemberModal
          tenantSlug={tenantSlug}
          currentRoomId={room.id}
          currentRoomNumber={room.roomNumber}
          assignment={transferTarget}
          isOpen={Boolean(transferTarget)}
          onClose={() => setTransferTarget(null)}
          onTransferred={() => fetchRoom()}
        />
      )}

      {moveOutTarget && (
        <MoveOutModal
          tenantSlug={tenantSlug}
          currentRoomId={room.id}
          currentRoomNumber={room.roomNumber}
          assignment={moveOutTarget}
          isOpen={Boolean(moveOutTarget)}
          onClose={() => setMoveOutTarget(null)}
          onMovedOut={() => fetchRoom()}
        />
      )}
    </div>
  );
}
