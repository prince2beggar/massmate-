'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Utensils,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Lock,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DailyMealSheetViewProps {
  tenantSlug: string;
  initialSheet: any;
  onRefresh: (date?: string) => void;
}

export function DailyMealSheetView({
  tenantSlug,
  initialSheet,
  onRefresh,
}: DailyMealSheetViewProps) {
  const [sheet, setSheet] = useState<any>(initialSheet);
  const [currentDate, setCurrentDate] = useState<string>(
    initialSheet?.dateString || new Date().toISOString().split('T')[0]
  );
  const [entries, setEntries] = useState<any[]>(initialSheet?.memberEntries || []);
  const [breakfastMenu, setBreakfastMenu] = useState(
    initialSheet?.dailyLog?.breakfastMenu || ''
  );
  const [lunchMenu, setLunchMenu] = useState(initialSheet?.dailyLog?.lunchMenu || '');
  const [dinnerMenu, setDinnerMenu] = useState(initialSheet?.dailyLog?.dinnerMenu || '');
  const [specialNotes, setSpecialNotes] = useState(
    initialSheet?.dailyLog?.specialNotes || ''
  );

  const [saving, setSaving] = useState(false);
  const [loadingDate, setLoadingDate] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );



  const loadDateSheet = async (dateStr: string) => {
    setLoadingDate(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/daily?date=${dateStr}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSheet(json.data);
        setCurrentDate(dateStr);
        setEntries(json.data.memberEntries || []);
        setBreakfastMenu(json.data.dailyLog?.breakfastMenu || '');
        setLunchMenu(json.data.dailyLog?.lunchMenu || '');
        setDinnerMenu(json.data.dailyLog?.dinnerMenu || '');
        setSpecialNotes(json.data.dailyLog?.specialNotes || '');
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to fetch meal sheet for selected date' });
    } finally {
      setLoadingDate(false);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate + 'T12:00:00Z');
    d.setDate(d.getDate() - 1);
    const prev = d.toISOString().split('T')[0];
    loadDateSheet(prev);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate + 'T12:00:00Z');
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    loadDateSheet(next);
  };

  const handleEntryChange = (
    membershipId: string,
    field: 'breakfastCount' | 'lunchCount' | 'dinnerCount',
    val: number
  ) => {
    setEntries((prev) =>
      prev.map((item) => {
        if (item.membershipId === membershipId) {
          const updated = { ...item, [field]: Math.max(0, val) };
          const bw = sheet.settings.breakfastWeight || 0.5;
          const lw = sheet.settings.lunchWeight || 1.0;
          const dw = sheet.settings.dinnerWeight || 1.0;
          updated.totalChargeableUnits = Number(
            (
              updated.breakfastCount * bw +
              updated.lunchCount * lw +
              updated.dinnerCount * dw +
              (updated.customCount || 0)
            ).toFixed(2)
          );
          return updated;
        }
        return item;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateString: currentDate,
          breakfastMenu: breakfastMenu.trim() || undefined,
          lunchMenu: lunchMenu.trim() || undefined,
          dinnerMenu: dinnerMenu.trim() || undefined,
          specialNotes: specialNotes.trim() || undefined,
          entries: entries.map((e) => ({
            membershipId: e.membershipId,
            breakfastCount: e.breakfastCount,
            lunchCount: e.lunchCount,
            dinnerCount: e.dinnerCount,
            customCount: e.customCount || 0,
            notes: e.notes || undefined,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error?.message || 'মিল সেভ করতে ব্যর্থ হয়েছে');
      }

      setFeedback({
        type: 'success',
        message: `Successfully saved daily meal records for ${currentDate}`,
      });
      onRefresh(currentDate);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving daily meals' });
    } finally {
      setSaving(false);
    }
  };

  const totalBreakfast = entries.reduce((acc, e) => acc + (Number(e.breakfastCount) || 0), 0);
  const totalLunch = entries.reduce((acc, e) => acc + (Number(e.lunchCount) || 0), 0);
  const totalDinner = entries.reduce((acc, e) => acc + (Number(e.dinnerCount) || 0), 0);
  const totalUnits = entries
    .reduce((acc, e) => acc + (Number(e.totalChargeableUnits) || 0), 0)
    .toFixed(2);
  const totalMealOff = entries.filter((e) => e.hasMealOff).length;

  return (
    <div className="space-y-6">
      {/* Date Header Strip */}
      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            disabled={loadingDate}
            className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition text-foreground"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => loadDateSheet(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background text-foreground"
          />
          <button
            onClick={handleNextDay}
            disabled={loadingDate}
            className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition text-foreground"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => loadDateSheet(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground hover:bg-muted transition"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          {sheet?.isLocked ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Period Closed</span>
            </span>
          ) : sheet?.cutoffPassed ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border">
              <Clock className="w-3.5 h-3.5" />
              <span>Past Cutoff ({sheet?.defaultCutoffTime})</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Active (Cutoff: {sheet?.defaultCutoffTime || '20:00'})</span>
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving || sheet?.isLocked}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Sheet</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground font-medium">Residents</span>
          <div className="text-lg font-bold text-foreground mt-0.5">{entries.length}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground font-medium">Breakfast</span>
          <div className="text-lg font-bold text-foreground mt-0.5">{totalBreakfast}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground font-medium">Lunch</span>
          <div className="text-lg font-bold text-foreground mt-0.5">{totalLunch}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground font-medium">Dinner</span>
          <div className="text-lg font-bold text-foreground mt-0.5">{totalDinner}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground font-medium">Total Units</span>
          <div className="text-lg font-bold text-primary mt-0.5">{totalUnits}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground font-medium">Meal-Offs</span>
          <div className="text-lg font-bold text-amber-600 mt-0.5">{totalMealOff}</div>
        </div>
      </div>

      {/* Daily Menu Banner */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Daily Menu & Kitchen Notes
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Breakfast Menu
            </label>
            <input
              type="text"
              placeholder="e.g. Paratha, Daal, Egg"
              value={breakfastMenu}
              onChange={(e) => setBreakfastMenu(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Lunch Menu
            </label>
            <input
              type="text"
              placeholder="e.g. Rice, Fish Curry, Vegetables"
              value={lunchMenu}
              onChange={(e) => setLunchMenu(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Dinner Menu
            </label>
            <input
              type="text"
              placeholder="e.g. Rice, Chicken Curry, Lentil"
              value={dinnerMenu}
              onChange={(e) => setDinnerMenu(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Daily Entry Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Resident Member</th>
                <th className="px-4 py-3 font-medium text-center">
                  Breakfast (w: {sheet?.settings?.breakfastWeight ?? 0.5})
                </th>
                <th className="px-4 py-3 font-medium text-center">
                  Lunch (w: {sheet?.settings?.lunchWeight ?? 1.0})
                </th>
                <th className="px-4 py-3 font-medium text-center">
                  Dinner (w: {sheet?.settings?.dinnerWeight ?? 1.0})
                </th>
                <th className="px-4 py-3 font-medium text-center">Chargeable Units</th>
                <th className="px-4 py-3 font-medium">Status / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No active residents found in this mess.
                  </td>
                </tr>
              ) : (
                entries.map((m) => (
                  <tr
                    key={m.membershipId}
                    className={`hover:bg-muted/20 transition ${
                      m.hasMealOff ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground">{m.memberName}</span>
                      {m.memberCode && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {m.memberCode}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={m.hasMealOff || sheet?.isLocked}
                        value={m.breakfastCount}
                        onChange={(e) =>
                          handleEntryChange(
                            m.membershipId,
                            'breakfastCount',
                            parseFloat(e.target.value || '0')
                          )
                        }
                        className="w-16 px-2 py-1 text-xs text-center rounded border border-border bg-background text-foreground disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={m.hasMealOff || sheet?.isLocked}
                        value={m.lunchCount}
                        onChange={(e) =>
                          handleEntryChange(
                            m.membershipId,
                            'lunchCount',
                            parseFloat(e.target.value || '0')
                          )
                        }
                        className="w-16 px-2 py-1 text-xs text-center rounded border border-border bg-background text-foreground disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={m.hasMealOff || sheet?.isLocked}
                        value={m.dinnerCount}
                        onChange={(e) =>
                          handleEntryChange(
                            m.membershipId,
                            'dinnerCount',
                            parseFloat(e.target.value || '0')
                          )
                        }
                        className="w-16 px-2 py-1 text-xs text-center rounded border border-border bg-background text-foreground disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-foreground">
                      {m.totalChargeableUnits}
                    </td>
                    <td className="px-4 py-3">
                      {m.hasMealOff ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Meal-Off {m.mealOffReason ? `(${m.mealOffReason})` : ''}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">
                          {m.notes || 'Normal'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
