'use client';

import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Receipt,
  Home,
  Zap,
  Utensils,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import type {
  MessDashboardOverviewDto,
  DashboardPeriodFilter,
} from '@/server/mess-admin/mess-dashboard-service';
import { cn } from '@/lib/utils';

interface MessFinancialOverviewProps {
  financial: MessDashboardOverviewDto['financialSummary'];
  selectedPeriod: DashboardPeriodFilter;
  onPeriodChange: (period: DashboardPeriodFilter) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
}

export function MessFinancialOverview({
  financial,
  selectedPeriod,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: MessFinancialOverviewProps) {
  const periods: Array<{ id: DashboardPeriodFilter; label: string }> = [
    { id: 'current-month', label: 'Current Month' },
    { id: 'previous-month', label: 'Previous Month' },
    { id: 'last-3-months', label: 'Last 3 Months' },
    { id: 'last-6-months', label: 'Last 6 Months' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const chartData = financial.incomeVsExpenseChart || [];
  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.income, d.expense)),
    100
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
      {/* 1. Header & Period Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span>Financial Overview & Cash Flow</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Range: <span className="font-semibold text-slate-700">{financial.dateRange.formattedRange}</span>
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriodChange(p.id)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                selectedPeriod === p.id
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Inputs if Custom selected */}
      {selectedPeriod === 'custom' && onCustomDateChange && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Custom Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate || ''}
              onChange={(e) =>
                onCustomDateChange(e.target.value, customEndDate || '')
              }
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate || ''}
              onChange={(e) =>
                onCustomDateChange(customStartDate || '', e.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
            />
          </div>
        </div>
      )}

      {/* 2. 6 Financial Summary Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Confirmed Payments */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
          <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
            <CreditCard className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase">Confirmed Payments</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-emerald-900">
            ৳{financial.confirmedPayments}
          </p>
          <span className="text-[10px] text-emerald-600">Verified cash inflow</span>
        </div>

        {/* Approved Expenses */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5">
          <div className="flex items-center gap-1.5 text-rose-700 mb-1">
            <Receipt className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase">Approved Expenses</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-rose-900">
            ৳{financial.approvedExpenses}
          </p>
          <span className="text-[10px] text-rose-600">Bazar + common costs</span>
        </div>

        {/* Rent Charges */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-1.5 text-slate-600 mb-1">
            <Home className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase">Rent Charges</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-slate-800">
            ৳{financial.rentCharges}
          </p>
          <span className="text-[10px] text-slate-400">Task 31 seat rents</span>
        </div>

        {/* Utility Charges */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-1.5 text-slate-600 mb-1">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase">Utility Charges</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-slate-800">
            ৳{financial.utilityCharges}
          </p>
          <span className="text-[10px] text-slate-400">Gas, power, wifi split</span>
        </div>

        {/* Meal Expenses */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-1.5 text-slate-600 mb-1">
            <Utensils className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase">Meal Expenses</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-slate-800">
            ৳{financial.mealExpenses}
          </p>
          <span className="text-[10px] text-slate-400">Task 32 dining logs</span>
        </div>

        {/* Outstanding Dues */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3.5">
          <div className="flex items-center gap-1.5 text-amber-700 mb-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase">Outstanding Dues</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-amber-900">
            ৳{financial.outstandingDues}
          </p>
          <span className="text-[10px] text-amber-600">Pending collections</span>
        </div>
      </div>

      {/* 3. Monthly Income vs Expense Chart */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Monthly Income vs Expense Trend
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
              <span>Confirmed Income</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-xs bg-rose-400" />
              <span>Approved Expenses</span>
            </span>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3 h-44 pt-4 px-2">
              {chartData.map((bar, idx) => {
                const incomePercent = maxVal > 0 ? (bar.income / maxVal) * 100 : 0;
                const expensePercent = maxVal > 0 ? (bar.expense / maxVal) * 100 : 0;

                return (
                  <div
                    key={idx}
                    className="flex flex-1 flex-col items-center gap-2 h-full justify-end"
                  >
                    <div className="flex items-end justify-center gap-1.5 w-full h-32">
                      {/* Income Bar */}
                      <div
                        className="w-1/2 max-w-[36px] rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer relative group"
                        style={{ height: `${Math.max(incomePercent, 4)}%` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap shadow-md">
                          ৳{bar.income.toFixed(2)}
                        </div>
                      </div>

                      {/* Expense Bar */}
                      <div
                        className="w-1/2 max-w-[36px] rounded-t-md bg-rose-400 hover:bg-rose-500 transition-all cursor-pointer relative group"
                        style={{ height: `${Math.max(expensePercent, 4)}%` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap shadow-md">
                          ৳{bar.expense.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-slate-400">
            No transactions recorded for this period.
          </div>
        )}
      </div>
    </div>
  );
}
