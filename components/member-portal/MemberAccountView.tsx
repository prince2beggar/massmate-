'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Receipt,
  Printer,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Building2,
  Calendar,
  Info,
  DollarSign,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import type { MemberAccountOverviewDto } from '@/server/member-portal/member-portal-service';

interface MemberAccountViewProps {
  tenantSlug: string;
  initialData?: MemberAccountOverviewDto | null;
}

export function MemberAccountView({ tenantSlug, initialData }: MemberAccountViewProps) {
  const [data, setData] = useState<MemberAccountOverviewDto | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialData?.period.monthString || new Date().toISOString().substring(0, 7)
  );

  const fetchAccountData = useCallback(
    (monthToFetch: string) => {
      fetch(`/api/v1/portal/${tenantSlug}/account?month=${monthToFetch}`)
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to fetch account overview.');
          }
          return res.json();
        })
        .then((json) => {
          if (json.success && json.data) {
            setData(json.data);
            setLoading(false);
          }
        })
        .catch((err: any) => {
          setError(err.message || 'Error fetching account statement.');
          setLoading(false);
        });
    },
    [tenantSlug]
  );

  useEffect(() => {
    if (initialData && initialData.period.monthString === selectedMonth) {
      return;
    }
    fetchAccountData(selectedMonth);
  }, [selectedMonth, initialData, fetchAccountData]);

  const handleMonthChange = (newMonth: string) => {
    setLoading(true);
    setError(null);
    setSelectedMonth(newMonth);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading monthly statement & balances...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-semibold text-rose-800">Failed to load account data</h3>
        <p className="text-sm text-rose-600">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchAccountData(selectedMonth);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totals = data?.totals;
  const meta = data?.statementMetadata;
  const isAdvance = (totals?.closingBalanceTaka || 0) < 0;
  const isPaid = (totals?.closingBalanceTaka || 0) <= 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header & Period Selector (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Account & Monthly Bills</h1>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative statement, itemized charges, and payment balance breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-800 font-medium text-sm rounded-xl pl-4 pr-10 py-2.5 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
            >
              {(data?.availablePeriods || []).map((p) => (
                <option key={p.monthString} value={p.monthString}>
                  {p.label} {p.isCurrent ? '(Current)' : ''} {p.isLocked ? '🔒' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span className="hidden sm:inline">Print Statement</span>
          </button>

          <Link
            href={`/portal/${tenantSlug}/payments`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            <span>Make Payment</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Hidden on Print) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Outstanding / Advance Balance */}
        <div
          className={`p-5 rounded-2xl border shadow-sm ${
            isAdvance
              ? 'bg-blue-50/70 border-blue-200 text-blue-900'
              : isPaid
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider opacity-80">
            <span>{isAdvance ? 'Advance Credit' : isPaid ? 'Amount Due' : 'Outstanding Due'}</span>
            <Wallet className="h-4 w-4" />
          </div>
          <div className="mt-3 text-2xl font-black tracking-tight">
            ৳
            {isAdvance
              ? Math.abs(totals?.closingBalanceTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
              : (totals?.closingBalanceTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium">
            {isPaid ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{isAdvance ? 'Credited to next month' : 'Paid in Full'}</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                <span>Payment due for {data?.period.label}</span>
              </>
            )}
          </div>
        </div>

        {/* Confirmed Payments */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Confirmed Paid</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            ৳{(totals?.confirmedPaidTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Official verified payments</div>
        </div>

        {/* Total Month Charges */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Total Charges</span>
            <Receipt className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            ৳{(totals?.totalNewChargesTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Rent, utilities & meals</div>
        </div>

        {/* Previous Month Due */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Previous Due</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            ৳{(totals?.openingDueTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Carried opening balance</div>
        </div>
      </div>

      {/* 3. Pending Payments Advisory Banner (If any) */}
      {(totals?.pendingPaidTaka || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4 print:hidden">
          <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-900">
              Payment Voucher Awaiting Admin Verification (৳
              {(totals?.pendingPaidTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })})
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              You have submitted payment vouchers that are currently under administrative review. Pending payments
              are not deducted from your official balance until confirmed by the mess manager.
            </p>
          </div>
        </div>
      )}

      {/* 4. Official Monthly Statement (Printed and Screen Document) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50 print:bg-white print:border-b-2 print:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-emerald-600 print:text-black" />
                <h2 className="text-xl font-bold text-slate-900 tracking-tight print:text-2xl">
                  {meta?.tenantName}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">{meta?.messAddress}</p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 print:border print:border-slate-400">
                MONTHLY RESIDENT STATEMENT
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Statement Period: <strong className="text-slate-800">{data?.period.label}</strong>
              </p>
              {meta?.billNumber && (
                <p className="text-xs text-slate-400">
                  Bill Ref: <span className="font-mono">{meta.billNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Resident Details Strip */}
          <div className="mt-6 pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Resident Name:</span>
              <span className="font-bold text-slate-800 text-sm">{meta?.memberName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Member Code:</span>
              <span className="font-semibold text-slate-700">{meta?.memberCode || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Room & Bed Slot:</span>
              <span className="font-semibold text-slate-700">
                {meta?.roomNumber ? `Room ${meta.roomNumber} (Bed ${meta.bedLabel || 'A'})` : 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Due Date:</span>
              <span className="font-semibold text-slate-700">{meta?.dueDate || 'End of Month'}</span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="p-6 sm:p-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Itemized Charge & Ledger Breakdown
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-2">Description / Category</th>
                  <th className="py-3 px-2 hidden sm:table-cell">Rule / Notes</th>
                  <th className="py-3 px-2 text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Opening Due */}
                <tr className="bg-slate-50/40">
                  <td className="py-3 px-2 font-medium">Previous Balance / Opening Due</td>
                  <td className="py-3 px-2 text-xs text-slate-400 hidden sm:table-cell">
                    Carried forward from previous closed cycle
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-semibold">
                    ৳{(totals?.openingDueTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 2. Room Rent */}
                <tr>
                  <td className="py-3 px-2 font-medium">Room Accommodation & Rent</td>
                  <td className="py-3 px-2 text-xs text-slate-400 hidden sm:table-cell">
                    Monthly bed slot charge
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-semibold">
                    ৳{(totals?.rentChargesTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 3. Utilities */}
                <tr>
                  <td className="py-3 px-2 font-medium">Utilities & Maintenance (Power, Gas, Water, WiFi)</td>
                  <td className="py-3 px-2 text-xs text-slate-400 hidden sm:table-cell">
                    EQUAL_SPLIT allocation
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-semibold">
                    ৳{(totals?.utilityChargesTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 4. Meal Charges */}
                <tr>
                  <td className="py-3 px-2 font-medium">Meal Consumptions & Guest Meals</td>
                  <td className="py-3 px-2 text-xs text-slate-400 hidden sm:table-cell">
                    Recorded meal count × authoritative rate
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-semibold">
                    ৳{(totals?.mealChargesTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 5. Other Charges */}
                {(totals?.otherChargesTaka || 0) > 0 && (
                  <tr>
                    <td className="py-3 px-2 font-medium">Other Miscellaneous Mess Charges</td>
                    <td className="py-3 px-2 text-xs text-slate-400 hidden sm:table-cell">
                      Custom approved category
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-semibold">
                      ৳{(totals?.otherChargesTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {/* Individual Line Items if present */}
                {(data?.items || []).map((it) => (
                  <tr key={it.id} className="text-xs text-slate-600 bg-slate-50/20">
                    <td className="py-2.5 px-2 pl-6">• {it.categoryName}</td>
                    <td className="py-2.5 px-2 text-slate-400 hidden sm:table-cell">{it.notes || '—'}</td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      ৳{it.amountTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}

                {/* Total Charges Subtotal */}
                <tr className="border-t-2 border-slate-200 bg-slate-50/60 font-semibold text-slate-800">
                  <td className="py-3 px-2">Total Monthly Billed Amount</td>
                  <td className="py-3 px-2 hidden sm:table-cell text-xs text-slate-500 font-normal">
                    Opening Due + Current Charges
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-base">
                    ৳{(totals?.totalBilledTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Less: Credits/Adjustments */}
                {(totals?.creditAdjustmentTaka || 0) > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/30">
                    <td className="py-2.5 px-2">Less: Approved Credits & Adjustments</td>
                    <td className="py-2.5 px-2 text-xs hidden sm:table-cell opacity-80">
                      Discounts or reversal credits
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold">
                      -৳{(totals?.creditAdjustmentTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {/* Less: Confirmed Payments */}
                <tr className="text-emerald-800 bg-emerald-50/50">
                  <td className="py-3 px-2 font-semibold">Less: Confirmed Payments Received</td>
                  <td className="py-3 px-2 text-xs hidden sm:table-cell text-emerald-600">
                    Officially verified by management
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-bold text-base">
                    -৳{(totals?.confirmedPaidTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Closing Balance / Final Due */}
                <tr
                  className={`border-t-2 font-black text-lg ${
                    isAdvance
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : isPaid
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-rose-100 text-rose-950 border-rose-300'
                  }`}
                >
                  <td className="py-4 px-3">
                    {isAdvance ? 'Advance Credit Balance' : isPaid ? 'Net Due Balance' : 'Closing Amount Due'}
                  </td>
                  <td className="py-4 px-3 text-xs hidden sm:table-cell font-medium opacity-80">
                    {isPaid ? 'Fully settled' : 'Immediate payment requested'}
                  </td>
                  <td className="py-4 px-3 text-right font-mono text-xl">
                    ৳
                    {isAdvance
                      ? Math.abs(totals?.closingBalanceTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
                      : (totals?.closingBalanceTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mathematical Balance Formula Explainer */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1 print:border-slate-300">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-500" />
              Accounting Balance Formula:
            </div>
            <p className="font-mono text-[11px] text-slate-600">
              Closing Balance = Opening Due + Total Charges - Confirmed Payments - Credits
            </p>
            <p className="text-[11px]">
              Calculated using zero-drift integer poisha arithmetic on the authoritative server ledger.
            </p>
          </div>

          {/* Document Signatures (Visible on Print) */}
          <div className="hidden print:grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-slate-300 text-xs text-slate-600">
            <div>
              <div className="border-b border-slate-400 w-48 mb-2"></div>
              <p className="font-semibold text-slate-800">Resident Signature</p>
              <p className="text-[10px] text-slate-500">Date: _______________</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="border-b border-slate-400 w-48 mb-2"></div>
              <p className="font-semibold text-slate-800">Authorized Mess Manager</p>
              <p className="text-[10px] text-slate-500">Verified & Official</p>
            </div>
          </div>
        </div>

        {/* Document Footer */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400">
          <span>Generated on {meta?.generatedAt} (Asia/Dhaka)</span>
          <span>MessMate SaaS Platform • Multi-Tenant Isolated Accounting</span>
        </div>
      </div>
    </div>
  );
}
