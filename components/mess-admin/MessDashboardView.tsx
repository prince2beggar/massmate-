'use client';

import React, { useState, useTransition } from 'react';
import type {
  MessDashboardOverviewDto,
  DashboardPeriodFilter,
} from '@/server/mess-admin/mess-dashboard-service';
import { MessWelcomeBanner } from './MessWelcomeBanner';
import { MessKpiGrid } from './MessKpiGrid';
import { MessFinancialOverview } from './MessFinancialOverview';
import { MessChartsSection } from './MessChartsSection';
import { MessRecentActivityList } from './MessRecentActivityList';
import { MessQuickActionsBar } from './MessQuickActionsBar';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface MessDashboardViewProps {
  tenantSlug: string;
  initialData: MessDashboardOverviewDto;
}

export function MessDashboardView({
  tenantSlug,
  initialData,
}: MessDashboardViewProps) {
  const [data, setData] = useState<MessDashboardOverviewDto>(initialData);
  const [selectedPeriod, setSelectedPeriod] =
    useState<DashboardPeriodFilter>('current-month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch updated period data
  const handlePeriodChange = (period: DashboardPeriodFilter) => {
    setSelectedPeriod(period);
    fetchDashboardData(period, customStart, customEnd);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    if (start && end) {
      fetchDashboardData('custom', start, end);
    }
  };

  const fetchDashboardData = (
    period: DashboardPeriodFilter,
    start?: string,
    end?: string
  ) => {
    startTransition(async () => {
      try {
        setFetchError(null);
        let url = `/api/v1/mess/${tenantSlug}/dashboard?period=${period}`;
        if (period === 'custom' && start && end) {
          url += `&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to load overview data (status ${res.status})`);
        }
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          throw new Error(json.error?.message || 'Invalid server response');
        }
      } catch (err: any) {
        setFetchError(err.message || 'Unable to update dashboard data.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome Section */}
      <MessWelcomeBanner
        greeting={data.welcome.greeting}
        messName={data.welcome.messName}
        currentDate={data.welcome.currentDate}
        currentMonth={data.welcome.currentMonth}
        summary={data.welcome.summary}
        timezone={data.welcome.timezone}
        activeMembers={data.kpiCards.members.active}
      />

      {/* Error alert if period refresh failed */}
      {fetchError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => handlePeriodChange(selectedPeriod)}
            className="flex items-center gap-1 font-semibold text-rose-800 underline hover:no-underline"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. Quick Actions Bar */}
      <MessQuickActionsBar quickActions={data.quickActions} />

      {/* 3. Real KPI Cards Grid */}
      <MessKpiGrid kpi={data.kpiCards} />

      {/* 4. Financial Overview & Income vs Expense */}
      <MessFinancialOverview
        financial={data.financialSummary}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        customStartDate={customStart}
        customEndDate={customEnd}
        onCustomDateChange={handleCustomDateChange}
      />

      {/* 5. Charts & Analytics Section */}
      <MessChartsSection charts={data.charts} />

      {/* 6. Recent Activities Feed */}
      <MessRecentActivityList activities={data.recentActivities} />
    </div>
  );
}
