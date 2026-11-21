'use client';

import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BedDouble,
  CheckCircle2,
  Receipt,
  ShoppingBag,
  Utensils,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Badge } from '@/components/ui/badge';

const WEEKLY_MEAL_BARS = [
  { day: 'Sat', count: 38, pct: 76 },
  { day: 'Sun', count: 42, pct: 84 },
  { day: 'Mon', count: 44, pct: 88 },
  { day: 'Tue', count: 41, pct: 82 },
  { day: 'Wed', count: 46, pct: 92 },
  { day: 'Thu', count: 45, pct: 90 },
  { day: 'Fri', count: 48, pct: 96 },
];

const MEMBER_ACTIVITY = [
  {
    id: 'act-1',
    name: { en: 'Tanvir Hasan', bn: 'তানভীর হাসান' },
    action: { en: 'Logged 2 meals (Lunch & Dinner)', bn: '২টি মিল যুক্ত করেছেন' },
    meta: { en: 'R-201 · 09:15 AM', bn: 'রুম ২০১ · সকাল ৯:১৫' },
    icon: Utensils,
    iconBg: 'bg-[#EEF2FF] text-[#324CDD]',
  },
  {
    id: 'act-2',
    name: { en: 'Rafiul Islam', bn: 'রাফিউল ইসলাম' },
    action: { en: 'Added bazar entry (৳1,450)', bn: 'বাজার এন্ট্রি (৳১,৪৫০)' },
    meta: { en: 'R-204 · Yesterday', bn: 'রুম ২০৪ · গতকাল' },
    icon: ShoppingBag,
    iconBg: 'bg-sky-50 text-[#0284C7]',
  },
  {
    id: 'act-3',
    name: { en: 'Nabil Chowdhury', bn: 'নাবিল চৌধুরী' },
    action: { en: 'Seat R-302B confirmed for Dec', bn: 'রুম ৩০২-বি সিট নিশ্চিত' },
    meta: { en: 'R-302 · Nov 18', bn: 'রুম ৩০২ · ১৮ নভে' },
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50 text-[#059669]',
  },
];

const RECENT_TRANSACTIONS = [
  {
    id: 'tx-1',
    title: { en: 'Rent · Room 201', bn: 'ভাড়া · রুম ২০১' },
    subtitle: { en: 'bKash · Nov 19', bn: 'বিকাশ · ১৯ নভে' },
    amount: '+৳5,500',
    direction: 'in' as const,
  },
  {
    id: 'tx-2',
    title: { en: 'Bazar · Fresh Market', bn: 'বাজার · কাঁচাবাজার' },
    subtitle: { en: 'Receipt #142', bn: 'রসিদ #১৪২' },
    amount: '-৳2,340',
    direction: 'out' as const,
  },
  {
    id: 'tx-3',
    title: { en: 'Meal Deposit · R-204', bn: 'মিল জমা · রুম ২০৪' },
    subtitle: { en: 'Cash · Nov 18', bn: 'নগদ · ১৮ নভে' },
    amount: '+৳3,000',
    direction: 'in' as const,
  },
  {
    id: 'tx-4',
    title: { en: 'Utilities · Fiber & Gas', bn: 'ইউটিলিটি · ওয়াইফাই ও গ্যাস' },
    subtitle: { en: 'Split 14 ways', bn: '১৪ জনে বিভক্ত' },
    amount: '-৳1,850',
    direction: 'out' as const,
  },
];

export function HeroProductPreview() {
  const { locale, t } = useLanguage();

  return (
    <figure
      aria-label={
        locale === 'en'
          ? 'Static MessMate workspace preview showing sample monthly expenses, meal overview, room availability, member activity, and recent transactions'
          : 'MessMate ওয়ার্কস্পেস স্যাম্পল প্রিভিউ'
      }
      className="relative w-full max-w-full rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_rgba(23,43,77,0.09),0_4px_14px_rgba(23,43,77,0.04)] overflow-hidden"
    >
      {/* Window Header Chrome */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-slate-200/80 bg-[#F8F9FE] px-3.5 py-3 sm:px-5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>
          <p className="truncate text-xs sm:text-sm font-semibold text-[#172B4D]">
            {t.hero.previewTitle}
          </p>
        </div>
        <Badge variant="outline" className="bg-white text-[11px] font-medium shrink-0">
          {t.hero.previewMonth}
        </Badge>
      </div>

      {/* Main Workspace Canvas */}
      <div className="p-3.5 sm:p-4 xl:p-5 space-y-3.5 xl:space-y-4">
        {/* Top Row: Monthly Expense Summary, Meal Overview & Room Availability */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 xl:gap-3">
          {/* Monthly Expense Summary */}
          <div className="min-w-0 rounded-xl border border-slate-200/80 bg-[#F8F9FE]/70 p-3 xl:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] xl:text-xs font-medium text-[#525F7F] leading-tight">
                {t.hero.totalBazarLabel}
              </span>
              <Wallet className="h-3.5 w-3.5 text-[#324CDD] shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-2.5">
              <p className="font-mono tabular-nums text-lg xl:text-xl font-bold tracking-tight text-[#172B4D]">
                ৳46,800
              </p>
              <p className="mt-1 text-[11px] text-[#64748B]">
                {locale === 'en' ? 'Bazar ৳38.7k · Utils ৳8.1k' : 'বাজার ৳৩৮.৭k · বিল ৳৮.১k'}
              </p>
            </div>
          </div>

          {/* Meal Overview */}
          <div className="min-w-0 rounded-xl border border-slate-200/80 bg-[#F8F9FE]/70 p-3 xl:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] xl:text-xs font-medium text-[#525F7F] leading-tight">
                {t.hero.mealRateLabel}
              </span>
              <Utensils className="h-3.5 w-3.5 text-[#0284C7] shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-2">
              <div className="flex flex-wrap items-baseline gap-1">
                <p className="font-mono tabular-nums text-lg xl:text-xl font-bold tracking-tight text-[#172B4D]">
                  ৳64.50
                </p>
                <span className="text-[11px] text-[#64748B]">
                  {locale === 'en' ? '/ meal' : '/ মিল'}
                </span>
              </div>
              {/* Compact 7-day meal trend sparkbars */}
              <div className="mt-2 flex items-end justify-between gap-1 h-5" aria-hidden="true">
                {WEEKLY_MEAL_BARS.map((bar, idx) => (
                  <span
                    key={bar.day}
                    className={`flex-1 rounded-xs ${
                      idx === WEEKLY_MEAL_BARS.length - 1
                        ? 'bg-[#324CDD]'
                        : 'bg-[#324CDD]/25'
                    }`}
                    style={{ height: `${Math.max(30, bar.pct)}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Room Availability */}
          <div className="min-w-0 rounded-xl border border-slate-200/80 bg-[#F8F9FE]/70 p-3 xl:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] xl:text-xs font-medium text-[#525F7F] leading-tight">
                {t.hero.collectedRentLabel}
              </span>
              <BedDouble className="h-3.5 w-3.5 text-[#059669] shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <p className="font-mono tabular-nums text-lg xl:text-xl font-bold tracking-tight text-[#172B4D]">
                  {locale === 'en' ? '2 Open' : '২টি খালি'}
                </p>
                <span className="font-mono tabular-nums text-[11px] font-semibold text-[#059669]">
                  14/16
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full w-[87.5%] rounded-full bg-[#059669]" />
              </div>
            </div>
          </div>
        </div>

        {/* Lower Split: Member Activity & Recent Transactions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xl:gap-4 pt-0.5">
          {/* Member Activity */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 xl:p-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-[#172B4D]">
                {t.hero.memberLedgerLabel}
              </h3>
              <span className="font-mono text-[11px] text-[#64748B]">
                {locale === 'en' ? '14 active' : '১৪ সক্রিয়'}
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {MEMBER_ACTIVITY.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} className="flex items-start gap-2.5 py-2.5 first:pt-2.5 last:pb-0.5">
                    <span
                      className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#172B4D]">
                        {item.name[locale]}
                      </p>
                      <p className="truncate text-[11px] text-[#525F7F]">
                        {item.action[locale]}
                      </p>
                      <p className="text-[10px] text-[#64748B] mt-0.5">
                        {item.meta[locale]}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 xl:p-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-[#172B4D]">
                {locale === 'en' ? 'Recent Transactions' : 'সাম্প্রতিক লেনদেন'}
              </h3>
              <Receipt className="h-3.5 w-3.5 text-[#64748B]" aria-hidden="true" />
            </div>
            <ul className="divide-y divide-slate-100">
              {RECENT_TRANSACTIONS.map((tx) => {
                const isCredit = tx.direction === 'in';
                return (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-2 py-2 first:pt-2.5 last:pb-0.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                          isCredit
                            ? 'bg-emerald-50 text-[#059669]'
                            : 'bg-slate-100 text-[#525F7F]'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[#172B4D]">
                          {tx.title[locale]}
                        </p>
                        <p className="truncate text-[10px] text-[#64748B]">
                          {tx.subtitle[locale]}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-mono tabular-nums text-xs font-semibold shrink-0 ${
                        isCredit ? 'text-[#059669]' : 'text-[#172B4D]'
                      }`}
                    >
                      {tx.amount}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Verification Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-[#F8F9FE]/80 px-4 py-2.5 sm:px-5 text-[11px] text-[#64748B]">
        <span>
          {locale === 'en'
            ? 'Illustrative workspace data · Meal rate recalculates automatically'
            : 'নমুনা ডেটা প্রিভিউ · মিল রেট স্বয়ংক্রিয়ভাবে হিসাব হয়'}
        </span>
        <span className="font-mono tabular-nums font-medium text-[#172B4D]">
          {locale === 'en' ? '600 meals · 93% rent settled' : '৬০০ মিল · ৯৩% ভাড়া পরিশোধিত'}
        </span>
      </div>
    </figure>
  );
}
