'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  Calendar,
  Clock,
  CalendarOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
  Send,
  X,
  List,
  Grid,
  Sparkles,
  Users,
} from 'lucide-react';
import type { MemberMealOverviewDto } from '@/server/member-portal/member-portal-service';

interface MemberMealsViewProps {
  tenantSlug: string;
  initialData?: MemberMealOverviewDto | null;
}

export function MemberMealsView({ tenantSlug, initialData }: MemberMealsViewProps) {
  const [data, setData] = useState<MemberMealOverviewDto | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState<string>(
    initialData?.monthString || new Date().toISOString().substring(0, 7)
  );

  // View toggle: 'calendar' | 'list'
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Meal Off Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const refreshMealData = (monthToFetch = currentMonth) => {
    setLoading(true);
    setError(null);
    fetch(`/api/v1/portal/${tenantSlug}/meals?month=${monthToFetch}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to load meal data.');
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Error fetching meal details.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialData && initialData.monthString === currentMonth) {
      return;
    }
    let isMounted = true;
    fetch(`/api/v1/portal/${tenantSlug}/meals?month=${currentMonth}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to load meal data.');
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.success && json.data) {
          setData(json.data);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (isMounted) setError(err.message || 'Error fetching meal details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentMonth, initialData, tenantSlug]);

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newMonth = prevDate.toISOString().substring(0, 7);
    setLoading(true);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newMonth = nextDate.toISOString().substring(0, 7);
    setLoading(true);
    setCurrentMonth(newMonth);
  };

  const handleMealOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/meals/off-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          reason: reason.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || json.error?.message || 'Failed to submit meal-off request.');
      }

      setModalSuccess(json.message || 'Meal-off request recorded.');
      setTimeout(() => {
        setIsModalOpen(false);
        setStartDate('');
        setEndDate('');
        setReason('');
        refreshMealData(currentMonth);
      }, 1200);
    } catch (err: any) {
      setModalError(err.message || 'Error submitting request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelMealOff = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this pending meal-off request?')) return;

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/meals/off-requests/${requestId}/cancel`, {
        method: 'PATCH',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || 'Failed to cancel meal-off request.');
      }
      refreshMealData(currentMonth);
    } catch (err: any) {
      alert(err.message || 'Error cancelling request.');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading meal calendar & bookings...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-semibold text-rose-800">Failed to load meal data</h3>
        <p className="text-sm text-rose-600">{error}</p>
        <button
          onClick={() => refreshMealData(currentMonth)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Meals Calendar & Dining</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily meal bookings, published menus, and submit cutoff-enforced meal-off requests.
          </p>
        </div>
        <button
          onClick={() => {
            setModalError(null);
            setModalSuccess(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors w-fit"
        >
          <CalendarOff className="h-4 w-4" />
          Request Meal-Off
        </button>
      </div>

      {/* 2. Today's Dining Status & Menu Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Today's Status */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today&apos;s Dining Status ({data?.todayDate})
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                data?.todayStatus === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : data?.todayStatus === 'OFF'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {data?.todayStatus === 'ACTIVE'
                ? 'Meals Active'
                : data?.todayStatus === 'OFF'
                ? 'Meal-Off Active'
                : 'No Booking'}
            </span>
            <span className="text-xs text-slate-500">Asia/Dhaka</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
            <span>Breakfast: <strong>{data?.todayCounts.breakfast || 0}</strong></span>
            <span>•</span>
            <span>Lunch: <strong>{data?.todayCounts.lunch || 0}</strong></span>
            <span>•</span>
            <span>Dinner: <strong>{data?.todayCounts.dinner || 0}</strong></span>
          </div>
        </div>

        {/* Today's Published Menu */}
        <div className="md:col-span-2 bg-slate-50/80 rounded-xl border border-slate-100 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Today&apos;s Published Menu
          </div>
          {data?.todayMenu && (data.todayMenu.breakfast || data.todayMenu.lunch || data.todayMenu.dinner) ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Breakfast:</span>
                <span className="font-semibold">{data.todayMenu.breakfast || 'Standard'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Lunch:</span>
                <span className="font-semibold">{data.todayMenu.lunch || 'Standard'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Dinner:</span>
                <span className="font-semibold">{data.todayMenu.dinner || 'Standard'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Menu has not been published yet for today. Meals will follow the standard rotation.
            </p>
          )}
          {data?.todayMenu?.specialNotes && (
            <p className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5">
              Note: {data.todayMenu.specialNotes}
            </p>
          )}
        </div>
      </div>

      {/* 3. Dining Mode & Cutoff Policy Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode & Rate Card */}
        <div className="bg-emerald-50/60 rounded-xl border border-emerald-100 p-4 flex items-start gap-3">
          <UtensilsCrossed className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 space-y-1">
            <p className="font-bold text-emerald-900">
              {data?.mealSystem === 'FIXED' ? 'Fixed Meal System' : 'Flexible Meal System'}
            </p>
            <p className="text-emerald-800 leading-relaxed">{data?.mealSystemDescription}</p>
            <div className="pt-1 flex flex-wrap items-center gap-3 font-semibold text-emerald-900">
              <span>Units Consumed: {data?.monthSummary.totalChargeableUnits || 0}</span>
              <span>•</span>
              <span>Rate: {data?.monthSummary.estimatedMealRateFormatted || '৳65.00'}</span>
              <span>•</span>
              <span>Estimated Cost: {data?.monthSummary.totalMealChargesFormatted || '৳0.00'}</span>
            </div>
          </div>
        </div>

        {/* Cutoff Policy Card */}
        <div className="bg-blue-50/60 rounded-xl border border-blue-100 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-950 space-y-1">
            <p className="font-bold text-blue-900">Strict Cutoff Policy (Asia/Dhaka)</p>
            <p className="text-blue-800 leading-relaxed">{data?.cutoffs.cutoffExplanation}</p>
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-blue-700">
              <span>Breakfast: {data?.cutoffs.breakfast}</span>
              <span>|</span>
              <span>Lunch: {data?.cutoffs.lunch}</span>
              <span>|</span>
              <span>Dinner: {data?.cutoffs.dinner}</span>
              <span>|</span>
              <span>Evening Cutoff: <strong>{data?.cutoffs.defaultCutoff}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Monthly Calendar Navigation & View Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:shadow-xs transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm font-bold text-slate-800">
                {currentMonth}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:shadow-xs transition-colors"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-slate-400">
              Total Meals: <strong className="text-slate-700">{data?.monthSummary.totalMemberMeals || 0}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              Calendar Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Daily List
            </button>
          </div>
        </div>

        {/* View Mode: Calendar Grid */}
        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {data?.calendar.map((day) => (
              <div
                key={day.dateString}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[110px] ${
                  day.isToday
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : day.isMealOff
                    ? 'border-rose-200 bg-rose-50/30'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{day.dayNumber}</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {day.dayOfWeek}
                    </span>
                  </div>

                  {/* Badges / Meal counts */}
                  {day.isMealOff ? (
                    <div className="mt-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      Meal-Off
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1 text-[11px] font-medium text-slate-600">
                      <div className="flex justify-between">
                        <span>B: {day.breakfast}</span>
                        <span>L: {day.lunch}</span>
                        <span>D: {day.dinner}</span>
                      </div>
                      {day.guestMealsCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1 py-0.5 rounded">
                          <Users className="h-2.5 w-2.5" /> +{day.guestMealsCount} Guest
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Daily Menu Snippet */}
                {day.menu && (day.menu.lunch || day.menu.dinner) && (
                  <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500 truncate" title={`${day.menu.lunch || ''} | ${day.menu.dinner || ''}`}>
                    {day.menu.lunch || day.menu.dinner}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* View Mode: Daily List */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Breakfast</th>
                  <th className="py-2.5 px-4">Lunch</th>
                  <th className="py-2.5 px-4">Dinner</th>
                  <th className="py-2.5 px-4">Daily Units</th>
                  <th className="py-2.5 px-4">Status / Menu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.calendar.map((day) => (
                  <tr
                    key={day.dateString}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      day.isToday ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {day.dateString} ({day.dayOfWeek})
                    </td>
                    <td className="py-2.5 px-4">{day.isMealOff ? '—' : day.breakfast}</td>
                    <td className="py-2.5 px-4">{day.isMealOff ? '—' : day.lunch}</td>
                    <td className="py-2.5 px-4">{day.isMealOff ? '—' : day.dinner}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">
                      {day.isMealOff ? '0' : day.totalDailyUnits}
                    </td>
                    <td className="py-2.5 px-4 text-xs">
                      {day.isMealOff ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
                          Meal-Off ({day.mealOffReason || 'Requested'})
                        </span>
                      ) : day.menu?.lunch || day.menu?.dinner ? (
                        <span className="text-slate-600 truncate max-w-xs block">
                          {day.menu.lunch || day.menu.dinner}
                        </span>
                      ) : (
                        <span className="text-slate-400">Regular</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Recent Meal-Off Requests Section */}
      {data?.recentMealOffRequests && data.recentMealOffRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CalendarOff className="h-5 w-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">Recent Meal-Off Submissions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4">Reason</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Review Note</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentMealOffRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {req.startDate} to {req.endDate}
                    </td>
                    <td className="py-2.5 px-4 text-xs">{req.reason}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">
                      {req.reviewNote || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {req.canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancelMealOff(req.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Request Meal-Off Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <CalendarOff className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Request Meal-Off</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold text-emerald-800">{modalSuccess}</p>
              </div>
            )}

            {modalError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <p className="text-xs font-semibold text-rose-800">{modalError}</p>
              </div>
            )}

            <form onSubmit={handleMealOffSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Traveling to home district for weekend..."
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Minimum 3 characters.</p>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 flex items-start gap-2 text-xs text-amber-900">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <span>
                  Requests for tomorrow must be submitted before <strong>{data?.cutoffs.defaultCutoff || '20:00'} (Asia/Dhaka)</strong>. Server enforces cutoff checks on the official server clock.
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
                      Submit Meal-Off
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
