'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  Search,
  Plus,
  Filter,
  Users,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Building,
} from 'lucide-react';
import { AddRoomModal } from './AddRoomModal';
import { AssignBedModal } from './AssignBedModal';

interface RoomDirectoryViewProps {
  tenantSlug: string;
  initialData?: any;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function RoomDirectoryView({ tenantSlug, initialData }: RoomDirectoryViewProps) {
  const [rooms, setRooms] = useState<any[]>(initialData?.rooms || []);
  const [summary, setSummary] = useState(
    initialData?.summary || {
      totalRooms: 0,
      totalCapacity: 0,
      totalOccupied: 0,
      totalVacant: 0,
      underMaintenance: 0,
    }
  );
  const [pagination, setPagination] = useState<PaginationState>(
    initialData?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    }
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [assignRoomTarget, setAssignRoomTarget] = useState<any | null>(null);

  const isInitialMount = React.useRef(true);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (floorFilter.trim()) params.set('floor', floorFilter.trim());
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));

      const res = await fetch(`/api/v1/mess/${tenantSlug}/rooms?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to load rooms');
      }

      setRooms(json.data.rooms || []);
      if (json.data.summary) setSummary(json.data.summary);
      if (json.data.pagination) setPagination(json.data.pagination);
    } catch (err: any) {
      setError(err.message || 'Error fetching rooms');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, search, statusFilter, floorFilter, pagination]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchRooms();
  }, [fetchRooms]);

  const handleRoomAdded = (newRoom: any) => {
    if (newRoom) {
      setRooms((prev = []) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some((r) => r.id === newRoom.id)) return list;
        return [newRoom, ...list];
      });
    }
    fetchRooms();
  };

  const handleBedAssigned = (_assignment: any) => {
    fetchRooms();
  };

  const getStatusBadge = (status: string, vacantBeds: number) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            {vacantBeds > 0 ? `${vacantBeds} Vacant` : 'Available'}
          </span>
        );
      case 'OCCUPIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Users className="w-3 h-3" />
            Full
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <Wrench className="w-3 h-3" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Room Inventory & Bed Allocation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage rooms, track bed occupancy, and assign long-term mess residents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/mess/${tenantSlug}/rental`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition"
          >
            <span>Rental Management</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setIsAddRoomOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Rooms</span>
            <BedDouble className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {summary.totalRooms}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Across all units</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Capacity</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {summary.totalCapacity}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Configured bed slots</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Occupied Beds</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {summary.totalOccupied}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">
            {summary.totalCapacity > 0
              ? `${Math.round((summary.totalOccupied / summary.totalCapacity) * 100)}% Occupancy`
              : '0%'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Vacant Beds</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {summary.totalVacant}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ready for assignment</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Maintenance</span>
            <Wrench className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-2">
            {summary.underMaintenance}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Rooms blocked</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by room number, name, floor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {st === 'ALL'
                  ? 'All Rooms'
                  : st === 'AVAILABLE'
                  ? 'Available'
                  : st === 'OCCUPIED'
                  ? 'Occupied'
                  : 'Maintenance'}
              </button>
            ))}

            <button
              onClick={() => fetchRooms()}
              title="Refresh"
              className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Room Directory Content */}
      {loading ? (
        <div className="p-12 text-center rounded-xl border border-border bg-card">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Loading room inventory...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => fetchRooms()}
            className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-background text-foreground border border-border hover:bg-muted transition"
          >
            Retry
          </button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-border bg-card">
          <BedDouble className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
          <h3 className="text-base font-semibold text-foreground">No Rooms Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            {search || statusFilter !== 'ALL'
              ? 'No rooms match your search query or status filter. Try clearing filters.'
              : 'Start by creating your first room in this mess to allocate beds and manage residents.'}
          </p>
          {search || statusFilter !== 'ALL' ? (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="mt-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => setIsAddRoomOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Room</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const occRatio = room.capacity > 0 ? (room.occupancy / room.capacity) * 100 : 0;
            return (
              <div
                key={room.id}
                className="flex flex-col justify-between p-5 rounded-xl border border-border bg-card shadow-xs hover:border-foreground/20 transition group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground group-hover:text-primary transition">
                          Room {room.roomNumber}
                        </span>
                        {getStatusBadge(room.status, room.vacantBeds)}
                      </div>
                      {room.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {room.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">
                        ৳{room.defaultRent}
                      </div>
                      <span className="text-[10px] text-muted-foreground">/bed /mo</span>
                    </div>
                  </div>

                  {/* Location Info */}
                  {(room.floor || room.building) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {[room.building, room.floor].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                  )}

                  {/* Occupancy Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Occupancy:</span>
                      <span className="font-medium text-foreground">
                        {room.occupancy} of {room.capacity} Beds Occupied
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          occRatio >= 100
                            ? 'bg-amber-500'
                            : occRatio > 0
                            ? 'bg-primary'
                            : 'bg-muted-foreground/30'
                        }`}
                        style={{ width: `${Math.min(100, occRatio)}%` }}
                      />
                    </div>
                  </div>

                  {/* Facilities Chips */}
                  {room.facilities && room.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {room.facilities.slice(0, 3).map((f: string) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 rounded text-[11px] bg-muted text-muted-foreground"
                        >
                          {f}
                        </span>
                      ))}
                      {room.facilities.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted/60 text-muted-foreground">
                          +{room.facilities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                  {room.vacantBeds > 0 && room.status !== 'MAINTENANCE' ? (
                    <button
                      onClick={() => setAssignRoomTarget(room)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign Bed</span>
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      {room.status === 'MAINTENANCE' ? 'Under Maintenance' : 'Fully Occupied'}
                    </span>
                  )}

                  <Link
                    href={`/mess/${tenantSlug}/rooms/${room.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition ml-auto"
                  >
                    <span>Room Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} rooms
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddRoomModal
        tenantSlug={tenantSlug}
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        onRoomAdded={handleRoomAdded}
      />

      {assignRoomTarget && (
        <AssignBedModal
          tenantSlug={tenantSlug}
          roomId={assignRoomTarget.id}
          roomNumber={assignRoomTarget.roomNumber}
          defaultRent={assignRoomTarget.defaultRent}
          beds={[]}
          isOpen={Boolean(assignRoomTarget)}
          onClose={() => setAssignRoomTarget(null)}
          onAssigned={handleBedAssigned}
        />
      )}
    </div>
  );
}
