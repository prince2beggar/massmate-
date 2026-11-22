'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  Moon,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  Utensils,
  Wallet,
  Megaphone,
  AlertCircle,
  Calendar,
  X,
} from 'lucide-react';
import type {
  TenantNotificationDto,
  NotificationPreferenceDto,
} from '@/server/notifications/tenant-notification-service';

interface PortalNotificationCenterViewProps {
  tenantSlug: string;
  tenantName: string;
}

const CATEGORIES = [
  { key: 'ALL', label: 'All Alerts' },
  { key: 'MEAL_UPDATE', label: 'Dining & Meals' },
  { key: 'PAYMENT', label: 'Billing & Payments' },
  { key: 'GENERAL', label: 'Notices' },
  { key: 'COMPLAINT', label: 'Complaints' },
  { key: 'EVENT', label: 'Events' },
];

export function PortalNotificationCenterView({
  tenantSlug,
  tenantName,
}: PortalNotificationCenterViewProps) {
  const [notifications, setNotifications] = useState<TenantNotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Preferences modal
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferenceDto | null>(null);
  const [prefLoading, setPrefLoading] = useState(false);
  const [savingPref, setSavingPref] = useState(false);
  const [prefFeedback, setPrefFeedback] = useState<string | null>(null);

  // Form fields
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [mealsEnabled, setMealsEnabled] = useState(true);
  const [billingEnabled, setBillingEnabled] = useState(true);
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [complaintsEnabled, setComplaintsEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams();
    if (unreadOnly) params.set('unreadOnly', 'true');
    if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
    params.set('limit', '50');

    fetch(`/api/v1/portal/${tenantSlug}/notifications?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setNotifications(json.data);
          setUnreadCount(json.meta?.unreadCount || 0);
          setTotal(json.meta?.total || 0);
        }
      })
      .catch((err) => {
        console.error('[PortalNotificationCenter] Fetch error:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, unreadOnly, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (unreadOnly) params.set('unreadOnly', 'true');
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      params.set('limit', '50');

      const res = await fetch(`/api/v1/portal/${tenantSlug}/notifications?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setNotifications(json.data);
          setUnreadCount(json.meta?.unreadCount || 0);
          setTotal(json.meta?.total || 0);
        }
      }
    } finally {
      setRefreshing(false);
    }
  };

  const loadPreferences = async () => {
    setPrefLoading(true);
    setShowPreferences(true);
    setPrefFeedback(null);
    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/notifications/preferences`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d: NotificationPreferenceDto = json.data;
          setPreferences(d);
          setQuietHoursEnabled(d.quietHoursEnabled);
          setQuietHoursStart(d.quietHoursStart || '22:00');
          setQuietHoursEnd(d.quietHoursEnd || '07:00');
          setMealsEnabled(d.mealsEnabled);
          setBillingEnabled(d.billingEnabled);
          setEventsEnabled(d.eventsEnabled);
          setComplaintsEnabled(d.complaintsEnabled);
        }
      }
    } catch (err) {
      console.error('[PortalNotificationCenter] Preferences error:', err);
    } finally {
      setPrefLoading(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPref(true);
    setPrefFeedback(null);
    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inAppEnabled: true,
          emailEnabled: false,
          smsEnabled: false,
          quietHoursEnabled,
          quietHoursStart,
          quietHoursEnd,
          mealsEnabled,
          billingEnabled,
          eventsEnabled,
          complaintsEnabled,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPreferences(json.data);
        setPrefFeedback('Your preferences were updated successfully.');
      } else {
        setPrefFeedback(json.error?.message || 'Failed to save preferences.');
      }
    } catch (err: any) {
      setPrefFeedback(err.message || 'Network error saving preferences.');
    } finally {
      setSavingPref(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('[PortalNotificationCenter] Mark as read failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/notifications`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[PortalNotificationCenter] Mark all as read failed:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'MEAL_UPDATE':
      case 'MEAL_REQUEST':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Utensils className="h-3 w-3" /> Meals
          </span>
        );
      case 'PAYMENT':
      case 'BILLING':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Wallet className="h-3 w-3" /> Billing
          </span>
        );
      case 'COMPLAINT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3 w-3" /> Complaint
          </span>
        );
      case 'EVENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Calendar className="h-3 w-3" /> Event
          </span>
        );
      case 'GENERAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Megaphone className="h-3 w-3" /> Notice
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Notification Center</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Personal notices, meal schedule reminders, monthly billing statements, and complaint responses for {tenantName}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark all read
            </button>
          )}

          <button
            type="button"
            onClick={loadPreferences}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
            Alert Preferences
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 ml-1 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-foreground text-background font-semibold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer self-end sm:self-center pr-2">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
          Show Unread Only
        </label>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card rounded-xl border border-border">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <p className="text-xs text-muted-foreground">Loading alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card rounded-xl border border-border text-center px-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground">You are all caught up!</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            {unreadOnly
              ? 'No unread notifications at the moment. Switch off "Show Unread Only" to see previous history.'
              : 'No alerts found in the selected category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Showing {notifications.length} of {total} alert(s)</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="h-3 w-3" /> Timestamps in Asia/Dhaka
            </span>
          </div>

          <div className="divide-y divide-border/60 rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors ${
                  notif.isRead
                    ? 'bg-card hover:bg-muted/30'
                    : 'bg-primary/5 hover:bg-primary/10'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {getCategoryBadge(notif.category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-semibold truncate ${
                        notif.isRead ? 'text-foreground' : 'text-foreground font-bold'
                      }`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span>{notif.formattedCreatedAt || notif.createdAt}</span>
                      {notif.isRead && notif.readAt && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Check className="h-3 w-3" /> Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-9 sm:pl-0">
                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <span>Action</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}

                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Read</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Alert & Delivery Preferences</h3>
                <p className="text-xs text-muted-foreground">Customize quiet hours and category notifications.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Channels Notice */}
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Active Channel:</span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.2 font-semibold text-[10px]">
                  In-App Notification Center
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                External SMS and Email channels are unconfigured in system settings.
              </p>
            </div>

            {prefFeedback && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs font-semibold text-primary">
                {prefFeedback}
              </div>
            )}

            {prefLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSavePreferences} className="space-y-4">
                {/* Quiet Hours */}
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Quiet Hours (Asia/Dhaka)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={quietHoursEnabled}
                      onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                      className="rounded border-border text-primary h-4 w-4"
                    />
                  </div>

                  {quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                          From (Asia/Dhaka)
                        </label>
                        <input
                          type="time"
                          value={quietHoursStart}
                          onChange={(e) => setQuietHoursStart(e.target.value)}
                          className="w-full rounded-lg border border-border bg-card p-1.5 text-xs text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                          Until (Asia/Dhaka)
                        </label>
                        <input
                          type="time"
                          value={quietHoursEnd}
                          onChange={(e) => setQuietHoursEnd(e.target.value)}
                          className="w-full rounded-lg border border-border bg-card p-1.5 text-xs text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="rounded-xl border border-border p-4 space-y-2.5">
                  <span className="text-xs font-bold text-foreground block mb-1">Category Subscriptions</span>

                  <label className="flex items-center justify-between text-xs py-1 cursor-pointer">
                    <span className="text-foreground">Meals & Dining Updates</span>
                    <input
                      type="checkbox"
                      checked={mealsEnabled}
                      onChange={(e) => setMealsEnabled(e.target.checked)}
                      className="rounded border-border text-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs py-1 cursor-pointer">
                    <span className="text-foreground">Billing & Payment Invoices</span>
                    <input
                      type="checkbox"
                      checked={billingEnabled}
                      onChange={(e) => setBillingEnabled(e.target.checked)}
                      className="rounded border-border text-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs py-1 cursor-pointer">
                    <span className="text-foreground">Feasts & Community Events</span>
                    <input
                      type="checkbox"
                      checked={eventsEnabled}
                      onChange={(e) => setEventsEnabled(e.target.checked)}
                      className="rounded border-border text-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs py-1 cursor-pointer">
                    <span className="text-foreground">Complaints & Requests</span>
                    <input
                      type="checkbox"
                      checked={complaintsEnabled}
                      onChange={(e) => setComplaintsEnabled(e.target.checked)}
                      className="rounded border-border text-primary h-4 w-4"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPreferences(false)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={savingPref}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {savingPref ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Preferences
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
