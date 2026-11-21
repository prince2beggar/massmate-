'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  DollarSign,
  AlertCircle,
  Database,
  CheckCircle2,
  Shield,
  Clock,
  Ban,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DashboardKpiCard } from './DashboardKpiCard';
import {
  TenantGrowthChart,
  TenantStatusBreakdown,
  MonthlyRevenuePlaceholderCard,
  PlanDistributionPlaceholderCard,
} from './DashboardCharts';
import { RecentActivityList } from './RecentActivityList';
import { QuickActionsBar } from './QuickActionsBar';
import { DateRangeFilterBar } from './DateRangeFilterBar';
import type {
  PlatformOverviewData,
  DateRangePreset,
} from '@/server/platform/platform-overview-service';
import type { PlatformContext } from '@/server/platform/platform-auth';

interface SuperAdminDashboardProps {
  initialData: PlatformOverviewData;
  platformSession?: PlatformContext | null;
}

export function SuperAdminDashboard({
  initialData,
  platformSession,
}: SuperAdminDashboardProps) {
  const [data, setData] = useState<PlatformOverviewData>(initialData);
  const [range, setRange] = useState<DateRangePreset>(initialData.range);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async (selectedRange: DateRangePreset) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/super-admin/overview?range=${selectedRange}`, {
        headers: {
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to aggregate platform metrics.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching platform data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (newRange: DateRangePreset) => {
    setRange(newRange);
    fetchOverview(newRange);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header & Platform Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Platform Overview
            </h1>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              Super Admin
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Central governance, tenant health metrics, and infrastructure oversight for MessMate SaaS.
          </p>
        </div>

        {/* Diagnostic Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          {data.system.databaseConfigured ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Neon DB Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 font-medium text-amber-800">
              <Database className="h-4 w-4 text-amber-600" />
              <span>Dev DB Fallback</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Unconfigured DB / Dev Guidance Banner (if applicable) */}
      {!data.system.databaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Neon PostgreSQL connection unconfigured in local .env:</span>{' '}
              The dashboard is operating in safe fallback mode. Metric counts show zero until real Neon PostgreSQL connection strings are supplied in `.env`. Zero fake data is displayed.
            </div>
          </div>
        </div>
      )}

      {/* 3. Date Range Filter Bar */}
      <DateRangeFilterBar
        currentPreset={range}
        onSelectPreset={handleRangeChange}
        isLoading={loading}
        onRefresh={() => fetchOverview(range)}
      />

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* 4. KPI Cards Section */}
      <div className="space-y-4">
        {/* Row A: Tenant Metrics (Real DB) */}
        <div>
          <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            Tenant Operational Metrics
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardKpiCard
              title="Total Tenants"
              value={data.metrics.tenants.total}
              subtitle="All registered organizations"
              icon={Building2}
              accentColor="indigo"
              badge={{ text: 'Real DB Query', variant: 'live' }}
            />
            <DashboardKpiCard
              title="Active Tenants"
              value={data.metrics.tenants.active}
              subtitle="Live operating messes"
              icon={CheckCircle2}
              accentColor="emerald"
              badge={{ text: 'Active Status', variant: 'live' }}
            />
            <DashboardKpiCard
              title="Pending Approval"
              value={data.metrics.tenants.pending}
              subtitle="Awaiting admin verification"
              icon={Clock}
              accentColor="amber"
              badge={{ text: 'Queue', variant: 'warning' }}
            />
            <DashboardKpiCard
              title="Suspended Tenants"
              value={data.metrics.tenants.suspended}
              subtitle="Halted for violations/policy"
              icon={Ban}
              accentColor="rose"
              badge={{ text: 'Restricted', variant: 'neutral' }}
            />
          </div>
        </div>

        {/* Row B: Member & Subscription Metrics */}
        <div>
          <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            Members & Subscription Coverage
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardKpiCard
              title="Total Platform Members"
              value={data.metrics.members.totalMembers}
              subtitle="Cross-mess resident identities"
              icon={Users}
              accentColor="blue"
              badge={{ text: 'Real DB Query', variant: 'live' }}
            />
            <DashboardKpiCard
              title="Active Members"
              value={data.metrics.members.activeMembers}
              subtitle="Residents with active status"
              icon={Shield}
              accentColor="emerald"
              badge={{ text: 'Active Status', variant: 'live' }}
            />
            <DashboardKpiCard
              title="Active Subscriptions"
              value="0"
              subtitle="Paid recurring SaaS tiers"
              icon={CreditCard}
              accentColor="indigo"
              badge={{ text: 'Phase 3 Pending', variant: 'upcoming' }}
              tooltip="Subscription billing module scheduled for Phase 3"
            />
            <DashboardKpiCard
              title="Free Trial Accounts"
              value="0"
              subtitle="14-day evaluation accounts"
              icon={Sparkles}
              accentColor="amber"
              badge={{ text: 'Phase 3 Pending', variant: 'upcoming' }}
              tooltip="Trial accounting scheduled for Phase 3"
            />
          </div>
        </div>

        {/* Row C: Revenue Metrics (Real Backend Contract / Zero Fabrication) */}
        <div>
          <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            Platform Revenue & Settlement Metrics
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardKpiCard
              title="Total Collected Revenue"
              value="৳ 0.00"
              subtitle="Lifetime SaaS gross receipts"
              icon={DollarSign}
              accentColor="emerald"
              badge={{ text: 'Phase 3 Billing', variant: 'upcoming' }}
              tooltip="Payment gateway integration scheduled for Phase 3"
            />
            <DashboardKpiCard
              title="Current Month Revenue"
              value="৳ 0.00"
              subtitle="MTD gross SaaS collections"
              icon={DollarSign}
              accentColor="indigo"
              badge={{ text: 'Phase 3 Billing', variant: 'upcoming' }}
            />
            <DashboardKpiCard
              title="Pending Payments"
              value="৳ 0.00"
              subtitle="Invoices awaiting settlement"
              icon={Clock}
              accentColor="amber"
              badge={{ text: 'Phase 3 Billing', variant: 'upcoming' }}
            />
            <DashboardKpiCard
              title="Failed Payments"
              value="৳ 0.00"
              subtitle="Gateway failures & disputes"
              icon={Ban}
              accentColor="rose"
              badge={{ text: 'Phase 3 Billing', variant: 'upcoming' }}
            />
          </div>
        </div>
      </div>

      {/* 5. Quick Governance Shortcuts */}
      <QuickActionsBar />

      {/* 6. Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TenantGrowthChart
          points={data.charts.tenantGrowth.points}
          hasData={data.charts.tenantGrowth.hasData}
          rangeLabel={data.rangeLabel}
        />
        <TenantStatusBreakdown
          active={data.charts.tenantStatusDistribution.active}
          pending={data.charts.tenantStatusDistribution.pending}
          suspended={data.charts.tenantStatusDistribution.suspended}
          inactive={data.charts.tenantStatusDistribution.inactive}
          hasData={data.charts.tenantStatusDistribution.hasData}
        />
        <MonthlyRevenuePlaceholderCard />
        <PlanDistributionPlaceholderCard />
      </div>

      {/* 7. Recent Platform Activity Ledger */}
      <RecentActivityList activities={data.recentActivity} />
    </div>
  );
}
