'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  UtensilsCrossed,
  Wallet,
  CreditCard,
  Megaphone,
  CalendarOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Pin,
} from 'lucide-react';
import type { MemberDashboardDto } from '@/server/member-portal/member-portal-service';

const QUICK_ACTION_ICONS: Record<string, React.ElementType> = {
  Wallet,
  Utensils: UtensilsCrossed,
  CalendarOff,
  CreditCard,
  Megaphone,
};

interface MemberDashboardViewProps {
  tenantSlug: string;
  initialData?: MemberDashboardDto | null;
}

export function MemberDashboardView({ tenantSlug, initialData }: MemberDashboardViewProps) {
  const [data, setData] = useState<MemberDashboardDto | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;
    let isMounted = true;
    fetch(`/api/v1/portal/${tenantSlug}/dashboard`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || errData.error?.message || 'Failed to load member dashboard');
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.success && json.data) {
          setData(json.data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Error connecting to member portal');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, initialData]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/v1/portal/${tenantSlug}/dashboard`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || errData.error?.message || 'Failed to load member dashboard');
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Error connecting to member portal');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="h-9 w-9 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading your personal mess dashboard...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-card border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm space-y-4 text-center my-12">
        <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Portal Access Problem</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {error || 'Unable to load member dashboard records.'}
        </p>
        <button
          onClick={handleRetry}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const {
    member,
    mess,
    overviewCards,
    monthlyAccountSnapshot,
    mealSnapshot,
    recentActivities,
    notices,
    quickActions,
  } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Welcome Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-card to-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Welcome Back
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                  member.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                <CheckCircle className="h-3 w-3" />
                {member.status} Resident
              </span>
              {member.memberCode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  #{member.memberCode}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {member.name}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <span>{mess.name}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {mealSnapshot.todayDate} (Asia/Dhaka)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <Link
              href={`/portal/${tenantSlug}/account`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-all"
            >
              <Wallet className="h-4 w-4" />
              View Account Statement
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Four Key Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Room Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              My Accommodation
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BedDouble className="h-4 w-4" />
            </div>
          </div>

          <div>
            {overviewCards.room.isAssigned ? (
              <>
                <h3 className="text-xl font-bold text-foreground">
                  Room {overviewCards.room.roomNumber}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Slot: <strong>{overviewCards.room.bedLabel}</strong>
                </p>
                <p className="text-xs font-medium text-primary mt-2">
                  Rent: {overviewCards.room.monthlyRentFormatted} / month
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-foreground/80">Unassigned</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No active bed allocation. Contact your mess admin.
                </p>
              </>
            )}
          </div>

          <Link
            href={`/portal/${tenantSlug}/room`}
            className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 pt-1 border-t border-border/50"
          >
            Room Details <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Meal Status Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Today&apos;s Dining
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">
                {overviewCards.meals.todayStatus === 'OFF'
                  ? 'Meal Off'
                  : overviewCards.meals.todayStatus === 'NO_SCHEDULE'
                  ? 'No Schedule'
                  : 'Active Today'}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  overviewCards.meals.todayStatus === 'OFF'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : overviewCards.meals.todayStatus === 'NO_SCHEDULE'
                    ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {overviewCards.meals.todayStatus === 'NO_SCHEDULE'
                  ? 'No Schedule'
                  : overviewCards.meals.todayStatus}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              B: {overviewCards.meals.todayCounts.breakfast ? '✓' : '—'} • L:{' '}
              {overviewCards.meals.todayCounts.lunch ? '✓' : '—'} • D:{' '}
              {overviewCards.meals.todayCounts.dinner ? '✓' : '—'}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Total this month: <strong>{overviewCards.meals.currentMonthCount}</strong> meals
            </p>
          </div>

          <Link
            href={`/portal/${tenantSlug}/meals`}
            className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 pt-1 border-t border-border/50"
          >
            Manage Meals <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Current Balance Due Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Current Due
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-foreground">
              {overviewCards.account.currentDueFormatted}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total Charges: {overviewCards.account.totalBilledFormatted}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Month: {monthlyAccountSnapshot.month} ({monthlyAccountSnapshot.status})
            </p>
          </div>

          <Link
            href={`/portal/${tenantSlug}/account`}
            className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 pt-1 border-t border-border/50"
          >
            Itemized Statement <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Last Payment Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Last Confirmed Payment
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>

          <div>
            {overviewCards.account.lastConfirmedPayment ? (
              <>
                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {overviewCards.account.lastConfirmedPayment.amountFormatted}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  via {overviewCards.account.lastConfirmedPayment.method || 'Direct'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {overviewCards.account.lastConfirmedPayment.date}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-foreground/80">No Confirmed Deposit</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submit a deposit voucher after transferring dues.
                </p>
              </>
            )}
          </div>

          <Link
            href={`/portal/${tenantSlug}/payments`}
            className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 pt-1 border-t border-border/50"
          >
            Payment History <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* 3. Main Content Split: Account Snapshot & Today's Dining */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Monthly Account Snapshot */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Monthly Account Snapshot — {monthlyAccountSnapshot.month}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authoritative ledger breakdown from your mess finance records.
              </p>
            </div>
            <Link
              href={`/portal/${tenantSlug}/account`}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
            >
              Full Statement <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Ledger Calculation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-muted-foreground block text-[11px]">Opening Due</span>
              <span className="text-sm font-bold text-foreground mt-1 block">
                {monthlyAccountSnapshot.openingDueFormatted}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-muted-foreground block text-[11px]">Room Rent</span>
              <span className="text-sm font-bold text-foreground mt-1 block">
                {monthlyAccountSnapshot.rentChargesFormatted}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-muted-foreground block text-[11px]">Utilities & Shared</span>
              <span className="text-sm font-bold text-foreground mt-1 block">
                {monthlyAccountSnapshot.utilityChargesFormatted}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-muted-foreground block text-[11px]">Meal Charges</span>
              <span className="text-sm font-bold text-foreground mt-1 block">
                {monthlyAccountSnapshot.mealChargesFormatted}
              </span>
            </div>
          </div>

          {/* Ledger Calculation Summary */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Total New Charges:</span>
              <span className="font-semibold text-foreground">
                {monthlyAccountSnapshot.totalChargesFormatted}
              </span>
            </div>
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <span>Confirmed Payments Deducted:</span>
              <span className="font-semibold">
                − {monthlyAccountSnapshot.confirmedPaymentsFormatted}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Credits & Adjustments:</span>
              <span className="font-semibold text-foreground">
                − {monthlyAccountSnapshot.adjustmentsFormatted}
              </span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-bold">
              <span className="text-foreground">Net Closing Balance Due:</span>
              <span className="text-primary text-base">
                {monthlyAccountSnapshot.closingDueFormatted}
              </span>
            </div>
          </div>

          {/* Formula Note */}
          <p className="text-[11px] text-muted-foreground italic text-center">
            Formula: Closing Balance = Opening Due + Total Charges − Confirmed Payments − Credits
          </p>
        </div>

        {/* Right Column (1 Col): Today's Dining & Menu */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Today&apos;s Menu
              </h2>
              <span className="text-xs text-muted-foreground">{mealSnapshot.todayDate}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                <span className="font-bold text-primary uppercase text-[10px] tracking-wider block">
                  Breakfast
                </span>
                <p className="text-foreground font-medium">
                  {mealSnapshot.todayMenu.breakfast || 'Menu not yet posted'}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                <span className="font-bold text-primary uppercase text-[10px] tracking-wider block">
                  Lunch
                </span>
                <p className="text-foreground font-medium">
                  {mealSnapshot.todayMenu.lunch || 'Menu not yet posted'}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                <span className="font-bold text-primary uppercase text-[10px] tracking-wider block">
                  Dinner
                </span>
                <p className="text-foreground font-medium">
                  {mealSnapshot.todayMenu.dinner || 'Menu not yet posted'}
                </p>
              </div>

              {mealSnapshot.todayMenu.notes && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px]">
                  <strong>Chef Note:</strong> {mealSnapshot.todayMenu.notes}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <Link
              href={`/portal/${tenantSlug}/meals?action=request-off`}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <CalendarOff className="h-4 w-4" />
              Submit Meal-Off Request
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Split: Published Notices & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notices */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Published Mess Notices
            </h2>
            <Link
              href={`/portal/${tenantSlug}/notices`}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {notices.length === 0 ? (
            <p className="text-xs text-muted-foreground p-8 text-center">
              No published notices right now. Announcements from mess managers will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition-colors ${n.isPinned
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-muted/20 border-border'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      {n.isPinned && <Pin className="h-3 w-3 text-primary rotate-45" />}
                      {n.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{n.publishedAt}</span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Personal Activities */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Personal Activity
            </h2>
          </div>

          {recentActivities.length === 0 ? (
            <p className="text-xs text-muted-foreground p-8 text-center">
              No recent activity recorded yet. Your payments, meal requests, and updates will be logged here.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 text-xs"
                >
                  <div className="p-1.5 rounded bg-primary/10 text-primary mt-0.5">
                    {act.type === 'PAYMENT' && <CreditCard className="h-3.5 w-3.5" />}
                    {act.type === 'MEAL' && <UtensilsCrossed className="h-3.5 w-3.5" />}
                    {act.type === 'ROOM' && <BedDouble className="h-3.5 w-3.5" />}
                    {act.type === 'NOTICE' && <Megaphone className="h-3.5 w-3.5" />}
                    {act.type === 'ACCOUNT' && <Wallet className="h-3.5 w-3.5" />}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{act.action}</span>
                      <span className="text-[10px] text-muted-foreground">{act.formattedTime}</span>
                    </div>
                    <p className="text-muted-foreground">{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Quick Actions Shortcuts */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-foreground">Quick Action Shortcuts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((qa) => {
            const IconComponent = QUICK_ACTION_ICONS[qa.icon] || ArrowUpRight;
            return (
              <Link
                key={qa.id}
                href={qa.href}
                className="p-3.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/60 transition-colors flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                      {qa.label}
                    </span>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-[11px] text-muted-foreground">{qa.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
