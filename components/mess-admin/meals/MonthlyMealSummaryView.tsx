'use client';

import React, { useState } from 'react';
import {
  Calculator,
  Lock,
  Unlock,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PeriodLockModal } from './PeriodLockModal';

interface MonthlyMealSummaryViewProps {
  tenantSlug: string;
  initialSummary: any;
  onRefresh: (month?: string) => void;
}

export function MonthlyMealSummaryView({
  tenantSlug,
  initialSummary,
  onRefresh,
}: MonthlyMealSummaryViewProps) {
  const [summary, setSummary] = useState<any>(initialSummary);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialSummary?.monthString ||
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [loading, setLoading] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);



  const fetchSummary = async (monthStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/summary?month=${monthStr}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSummary(json.data);
        setSelectedMonth(monthStr);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const calc = summary?.calculation || {};
  const members = summary?.membersSummary || [];
  const isLocked = Boolean(summary?.isLocked);

  return (
    <div className="space-y-6">
      {/* Month Navigation & Period Lock Action */}
      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Billing Month:
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => fetchSummary(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border bg-background text-foreground"
          />
          {isLocked ? (
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Month Frozen & Closed</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Unlock className="w-3.5 h-3.5" />
              <span>Open for Changes</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>
          <button
            onClick={() => setIsLockModalOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg text-white transition shadow-sm ${
              isLocked
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isLocked ? 'Unlock Month' : 'Lock & Finalize Month'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Meal Rate Formula Card */}
      <div className="p-6 rounded-xl border border-primary/30 bg-primary/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Official Meal Rate
              </span>
            </div>
            <div className="text-3xl font-extrabold text-foreground mt-1">
              ৳{Number(calc.calculatedMealRateTaka || 0).toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                per chargeable meal unit
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-card text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              <span>Standard Calculation Formula</span>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              Meal Rate = Eligible Expenses / Total Chargeable Units
            </div>
          </div>
        </div>

        {/* Calculation Equation Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-primary/20">
          <div className="p-3 rounded-lg bg-card border border-border">
            <span className="text-[11px] text-muted-foreground">Eligible Meal Expenses</span>
            <div className="text-base font-bold text-foreground mt-0.5">
              ৳{Number(calc.totalEligibleExpensesTaka || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground">
              Categories: {calc.eligibleCategories?.join(', ') || 'Bazar & Cook'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border">
            <span className="text-[11px] text-muted-foreground">Chargeable Meal Units</span>
            <div className="text-base font-bold text-foreground mt-0.5">
              {Number(calc.totalChargeableUnits || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {calc.totalMemberMealsCount || 0} total physical meals
            </span>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border">
            <span className="text-[11px] text-muted-foreground">Guest Meals Logged</span>
            <div className="text-base font-bold text-foreground mt-0.5">
              {calc.totalGuestMealsCount || 0} meals
            </div>
            <span className="text-[10px] text-muted-foreground">
              Revenue: ৳{(Number(calc.guestMealRevenuePoisha || 0) / 100).toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border">
            <span className="text-[11px] text-muted-foreground">Status</span>
            <div className="text-base font-bold text-foreground mt-0.5">
              {isLocked ? 'Frozen / Locked' : 'Dynamic / Live'}
            </div>
            <span className="text-[10px] text-muted-foreground">
              Zero-drift poisha math
            </span>
          </div>
        </div>
      </div>

      {/* Member-by-Member Breakdown Table */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Resident Monthly Meal & Bill Matrix
        </h3>

        {loading ? (
          <div className="p-12 text-center rounded-xl border border-border bg-card">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
            <p className="text-xs text-muted-foreground mt-2">Aggregating monthly figures...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-border bg-card">
            <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-xs text-muted-foreground">No member data recorded for this month.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Resident</th>
                    <th className="px-4 py-3 font-medium text-center">Breakfast</th>
                    <th className="px-4 py-3 font-medium text-center">Lunch</th>
                    <th className="px-4 py-3 font-medium text-center">Dinner</th>
                    <th className="px-4 py-3 font-medium text-center">Total Meals</th>
                    <th className="px-4 py-3 font-medium text-center">Chargeable Units</th>
                    <th className="px-4 py-3 font-medium text-center">Meal-Offs</th>
                    <th className="px-4 py-3 font-medium text-center">Guest Meals</th>
                    <th className="px-4 py-3 font-medium text-right">Est. Meal Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m: any) => (
                    <tr key={m.membershipId} className="hover:bg-muted/20 transition">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {m.memberName}
                        {m.memberCode && (
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            ({m.memberCode})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {m.totalBreakfast}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {m.totalLunch}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {m.totalDinner}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-foreground">
                        {m.totalMeals}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-primary">
                        {m.totalChargeableUnits}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {m.mealOffDays}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {m.hostedGuestMeals}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        ৳{m.estimatedCostTaka.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Lock/Unlock Modal */}
      <PeriodLockModal
        tenantSlug={tenantSlug}
        monthString={selectedMonth}
        isCurrentlyLocked={isLocked}
        finalMealRateTaka={Number(calc.calculatedMealRateTaka || 0)}
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onSuccess={() => {
          void fetchSummary(selectedMonth);
          onRefresh(selectedMonth);
        }}
      />
    </div>
  );
}
