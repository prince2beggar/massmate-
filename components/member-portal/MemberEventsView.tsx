'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import type { MemberEventDto } from '@/server/member-portal/member-portal-service';

interface MemberEventsViewProps {
  tenantSlug: string;
  initialData?: MemberEventDto[] | null;
}

export function MemberEventsView({ tenantSlug, initialData }: MemberEventsViewProps) {
  const [events, setEvents] = useState<MemberEventDto[] | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchEvents = useCallback(() => {
    fetch(`/api/v1/portal/${tenantSlug}/events`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch events.');
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setEvents(json.data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Error fetching events.');
        setLoading(false);
      });
  }, [tenantSlug]);

  useEffect(() => {
    if (initialData) return;
    fetchEvents();
  }, [initialData, fetchEvents]);

  const handleRsvp = async (eventId: string, status: 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE') => {
    setUpdatingId(eventId);
    setError(null);

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update RSVP.');
      }

      // Optimistically or via reload update state
      fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Error updating RSVP.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && !events) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading community feasts & events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Community Events & Feasts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Stay connected with mess gatherings, grand Friday feasts, cleaning drives, and RSVP online.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-xs font-semibold text-rose-800">{error}</p>
        </div>
      )}

      {/* Events Grid */}
      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => {
            const isAttending = event.myRsvpStatus === 'ATTENDING';
            const isNotAttending = event.myRsvpStatus === 'NOT_ATTENDING';
            const isMaybe = event.myRsvpStatus === 'MAYBE';

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 p-6 flex flex-col justify-between space-y-5 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      Mess Event
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {event.totalAttendingCount} Attending
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">{event.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>

                  <div className="pt-2 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Event Time: <strong className="text-slate-800">{event.eventDate}</strong></span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Location: <strong className="text-slate-800">{event.location}</strong></span>
                      </div>
                    )}
                    {event.rsvpDeadline && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>RSVP Deadline: {event.rsvpDeadline}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RSVP Controls */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Your RSVP Status:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs ${
                        isAttending
                          ? 'bg-emerald-100 text-emerald-800'
                          : isNotAttending
                          ? 'bg-rose-100 text-rose-800'
                          : isMaybe
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {event.myRsvpStatus === 'NO_RESPONSE' ? 'Not Responded' : event.myRsvpStatus}
                    </span>
                  </div>

                  {event.isRsvpOpen ? (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={updatingId === event.id}
                        onClick={() => handleRsvp(event.id, 'ATTENDING')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                          isAttending
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Attending
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === event.id}
                        onClick={() => handleRsvp(event.id, 'MAYBE')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                          isMaybe
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200 hover:border-amber-200'
                        }`}
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        Maybe
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === event.id}
                        onClick={() => handleRsvp(event.id, 'NOT_ATTENDING')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                          isNotAttending
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-rose-50 text-slate-700 border-slate-200 hover:border-rose-200'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-1">
                      RSVP is now closed for this event.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Upcoming Events</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no community feasts or mess activities scheduled right now.
          </p>
        </div>
      )}
    </div>
  );
}
