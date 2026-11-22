'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  Loader2,
  X,
  History,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Check,
  Edit,
} from 'lucide-react';
import type {
  BudgetDto,
  BudgetDashboardDto,
  BudgetReportDto,
  BudgetPeriodType,
} from '@/server/budget/budget-service';

interface MessBudgetManagementViewProps {
  tenantSlug: string;
  tenantName: string;
}

const DEFAULT_CATEGORIES = [
  'Food and Groceries',
  'Rent',
  'Electricity',
  'Gas',
  'Water',
  'Internet',
  'Cleaning',
  'Maintenance',
  'Staff Expenses',
  'Emergency Expenses',
  'Other Expenses',
];

export function MessBudgetManagementView({
  tenantSlug,
  tenantName,
}: MessBudgetManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ALL_BUDGETS' | 'REPORTS'>('DASHBOARD');
  const [dashboard, setDashboard] = useState<BudgetDashboardDto | null>(null);
  const [budgets, setBudgets] = useState<BudgetDto[]>([]);
  const [reports, setReports] = useState<BudgetReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [createName, setCreateName] = useState('');
  const [createPeriodType, setCreatePeriodType] = useState<BudgetPeriodType>('MONTHLY');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createEndDate, setCreateEndDate] = useState('');
  const [createTotalAmount, setCreateTotalAmount] = useState<number>(50000);
  const [createDescription, setCreateDescription] = useState('');
  const [createApprovalRequired, setCreateApprovalRequired] = useState(true);
  const [createAllocations, setCreateAllocations] = useState<{ categoryName: string; allocatedAmountTaka: number }[]>([
    { categoryName: 'Food and Groceries', allocatedAmountTaka: 25000 },
    { categoryName: 'Rent', allocatedAmountTaka: 15000 },
    { categoryName: 'Electricity', allocatedAmountTaka: 4000 },
    { categoryName: 'Internet', allocatedAmountTaka: 1000 },
    { categoryName: 'Other Expenses', allocatedAmountTaka: 5000 },
  ]);

  // Edit Modal with Mandatory Reason
  const [selectedBudget, setSelectedBudget] = useState<BudgetDto | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTotalAmount, setEditTotalAmount] = useState<number>(0);
  const [editReason, setEditReason] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Review / Approval Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Audit History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Banner
  const [banner, setBanner] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadAll = () => {
    let isMounted = true;
    Promise.all([
      fetch(`/api/v1/mess/${tenantSlug}/budget/dashboard`).then((r) => r.json()),
      fetch(`/api/v1/mess/${tenantSlug}/budget`).then((r) => r.json()),
      fetch(`/api/v1/mess/${tenantSlug}/budget/reports`).then((r) => r.json()),
    ])
      .then(([dashRes, listRes, repRes]) => {
        if (!isMounted) return;
        if (dashRes.success && dashRes.data) setDashboard(dashRes.data);
        if (listRes.success && Array.isArray(listRes.data)) setBudgets(listRes.data);
        if (repRes.success && repRes.data) setReports(repRes.data);
      })
      .catch((err) => {
        console.error('Failed to load budget data:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createStartDate || !createEndDate) {
      setCreateError('Please complete all required fields.');
      return;
    }

    const allocTotal = createAllocations.reduce((sum, a) => sum + (Number(a.allocatedAmountTaka) || 0), 0);
    if (allocTotal > createTotalAmount) {
      setCreateError(`Allocations (${allocTotal} ৳) cannot exceed the total budget (${createTotalAmount} ৳).`);
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const payload = {
        name: createName.trim(),
        periodType: createPeriodType,
        startDate: createStartDate,
        endDate: createEndDate,
        totalAmountTaka: createTotalAmount,
        description: createDescription.trim() || undefined,
        approvalRequired: createApprovalRequired,
        allocations: createAllocations.filter((a) => a.allocatedAmountTaka > 0),
      };

      const res = await fetch(`/api/v1/mess/${tenantSlug}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Creation failed');

      setBanner({ text: 'Budget created successfully.', type: 'success' });
      setShowCreateModal(false);
      loadAll();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create budget.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;
    if (!editReason.trim()) {
      setEditError('A justification reason is mandatory to maintain the financial audit history.');
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/budget/${selectedBudget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmountTaka: editTotalAmount,
          reason: editReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Update failed');

      setBanner({ text: 'Budget updated successfully with full audit trail.', type: 'success' });
      setShowEditModal(false);
      loadAll();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update budget.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;

    setReviewLoading(true);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/budget/${selectedBudget.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: reviewDecision,
          reason: reviewReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Review action failed');

      setBanner({
        text: `Budget ${reviewDecision === 'APPROVE' ? 'approved and activated' : 'rejected'}.`,
        type: 'success',
      });
      setShowReviewModal(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setReviewLoading(false);
    }
  };

  const filteredBudgets = budgets.filter((b) => {
    if (periodFilter !== 'ALL' && b.periodType !== periodFilter) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!b.name.toLowerCase().includes(q) && !b.referenceNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Loading Budget Management for {tenantName}...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-teal-600" />
            Budget Management System
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Planned vs actual expense tracking, exact poisha accounting, approval workflows, and threshold alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reports?.csvExportContent && (
            <a
              href={`/api/v1/mess/${tenantSlug}/budget/reports?format=csv`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 rounded-lg shadow-sm"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </a>
          )}
          <button
            onClick={() => {
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Budget
          </button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            banner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{banner.text}</span>
          <button onClick={() => setBanner(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 text-sm font-medium">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'DASHBOARD'
              ? 'border-teal-600 text-teal-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Overview & Utilization
        </button>
        <button
          onClick={() => setActiveTab('ALL_BUDGETS')}
          className={`py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'ALL_BUDGETS'
              ? 'border-teal-600 text-teal-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          All Budgets ({budgets.length})
        </button>
        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'REPORTS'
              ? 'border-teal-600 text-teal-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Analytics & Trends
        </button>
      </div>

      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Executive Dashboard KPI Cards */}
          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Monthly Budget</span>
                  <Wallet className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  ৳{dashboard.monthlyPlannedTaka.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Active monthly ceiling
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Actual Spent</span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  ৳{dashboard.monthlyActualSpentTaka.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Approved eligible expenses
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Remaining Budget</span>
                  <span
                    className={`text-xs font-semibold ${
                      dashboard.monthlyRemainingTaka < 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {dashboard.monthlyRemainingTaka < 0 ? 'Deficit' : 'Surplus'}
                  </span>
                </div>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    dashboard.monthlyRemainingTaka < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  ৳{dashboard.monthlyRemainingTaka.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Remaining funds available
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Utilization Rate</span>
                  <Percent className="w-4 h-4 text-purple-600" />
                </div>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    dashboard.monthlyUtilizationPercent > 100
                      ? 'text-rose-600 dark:text-rose-400'
                      : dashboard.monthlyUtilizationPercent >= 90
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {dashboard.monthlyUtilizationPercent.toFixed(1)}%
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      dashboard.monthlyUtilizationPercent > 100
                        ? 'bg-rose-500'
                        : dashboard.monthlyUtilizationPercent >= 90
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, dashboard.monthlyUtilizationPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Over-budget categories alert */}
          {dashboard && dashboard.overBudgetCategories.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-semibold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Over-Budget Categories Alert ({dashboard.overBudgetCategories.length})
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                The following categories have exceeded their planned budget allocation for this month:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                {dashboard.overBudgetCategories.map((ob) => (
                  <div
                    key={ob.categoryName}
                    className="bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white block">{ob.categoryName}</span>
                      <span className="text-gray-500 text-[11px]">
                        Allocated: ৳{ob.allocatedTaka.toLocaleString()} | Spent: ৳{ob.spentTaka.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-rose-600 font-bold font-mono">
                      +৳{ob.excessTaka.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Budget Details Breakdown */}
          {dashboard?.currentMonthlyBudget ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {dashboard.currentMonthlyBudget.name}
                    </h3>
                    <span className="text-[10px] font-mono bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 px-2 py-0.5 rounded">
                      {dashboard.currentMonthlyBudget.referenceNumber}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Period: {dashboard.currentMonthlyBudget.formattedStartDate} to{' '}
                    {dashboard.currentMonthlyBudget.formattedEndDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!dashboard.currentMonthlyBudget) return;
                      setSelectedBudget(dashboard.currentMonthlyBudget);
                      setEditTotalAmount(dashboard.currentMonthlyBudget.totalAmountTaka);
                      setEditReason('');
                      setShowEditModal(true);
                    }}
                    className="p-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Adjust Budget
                  </button>
                  <button
                    onClick={() => {
                      if (!dashboard.currentMonthlyBudget) return;
                      setSelectedBudget(dashboard.currentMonthlyBudget);
                      setShowHistoryModal(true);
                    }}
                    className="p-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    Audit Trail
                  </button>
                </div>
              </div>

              {/* Allocations Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold">
                    <tr>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5 text-right">Allocated (BDT)</th>
                      <th className="px-3 py-2.5 text-right">Actual Spent (BDT)</th>
                      <th className="px-3 py-2.5 text-right">Remaining (BDT)</th>
                      <th className="px-3 py-2.5 text-center">Utilization</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {dashboard.currentMonthlyBudget.allocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750">
                        <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
                          {alloc.categoryName}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">
                          ৳{alloc.allocatedAmountTaka.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-900 dark:text-white">
                          ৳{alloc.actualSpentTaka.toLocaleString()}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-mono ${
                            alloc.remainingAmountTaka < 0
                              ? 'text-rose-600 font-bold'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          ৳{alloc.remainingAmountTaka.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {alloc.utilizationPercent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                              alloc.isOverBudget
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                : alloc.utilizationPercent >= 85
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}
                          >
                            {alloc.isOverBudget
                              ? 'OVER BUDGET'
                              : alloc.utilizationPercent >= 85
                              ? 'WARNING'
                              : 'ON TRACK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <Wallet className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">No active monthly budget</p>
              <p className="text-xs text-gray-500 mt-1">Create a budget for this month to start tracking expenses.</p>
            </div>
          )}

          {/* Upcoming Commitments */}
          {dashboard?.upcomingCommitments && dashboard.upcomingCommitments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Upcoming Budget Commitments
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {dashboard.upcomingCommitments.map((com, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{com.title}</p>
                      <span className="text-[11px] text-gray-400">Due: {com.dueDate}</span>
                    </div>
                    <span className="font-mono font-bold text-teal-600">
                      ৳{com.estimatedAmountTaka.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: All Budgets */}
      {activeTab === 'ALL_BUDGETS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search budgets by name or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
              >
                <option value="ALL">All Periods</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBudgets.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 block">{b.referenceNumber}</span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{b.name}</h4>
                    <span className="text-xs text-gray-400">
                      {b.formattedStartDate} — {b.formattedEndDate} ({b.periodType})
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      b.status === 'APPROVED'
                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                        : b.status === 'PENDING_APPROVAL'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-gray-400 block">Planned</span>
                    <span className="font-bold text-gray-900 dark:text-white">৳{b.totalAmountTaka.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Spent</span>
                    <span className="font-bold text-gray-900 dark:text-white">৳{b.actualSpentTaka.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Remaining</span>
                    <span className={`font-bold ${b.remainingAmountTaka < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ৳{b.remainingAmountTaka.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
                  <span className="text-gray-500">
                    Created by: <span className="font-medium text-gray-700 dark:text-gray-300">{b.creatorName}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    {b.status === 'PENDING_APPROVAL' && (
                      <button
                        onClick={() => {
                          setSelectedBudget(b);
                          setReviewDecision('APPROVE');
                          setReviewReason('');
                          setShowReviewModal(true);
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded"
                      >
                        Review
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedBudget(b);
                        setShowHistoryModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Analytics & Reports */}
      {activeTab === 'REPORTS' && reports && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Category Budget Performance & Utilization
            </h3>

            <div className="space-y-3">
              {reports.categoryBreakdown.map((cat) => (
                <div key={cat.categoryName} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-900 dark:text-white">{cat.categoryName}</span>
                    <span className="text-gray-500">
                      ৳{cat.spentTaka.toLocaleString()} / ৳{cat.plannedTaka.toLocaleString()} ({cat.utilizationPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        cat.status === 'EXCEEDED'
                          ? 'bg-rose-500'
                          : cat.status === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, cat.utilizationPercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                Create New Budget
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg border border-rose-200 dark:border-rose-800">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Budget Plan Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. December 2026 Operational Budget"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Period Type *
                  </label>
                  <select
                    value={createPeriodType}
                    onChange={(e) => setCreatePeriodType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom Range</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Total Amount (BDT ৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createTotalAmount}
                    onChange={(e) => setCreateTotalAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createStartDate}
                    onChange={(e) => setCreateStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createEndDate}
                    onChange={(e) => setCreateEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Category Allocations */}
              <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Category Allocations (Sum: ৳
                  {createAllocations.reduce((s, a) => s + (Number(a.allocatedAmountTaka) || 0), 0).toLocaleString()} / ৳
                  {createTotalAmount.toLocaleString()})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {createAllocations.map((alloc, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        readOnly
                        value={alloc.categoryName}
                        className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                      />
                      <input
                        type="number"
                        min="0"
                        value={alloc.allocatedAmountTaka}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const next = [...createAllocations];
                          next[idx].allocatedAmountTaka = val;
                          setCreateAllocations(next);
                        }}
                        className="w-28 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-white text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="approvalReq"
                  checked={createApprovalRequired}
                  onChange={(e) => setCreateApprovalRequired(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="approvalReq" className="text-xs text-gray-700 dark:text-gray-300">
                  Require manager approval before budget becomes active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal with Mandatory Reason */}
      {showEditModal && selectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-teal-600" />
                Adjust Budget: {selectedBudget.name}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Updated Total Amount (BDT ৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editTotalAmount}
                  onChange={(e) => setEditTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Justification Reason (Mandatory for Audit) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this budget amount is being revised (e.g. unexpected grocery inflation, utility price hike)..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1"
                >
                  {editLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Review Budget Plan
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              Reviewing: <strong>{selectedBudget.name}</strong> (৳{selectedBudget.totalAmountTaka.toLocaleString()})
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                  <input
                    type="radio"
                    name="decision"
                    checked={reviewDecision === 'APPROVE'}
                    onChange={() => setReviewDecision('APPROVE')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  Approve & Activate
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                  <input
                    type="radio"
                    name="decision"
                    checked={reviewDecision === 'REJECT'}
                    onChange={() => setReviewDecision('REJECT')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  Reject Plan
                </label>
              </div>

              {reviewDecision === 'REJECT' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Rejection Feedback *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide details on why this budget is rejected..."
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1"
                >
                  {reviewLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {showHistoryModal && selectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                Audit Trail: {selectedBudget.referenceNumber}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="border-l-2 border-teal-500 pl-3 py-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">Budget Created</span>
                  <span className="text-[10px] text-gray-400">{selectedBudget.formattedCreatedAt}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Initial amount: ৳{selectedBudget.totalAmountTaka.toLocaleString()} by {selectedBudget.creatorName}
                </p>
              </div>

              {selectedBudget.changeHistories && selectedBudget.changeHistories.length > 0 ? (
                selectedBudget.changeHistories.map((h) => (
                  <div key={h.id} className="border-l-2 border-amber-500 pl-3 py-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">Revision by {h.changedByName}</span>
                      <span className="text-[10px] text-gray-400">{h.formattedCreatedAt}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Amount changed from ৳{h.previousAmountTaka.toLocaleString()} to ৳{h.newAmountTaka.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-500 italic bg-gray-50 dark:bg-gray-900 p-1.5 rounded">
                      &quot;{h.reason}&quot;
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No revisions have been recorded for this budget plan.</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
