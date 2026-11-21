'use client';

import React from 'react';
import {
  Users,
  BedDouble,
  UtensilsCrossed,
  PieChart,
  Clock,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { MessDashboardOverviewDto } from '@/server/mess-admin/mess-dashboard-service';

interface MessChartsSectionProps {
  charts: MessDashboardOverviewDto['charts'];
}

export function MessChartsSection({ charts }: MessChartsSectionProps) {
  const memberTotal =
    charts.memberStatistics.active +
    charts.memberStatistics.pending +
    charts.memberStatistics.inactive;

  const activePct =
    memberTotal > 0
      ? Math.round((charts.memberStatistics.active / memberTotal) * 100)
      : 0;
  const pendingPct =
    memberTotal > 0
      ? Math.round((charts.memberStatistics.pending / memberTotal) * 100)
      : 0;
  const inactivePct =
    memberTotal > 0
      ? Math.round((charts.memberStatistics.inactive / memberTotal) * 100)
      : 0;

  const expenseCategories = [
    { name: 'Bazar / Grocery', pct: 0, color: 'bg-emerald-500' },
    { name: 'Electricity', pct: 0, color: 'bg-amber-500' },
    { name: 'Gas / Fuel', pct: 0, color: 'bg-orange-500' },
    { name: 'Water', pct: 0, color: 'bg-cyan-500' },
    { name: 'WiFi / Internet', pct: 0, color: 'bg-blue-500' },
    { name: 'Cleaning & Maid', pct: 0, color: 'bg-purple-500' },
    { name: 'Maintenance', pct: 0, color: 'bg-rose-500' },
    { name: 'Other Sundries', pct: 0, color: 'bg-slate-400' },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Member Statistics Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Member Roster Distribution
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total: {memberTotal}
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="space-y-2">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            {activePct > 0 && (
              <div
                style={{ width: `${activePct}%` }}
                className="bg-emerald-500 transition-all"
                title={`Active: ${charts.memberStatistics.active} (${activePct}%)`}
              />
            )}
            {pendingPct > 0 && (
              <div
                style={{ width: `${pendingPct}%` }}
                className="bg-amber-400 transition-all"
                title={`Pending: ${charts.memberStatistics.pending} (${pendingPct}%)`}
              />
            )}
            {inactivePct > 0 && (
              <div
                style={{ width: `${inactivePct}%` }}
                className="bg-slate-300 transition-all"
                title={`Inactive: ${charts.memberStatistics.inactive} (${inactivePct}%)`}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            <div className="rounded-lg bg-emerald-50/60 p-2.5 border border-emerald-100">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Active</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {charts.memberStatistics.active}
              </p>
              <span className="text-[10px] text-slate-500">{activePct}% of roster</span>
            </div>

            <div className="rounded-lg bg-amber-50/60 p-2.5 border border-amber-100">
              <div className="flex items-center gap-1.5 text-amber-700 font-semibold mb-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Pending</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {charts.memberStatistics.pending}
              </p>
              <span className="text-[10px] text-slate-500">{pendingPct}% awaiting</span>
            </div>

            <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold mb-1">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span>Left / Inactive</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {charts.memberStatistics.inactive}
              </p>
              <span className="text-[10px] text-slate-500">{inactivePct}% departed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Room Occupancy & Capacity (Task 31 Upcoming) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Room & Bed Occupancy
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Task 31</span>
          </span>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <BedDouble className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Room Inventory Not Yet Configured
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Room allocation, bed capacities, seat rent calculation, and public vacancy
            listings will be activated in Task 31.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-xs font-medium text-slate-600">
            <span>Occupied Beds: 0</span>
            <span>•</span>
            <span>Available Beds: 0</span>
            <span>•</span>
            <span>Occupancy: 0%</span>
          </div>
        </div>
      </div>

      {/* 3. Meal Consumption Trends (Task 32 Upcoming) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Daily Meal Consumption
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Task 32</span>
          </span>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <UtensilsCrossed className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Meal Booking System Inactive
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Daily breakfast, lunch, and dinner bookings, cutoff controls, and monthly
            meal-rate math will launch in Task 32.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-xs font-medium text-slate-600">
            <span>This Month: 0 Meals</span>
            <span>•</span>
            <span>Today: 0 Meals</span>
          </div>
        </div>
      </div>

      {/* 4. Expense Breakdown by Category (Task 33 Upcoming) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Expense Distribution by Category
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Task 33</span>
          </span>
        </div>

        <div className="space-y-2.5">
          {expenseCategories.map((cat, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">{cat.name}</span>
                <span className="font-semibold text-slate-400">৳0.00 (0%)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${cat.pct}%` }}
                  className={`${cat.color} h-full`}
                />
              </div>
            </div>
          ))}

          <p className="pt-2 text-[11px] text-slate-400 text-center italic">
            Itemized bazar vouchers and shared utility expenses will be populated when
            active in Task 33.
          </p>
        </div>
      </div>
    </div>
  );
}
