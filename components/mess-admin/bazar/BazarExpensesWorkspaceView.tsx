'use client';

import React, { useState } from 'react';
import { ShoppingBag, Calendar, Tag, Plus, CalendarPlus, Users } from 'lucide-react';
import { ExpensesListView } from './ExpensesListView';
import { MemberBazarSummaryView } from './MemberBazarSummaryView';
import { BazarScheduleView } from './BazarScheduleView';
import { CategoriesView } from './CategoriesView';
import { RecordExpenseModal } from './RecordExpenseModal';
import { ReviewExpenseModal } from './ReviewExpenseModal';
import { ReverseExpenseModal } from './ReverseExpenseModal';
import { ExpenseDetailsModal } from './ExpenseDetailsModal';
import { AssignBazarModal } from './AssignBazarModal';

interface BazarExpensesWorkspaceViewProps {
  tenantSlug: string;
  initialExpenses: any[];
  initialCategories: any[];
  initialSchedules: any[];
  members: Array<{ id: string; name: string; memberCode?: string | null }>;
  currentMonth: string;
}

export function BazarExpensesWorkspaceView({
  tenantSlug,
  initialExpenses,
  initialCategories,
  initialSchedules,
  members,
  currentMonth,
}: BazarExpensesWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<
    'expenses' | 'member-summary' | 'schedules' | 'categories'
  >('expenses');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  // Data states
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [schedules, setSchedules] = useState<any[]>(initialSchedules);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [reviewExpense, setReviewExpense] = useState<any | null>(null);
  const [reverseExpense, setReverseExpense] = useState<any | null>(null);
  const [detailsExpense, setDetailsExpense] = useState<any | null>(null);

  // Contextual pre-fill for record modal when launched from schedule rota
  const [recordDefaultDate, setRecordDefaultDate] = useState<string | undefined>(undefined);
  const [recordDefaultPurchaserId, setRecordDefaultPurchaserId] = useState<string | undefined>(undefined);
  const [recordScheduleId, setRecordScheduleId] = useState<string | undefined>(undefined);

  // Fetch functions
  const fetchExpenses = async (month?: string) => {
    try {
      const m = month || selectedMonth;
      const res = await fetch(`/api/v1/mess/${tenantSlug}/expenses?month=${m}&limit=200`);
      const json = await res.json();
      if (json.success && json.data?.expenses) {
        setExpenses(json.data.expenses);
      }
    } catch {}
  };

  const fetchSchedules = async (month?: string) => {
    try {
      const m = month || selectedMonth;
      const res = await fetch(`/api/v1/mess/${tenantSlug}/expenses/schedules?month=${m}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSchedules(json.data);
      }
    } catch {}
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/expenses/categories`);
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data);
      }
    } catch {}
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    void fetchExpenses(newMonth);
    void fetchSchedules(newMonth);
  };

  const handleOpenRecordModal = (
    defaultDate?: string,
    defaultPurchaserId?: string,
    scheduleId?: string
  ) => {
    setRecordDefaultDate(defaultDate);
    setRecordDefaultPurchaserId(defaultPurchaserId);
    setRecordScheduleId(scheduleId);
    setIsRecordModalOpen(true);
  };

  const handleRecordForSchedule = (sc: any) => {
    handleOpenRecordModal(sc.assignedDate, sc.assignedMembershipId, sc.id);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Bazar & Expense Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily bazar purchases, rota assignments, and operating expense vouchers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <CalendarPlus className="h-4 w-4 text-emerald-600" />
            Assign Duty
          </button>
          <button
            onClick={() => handleOpenRecordModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === 'expenses'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Purchases & Expenses</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
            {expenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('member-summary')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === 'member-summary'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>সদস্যভিত্তিক বাজার (কে কত বাজার করেছে)</span>
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === 'schedules'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Bazar Duty Rota</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
            {schedules.length}
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
          <span>Expense Categories</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
            {categories.length}
          </span>
        </button>
      </div>

      {/* Workspace Tab Contents */}
      {activeTab === 'expenses' && (
        <ExpensesListView
          expenses={expenses}
          categories={categories}
          members={members}
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          onOpenRecordModal={() => handleOpenRecordModal()}
          onOpenReviewModal={(exp) => setReviewExpense(exp)}
          onOpenReverseModal={(exp) => setReverseExpense(exp)}
          onOpenDetailsModal={(exp) => setDetailsExpense(exp)}
        />
      )}

      {activeTab === 'member-summary' && (
        <MemberBazarSummaryView
          tenantSlug={tenantSlug}
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          onRecordForMember={(memId) => handleOpenRecordModal(undefined, memId)}
        />
      )}

      {activeTab === 'schedules' && (
        <BazarScheduleView
          tenantSlug={tenantSlug}
          schedules={schedules}
          members={members}
          onRefresh={() => fetchSchedules()}
          onOpenAssignModal={() => setIsAssignModalOpen(true)}
          onRecordForSchedule={handleRecordForSchedule}
        />
      )}

      {activeTab === 'categories' && (
        <CategoriesView
          tenantSlug={tenantSlug}
          categories={categories}
          onRefresh={() => fetchCategories()}
        />
      )}

      {/* Modals */}
      {isRecordModalOpen && (
        <RecordExpenseModal
          tenantSlug={tenantSlug}
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setRecordDefaultDate(undefined);
            setRecordDefaultPurchaserId(undefined);
            setRecordScheduleId(undefined);
          }}
          onSuccess={() => {
            void fetchExpenses();
            void fetchSchedules();
          }}
          members={members}
          categories={categories}
          defaultDate={recordDefaultDate}
          defaultPurchaserMembershipId={recordDefaultPurchaserId}
          bazarScheduleId={recordScheduleId}
        />
      )}

      {reviewExpense && (
        <ReviewExpenseModal
          tenantSlug={tenantSlug}
          isOpen={Boolean(reviewExpense)}
          onClose={() => setReviewExpense(null)}
          onSuccess={() => {
            void fetchExpenses();
          }}
          expense={reviewExpense}
        />
      )}

      {reverseExpense && (
        <ReverseExpenseModal
          tenantSlug={tenantSlug}
          isOpen={Boolean(reverseExpense)}
          onClose={() => setReverseExpense(null)}
          onSuccess={() => {
            void fetchExpenses();
          }}
          expense={reverseExpense}
        />
      )}

      {detailsExpense && (
        <ExpenseDetailsModal
          isOpen={Boolean(detailsExpense)}
          onClose={() => setDetailsExpense(null)}
          expense={detailsExpense}
        />
      )}

      {isAssignModalOpen && (
        <AssignBazarModal
          tenantSlug={tenantSlug}
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => {
            void fetchSchedules();
          }}
          members={members}
        />
      )}
    </div>
  );
}
