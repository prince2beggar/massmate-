'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Calculator,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Send,
  Eye,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import { GenerateBillsModal } from './GenerateBillsModal';
import { FinancialCategoriesView } from './FinancialCategoriesView';
import { MemberStatementModal } from './MemberStatementModal';
import { BalanceAdjustmentModal } from './BalanceAdjustmentModal';

interface FinancialOverviewData {
  monthString: string;
  isPeriodLocked: boolean;
  periodStatus: string;
  kpis: {
    totalBilledTaka: number;
    totalCollectedTaka: number;
    totalOutstandingDueTaka: number;
    totalPendingVerificationTaka: number;
  };
  paymentMethodBreakdown: Record<string, { count: number; totalTaka: number }>;
  memberCount: number;
  bills: any[];
}

interface MemberOption {
  id: string;
  name: string;
  memberCode?: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
  code: string;
  allocationRule: string;
  defaultAmountTaka?: number | null;
  isActive: boolean;
  isSystem: boolean;
}

interface FinanceWorkspaceViewProps {
  tenantSlug: string;
  initialOverview: FinancialOverviewData | null;
  initialCategories: CategoryOption[];
  members: MemberOption[];
  currentMonth: string;
}

export function FinanceWorkspaceView({
  tenantSlug,
  initialOverview,
  initialCategories,
  members,
  currentMonth,
}: FinanceWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<'billing' | 'categories'>('billing');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [overview, setOverview] = useState<FinancialOverviewData | null>(initialOverview);
  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories);

  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [statementMembershipId, setStatementMembershipId] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchOverview = async (month?: string) => {
    try {
      const m = month || selectedMonth;
      const res = await fetch(`/api/v1/mess/${tenantSlug}/finance/billing?month=${m}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
      }
    } catch {}
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/finance/categories?includeInactive=true`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
      }
    } catch {}
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    void fetchOverview(newMonth);
  };

  const handlePublishBills = async () => {
    if (!confirm(`Publish all member bills for ${selectedMonth}? Members will be able to see their active statements.`)) {
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/finance/billing/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthString: selectedMonth }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to publish');
      setMessage({ text: 'Bills successfully published for all residents.', type: 'success' });
      void fetchOverview();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error publishing bills', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseMonth = async () => {
    if (
      !confirm(
        `Are you sure you want to close and lock the financial ledger for ${selectedMonth}? Once locked, bill amounts cannot be rewritten.`
      )
    ) {
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/finance/billing/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthString: selectedMonth }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to close month');
      setMessage({ text: `Financial month ${selectedMonth} is now closed and locked.`, type: 'success' });
      void fetchOverview();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error closing month', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getBillStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Paid
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
            Partially Paid
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            Unpaid
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            Draft
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const isLocked = overview?.isPeriodLocked || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Finance & Monthly Billing
            </h1>
            {isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                <Lock className="h-3.5 w-3.5 text-amber-700" /> Month Locked
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate monthly resident bills, track balances, and audit collections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAdjustmentOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
            Adjust Balance
          </button>

          {!isLocked && (
            <>
              <button
                onClick={() => setIsGenerateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Calculator className="h-3.5 w-3.5" />
                Generate Bills
              </button>

              <button
                onClick={handlePublishBills}
                disabled={actionLoading || !overview?.bills?.length}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 disabled:opacity-50 transition"
              >
                <Send className="h-3.5 w-3.5" />
                Publish Bills
              </button>

              <button
                onClick={handleCloseMonth}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-50 transition"
              >
                <Lock className="h-3.5 w-3.5" />
                Close Month
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === 'billing'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Monthly Bills & Ledger</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
            {overview?.bills?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === 'categories'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Financial Categories</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
            {categories.length}
          </span>
        </button>
      </div>

      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Total Billed Pool</span>
                <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                  <Calculator className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                ৳{(overview?.kpis.totalBilledTaka || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {overview?.memberCount || 0} residents billed
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-800">Confirmed Collections</span>
                <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-900">
                ৳{(overview?.kpis.totalCollectedTaka || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700">Credited to accounts</div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/50 to-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-800">Outstanding Dues</span>
                <span className="rounded-lg bg-rose-100 p-1.5 text-rose-700">
                  <AlertCircle className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-900">
                ৳{(overview?.kpis.totalOutstandingDueTaka || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="mt-1 text-[11px] text-rose-700">Receivable from members</div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-800">Pending Verification</span>
                <span className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-900">
                ৳{(overview?.kpis.totalPendingVerificationTaka || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="mt-1 text-[11px] text-amber-700">Awaiting manager audit</div>
            </div>
          </div>

          {/* Month selector toolbar */}
          <div className="flex items-center justify-between rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Period:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-500">
              Status: <strong className="text-slate-800">{overview?.periodStatus || 'DRAFT'}</strong>
            </span>
          </div>

          {/* Member Bills Matrix */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {!overview?.bills || overview.bills.length === 0 ? (
              <div className="p-12 text-center">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300" />
                <h4 className="mt-3 text-sm font-bold text-slate-700">No Bills Generated</h4>
                <p className="mt-1 text-xs text-slate-500">
                  No billing run has been calculated for {selectedMonth}. Click &quot;Generate Bills&quot; to
                  create draft bills.
                </p>
                <button
                  onClick={() => setIsGenerateOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Calculator className="h-4 w-4" />
                  Generate Month Bills
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Resident</th>
                      <th className="px-4 py-3.5 text-right">Opening Due</th>
                      <th className="px-4 py-3.5 text-right">Rent</th>
                      <th className="px-4 py-3.5 text-right">Utilities</th>
                      <th className="px-4 py-3.5 text-right">Meals</th>
                      <th className="px-4 py-3.5 text-right">Total Charges</th>
                      <th className="px-4 py-3.5 text-right">Paid</th>
                      <th className="px-4 py-3.5 text-right">Closing Balance</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Statement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.bills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{b.memberName}</div>
                          {b.memberCode && (
                            <div className="text-[11px] text-slate-400">{b.memberCode}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap text-slate-600">
                          ৳{b.openingDueTaka.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap text-slate-600">
                          ৳{b.rentChargesTaka.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap text-slate-600">
                          ৳{b.utilityChargesTaka.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap text-slate-600">
                          ৳{b.mealChargesTaka.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap font-bold text-slate-900">
                          ৳{b.totalChargesTaka.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap text-emerald-700 font-semibold">
                          ৳{b.paidAmountTaka.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span
                            className={`font-black ${
                              b.closingBalanceTaka > 0
                                ? 'text-rose-700'
                                : b.closingBalanceTaka < 0
                                ? 'text-emerald-700'
                                : 'text-slate-900'
                            }`}
                          >
                            ৳{b.closingBalanceTaka.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getBillStatusBadge(b.status)}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setStatementMembershipId(b.membershipId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                          >
                            <Eye className="h-3 w-3" />
                            Statement
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <FinancialCategoriesView
          tenantSlug={tenantSlug}
          categories={categories}
          onRefresh={() => fetchCategories()}
        />
      )}

      {/* Modals */}
      {isGenerateOpen && (
        <GenerateBillsModal
          tenantSlug={tenantSlug}
          isOpen={isGenerateOpen}
          onClose={() => setIsGenerateOpen(false)}
          onSuccess={() => void fetchOverview()}
          categories={categories}
          defaultMonth={selectedMonth}
        />
      )}

      {isAdjustmentOpen && (
        <BalanceAdjustmentModal
          tenantSlug={tenantSlug}
          isOpen={isAdjustmentOpen}
          onClose={() => setIsAdjustmentOpen(false)}
          onSuccess={() => void fetchOverview()}
          members={members}
        />
      )}

      {statementMembershipId && (
        <MemberStatementModal
          tenantSlug={tenantSlug}
          isOpen={Boolean(statementMembershipId)}
          onClose={() => setStatementMembershipId(null)}
          membershipId={statementMembershipId}
          monthString={selectedMonth}
        />
      )}
    </div>
  );
}
