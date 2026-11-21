'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Building2,
  Users,
  Globe,
  Headphones,
  Calendar,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  FileText,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import type {
  PlatformAnalyticsDto,
  AnalyticsDatePreset,
} from '@/server/platform/platform-analytics-service';
import type { PlatformRole } from '@/types/database';
import { cn } from '@/lib/utils';

interface PlatformAnalyticsViewProps {
  initialAnalytics: PlatformAnalyticsDto;
  currentUserRole?: PlatformRole | null;
}

export function PlatformAnalyticsView({
  initialAnalytics,
  currentUserRole,
}: PlatformAnalyticsViewProps) {
  const [analytics, setAnalytics] = useState<PlatformAnalyticsDto>(initialAnalytics);
  const [preset, setPreset] = useState<AnalyticsDatePreset>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (selectedPreset: AnalyticsDatePreset) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('preset', selectedPreset);
      if (selectedPreset === 'custom' && customStart && customEnd) {
        params.set('startDate', customStart);
        params.set('endDate', customEnd);
      }

      const res = await fetch(`/api/v1/super-admin/analytics?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch analytics');
      setAnalytics(data.data);
    } catch (err: any) {
      setError(err.message || 'Error loading platform analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [customStart, customEnd]);

  const handlePresetChange = (newPreset: AnalyticsDatePreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      fetchAnalytics(newPreset);
    }
  };

  const handleExport = async (reportType: string) => {
    setExportingType(reportType);
    setError(null);
    setExportSuccess(null);
    try {
      const res = await fetch('/api/v1/super-admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Export failed');
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `messmate-${reportType}-report.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportSuccess(`Successfully downloaded ${filename}`);
    } catch (err: any) {
      setError(err.message || 'Report export failed.');
    } finally {
      setExportingType(null);
    }
  };

  const { tenants, users, subscriptions, revenue, domains, support } = analytics;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Analytics & Reports</h1>
          <p className="text-sm text-slate-500">
            Real-time multi-tenant metrics, confirmed financial ledgers, and exportable datasets.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative inline-block text-left">
            <select
              aria-label="Export platform report dataset"
              value=""
              onChange={(e) => {
                if (e.target.value) handleExport(e.target.value);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-hidden"
            >
              <option value="" disabled>
                {exportingType ? `Generating ${exportingType}...` : '📥 Export CSV Report'}
              </option>
              <option value="tenants">Tenants Directory</option>
              <option value="subscriptions">Subscriptions Summary</option>
              <option value="payments">Confirmed Payments</option>
              <option value="users">Platform Users</option>
              <option value="domains">Domain Statuses</option>
              <option value="tickets">Support Tickets</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(preset)}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Reporting Period:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePresetChange(item.id)}
              className={cn(
                'rounded-lg px-2.5 py-1 font-medium transition-all',
                preset === item.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-slate-200 p-1 text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-slate-200 p-1 text-xs"
            />
            <button
              type="button"
              onClick={() => fetchAnalytics('custom')}
              className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {exportSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* SECTION 1: Revenue Analytics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-600" />
            Revenue & Financial Ledgers
          </h2>
          <span className="text-[11px] font-medium text-slate-500">
            * Strictly confirmed payment records in BDT
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
            <span className="text-xs font-medium text-emerald-800">Net Collected Revenue</span>
            <div className="mt-1 text-2xl font-bold text-emerald-950">৳{revenue.netCollectedRevenue.toLocaleString()}</div>
            <p className="mt-1 text-[10px] text-emerald-700">Gross revenue minus refunds</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Gross Collected</span>
            <div className="mt-1 text-xl font-bold text-slate-900">৳{revenue.totalCollectedRevenue.toLocaleString()}</div>
            <p className="mt-1 text-[10px] text-slate-400">Total CONFIRMED invoices</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Period Collected</span>
            <div className="mt-1 text-xl font-bold text-slate-900">৳{revenue.monthlyCollectedRevenue.toLocaleString()}</div>
            <p className="mt-1 text-[10px] text-slate-400">Confirmed within period</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
            <span className="text-xs font-medium text-amber-800">Outstanding Invoices</span>
            <div className="mt-1 text-xl font-bold text-amber-950">৳{revenue.outstandingInvoices.toLocaleString()}</div>
            <p className="mt-1 text-[10px] text-amber-700">PENDING payment invoices</p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
            <span className="text-xs font-medium text-rose-800">Total Refunds</span>
            <div className="mt-1 text-xl font-bold text-rose-950">৳{revenue.refunds.toLocaleString()}</div>
            <p className="mt-1 text-[10px] text-rose-700">Reversed/refunded funds</p>
          </div>
        </div>

        {/* Revenue by Plan breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 mb-3">Revenue Breakdown by Subscription Plan</h3>
          {revenue.revenueByPlan.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No confirmed subscription invoice records found.</p>
          ) : (
            <div className="space-y-2">
              {revenue.revenueByPlan.map((p) => (
                <div key={p.planName} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{p.planName}</span>
                    <span className="text-slate-400">({p.percentage}%)</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">৳{p.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2 & 3: Tenants & Subscriptions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tenant Analytics */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            Tenant Organizations
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-2.5">
              <span className="text-[11px] text-slate-500">Total Tenants</span>
              <div className="text-lg font-bold text-slate-900">{tenants.total}</div>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2.5">
              <span className="text-[11px] text-indigo-700">New in Period</span>
              <div className="text-lg font-bold text-indigo-900">{tenants.newInRange}</div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2.5">
              <span className="text-[11px] text-emerald-700">Active</span>
              <div className="text-lg font-bold text-emerald-900">{tenants.active}</div>
            </div>
            <div className="rounded-lg bg-rose-50 p-2.5">
              <span className="text-[11px] text-rose-700">Suspended</span>
              <div className="text-lg font-bold text-rose-900">{tenants.suspended}</div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h3 className="text-xs font-semibold text-slate-800 mb-2">Tenant Type Distribution</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-slate-200 p-2 text-center">
                <span className="text-[10px] text-slate-500">Bachelor Mess</span>
                <p className="font-bold text-slate-800">{tenants.typeDistribution.BACHELOR_MESS}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-2 text-center">
                <span className="text-[10px] text-slate-500">Student Mess</span>
                <p className="font-bold text-slate-800">{tenants.typeDistribution.STUDENT_MESS}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-2 text-center">
                <span className="text-[10px] text-slate-500">Hostel</span>
                <p className="font-bold text-slate-800">{tenants.typeDistribution.HOSTEL}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription & Conversion */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Percent className="h-4 w-4 text-purple-600" />
            Subscriptions & Conversion
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-purple-50 p-2.5">
              <span className="text-[11px] text-purple-700">Free Trials</span>
              <div className="text-lg font-bold text-purple-900">{subscriptions.freeTrialAccounts}</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5">
              <span className="text-[11px] text-blue-700">Active Starter</span>
              <div className="text-lg font-bold text-blue-900">{subscriptions.activeStarter}</div>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2.5">
              <span className="text-[11px] text-indigo-700">Custom Business</span>
              <div className="text-lg font-bold text-indigo-900">{subscriptions.customBusiness}</div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-purple-900">Trial-to-Paid Conversion Rate</span>
              <p className="text-[11px] text-purple-700">Tenants converting from 7-day trial to paid subscription</p>
            </div>
            <div className="text-2xl font-black text-purple-900">{subscriptions.trialToPaidConversionRate}%</div>
          </div>
        </div>
      </div>

      {/* SECTION 4, 5 & 6: Users, Domains & Support Helpdesk */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Users Analytics */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-indigo-600" />
            Platform Users ({users.total})
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Active Accounts:</span>
              <span className="font-semibold text-slate-900">{users.active}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>New in Period:</span>
              <span className="font-semibold text-indigo-600">+{users.newInRange}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Multi-Mess Residents:</span>
              <span className="font-semibold text-slate-900">{users.membershipDistribution.multiple}</span>
            </div>
          </div>
        </div>

        {/* Domains Analytics */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-emerald-600" />
            Domain Routing
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Platform Subdomains:</span>
              <span className="font-semibold text-slate-900">{domains.totalPlatformSubdomains}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Custom Domains:</span>
              <span className="font-semibold text-slate-900">{domains.totalCustomDomains}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Verified & Active:</span>
              <span className="font-semibold text-emerald-600">{domains.verifiedDomains}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Pending Verification:</span>
              <span className="font-semibold text-amber-600">{domains.pendingVerification}</span>
            </div>
          </div>
        </div>

        {/* Support Helpdesk Analytics */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Headphones className="h-4 w-4 text-rose-600" />
            Support Helpdesk
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Tickets:</span>
              <span className="font-semibold text-slate-900">{support.totalTickets}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Open & In-Progress:</span>
              <span className="font-semibold text-amber-600">{support.openTickets}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Resolved:</span>
              <span className="font-semibold text-emerald-600">{support.resolvedTickets}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Avg Resolution Time:</span>
              <span className="font-semibold text-slate-900">{support.averageResolutionHours} hrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
