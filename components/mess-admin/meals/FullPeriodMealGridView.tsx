'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Printer,
  Sparkles,
  Utensils,
  Sun,
  Moon,
  Coffee,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Clock,
  Edit2,
  DollarSign,
  Users,
} from 'lucide-react';
import { ROLE_TEMPLATES_INFO } from '@/server/rbac/role-constants';

interface FullPeriodMealGridViewProps {
  tenantSlug: string;
  initialData?: any;
}

export function FullPeriodMealGridView({
  tenantSlug,
  initialData,
}: FullPeriodMealGridViewProps) {
  // Preset Cycle Mode: 'current-month' | 'previous-month' | 'mid-month' | 'custom'
  const [cycleMode, setCycleMode] = useState<'current-month' | 'previous-month' | 'mid-month' | 'custom'>('current-month');

  // Date ranges
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  const [startDate, setStartDate] = useState(() => {
    if (initialData?.period?.startDate) return initialData.period.startDate;
    const y = currentYear;
    const m = String(currentMonth + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });

  const [endDate, setEndDate] = useState(() => {
    if (initialData?.period?.endDate) return initialData.period.endDate;
    const y = currentYear;
    const m = String(currentMonth + 1).padStart(2, '0');
    const lastDay = new Date(y, currentMonth + 1, 0).getDate();
    return `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  });

  const [data, setData] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Cell State
  const [editingCell, setEditingCell] = useState<{
    membershipId: string;
    memberName: string;
    dateString: string;
    dayNumber: number;
    dayNameBengali: string;
    breakfast: number;
    lunch: number;
    dinner: number;
    custom: number;
    notes: string;
  } | null>(null);

  const [savingCell, setSavingCell] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch Period Grid
  const fetchGridData = async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/mess/${tenantSlug}/meals/period-grid?startDate=${start}&endDate=${end}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'মিল শিট লোড করতে ব্যর্থ হয়েছে');
      }
      setData(json.data);
    } catch (err: any) {
      setError(err.message || 'মিল শিট লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchGridData(startDate, endDate);
    }
  }, [tenantSlug]);

  // Handle Preset Changes
  const applyPreset = (preset: 'current-month' | 'previous-month' | 'mid-month' | 'custom') => {
    setCycleMode(preset);
    let start = '';
    let end = '';

    if (preset === 'current-month') {
      const y = currentYear;
      const m = String(currentMonth + 1).padStart(2, '0');
      const lastDay = new Date(y, currentMonth + 1, 0).getDate();
      start = `${y}-${m}-01`;
      end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    } else if (preset === 'previous-month') {
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, prevDate.getMonth() + 1, 0).getDate();
      start = `${y}-${m}-01`;
      end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    } else if (preset === 'mid-month') {
      // 15th of current month to 15th of next month (Bangladeshi typical rental/mess cycle)
      const y = currentYear;
      const m = currentMonth + 1;
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? y + 1 : y;
      start = `${y}-${String(m).padStart(2, '0')}-15`;
      end = `${nextY}-${String(nextM).padStart(2, '0')}-15`;
    } else {
      // Custom retains current values
      return;
    }

    setStartDate(start);
    setEndDate(end);
    fetchGridData(start, end);
  };

  // Quick Days Adder for Custom Range
  const setCustomDuration = (days: number) => {
    if (!startDate) return;
    const startObj = new Date(startDate);
    const endObj = new Date(startObj.getTime() + (days - 1) * 24 * 3600 * 1000);
    const y = endObj.getFullYear();
    const m = String(endObj.getMonth() + 1).padStart(2, '0');
    const d = String(endObj.getDate()).padStart(2, '0');
    const newEnd = `${y}-${m}-${d}`;
    setEndDate(newEnd);
    fetchGridData(startDate, newEnd);
  };

  // Cell Click -> Open Edit Popover
  const handleCellClick = (
    membershipId: string,
    memberName: string,
    dateString: string,
    dayNumber: number,
    dayNameBengali: string,
    currentMeal: any
  ) => {
    setEditError(null);
    setEditingCell({
      membershipId,
      memberName,
      dateString,
      dayNumber,
      dayNameBengali,
      breakfast: currentMeal?.breakfast ?? 0,
      lunch: currentMeal?.lunch ?? 0,
      dinner: currentMeal?.dinner ?? 0,
      custom: currentMeal?.custom ?? 0,
      notes: currentMeal?.notes ?? '',
    });
  };

  // Quick Preset Setter in Modal
  const applyMealPreset = (bf: number, lunch: number, dinner: number) => {
    if (!editingCell) return;
    setEditingCell({
      ...editingCell,
      breakfast: bf,
      lunch,
      dinner,
    });
  };

  // Save Cell Edit
  const handleSaveCell = async () => {
    if (!editingCell) return;
    setSavingCell(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/period-grid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateString: editingCell.dateString,
          membershipId: editingCell.membershipId,
          breakfastCount: editingCell.breakfast,
          lunchCount: editingCell.lunch,
          dinnerCount: editingCell.dinner,
          customCount: editingCell.custom,
          notes: editingCell.notes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message || json.message || 'মিল সংরক্ষণ করতে ব্যর্থ হয়েছে'
        );
      }

      // Optimistically update in local state without full reload
      if (data && data.members) {
        const updatedMembers = data.members.map((m: any) => {
          if (m.membershipId !== editingCell.membershipId) return m;

          const oldDay = m.dailyMeals[editingCell.dateString] || {};
          const newUnits = Number(
            (
              editingCell.breakfast * 0.5 +
              editingCell.lunch * 1 +
              editingCell.dinner * 1 +
              editingCell.custom
            ).toFixed(2)
          );

          const updatedDaily = {
            ...m.dailyMeals,
            [editingCell.dateString]: {
              ...oldDay,
              breakfast: editingCell.breakfast,
              lunch: editingCell.lunch,
              dinner: editingCell.dinner,
              custom: editingCell.custom,
              totalUnits: newUnits,
              isOff: newUnits === 0,
            },
          };

          // Recompute totals for member
          let totalBf = 0;
          let totalLunch = 0;
          let totalDinner = 0;
          let totalUnits = 0;
          let offDays = 0;

          for (const d of data.period.dates) {
            const dayEntry = updatedDaily[d.dateString];
            if (dayEntry) {
              totalBf += dayEntry.breakfast;
              totalLunch += dayEntry.lunch;
              totalDinner += dayEntry.dinner;
              totalUnits += dayEntry.totalUnits;
              if (dayEntry.isOff) offDays++;
            }
          }

          const mealRate = data.summary?.calculatedMealRateTaka || 49.48;

          return {
            ...m,
            dailyMeals: updatedDaily,
            totals: {
              ...m.totals,
              totalBreakfast: totalBf,
              totalLunch,
              totalDinner,
              totalMeals: totalBf + totalLunch + totalDinner,
              totalUnits: Number(totalUnits.toFixed(2)),
              totalOffDays: offDays,
              estimatedCostTaka: Number((totalUnits * mealRate).toFixed(2)),
            },
          };
        });

        setData({
          ...data,
          members: updatedMembers,
        });
      }

      setEditingCell(null);
    } catch (err: any) {
      setEditError(err.message || 'মিল সংরক্ষণ করতে ব্যর্থ হয়েছে');
    } finally {
      setSavingCell(false);
    }
  };

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    if (!searchQuery.trim()) return data.members;
    const q = searchQuery.toLowerCase().trim();
    return data.members.filter(
      (m: any) =>
        m.memberName?.toLowerCase().includes(q) ||
        m.memberCode?.toLowerCase().includes(q) ||
        m.phone?.includes(q)
    );
  }, [data?.members, searchQuery]);

  const datesList = data?.period?.dates || [];
  const summary = data?.summary;
  const dailyTotals = data?.dailyTotals || {};

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar & Preset Controls */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <CalendarRange className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                মাসিক ও কাস্টম মেস মিল রেজিস্টার শিট (Full Meal Matrix)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              মাসের ১ থেকে ৩০ তারিখ বা কাস্টম মেস সাইকেল (যেমন ১৫ তারিখ থেকে ১৫ তারিখ বা ৪০ দিন) অনুযায়ী সবার মিলের পূর্ণাঙ্গ হিসাব
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchGridData(startDate, endDate)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>প্রিন্ট / এক্সপোর্ট শিট</span>
            </button>
          </div>
        </div>

        {/* Cycle Presets & Date Pickers */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => applyPreset('current-month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                cycleMode === 'current-month'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 চলতি মাস (১ম-৩০/৩১)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('previous-month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                cycleMode === 'previous-month'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 গত মাস
            </button>
            <button
              type="button"
              onClick={() => applyPreset('mid-month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                cycleMode === 'mid-month'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔄 ১৫ তারিখ হতে ১৫ তারিখ
            </button>
            <button
              type="button"
              onClick={() => applyPreset('custom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                cycleMode === 'custom'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚙️ কাস্টম রেঞ্জ (Custom)
            </button>
          </div>

          {/* Quick Date Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500 font-medium">শুরু:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCycleMode('custom');
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500 font-medium">শেষ:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCycleMode('custom');
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchGridData(startDate, endDate)}
              className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
            >
              লোড করুন
            </button>

            {/* Quick 30d, 40d, 45d badges for Custom Mode */}
            {cycleMode === 'custom' && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium">দ্রুত সাইকেল:</span>
                <button
                  type="button"
                  onClick={() => setCustomDuration(30)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  ৩০ দিন
                </button>
                <button
                  type="button"
                  onClick={() => setCustomDuration(40)}
                  className="px-2 py-0.5 rounded-md bg-emerald-100 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200 transition"
                >
                  ৪০ দিন
                </button>
                <button
                  type="button"
                  onClick={() => setCustomDuration(45)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  ৪৫ দিন
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">মেস সাইকেল সময়কাল</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {summary.totalDays} <span className="text-xs font-normal text-slate-500">দিন</span>
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">
              {data.period.startDate} হতে {data.period.endDate}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">মোট সক্রিয় সদস্য</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {summary.totalMembers} <span className="text-xs font-normal text-slate-500">জন</span>
            </p>
            <span className="text-[10px] text-slate-400 font-medium">নিয়মিত ডাইনিং মেম্বার</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">মোট খাওয়া মিল (Plates)</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {summary.totalMeals} <span className="text-xs font-normal text-slate-500">টি</span>
            </p>
            <span className="text-[10px] text-slate-400 font-medium">
              নাস্তা: {summary.totalBreakfast} | দুপুর: {summary.totalLunch} | রাত: {summary.totalDinner}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">মোট মিল ইউনিট</span>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">
              {summary.totalUnits.toFixed(1)}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">ওয়েট অনুসারে মোট ইউনিট</span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-900">বর্তমান মিল রেট</span>
            <p className="text-lg font-black text-emerald-800 mt-0.5">
              ৳{summary.calculatedMealRateTaka.toFixed(2)}
            </p>
            <span className="text-[10px] text-emerald-700 font-medium">বাজার খরচ / মোট ইউনিট</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">মোট বাজার খরচ</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              ৳{summary.totalBazarExpenseTaka.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">অনুমোদিত বাজার ভাউচার</span>
          </div>
        </div>
      )}

      {/* 3. Search and Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="সদস্যের নাম বা কোড দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-300"></span>
            <span>নিয়মিত মিল</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-rose-100 border border-rose-300"></span>
            <span>মিল অফ (OFF)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-amber-100 border border-amber-300"></span>
            <span>ছুটির দিন (শুক্র/শনি)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600"></span>
            <span>আজকের দিন</span>
          </div>
        </div>
      </div>

      {/* 4. Full Period Matrix Spreadsheet Grid */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">মিল রেজিস্টার শিট প্রস্তুত হচ্ছে...</p>
            <p className="text-xs text-slate-400 mt-1">সব সদস্যের দৈনিক মিল ও রেট গণনা করা হচ্ছে</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              onClick={() => fetchGridData(startDate, endDate)}
              className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <table className="w-full border-collapse text-left text-xs">
              {/* Header Row */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 select-none">
                  {/* Sticky Member Code */}
                  <th className="sticky left-0 z-20 bg-slate-100 px-3 py-3 font-bold text-slate-800 border-r border-slate-200 min-w-[75px] shadow-sm">
                    কোড
                  </th>
                  {/* Sticky Resident Name */}
                  <th className="sticky left-[75px] z-20 bg-slate-100 px-4 py-3 font-bold text-slate-800 border-r border-slate-300 min-w-[170px] shadow-sm">
                    মেম্বারের নাম ও রোল
                  </th>

                  {/* Day Columns */}
                  {datesList.map((d: any) => (
                    <th
                      key={d.dateString}
                      className={`px-1.5 py-2 text-center border-r border-slate-200 min-w-[42px] transition ${
                        d.isToday
                          ? 'bg-emerald-100/80 text-emerald-950 font-black ring-1 ring-emerald-500/30'
                          : d.isWeekend
                          ? 'bg-amber-50/60 text-amber-900 font-semibold'
                          : 'text-slate-700'
                      }`}
                    >
                      <div className="text-[13px] leading-tight font-black">{d.dayNumber}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{d.dayNameBengali}</div>
                    </th>
                  ))}

                  {/* Sticky Right Summary Columns */}
                  <th className="sticky right-[270px] z-20 bg-slate-100 px-2 py-3 text-center font-bold text-slate-800 border-l border-slate-300 min-w-[50px]">
                    নাস্তা
                  </th>
                  <th className="sticky right-[220px] z-20 bg-slate-100 px-2 py-3 text-center font-bold text-slate-800 border-r border-slate-200 min-w-[50px]">
                    দুপুর
                  </th>
                  <th className="sticky right-[170px] z-20 bg-slate-100 px-2 py-3 text-center font-bold text-slate-800 border-r border-slate-200 min-w-[50px]">
                    রাত
                  </th>
                  <th className="sticky right-[120px] z-20 bg-emerald-50 px-2 py-3 text-center font-black text-emerald-900 border-r border-slate-200 min-w-[50px]">
                    মোট
                  </th>
                  <th className="sticky right-[60px] z-20 bg-emerald-100 px-2.5 py-3 text-center font-black text-emerald-900 border-r border-slate-200 min-w-[60px]">
                    ইউনিট
                  </th>
                  <th className="sticky right-0 z-20 bg-slate-100 px-3 py-3 text-right font-black text-slate-900 min-w-[90px] shadow-sm">
                    খরচ (৳)
                  </th>
                </tr>
              </thead>

              {/* Body Rows */}
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m: any, mIdx: number) => {
                  const roles = m.assignedRoles || [];
                  const primaryRole = roles[0] || 'member';
                  const roleMeta = (ROLE_TEMPLATES_INFO as any)[primaryRole] || ROLE_TEMPLATES_INFO.member;

                  return (
                    <tr
                      key={m.membershipId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        mIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      {/* Sticky Code */}
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-2 font-mono text-[11px] font-semibold text-slate-600 border-r border-slate-200">
                        {m.memberCode || `M-${mIdx + 1}`}
                      </td>

                      {/* Sticky Resident Name & Roles */}
                      <td className="sticky left-[75px] z-10 bg-inherit px-4 py-2 border-r border-slate-300">
                        <div className="font-bold text-slate-900 truncate max-w-[150px]">
                          {m.memberName}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {roles.slice(0, 2).map((rKey: string) => {
                            const meta = (ROLE_TEMPLATES_INFO as any)[rKey];
                            return (
                              <span
                                key={rKey}
                                className={`inline-block px-1.5 py-0.2 rounded-md text-[9px] font-medium border ${
                                  meta?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {meta?.name?.split('(')[0]?.trim() || rKey}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Day Cells */}
                      {datesList.map((d: any) => {
                        const dayMeal = m.dailyMeals[d.dateString];
                        const totalUnits = dayMeal?.totalUnits ?? 0;
                        const isOff = dayMeal?.isOff;

                        return (
                          <td
                            key={d.dateString}
                            onClick={() =>
                              handleCellClick(
                                m.membershipId,
                                m.memberName,
                                d.dateString,
                                d.dayNumber,
                                d.dayNameBengali,
                                dayMeal
                              )
                            }
                            title={`${m.memberName} (${d.dayNumber} ${d.dayNameBengali}): নাস্তা: ${dayMeal?.breakfast ?? 0}, দুপুর: ${dayMeal?.lunch ?? 0}, রাত: ${dayMeal?.dinner ?? 0}`}
                            className={`px-1 py-1 text-center border-r border-slate-100 cursor-pointer select-none transition group relative ${
                              d.isToday
                                ? 'bg-emerald-50/50 hover:bg-emerald-100/70'
                                : d.isWeekend
                                ? 'bg-amber-50/30 hover:bg-amber-100/50'
                                : 'hover:bg-slate-100'
                            }`}
                          >
                            {isOff ? (
                              <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                OFF
                              </span>
                            ) : totalUnits > 0 ? (
                              <span className="font-bold text-slate-800 text-[11px] group-hover:text-emerald-700">
                                {totalUnits % 1 === 0 ? totalUnits.toFixed(0) : totalUnits.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-light">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Sticky Right Summary Values */}
                      <td className="sticky right-[270px] z-10 bg-inherit px-2 py-2 text-center font-medium text-slate-700 border-l border-slate-300">
                        {m.totals.totalBreakfast}
                      </td>
                      <td className="sticky right-[220px] z-10 bg-inherit px-2 py-2 text-center font-medium text-slate-700 border-r border-slate-200">
                        {m.totals.totalLunch}
                      </td>
                      <td className="sticky right-[170px] z-10 bg-inherit px-2 py-2 text-center font-medium text-slate-700 border-r border-slate-200">
                        {m.totals.totalDinner}
                      </td>
                      <td className="sticky right-[120px] z-10 bg-emerald-50 px-2 py-2 text-center font-bold text-emerald-900 border-r border-slate-200">
                        {m.totals.totalMeals}
                      </td>
                      <td className="sticky right-[60px] z-10 bg-emerald-100 px-2 py-2 text-center font-black text-emerald-950 border-r border-slate-200">
                        {m.totals.totalUnits.toFixed(1)}
                      </td>
                      <td className="sticky right-0 z-10 bg-inherit px-3 py-2 text-right font-bold text-slate-900">
                        ৳{m.totals.estimatedCostTaka.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Bottom Summary Row: Daily Mess Totals */}
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-800">
                  <td className="sticky left-0 z-20 bg-slate-200 px-3 py-2.5 text-slate-700 border-r border-slate-300">
                    মোট
                  </td>
                  <td className="sticky left-[75px] z-20 bg-slate-200 px-4 py-2.5 text-slate-900 border-r border-slate-300">
                    দৈনিক মেসের সর্বমোট মিল
                  </td>

                  {/* Daily Column Sums */}
                  {datesList.map((d: any) => {
                    const dt = dailyTotals[d.dateString];
                    const count = dt?.totalMeals ?? 0;
                    return (
                      <td
                        key={d.dateString}
                        className={`px-1 py-2 text-center border-r border-slate-300 text-[11px] ${
                          d.isToday
                            ? 'bg-emerald-200/90 text-emerald-950'
                            : d.isWeekend
                            ? 'bg-amber-100/80 text-amber-950'
                            : 'bg-slate-100'
                        }`}
                      >
                        {count > 0 ? count : '-'}
                      </td>
                    );
                  })}

                  {/* Grand Totals */}
                  <td className="sticky right-[270px] z-20 bg-slate-200 px-2 py-2.5 text-center border-l border-slate-300">
                    {summary?.totalBreakfast}
                  </td>
                  <td className="sticky right-[220px] z-20 bg-slate-200 px-2 py-2.5 text-center border-r border-slate-300">
                    {summary?.totalLunch}
                  </td>
                  <td className="sticky right-[170px] z-20 bg-slate-200 px-2 py-2.5 text-center border-r border-slate-300">
                    {summary?.totalDinner}
                  </td>
                  <td className="sticky right-[120px] z-20 bg-emerald-200 px-2 py-2.5 text-center text-emerald-950 border-r border-slate-300">
                    {summary?.totalMeals}
                  </td>
                  <td className="sticky right-[60px] z-20 bg-emerald-300 px-2 py-2.5 text-center text-emerald-950 border-r border-slate-300">
                    {summary?.totalUnits?.toFixed(1)}
                  </td>
                  <td className="sticky right-0 z-20 bg-slate-200 px-3 py-2.5 text-right text-slate-900">
                    ৳{summary?.totalEstimatedMealCostTaka?.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* 5. Cell Edit Modal / Floating Editor */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  মিল পরিবর্তন: {editingCell.memberName}
                </h3>
                <p className="text-xs text-slate-500">
                  তারিখ: {editingCell.dateString} ({editingCell.dayNumber} {editingCell.dayNameBengali})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            {/* Quick 1-Click Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">দ্রুত প্রিসেট নির্বাচন:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyMealPreset(0, 0, 0)}
                  className="rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                >
                  🚫 মিল অফ / বন্ধ (০)
                </button>
                <button
                  type="button"
                  onClick={() => applyMealPreset(1, 1, 1)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  🍳 ফুল মিল (২.৫/৩)
                </button>
                <button
                  type="button"
                  onClick={() => applyMealPreset(0, 1, 1)}
                  className="rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 transition"
                >
                  🍛 দুপুর + রাত (২.০)
                </button>
                <button
                  type="button"
                  onClick={() => applyMealPreset(1, 0, 0)}
                  className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                >
                  ☕ নাস্তা মাত্র (০.৫)
                </button>
              </div>
            </div>

            {/* Meal Items Counters */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              {/* Breakfast */}
              <div className="rounded-xl border border-slate-200 p-3 text-center space-y-1 bg-slate-50/50">
                <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-bold">
                  <Coffee className="h-3.5 w-3.5 text-amber-600" />
                  <span>সকাল</span>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCell({
                        ...editingCell,
                        breakfast: Math.max(0, editingCell.breakfast - 1),
                      })
                    }
                    className="h-6 w-6 rounded-md bg-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-300"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-slate-900">{editingCell.breakfast}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCell({
                        ...editingCell,
                        breakfast: editingCell.breakfast + 1,
                      })
                    }
                    className="h-6 w-6 rounded-md bg-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-300"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Lunch */}
              <div className="rounded-xl border border-slate-200 p-3 text-center space-y-1 bg-slate-50/50">
                <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-bold">
                  <Sun className="h-3.5 w-3.5 text-orange-500" />
                  <span>দুপুর</span>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCell({
                        ...editingCell,
                        lunch: Math.max(0, editingCell.lunch - 1),
                      })
                    }
                    className="h-6 w-6 rounded-md bg-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-300"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-slate-900">{editingCell.lunch}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCell({
                        ...editingCell,
                        lunch: editingCell.lunch + 1,
                      })
                    }
                    className="h-6 w-6 rounded-md bg-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-300"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dinner */}
              <div className="rounded-xl border border-slate-200 p-3 text-center space-y-1 bg-slate-50/50">
                <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-bold">
                  <Moon className="h-3.5 w-3.5 text-indigo-600" />
                  <span>রাত</span>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCell({
                        ...editingCell,
                        dinner: Math.max(0, editingCell.dinner - 1),
                      })
                    }
                    className="h-6 w-6 rounded-md bg-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-300"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-slate-900">{editingCell.dinner}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCell({
                        ...editingCell,
                        dinner: editingCell.dinner + 1,
                      })
                    }
                    className="h-6 w-6 rounded-md bg-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-300"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Calculated Units Note */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-2.5 text-center text-xs text-emerald-900 font-semibold">
              মোট প্রযোজ্য ইউনিট:{' '}
              <span className="text-sm font-black text-emerald-800">
                {(
                  editingCell.breakfast * 0.5 +
                  editingCell.lunch * 1 +
                  editingCell.dinner * 1 +
                  editingCell.custom
                ).toFixed(1)}{' '}
                ইউনিট
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveCell}
                disabled={savingCell}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
              >
                {savingCell ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
