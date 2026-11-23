'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CalendarDays,
  CalendarRange,
  Search,
  Printer,
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
  Settings,
  ArrowUpDown,
  Filter,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  Wallet,
  ShoppingBag,
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

  // Date Ordering: 'recent-first' (Newest first, today upfront) vs 'oldest-first' (Day 1 to 30)
  const [dateOrder, setDateOrder] = useState<'recent-first' | 'oldest-first'>('recent-first');

  // Date Scope: 'up-to-today' (Hides future empty days) vs 'full-cycle' (All 30/40 days)
  const [dateScope, setDateScope] = useState<'up-to-today' | 'full-cycle'>('up-to-today');

  // Column Section Collapse States ([-] and [+])
  const [showMealBreakdown, setShowMealBreakdown] = useState<boolean>(true); // নাস্তা, দুপুর, রাত
  const [showMealCost, setShowMealCost] = useState<boolean>(true); // মিলের খরচ (৳)
  const [dateDisplayLimit, setDateDisplayLimit] = useState<'all' | 'recent-7'>('all'); // ৭ দিন vs পুরো সাইকেল

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

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    breakfastEnabled: true,
    lunchEnabled: true,
    dinnerEnabled: true,
    breakfastWeight: 0.5,
    lunchWeight: 1.0,
    dinnerWeight: 1.0,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Sync settings when data changes
  useEffect(() => {
    if (data?.settings) {
      setSettingsForm({
        breakfastEnabled: data.settings.breakfastEnabled ?? true,
        lunchEnabled: data.settings.lunchEnabled ?? true,
        dinnerEnabled: data.settings.dinnerEnabled ?? true,
        breakfastWeight: Number(data.settings.breakfastWeight ?? 0.5),
        lunchWeight: Number(data.settings.lunchWeight ?? 1.0),
        dinnerWeight: Number(data.settings.dinnerWeight ?? 1.0),
      });
    }
  }, [data?.settings]);

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

  const tableContainerRef = useRef<HTMLDivElement>(null);

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
      const y = currentYear;
      const m = currentMonth + 1;
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? y + 1 : y;
      start = `${y}-${String(m).padStart(2, '0')}-15`;
      end = `${nextY}-${String(nextM).padStart(2, '0')}-15`;
    } else {
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

  // Save Settings (Weights & Meal Toggles)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breakfastEnabled: settingsForm.breakfastEnabled,
          lunchEnabled: settingsForm.lunchEnabled,
          dinnerEnabled: settingsForm.dinnerEnabled,
          breakfastWeight: Number(settingsForm.breakfastWeight),
          lunchWeight: Number(settingsForm.lunchWeight),
          dinnerWeight: Number(settingsForm.dinnerWeight),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'সেটিংস আপডেট করতে ব্যর্থ হয়েছে');
      }

      setSettingsSuccess('মিল ইউনিট ও সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
      setTimeout(() => {
        setIsSettingsOpen(false);
        setSettingsSuccess(null);
      }, 1200);

      // Refresh grid with new weights
      await fetchGridData(startDate, endDate);
    } catch (err: any) {
      setSettingsError(err.message || 'সেটিংস সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSavingSettings(false);
    }
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
      breakfast: currentMeal?.breakfast ?? (settingsForm.breakfastEnabled ? 1 : 0),
      lunch: currentMeal?.lunch ?? (settingsForm.lunchEnabled ? 1 : 0),
      dinner: currentMeal?.dinner ?? (settingsForm.dinnerEnabled ? 1 : 0),
      custom: currentMeal?.custom ?? 0,
      notes: currentMeal?.notes ?? '',
    });
  };

  // Quick Preset Setter in Modal (Adapts dynamically to enabled meals & unit weights)
  const applyMealPreset = (bf: number, lunch: number, dinner: number) => {
    if (!editingCell) return;
    setEditingCell({
      ...editingCell,
      breakfast: settingsForm.breakfastEnabled ? bf : 0,
      lunch: settingsForm.lunchEnabled ? lunch : 0,
      dinner: settingsForm.dinnerEnabled ? dinner : 0,
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
          breakfastCount: settingsForm.breakfastEnabled ? editingCell.breakfast : 0,
          lunchCount: settingsForm.lunchEnabled ? editingCell.lunch : 0,
          dinnerCount: settingsForm.dinnerEnabled ? editingCell.dinner : 0,
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

      // Optimistically update local state
      if (data && data.members) {
        const bfW = settingsForm.breakfastEnabled ? settingsForm.breakfastWeight : 0;
        const lunchW = settingsForm.lunchEnabled ? settingsForm.lunchWeight : 0;
        const dinW = settingsForm.dinnerEnabled ? settingsForm.dinnerWeight : 0;

        const updatedMembers = data.members.map((m: any) => {
          if (m.membershipId !== editingCell.membershipId) return m;

          const oldDay = m.dailyMeals[editingCell.dateString] || {};
          const newUnits = Number(
            (
              editingCell.breakfast * bfW +
              editingCell.lunch * lunchW +
              editingCell.dinner * dinW +
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

          // Recompute totals
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
          const estimatedCost = Number((totalUnits * mealRate).toFixed(2));
          const totalBazar = m.totals?.totalBazarTaka || 0;
          const balance = Number((totalBazar - estimatedCost).toFixed(2));

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
              estimatedCostTaka: estimatedCost,
              totalBazarTaka: totalBazar,
              balanceTaka: balance,
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

  // Filter & Order dates according to user preference
  const rawDates = data?.period?.dates || [];
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Compute tomorrow string for "Up to Today + 1" view
  const tomorrowStr = useMemo(() => {
    const tom = new Date(today.getTime() + 24 * 3600 * 1000);
    const y = tom.getFullYear();
    const m = String(tom.getMonth() + 1).padStart(2, '0');
    const d = String(tom.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const displayDates = useMemo(() => {
    let list = [...rawDates];

    // 1. Date Scope Filter: 'up-to-today' (show up to tomorrow so future empty days don't crowd the view)
    if (dateScope === 'up-to-today' && list.length > 0) {
      // If cycle includes today, limit to dates <= tomorrowStr
      const hasToday = list.some((d) => d.dateString === todayStr);
      if (hasToday) {
        list = list.filter((d) => d.dateString <= tomorrowStr);
      }
    }

    // 2. Sort Order: 'recent-first' (Newest date / today upfront) vs 'oldest-first'
    if (dateOrder === 'recent-first') {
      list.reverse();
    }

    // 3. Date Display Limit (e.g. 7 days for screen-fit mode)
    if (dateDisplayLimit === 'recent-7') {
      list = list.slice(0, 7);
    }

    return list;
  }, [rawDates, dateScope, dateOrder, dateDisplayLimit, todayStr, tomorrowStr]);

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

  const summary = data?.summary;
  const dailyTotals = data?.dailyTotals || {};

  // Dynamic weights from active settings
  const curBfWeight = settingsForm.breakfastEnabled ? settingsForm.breakfastWeight : 0;
  const curLunchWeight = settingsForm.lunchEnabled ? settingsForm.lunchWeight : 0;
  const curDinnerWeight = settingsForm.dinnerEnabled ? settingsForm.dinnerWeight : 0;

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar & Controls */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
                <CalendarRange className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  মাসিক ও কাস্টম মেস মিল রেজিস্টার শিট (Full Meal Matrix)
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <Sparkles className="h-3 w-3" />
                    সকালের ইউনিট: {settingsForm.breakfastEnabled ? settingsForm.breakfastWeight : 'বন্ধ'} | দুপুর: {settingsForm.lunchEnabled ? settingsForm.lunchWeight : 'বন্ধ'} | রাত: {settingsForm.dinnerEnabled ? settingsForm.dinnerWeight : 'বন্ধ'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Meal Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/80 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
            >
              <Settings className="h-3.5 w-3.5 text-emerald-700" />
              <span>মিল ইউনিট ও অন/অফ সেটিংস</span>
            </button>

            <button
              type="button"
              onClick={() => fetchGridData(startDate, endDate)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>প্রিন্ট শিট</span>
            </button>
          </div>
        </div>

        {/* Cycle Presets & Date Pickers */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => applyPreset('current-month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                cycleMode === 'current-month'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 চলতি মাস
            </button>
            <button
              type="button"
              onClick={() => applyPreset('previous-month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                cycleMode === 'previous-month'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
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
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔄 ১৫ হতে ১৫ তারিখ
            </button>
            <button
              type="button"
              onClick={() => applyPreset('custom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                cycleMode === 'custom'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚙️ কাস্টম রেঞ্জ
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
              className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
            >
              লোড করুন
            </button>

            {/* Quick 30d, 40d, 45d badges for Custom Mode */}
            {cycleMode === 'custom' && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium">সাইকেল:</span>
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

        {/* Date Focus & Sorting Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/60 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
          {/* Order Switcher: Recent First vs 1 to 30 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-emerald-600" />
              তারিখের ক্রম:
            </span>
            <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200 shadow-2xs text-xs">
              <button
                type="button"
                onClick={() => setDateOrder('recent-first')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  dateOrder === 'recent-first'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ নতুন/আজ আগে (Recent First)
              </button>
              <button
                type="button"
                onClick={() => setDateOrder('oldest-first')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  dateOrder === 'oldest-first'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ১ম হতে শেষ (1st to 30)
              </button>
            </div>
          </div>

          {/* Scope Filter: Up to Today vs Full Month */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-emerald-600" />
              প্রদর্শন:
            </span>
            <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200 shadow-2xs text-xs">
              <button
                type="button"
                onClick={() => setDateScope('up-to-today')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  dateScope === 'up-to-today'
                    ? 'bg-slate-800 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="আজ পর্যন্ত যে দিনগুলোর মিল হয়েছে সেগুলো দেখাবে, ভবিষ্যতের ফাঁকা দিনগুলো বাদ দিয়ে টেবিল স্পষ্ট রাখবে"
              >
                ✨ আজ ও সাম্প্রতিক দিন ({displayDates.length} দিন)
              </button>
              <button
                type="button"
                onClick={() => setDateScope('full-cycle')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  dateScope === 'full-cycle'
                    ? 'bg-slate-800 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌐 পুরো সাইকেল ({rawDates.length} দিন)
              </button>
            </div>
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
              {settingsForm.breakfastEnabled ? `সকাল: ${summary.totalBreakfast} | ` : ''}দুপুর: {summary.totalLunch} | রাত: {summary.totalDinner}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">মোট চার্জেবল ইউনিট</span>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">
              {summary.totalUnits.toFixed(1)}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">ইউনিট ওয়েট অনুযায়ী মোট</span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-2xs">
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

      {/* 3. Search and Quick Legend Bar */}
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

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
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
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200"></span>
            <span className="font-semibold text-emerald-800">আজকের দিন</span>
          </div>
        </div>
      </div>

      {/* 4. Display Modes & Column Collapse Controls (Screen Fit & -/+ Toggles) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Preset View Buttons: Screen Fit vs Full 30 Days */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            ভিউ মোড:
          </span>

          <button
            type="button"
            onClick={() => {
              setDateDisplayLimit('recent-7');
              setShowMealBreakdown(false);
              setShowMealCost(true);
              setDateOrder('recent-first');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              dateDisplayLimit === 'recent-7' && !showMealBreakdown
                ? 'bg-emerald-600 text-white shadow-emerald-600/20 ring-2 ring-emerald-500/30'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
            title="এক নজরে স্ক্রিনে সব দেখতে: সাম্প্রতিক ৭ দিন ও মোট মিল, বাজার ও ব্যালেন্স (নো স্ক্রলিং)"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span>🖥️ স্ক্রিন ফিট ভিউ (Fit on Screen)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDateDisplayLimit('all');
              setDateScope('full-cycle');
              setShowMealBreakdown(true);
              setShowMealCost(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              dateDisplayLimit === 'all' && showMealBreakdown && dateScope === 'full-cycle'
                ? 'bg-slate-800 text-white shadow-slate-800/20 ring-2 ring-slate-700/30'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
            title="পুরো ৩০ দিনের সকল তারিখ ও নাস্তা/দুপুর/রাতের বিস্তারিত বিবরণ দেখুন"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>📑 পূর্ণাঙ্গ ৩০ দিনের শিট (Full 30 Days)</span>
          </button>
        </div>

        {/* Granular [-] / [+] Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">কলাম কলাপ্স/হাইড:</span>

          {/* Toggle Meal Breakdown (Breakfast/Lunch/Dinner) */}
          <button
            type="button"
            onClick={() => setShowMealBreakdown(!showMealBreakdown)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              showMealBreakdown
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
            }`}
            title={showMealBreakdown ? 'নাস্তা, দুপুর ও রাতের কলামগুলো লুকিয়ে টেবিল ছোট করুন' : 'নাস্তা, দুপুর ও রাত প্রদর্শন করুন'}
          >
            {showMealBreakdown ? (
              <>
                <Minus className="h-3 w-3 text-slate-500" />
                <span>নাস্তা, দুপুর, রাত</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 text-amber-700" />
                <span>নাস্তা, দুপুর, রাত</span>
              </>
            )}
          </button>

          {/* Toggle Meal Cost */}
          <button
            type="button"
            onClick={() => setShowMealCost(!showMealCost)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              showMealCost
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
            }`}
            title={showMealCost ? 'মিলের খরচ কলাম লুকান' : 'মিলের খরচ কলাম দেখান'}
          >
            {showMealCost ? (
              <>
                <Minus className="h-3 w-3 text-slate-500" />
                <span>মিলের খরচ</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 text-amber-700" />
                <span>মিলের খরচ</span>
              </>
            )}
          </button>

          {/* Toggle Date Count: 7 Days vs Full */}
          <button
            type="button"
            onClick={() => setDateDisplayLimit(dateDisplayLimit === 'recent-7' ? 'all' : 'recent-7')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              dateDisplayLimit === 'recent-7'
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {dateDisplayLimit === 'recent-7' ? (
              <>
                <Plus className="h-3 w-3 text-amber-700" />
                <span>সব দিন ({rawDates.length} দিন)</span>
              </>
            ) : (
              <>
                <Minus className="h-3 w-3 text-slate-500" />
                <span>৭ দিন সীমাবদ্ধ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Full Period Matrix Spreadsheet Grid (Zero Bleed-Through, Crystal Clear Layout) */}
      <div className="rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">মিল রেজিস্টার শিট লোড হচ্ছে...</p>
            <p className="text-xs text-slate-400 mt-1">সব সদস্যের দৈনিক মিল ও রেট সমন্বয় করা হচ্ছে</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchGridData(startDate, endDate)}
              className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : (
          <div ref={tableContainerRef} className="overflow-x-auto max-w-full relative">
            <table className="w-full border-collapse text-left text-xs">
              {/* Header Row */}
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-700 select-none">
                  {/* Sticky Member Code (Solid Background & Z-30) */}
                  <th className="sticky left-0 z-30 bg-slate-100 px-3 py-3 font-bold text-slate-800 border-r border-slate-200 min-w-[65px] max-w-[65px]">
                    কোড
                  </th>
                  {/* Sticky Resident Name (Solid Background, Z-30, Solid Shadow Divider) */}
                  <th className="sticky left-[65px] z-30 bg-slate-100 px-4 py-3 font-bold text-slate-800 border-r-2 border-slate-300 min-w-[195px] max-w-[195px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)]">
                    মেম্বারের নাম ও রোল
                  </th>

                  {/* Day Columns */}
                  {displayDates.map((d: any) => (
                    <th
                      key={d.dateString}
                      className={`px-1.5 py-2.5 text-center border-r border-slate-200 min-w-[46px] transition ${
                        d.isToday
                          ? 'bg-emerald-100 text-emerald-950 font-black ring-2 ring-emerald-500/40 z-10'
                          : d.isWeekend
                          ? 'bg-amber-50 text-amber-900 font-semibold'
                          : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-[13px] leading-tight font-black flex items-center justify-center gap-1">
                        {d.dayNumber}
                        {d.isToday && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{d.dayNameBengali}</div>
                    </th>
                  ))}

                  {/* Optional Meal Breakdown Columns: নাস্তা, দুপুর, রাত */}
                  {showMealBreakdown && settingsForm.breakfastEnabled && (
                    <th className="bg-slate-100 px-2 py-3 text-center font-bold text-slate-700 border-l-2 border-slate-300 min-w-[54px]">
                      <div className="flex items-center justify-center gap-1">
                        <span>নাস্তা</span>
                        <button
                          type="button"
                          onClick={() => setShowMealBreakdown(false)}
                          className="h-3.5 w-3.5 rounded bg-slate-200 hover:bg-slate-300 inline-flex items-center justify-center text-slate-600"
                          title="নাস্তা, দুপুর ও রাত কলাম সংক্ষেপ করুন"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </th>
                  )}
                  {showMealBreakdown && settingsForm.lunchEnabled && (
                    <th className={`bg-slate-100 px-2 py-3 text-center font-bold text-slate-700 border-r border-slate-200 min-w-[50px] ${!settingsForm.breakfastEnabled ? 'border-l-2 border-slate-300' : ''}`}>
                      দুপুর
                    </th>
                  )}
                  {showMealBreakdown && settingsForm.dinnerEnabled && (
                    <th className="bg-slate-100 px-2 py-3 text-center font-bold text-slate-700 border-r border-slate-200 min-w-[50px]">
                      রাত
                    </th>
                  )}

                  {/* Core Metric 1: মোট মিল ও ইউনিট */}
                  <th className={`bg-emerald-50 px-2.5 py-3 text-center font-black text-emerald-900 border-r border-slate-200 min-w-[60px] ${!showMealBreakdown ? 'border-l-2 border-slate-300' : ''}`}>
                    <div className="flex items-center justify-center gap-1">
                      <span>মোট মিল</span>
                      {!showMealBreakdown && (
                        <button
                          type="button"
                          onClick={() => setShowMealBreakdown(true)}
                          className="h-3.5 w-3.5 rounded bg-emerald-200 hover:bg-emerald-300 inline-flex items-center justify-center text-emerald-800"
                          title="নাস্তা, দুপুর ও রাত বিস্তারিত দেখুন"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </th>
                  <th className="bg-emerald-100 px-3 py-3 text-center font-black text-emerald-950 border-r border-slate-200 min-w-[65px]">
                    ইউনিট
                  </th>

                  {/* Meal Cost (Collapsible) */}
                  {showMealCost && (
                    <th className="bg-slate-100 px-3 py-3 text-right font-black text-slate-900 border-r border-slate-200 min-w-[85px]">
                      <div className="flex items-center justify-end gap-1">
                        <span>খরচ (৳)</span>
                        <button
                          type="button"
                          onClick={() => setShowMealCost(false)}
                          className="h-3.5 w-3.5 rounded bg-slate-200 hover:bg-slate-300 inline-flex items-center justify-center text-slate-600"
                          title="মিলের খরচ লুকান"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </th>
                  )}

                  {/* Core Metric 2: বাজার খরচ (৳) */}
                  <th className="bg-blue-50/80 px-3 py-3 text-right font-black text-blue-950 border-r border-slate-200 min-w-[95px]">
                    <div className="flex items-center justify-end gap-1">
                      <ShoppingBag className="h-3.5 w-3.5 text-blue-600 inline" />
                      <span>বাজার (৳)</span>
                    </div>
                  </th>

                  {/* Core Metric 3: পাবে বা দিবে (৳) */}
                  <th className="bg-emerald-50/70 px-3.5 py-3 text-center font-black text-slate-900 min-w-[120px]">
                    <div className="flex items-center justify-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-emerald-700 inline" />
                      <span>পাবে বা দিবে (৳)</span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Body Rows */}
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m: any, mIdx: number) => {
                  const roles = m.assignedRoles || [];
                  const primaryRole = roles[0] || 'member';
                  const roleMeta = (ROLE_TEMPLATES_INFO as any)[primaryRole] || ROLE_TEMPLATES_INFO.member;
                  const balance = m.totals?.balanceTaka ?? 0;
                  const totalBazar = m.totals?.totalBazarTaka ?? 0;

                  return (
                    <tr
                      key={m.membershipId}
                      className={`group transition-colors ${
                        mIdx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/60'
                      }`}
                    >
                      {/* Sticky Code (Solid 100% Opaque bg-white/slate-50 on hover) */}
                      <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-100 px-3 py-2.5 font-mono text-[11px] font-bold text-slate-600 border-r border-slate-200">
                        {m.memberCode || `M-${mIdx + 1}`}
                      </td>

                      {/* Sticky Resident Name (Solid 100% Opaque, Z-20, Right Divider Shadow) */}
                      <td className="sticky left-[65px] z-20 bg-white group-hover:bg-slate-100 px-4 py-2.5 border-r-2 border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                        <div className="font-bold text-slate-900 truncate max-w-[175px]" title={m.memberName}>
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

                      {/* Day Cells (Scrolls freely behind the left sticky columns with ZERO bleed) */}
                      {displayDates.map((d: any) => {
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
                            title={`${m.memberName} (${d.dayNumber} ${d.dayNameBengali}): ${settingsForm.breakfastEnabled ? `সকাল: ${dayMeal?.breakfast ?? 0}, ` : ''}দুপুর: ${dayMeal?.lunch ?? 0}, রাত: ${dayMeal?.dinner ?? 0} (ক্লিক করে পরিবর্তন করুন)`}
                            className={`px-1 py-1.5 text-center border-r border-slate-100 cursor-pointer select-none transition relative ${
                              d.isToday
                                ? 'bg-emerald-50/70 hover:bg-emerald-100/90'
                                : d.isWeekend
                                ? 'bg-amber-50/40 hover:bg-amber-100/60'
                                : 'hover:bg-slate-100'
                            }`}
                          >
                            {isOff ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                OFF
                              </span>
                            ) : totalUnits > 0 ? (
                              <span className="font-bold text-slate-900 text-[11.5px] hover:text-emerald-700">
                                {totalUnits % 1 === 0 ? totalUnits.toFixed(0) : totalUnits.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-light">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Meal Breakdown Columns */}
                      {showMealBreakdown && settingsForm.breakfastEnabled && (
                        <td className="px-2 py-2.5 text-center font-medium text-slate-700 border-l-2 border-slate-300 bg-slate-50/60">
                          {m.totals.totalBreakfast}
                        </td>
                      )}
                      {showMealBreakdown && settingsForm.lunchEnabled && (
                        <td className={`px-2 py-2.5 text-center font-medium text-slate-700 border-r border-slate-200 bg-slate-50/60 ${!settingsForm.breakfastEnabled ? 'border-l-2 border-slate-300' : ''}`}>
                          {m.totals.totalLunch}
                        </td>
                      )}
                      {showMealBreakdown && settingsForm.dinnerEnabled && (
                        <td className="px-2 py-2.5 text-center font-medium text-slate-700 border-r border-slate-200 bg-slate-50/60">
                          {m.totals.totalDinner}
                        </td>
                      )}

                      {/* Core Metric 1: মোট মিল ও ইউনিট */}
                      <td className={`bg-emerald-50 px-2.5 py-2.5 text-center font-bold text-emerald-900 border-r border-slate-200 ${!showMealBreakdown ? 'border-l-2 border-slate-300' : ''}`}>
                        {m.totals.totalMeals}
                      </td>
                      <td className="bg-emerald-100 px-3 py-2.5 text-center font-black text-emerald-950 border-r border-slate-200">
                        {m.totals.totalUnits.toFixed(1)}
                      </td>

                      {/* Meal Cost (Collapsible) */}
                      {showMealCost && (
                        <td className="px-3 py-2.5 text-right font-black text-slate-900 bg-slate-50/80 border-r border-slate-200">
                          ৳{m.totals.estimatedCostTaka.toLocaleString()}
                        </td>
                      )}

                      {/* Core Metric 2: বাজার খরচ (৳) */}
                      <td className="px-3 py-2.5 text-right font-black text-blue-950 bg-blue-50/40 border-r border-slate-200">
                        ৳{totalBazar.toLocaleString()}
                      </td>

                      {/* Core Metric 3: পাবে বা দিবে (৳) */}
                      <td className="px-3 py-2.5 text-center font-bold bg-white">
                        {balance > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black shadow-2xs whitespace-nowrap">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                            পাবে ৳{Math.round(balance).toLocaleString()}
                          </span>
                        ) : balance < 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-black shadow-2xs whitespace-nowrap">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                            দিবে ৳{Math.abs(Math.round(balance)).toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                            ব্যালেন্স ৳০
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Bottom Summary Row: Daily Mess Totals */}
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-800">
                  {/* Sticky Total Label (Solid Z-30) */}
                  <td className="sticky left-0 z-30 bg-slate-200 px-3 py-3 text-slate-700 border-r border-slate-300">
                    মোট
                  </td>
                  <td className="sticky left-[65px] z-30 bg-slate-200 px-4 py-3 text-slate-900 border-r-2 border-slate-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)]">
                    দৈনিক মেসের সর্বমোট মিল
                  </td>

                  {/* Daily Column Sums */}
                  {displayDates.map((d: any) => {
                    const dt = dailyTotals[d.dateString];
                    const count = dt?.totalMeals ?? 0;
                    return (
                      <td
                        key={d.dateString}
                        className={`px-1 py-2.5 text-center border-r border-slate-300 text-[11px] font-bold ${
                          d.isToday
                            ? 'bg-emerald-200 text-emerald-950 ring-1 ring-emerald-500/40'
                            : d.isWeekend
                            ? 'bg-amber-100 text-amber-950'
                            : 'bg-slate-100'
                        }`}
                      >
                        {count > 0 ? count : '-'}
                      </td>
                    );
                  })}

                  {/* Grand Totals */}
                  {showMealBreakdown && settingsForm.breakfastEnabled && (
                    <td className="px-2 py-3 text-center border-l-2 border-slate-300 bg-slate-200">
                      {summary?.totalBreakfast}
                    </td>
                  )}
                  {showMealBreakdown && settingsForm.lunchEnabled && (
                    <td className={`px-2 py-3 text-center border-r border-slate-300 bg-slate-200 ${!settingsForm.breakfastEnabled ? 'border-l-2 border-slate-300' : ''}`}>
                      {summary?.totalLunch}
                    </td>
                  )}
                  {showMealBreakdown && settingsForm.dinnerEnabled && (
                    <td className="px-2 py-3 text-center border-r border-slate-300 bg-slate-200">
                      {summary?.totalDinner}
                    </td>
                  )}
                  <td className={`bg-emerald-200 px-2.5 py-3 text-center text-emerald-950 border-r border-slate-300 font-black ${!showMealBreakdown ? 'border-l-2 border-slate-300' : ''}`}>
                    {summary?.totalMeals}
                  </td>
                  <td className="bg-emerald-300 px-3 py-3 text-center text-emerald-950 border-r border-slate-300 font-black">
                    {summary?.totalUnits?.toFixed(1)}
                  </td>
                  {showMealCost && (
                    <td className="px-3 py-3 text-right text-slate-900 bg-slate-200 font-black border-r border-slate-300">
                      ৳{summary?.totalEstimatedMealCostTaka?.toLocaleString()}
                    </td>
                  )}
                  <td className="px-3 py-3 text-right text-blue-950 bg-blue-100/70 font-black border-r border-slate-300">
                    ৳{summary?.totalBazarExpenseTaka?.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-3 text-center text-slate-700 bg-slate-200 font-bold">
                    <span className="text-[11px] text-slate-600 bg-slate-300/60 px-2 py-0.5 rounded-md">ব্যালেন্স সমন্বয়</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* 5. Meal Weights & Toggles Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Settings className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    মিল সেটিংস ও ইউনিট ওজন (Meal Configuration)
                  </h3>
                  <p className="text-xs text-slate-500">
                    কোন মিলগুলো মেসে রান্না হয় এবং প্রতিটির ইউনিট কত গণনা হবে তা নির্ধারণ করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {settingsError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{settingsError}</span>
              </div>
            )}

            {settingsSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* 1. Meal ON/OFF Switches */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  ১. মেসে কোন কোন মিল চালু থাকবে? (Meal Toggles)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Breakfast Switch */}
                  <div className={`p-3 rounded-xl border transition ${settingsForm.breakfastEnabled ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <Coffee className="h-3.5 w-3.5 text-amber-600" />
                        <span>সকাল</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.breakfastEnabled}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, breakfastEnabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {settingsForm.breakfastEnabled ? 'সকালের নাস্তা চালু' : 'নাস্তা বন্ধ'}
                    </span>
                  </div>

                  {/* Lunch Switch */}
                  <div className={`p-3 rounded-xl border transition ${settingsForm.lunchEnabled ? 'bg-orange-50/60 border-orange-300' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <Sun className="h-3.5 w-3.5 text-orange-500" />
                        <span>দুপুর</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.lunchEnabled}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, lunchEnabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {settingsForm.lunchEnabled ? 'দুপুরের খাবার চালু' : 'দুপুর বন্ধ'}
                    </span>
                  </div>

                  {/* Dinner Switch */}
                  <div className={`p-3 rounded-xl border transition ${settingsForm.dinnerEnabled ? 'bg-indigo-50/60 border-indigo-300' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <Moon className="h-3.5 w-3.5 text-indigo-600" />
                        <span>রাত</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.dinnerEnabled}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, dinnerEnabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {settingsForm.dinnerEnabled ? 'রাতের খাবার চালু' : 'রাত বন্ধ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Meal Unit Weights Configuration */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 block">
                  ২. মিলের ইউনিট ওজন নির্ধারণ (Unit Weights)
                </label>
                <p className="text-[11px] text-slate-500 -mt-2">
                  সকালের নাস্তাকে সাধারণত হাফ (০.৫) মিল ধরা হয়, তবে মেসে চাইলে ১ বা ০.৭৫ করে নির্ধারণ করা যাবে।
                </p>

                {/* Breakfast Weight Input & Presets */}
                <div className={`space-y-2 p-3 rounded-xl border ${settingsForm.breakfastEnabled ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 opacity-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Coffee className="h-3.5 w-3.5 text-amber-600" />
                      সকালের নাস্তার ইউনিট ওজন:
                    </span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="3"
                      disabled={!settingsForm.breakfastEnabled}
                      value={settingsForm.breakfastWeight}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          breakfastWeight: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-center text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>

                  {settingsForm.breakfastEnabled && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500">প্রিসেট:</span>
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, breakfastWeight: 0.5 })}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${settingsForm.breakfastWeight === 0.5 ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
                      >
                        হাফ (০.৫)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, breakfastWeight: 1.0 })}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${settingsForm.breakfastWeight === 1.0 ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
                      >
                        ফুল মিল (১.০)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, breakfastWeight: 0.75 })}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${settingsForm.breakfastWeight === 0.75 ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
                      >
                        পৌনে (০.৭৫)
                      </button>
                    </div>
                  )}
                </div>

                {/* Lunch & Dinner Weights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Lunch Weight */}
                  <div className={`p-3 rounded-xl border ${settingsForm.lunchEnabled ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 opacity-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sun className="h-3.5 w-3.5 text-orange-500" />
                        দুপুরের ইউনিট:
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="3"
                        disabled={!settingsForm.lunchEnabled}
                        value={settingsForm.lunchWeight}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            lunchWeight: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-center text-slate-800 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Dinner Weight */}
                  <div className={`p-3 rounded-xl border ${settingsForm.dinnerEnabled ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 opacity-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Moon className="h-3.5 w-3.5 text-indigo-600" />
                        রাতের ইউনিট:
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="3"
                        disabled={!settingsForm.dinnerEnabled}
                        value={settingsForm.dinnerWeight}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            dinnerWeight: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-center text-slate-800 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
                >
                  {savingSettings ? (
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
            </form>
          </div>
        </div>
      )}

      {/* 6. Dynamic Cell Edit Modal / Popover */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
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

            {/* Quick 1-Click Preset Buttons (Adapts to Active Settings) */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">দ্রুত প্রিসেট নির্বাচন:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyMealPreset(0, 0, 0)}
                  className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                >
                  🚫 মিল বন্ধ / অফ (০)
                </button>

                <button
                  type="button"
                  onClick={() => applyMealPreset(1, 1, 1)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  🍳 ফুল মিল ({(curBfWeight + curLunchWeight + curDinnerWeight).toFixed(1)})
                </button>

                {settingsForm.lunchEnabled && settingsForm.dinnerEnabled && (
                  <button
                    type="button"
                    onClick={() => applyMealPreset(0, 1, 1)}
                    className="rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 transition"
                  >
                    🍛 দুপুর + রাত ({(curLunchWeight + curDinnerWeight).toFixed(1)})
                  </button>
                )}

                {settingsForm.breakfastEnabled && (
                  <button
                    type="button"
                    onClick={() => applyMealPreset(1, 0, 0)}
                    className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                  >
                    ☕ নাস্তা মাত্র ({curBfWeight.toFixed(1)})
                  </button>
                )}
              </div>
            </div>

            {/* Meal Items Counters */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
              {/* Breakfast Counter */}
              {settingsForm.breakfastEnabled ? (
                <div className="rounded-xl border border-slate-200 p-2.5 text-center space-y-1 bg-amber-50/30">
                  <div className="flex items-center justify-center gap-1 text-slate-700 text-xs font-bold">
                    <Coffee className="h-3.5 w-3.5 text-amber-600" />
                    <span>সকাল ({settingsForm.breakfastWeight})</span>
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
              ) : (
                <div className="rounded-xl border border-slate-200 p-2 text-center bg-slate-100 opacity-60">
                  <span className="text-[10px] text-slate-400 font-semibold block">নাস্তা বন্ধ</span>
                </div>
              )}

              {/* Lunch Counter */}
              {settingsForm.lunchEnabled ? (
                <div className="rounded-xl border border-slate-200 p-2.5 text-center space-y-1 bg-orange-50/30">
                  <div className="flex items-center justify-center gap-1 text-slate-700 text-xs font-bold">
                    <Sun className="h-3.5 w-3.5 text-orange-500" />
                    <span>দুপুর ({settingsForm.lunchWeight})</span>
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
              ) : (
                <div className="rounded-xl border border-slate-200 p-2 text-center bg-slate-100 opacity-60">
                  <span className="text-[10px] text-slate-400 font-semibold block">দুপুর বন্ধ</span>
                </div>
              )}

              {/* Dinner Counter */}
              {settingsForm.dinnerEnabled ? (
                <div className="rounded-xl border border-slate-200 p-2.5 text-center space-y-1 bg-indigo-50/30">
                  <div className="flex items-center justify-center gap-1 text-slate-700 text-xs font-bold">
                    <Moon className="h-3.5 w-3.5 text-indigo-600" />
                    <span>রাত ({settingsForm.dinnerWeight})</span>
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
              ) : (
                <div className="rounded-xl border border-slate-200 p-2 text-center bg-slate-100 opacity-60">
                  <span className="text-[10px] text-slate-400 font-semibold block">রাত বন্ধ</span>
                </div>
              )}
            </div>

            {/* Calculated Units Note */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/90 p-2.5 text-center text-xs text-emerald-900 font-semibold">
              মোট প্রযোজ্য ইউনিট:{' '}
              <span className="text-sm font-black text-emerald-800">
                {(
                  (settingsForm.breakfastEnabled ? editingCell.breakfast * settingsForm.breakfastWeight : 0) +
                  (settingsForm.lunchEnabled ? editingCell.lunch * settingsForm.lunchWeight : 0) +
                  (settingsForm.dinnerEnabled ? editingCell.dinner * settingsForm.dinnerWeight : 0) +
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
