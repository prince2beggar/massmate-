'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  Building,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRightLeft,
  Sparkles,
  Info,
  Clock,
  Send,
  X,
  History,
} from 'lucide-react';
import type { MemberRoomDetailsDto } from '@/server/member-portal/member-portal-service';

interface MemberRoomViewProps {
  tenantSlug: string;
  initialData?: MemberRoomDetailsDto | null;
}

export function MemberRoomView({ tenantSlug, initialData }: MemberRoomViewProps) {
  const [data, setData] = useState<MemberRoomDetailsDto | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchRoomDetails = useCallback(() => {
    fetch(`/api/v1/portal/${tenantSlug}/room`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to load room details.');
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Error fetching room assignment details.');
        setLoading(false);
      });
  }, [tenantSlug]);

  useEffect(() => {
    if (initialData) return;
    fetchRoomDetails();
  }, [initialData, fetchRoomDetails]);

  const handleOpenTransferModal = (prefillRoomId?: string) => {
    setSelectedRoomId(prefillRoomId || '');
    setPreferredDate('');
    setReason('');
    setSubmitSuccess(null);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setSubmitError('Please enter a reason with at least 5 characters.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'ROOM_CHANGE',
          requestedRoomId: selectedRoomId || null,
          preferredDate: preferredDate || null,
          title: 'Room Change / Transfer Request',
          description: reason.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || json.error?.message || 'Failed to submit room change request.');
      }

      setSubmitSuccess('Your room transfer request has been submitted for Admin approval.');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchRoomDetails();
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading your room details...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-semibold text-rose-800">Failed to load room details</h3>
        <p className="text-sm text-rose-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const current = data?.currentAssignment;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Room & Bed Assignment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Details of your current accommodation, rent agreement, and room transfer requests.
          </p>
        </div>
        <button
          onClick={() => handleOpenTransferModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors w-fit"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Request Room Change
        </button>
      </div>

      {/* 1. Current Active Assignment Section */}
      {data?.hasAssignment && current ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-6 text-white sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200">
                  Current Room Assignment
                </span>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BedDouble className="h-6 w-6 text-emerald-300" />
                  Room {current.roomNumber}
                  {current.roomName && (
                    <span className="text-lg font-normal text-emerald-100">
                      — {current.roomName}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-emerald-100/90 flex items-center gap-2">
                  <span>{current.floor || 'Standard Floor'}</span>
                  {current.building && <span>• {current.building}</span>}
                </p>
              </div>

              <div className="text-left sm:text-right bg-white/10 backdrop-blur-xs px-4 py-3 rounded-xl border border-white/20">
                <span className="block text-xs uppercase tracking-wider text-emerald-200 font-medium">
                  Agreed Monthly Rent
                </span>
                <span className="text-2xl font-bold text-white tracking-tight">
                  {current.formattedRent}
                </span>
                <span className="block text-[11px] text-emerald-200">per month (BDT)</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bed & Occupancy (Privacy Protected) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Assigned Bed
              </span>
              <p className="text-lg font-bold text-slate-800">{current.bedNumber}</p>
              <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>
                  Room Occupancy:{' '}
                  <strong className="text-slate-800">
                    {current.currentOccupantsCount} / {current.capacity} Beds
                  </strong>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Co-resident privacy protected by mess tenancy policy.
              </p>
            </div>

            {/* Allocation Duration */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Allocation Date
              </span>
              <p className="text-lg font-bold text-slate-800">{current.startDate}</p>
              <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>Status: <strong className="text-emerald-700 uppercase">{current.status}</strong></span>
              </div>
            </div>

            {/* Facilities Chips */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Room Facilities
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {current.facilities && current.facilities.length > 0 ? (
                  current.facilities.map((fac, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-xs"
                    >
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      {fac}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Standard Amenities</span>
                )}
              </div>
            </div>
          </div>

          {current.roomRules && (
            <div className="mx-6 sm:mx-8 mb-6 p-4 rounded-xl border border-amber-200/80 bg-amber-50/60 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong className="font-semibold">Room Guidelines: </strong>
                {current.roomRules}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Unassigned Empty State */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <BedDouble className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Active Room Assigned</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              You do not currently have a bed allocated in this mess. You can submit an allocation request below to be assigned to an available room.
            </p>
          </div>
          <button
            onClick={() => handleOpenTransferModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Send className="h-4 w-4" />
            Request Room Allocation
          </button>
        </div>
      )}

      {/* 2. Available Rooms in Mess */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building className="h-5 w-5 text-emerald-600" />
            Available Mess Rooms
          </h2>
          <span className="text-xs text-slate-500">
            {data?.availableRooms.length || 0} room(s) with vacancies
          </span>
        </div>

        {data?.availableRooms && data.availableRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.availableRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">
                      Room {room.roomNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {room.availableBedsCount} bed{room.availableBedsCount > 1 ? 's' : ''} free
                    </span>
                  </div>
                  {room.name && <p className="text-xs font-medium text-slate-600">{room.name}</p>}
                  <p className="text-xs text-slate-500">
                    {room.floor || 'Standard Floor'} {room.building ? `• ${room.building}` : ''}
                  </p>

                  <div className="pt-2">
                    <span className="text-xs text-slate-400">Default Rent: </span>
                    <strong className="text-sm text-slate-800">{room.formattedDefaultRent}</strong>
                    <span className="text-[11px] text-slate-400"> /mo</span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {room.facilities.slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenTransferModal(room.id)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  Request This Room
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
            All rooms are currently at full capacity. You may still submit a general transfer request.
          </div>
        )}
      </div>

      {/* 3. Room Assignment History */}
      {data?.assignmentHistory && data.assignmentHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <History className="h-5 w-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">Room Assignment History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Room & Bed</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Monthly Rent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.assignmentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Room {item.roomNumber} ({item.bedNumber})
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {item.startDate} — {item.endDate || 'Present'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{item.formattedRent}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {item.moveOutReason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Room Change / Allocation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {data?.hasAssignment ? 'Request Room Change' : 'Request Room Allocation'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold text-emerald-800">{submitSuccess}</p>
              </div>
            )}

            {submitError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <p className="text-xs font-semibold text-rose-800">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {/* Preferred Room Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Room (Optional)
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Any available room / No preference</option>
                  {data?.availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.availableBedsCount} bed free) — {r.formattedDefaultRent}/mo
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Move-in Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Request <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Requesting transfer to upper floor for study quietness during exam term..."
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Minimum 5 characters.</p>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2 text-xs text-blue-900">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>
                  Submitting this request creates a <strong>PENDING</strong> ticket for the Mess Admin. Your room assignment is only updated once verified and approved.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
