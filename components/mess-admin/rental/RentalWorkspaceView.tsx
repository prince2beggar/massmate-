'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Home,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  BedDouble,
  DollarSign,
  Phone,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { CreateListingModal } from './CreateListingModal';
import { ReviewBookingModal } from './ReviewBookingModal';

interface RentalWorkspaceViewProps {
  tenantSlug: string;
  initialListings?: any[];
  initialSummary?: any;
}

export function RentalWorkspaceView({
  tenantSlug,
  initialListings = [],
  initialSummary,
}: RentalWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<'listings' | 'bookings' | 'calendar'>('listings');

  // Listings State
  const [listings, setListings] = useState<any[]>(initialListings);
  const [listingsSummary, setListingsSummary] = useState(
    initialSummary || {
      totalListings: initialListings.length,
      published: initialListings.filter((l) => l.status === 'PUBLISHED').length,
      draft: initialListings.filter((l) => l.status === 'DRAFT').length,
      paused: initialListings.filter((l) => l.status === 'PAUSED').length,
    }
  );
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState('ALL');

  // Bookings State
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsSummary, setBookingsSummary] = useState({
    totalBookings: 0,
    pendingReview: 0,
    approved: 0,
    completed: 0,
  });
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');

  // Calendar State
  const [calendarData, setCalendarData] = useState<any | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reviewBookingTarget, setReviewBookingTarget] = useState<any | null>(null);

  // Fetch Listings
  const fetchListings = useCallback(async (statusOverride?: string, searchOverride?: string) => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams();
      const s = searchOverride !== undefined ? searchOverride : listingSearch;
      const st = statusOverride !== undefined ? statusOverride : listingStatusFilter;
      if (s.trim()) params.set('search', s.trim());
      if (st !== 'ALL') params.set('status', st);

      const res = await fetch(`/api/v1/mess/${tenantSlug}/rental/listings?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setListings(json.data.listings || []);
        if (json.data.summary) {
          setListingsSummary(json.data.summary);
        }
      }
    } catch {
    } finally {
      setListingsLoading(false);
    }
  }, [tenantSlug, listingSearch, listingStatusFilter]);

  // Fetch Bookings
  const fetchBookings = useCallback(async (statusOverride?: string) => {
    setBookingsLoading(true);
    try {
      const params = new URLSearchParams();
      const st = statusOverride !== undefined ? statusOverride : bookingStatusFilter;
      if (st !== 'ALL') params.set('status', st);

      const res = await fetch(`/api/v1/mess/${tenantSlug}/rental/bookings?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setBookings(json.data.bookings || []);
        if (json.data.summary) {
          setBookingsSummary(json.data.summary);
        }
      }
    } catch {
    } finally {
      setBookingsLoading(false);
    }
  }, [tenantSlug, bookingStatusFilter]);

  // Fetch Calendar
  const fetchCalendar = useCallback(async (monthOverride?: string) => {
    setCalendarLoading(true);
    try {
      const m = monthOverride || selectedMonth;
      const res = await fetch(
        `/api/v1/mess/${tenantSlug}/rooms/availability?month=${m}`
      );
      const json = await res.json();
      if (json.success) {
        setCalendarData(json.data);
      }
    } catch {
    } finally {
      setCalendarLoading(false);
    }
  }, [tenantSlug, selectedMonth]);

  const handleTabChange = (tab: 'listings' | 'bookings' | 'calendar') => {
    setActiveTab(tab);
    if (tab === 'listings') void fetchListings();
    if (tab === 'bookings') void fetchBookings();
    if (tab === 'calendar') void fetchCalendar();
  };

  const handleToggleStatus = async (listingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED';
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/rental/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchListings();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Rental Management & Guest Bookings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Publish vacant spaces, review short-term guest reservations, and inspect availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/mess/${tenantSlug}/rooms`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition"
          >
            <BedDouble className="w-4 h-4" />
            <span>Room Directory</span>
          </Link>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Listing</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleTabChange('listings')}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'listings'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Rental Listings ({listingsSummary.totalListings})
          </button>
          <button
            onClick={() => handleTabChange('bookings')}
            className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Guest Bookings</span>
            {bookingsSummary.pendingReview > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {bookingsSummary.pendingReview}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('calendar')}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'calendar'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Availability Calendar
          </button>
        </div>
      </div>

      {/* TAB 1: RENTAL LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Total Listings</span>
              <div className="text-xl font-bold text-foreground mt-1">
                {listingsSummary.totalListings}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Published (Active)</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {listingsSummary.published}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Drafts</span>
              <div className="text-xl font-bold text-muted-foreground mt-1">
                {listingsSummary.draft}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Paused</span>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {listingsSummary.paused}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search listings..."
                value={listingSearch}
                onChange={(e) => {
                  setListingSearch(e.target.value);
                  void fetchListings(undefined, e.target.value);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              {['ALL', 'PUBLISHED', 'DRAFT', 'PAUSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setListingStatusFilter(st);
                    void fetchListings(st);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                    listingStatusFilter === st
                      ? 'border-primary bg-primary text-primary-foreground font-medium'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          {listingsLoading ? (
            <div className="p-12 text-center rounded-xl border border-border bg-card">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-2">Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-border bg-card">
              <Home className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-base font-semibold text-foreground">No Listings Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                Create a listing to offer short-term or temporary vacant spaces to visitors.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Listing</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-col justify-between p-5 rounded-xl border border-border bg-card shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-foreground line-clamp-1">
                        {l.title}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          l.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : l.status === 'PAUSED'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>

                    {l.roomNumber && (
                      <p className="text-xs text-primary font-medium mt-1">
                        Linked to Room {l.roomNumber}
                      </p>
                    )}

                    <div className="flex items-baseline gap-2 mt-3">
                      {l.dailyRate && (
                        <div className="text-sm font-bold text-foreground">
                          ৳{l.dailyRate} <span className="text-[11px] font-normal text-muted-foreground">/day</span>
                        </div>
                      )}
                      {l.monthlyRate && (
                        <div className="text-sm font-bold text-foreground">
                          ৳{l.monthlyRate} <span className="text-[11px] font-normal text-muted-foreground">/mo</span>
                        </div>
                      )}
                    </div>

                    {l.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {l.description}
                      </p>
                    )}

                    {l.facilities && l.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {l.facilities.slice(0, 3).map((f: string) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {l.isPublic ? 'Publicly visible' : 'Private offer'}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(l.id, l.status)}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${
                        l.status === 'PUBLISHED'
                          ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                          : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                      }`}
                    >
                      {l.status === 'PUBLISHED' ? 'Pause Listing' : 'Publish Listing'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GUEST BOOKING REQUESTS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Total Requests</span>
              <div className="text-xl font-bold text-foreground mt-1">
                {bookingsSummary.totalBookings}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Pending Review</span>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {bookingsSummary.pendingReview}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Approved Bookings</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {bookingsSummary.approved}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Completed</span>
              <div className="text-xl font-bold text-muted-foreground mt-1">
                {bookingsSummary.completed}
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          {bookingsLoading ? (
            <div className="p-12 text-center rounded-xl border border-border bg-card">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-2">Loading booking requests...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-border bg-card">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-base font-semibold text-foreground">No Booking Requests</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                When prospective guests submit inquiries or stay reservations, they will appear here for review.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-medium">Guest Name</th>
                      <th className="px-4 py-3 font-medium">Contact Phone</th>
                      <th className="px-4 py-3 font-medium">Space Listing</th>
                      <th className="px-4 py-3 font-medium">Check-In / Out</th>
                      <th className="px-4 py-3 font-medium">Total Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/20 transition">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-foreground">{b.guestName}</span>
                          {b.guestEmail && (
                            <div className="text-[11px] text-muted-foreground">{b.guestEmail}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{b.guestPhone}</td>
                        <td className="px-4 py-3 text-foreground font-medium max-w-xs truncate">
                          {b.listingTitle}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(b.checkInDate).toLocaleDateString()} &rarr;{' '}
                          {new Date(b.checkOutDate).toLocaleDateString()}
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({b.durationDays}d)
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">
                          ৳{b.totalAmount}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              b.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : b.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {b.status === 'PENDING' ? (
                            <button
                              onClick={() => setReviewBookingTarget(b)}
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AVAILABILITY CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Accommodation Availability Overview
              </h3>
              <p className="text-xs text-muted-foreground">
                Server-validated daily occupancy, guest bookings, and vacant bed counts
              </p>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                void fetchCalendar(e.target.value);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          {calendarLoading || !calendarData ? (
            <div className="p-12 text-center rounded-xl border border-border bg-card">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-2">Aggregating availability data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {calendarData.days?.map((day: any) => {
                const isFull = day.vacantBeds <= 0;
                return (
                  <div
                    key={day.day}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between min-h-[90px] transition ${
                      isFull
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Day {day.day}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          isFull
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}
                      >
                        {isFull ? 'Full' : `${day.vacantBeds} Vacant`}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-[11px] text-muted-foreground my-1">
                      <div>Residents: {day.occupiedBeds}</div>
                      {day.guestBookingsCount > 0 && (
                        <div className="text-blue-500 font-medium">
                          Guests: {day.guestBookingsCount}
                        </div>
                      )}
                      {day.pendingBookingsCount > 0 && (
                        <div className="text-amber-500">
                          Pending: {day.pendingBookingsCount}
                        </div>
                      )}
                    </div>

                    <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${isFull ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{
                          width: `${Math.min(
                            100,
                            ((day.occupiedBeds + day.guestBookingsCount) / (day.totalCapacity || 1)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateListingModal
        tenantSlug={tenantSlug}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onListingCreated={() => fetchListings()}
      />

      {reviewBookingTarget && (
        <ReviewBookingModal
          tenantSlug={tenantSlug}
          booking={reviewBookingTarget}
          isOpen={Boolean(reviewBookingTarget)}
          onClose={() => setReviewBookingTarget(null)}
          onReviewed={() => fetchBookings()}
        />
      )}
    </div>
  );
}
