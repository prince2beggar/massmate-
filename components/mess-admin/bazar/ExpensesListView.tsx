'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  Utensils,
  ShoppingBag,
} from 'lucide-react';

interface ExpenseItemSummary {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPricePoisha: number | string;
  lineTotalPoisha: number | string;
}

interface ExpenseRecord {
  id: string;
  purchaseDate: string;
  purchaserMembershipId: string;
  purchaser?: {
    user?: { name: string; email?: string; phone?: string };
    memberCode?: string | null;
  };
  categoryId: string;
  category?: {
    name: string;
    code: string;
    isMealEligible: boolean;
  };
  totalAmountPoisha: number | string;
  paymentMethod: string;
  vendorName?: string | null;
  description?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVERSED';
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  reversalReason?: string | null;
  items?: ExpenseItemSummary[];
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
  isMealEligible: boolean;
  isActive: boolean;
}

interface ExpensesListViewProps {
  expenses: ExpenseRecord[];
  categories: CategoryOption[];
  members: MemberOption[];
  onOpenRecordModal: () => void;
  onOpenReviewModal: (expense: ExpenseRecord) => void;
  onOpenReverseModal: (expense: ExpenseRecord) => void;
  onOpenDetailsModal: (expense: ExpenseRecord) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export function ExpensesListView({
  expenses,
  categories,
  members,
  onOpenRecordModal,
  onOpenReviewModal,
  onOpenReverseModal,
  onOpenDetailsModal,
  selectedMonth,
  onMonthChange,
}: ExpensesListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPurchaser, setSelectedPurchaser] = useState<string>('ALL');

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Month match (purchaseDate starts with YYYY-MM)
      if (selectedMonth && !exp.purchaseDate.startsWith(selectedMonth)) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && exp.status !== selectedStatus) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'ALL' && exp.categoryId !== selectedCategory) {
        return false;
      }
      // Purchaser filter
      if (selectedPurchaser !== 'ALL' && exp.purchaserMembershipId !== selectedPurchaser) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const purchaserName = exp.purchaser?.user?.name?.toLowerCase() || '';
        const vendor = exp.vendorName?.toLowerCase() || '';
        const desc = exp.description?.toLowerCase() || '';
        const itemNames = exp.items?.map((i) => i.itemName.toLowerCase()).join(' ') || '';

        const matches =
          purchaserName.includes(query) ||
          vendor.includes(query) ||
          desc.includes(query) ||
          itemNames.includes(query);

        if (!matches) return false;
      }
      return true;
    });
  }, [expenses, selectedMonth, selectedStatus, selectedCategory, selectedPurchaser, searchTerm]);

  // Aggregate KPI metrics
  const { totalApprovedTaka, totalPendingTaka, totalMealEligibleTaka, approvedCount } =
    useMemo(() => {
      let approvedPoisha = BigInt(0);
      let pendingPoisha = BigInt(0);
      let mealEligiblePoisha = BigInt(0);
      let appCount = 0;

      for (const exp of filteredExpenses) {
        const poisha = BigInt(exp.totalAmountPoisha || 0);
        if (exp.status === 'APPROVED') {
          approvedPoisha += poisha;
          appCount++;
          if (exp.category?.isMealEligible) {
            mealEligiblePoisha += poisha;
          }
        } else if (exp.status === 'PENDING') {
          pendingPoisha += poisha;
        }
      }

      return {
        totalApprovedTaka: Number(approvedPoisha) / 100,
        totalPendingTaka: Number(pendingPoisha) / 100,
        totalMealEligibleTaka: Number(mealEligiblePoisha) / 100,
        approvedCount: appCount,
      };
    }, [filteredExpenses]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case 'REVERSED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-300">
            <RotateCcw className="h-3 w-3" /> Reversed
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Bazar Purchases & Expenses</h3>
          <p className="text-xs text-slate-500">
            Audit-ready itemized purchases, line calculations, and supervisor reviews
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenRecordModal}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">Approved Spending</span>
            <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">
            ৳{totalApprovedTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700">
            {approvedCount} verified vouchers
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">Pending Review</span>
            <span className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-900">
            ৳{totalPendingTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-amber-700">Awaiting manager audit</div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800">Meal-Eligible Bazar</span>
            <span className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
              <Utensils className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-900">
            ৳{totalMealEligibleTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-blue-700">Applied to meal rate formula</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Voucher Count</span>
            <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{filteredExpenses.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">Filtered purchases in period</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by purchaser, vendor, item or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          />

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVERSED">Reversed</option>
          </select>

          {/* Category selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Purchaser selector */}
          <select
            value={selectedPurchaser}
            onChange={(e) => setSelectedPurchaser(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Purchasers</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
            <h4 className="mt-3 text-sm font-bold text-slate-700">No Expenses Found</h4>
            <p className="mt-1 text-xs text-slate-500">
              No purchases match the selected month and filters. Record a new purchase to get
              started.
            </p>
            <button
              onClick={onOpenRecordModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Record First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Purchaser</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Items Summary</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const totalTaka = Number(exp.totalAmountPoisha || 0) / 100;
                  const itemsList = exp.items || [];
                  const itemsSummaryText =
                    itemsList.map((i) => i.itemName).slice(0, 3).join(', ') +
                    (itemsList.length > 3 ? ` +${itemsList.length - 3} more` : '');

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {exp.purchaseDate}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {exp.purchaser?.user?.name || exp.purchaserMembershipId}
                        </div>
                        {exp.purchaser?.memberCode && (
                          <div className="text-[11px] text-slate-400">
                            {exp.purchaser.memberCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {exp.category?.name || 'General'}
                        </div>
                        {exp.category?.isMealEligible ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-medium">
                            <Utensils className="h-2.5 w-2.5" /> Meal Rate
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Overhead</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 font-medium max-w-xs truncate">
                          {itemsSummaryText || exp.description || 'No item detail'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {itemsList.length} item{itemsList.length !== 1 ? 's' : ''}
                          {exp.vendorName ? ` • ${exp.vendorName}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">
                          ৳{totalTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {exp.paymentMethod}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(exp.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => onOpenDetailsModal(exp)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>

                        {exp.status === 'PENDING' && (
                          <button
                            onClick={() => onOpenReviewModal(exp)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Review
                          </button>
                        )}

                        {exp.status === 'APPROVED' && (
                          <button
                            onClick={() => onOpenReverseModal(exp)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                            title="Reverse Expense"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
