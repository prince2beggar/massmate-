'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
  Settings2,
  Sparkles,
  Utensils,
  Wallet,
  Megaphone,
  AlertCircle,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { TenantNotificationDto } from '@/server/notifications/tenant-notification-service';

interface MessNotificationCenterViewProps {
  tenantSlug: string;
  tenantName: string;
}

const CATEGORIES = [
  { key: 'ALL', label: 'All Alerts' },
  { key: 'GENERAL', label: 'General & Notices' },
  { key: 'MEAL_UPDATE', label: 'Meals & Dining' },
  { key: 'PAYMENT', label: 'Payments & Billing' },
  { key: 'COMPLAINT', label: 'Complaints' },
  { key: 'EVENT', label: 'Events & Feasts' },
];

export function MessNotificationCenterView({
  tenantSlug,
  tenantName,
}: MessNotificationCenterViewProps) {
  const [notifications, setNotifications] = useState<TenantNotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams();
    if (unreadOnly) params.set('unreadOnly', 'true');
    if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
    params.set('limit', '50');

    fetch(`/api/v1/mess/${tenantSlug}/notifications?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setNotifications(json.data);
          setUnreadCount(json.meta?.unreadCount || 0);
          setTotal(json.meta?.total || 0);
        }
      })
      .catch((err) => {
        console.error('[MessNotificationCenter] Fetch error:', err);
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

      const res = await fetch(`/api/v1/mess/${tenantSlug}/notifications?${params.toString()}`);
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

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('[MessNotificationCenter] Mark as read failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/notifications`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[MessNotificationCenter] Mark all as read failed:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'MEAL_UPDATE':
      case 'MEAL_REQUEST':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <Utensils className="h-3 w-3" /> Meals
          </span>
        );
      case 'PAYMENT':
      case 'BILLING':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <Wallet className="h-3 w-3" /> Finance
          </span>
        );
      case 'COMPLAINT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3" /> Complaint
          </span>
        );
      case 'EVENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <Calendar className="h-3 w-3" /> Event
          </span>
        );
      case 'GENERAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
            <Megaphone className="h-3 w-3" /> Notice
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time operational alerts, dining notices, member requests, and finance updates for {tenantName}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark all read
            </button>
          )}

          <Link
            href={`/mess/${tenantSlug}/notifications/preferences`}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Delivery Settings & Reminders
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-slate-400 shrink-0 ml-1 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Unread Toggle */}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer self-end sm:self-center pr-2">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          Show Unread Only
        </label>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 text-center px-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Sparkles className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No notifications found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {unreadOnly
              ? 'You have caught up with all active alerts! Switch off "Show Unread Only" to view historical notifications.'
              : 'There are no notifications matching the selected category criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing {notifications.length} of {total} alert(s)</span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="h-3 w-3" /> Timestamps in Asia/Dhaka
            </span>
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors ${
                  notif.isRead ? 'bg-white hover:bg-slate-50/60' : 'bg-emerald-50/30 hover:bg-emerald-50/60'
                }`}
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {getCategoryBadge(notif.category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-semibold truncate ${
                        notif.isRead ? 'text-slate-800' : 'text-slate-900 font-bold'
                      }`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>{notif.formattedCreatedAt || notif.createdAt}</span>
                      {notif.isRead && notif.readAt && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Check className="h-3 w-3 text-slate-400" /> Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-9 sm:pl-0">
                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <span>Action</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}

                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
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
    </div>
  );
}
