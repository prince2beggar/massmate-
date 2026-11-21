'use client';

import React from 'react';
import {
  Users,
  BedDouble,
  UtensilsCrossed,
  Receipt,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { MessDashboardOverviewDto } from '@/server/mess-admin/mess-dashboard-service';

interface MessKpiGridProps {
  kpi: MessDashboardOverviewDto['kpiCards'];
}

export function MessKpiGrid({ kpi }: MessKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* 1. Members KPI Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Members
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900">
                {kpi.members.total}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Active</span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Active</p>
            <p className="text-sm font-bold text-emerald-700">{kpi.members.active}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Pending</p>
            <p className="text-sm font-bold text-amber-600">{kpi.members.pending}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Left</p>
            <p className="text-sm font-bold text-slate-500">{kpi.members.suspended}</p>
          </div>
        </div>
      </div>

      {/* 2. Rooms KPI Card (Task 31 Upcoming) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rooms & Seats
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900">
                {kpi.rooms.total}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Task 31</span>
          </span>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Occupied: {kpi.rooms.occupied}</span>
            <span className="text-slate-500">Available: {kpi.rooms.available}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 italic">
            {kpi.rooms.statusNote}
          </p>
        </div>
      </div>

      {/* 3. Meals KPI Card (Task 32 Upcoming) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Meals
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900">
                {kpi.meals.totalThisMonth}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Task 32</span>
          </span>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Today Count: {kpi.meals.todayCount}</span>
            <span className="text-slate-500">Status: {kpi.meals.systemStatus}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 italic">
            {kpi.meals.statusNote}
          </p>
        </div>
      </div>

      {/* 4. Monthly Expenses KPI Card (Task 33 Upcoming) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Expenses
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900">
                ৳{kpi.monthlyExpenses.totalApproved}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Task 33</span>
          </span>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Bazar: ৳{kpi.monthlyExpenses.bazarExpenses}</span>
            <span className="text-slate-500">Other: ৳{kpi.monthlyExpenses.otherExpenses}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 italic">
            {kpi.monthlyExpenses.statusNote}
          </p>
        </div>
      </div>

      {/* 5. Payments KPI Card (Real Backend Records) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Confirmed Payments
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900">
                ৳{kpi.payments.confirmedThisMonth}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <span>{kpi.payments.confirmedCount} Paid</span>
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="text-slate-500">Pending Verification:</span>
          <span className="font-semibold text-amber-600">
            {kpi.payments.pendingVerificationCount} (৳{kpi.payments.pendingAmount})
          </span>
        </div>
      </div>

      {/* 6. Outstanding Dues KPI Card (Task 34 Upcoming) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Outstanding Dues
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900">
                ৳{kpi.outstandingDues.totalBalance}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Task 34</span>
          </span>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Members with Dues:</span>
            <span className="font-semibold text-slate-700">
              {kpi.outstandingDues.membersWithDuesCount}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 italic">
            {kpi.outstandingDues.statusNote}
          </p>
        </div>
      </div>
    </div>
  );
}
