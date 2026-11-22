'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  Utensils,
  Wallet,
  Megaphone,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { TenantNotificationDto } from '@/server/notifications/tenant-notification-service';

interface NotificationBellProps {
  tenantSlug: string;
  portalMode?: boolean;
  apiBasePath?: string;
  centerPath?: string;
}

export function NotificationBell({
  tenantSlug,
  portalMode = false,
  apiBasePath,
  centerPath,
}: NotificationBellProps) {
  const router = useRouter();
  const basePath = apiBasePath || (portalMode
    ? `/api/v1/portal/${tenantSlug}/notifications`
    : `/api/v1/mess/${tenantSlug}/notifications`);
  const viewAllPath = centerPath || (portalMode
    ? `/portal/${tenantSlug}/notifications`
    : `/mess/${tenantSlug}/notifications`);

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<TenantNotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLatest = () => {
      fetch(`${basePath}?limit=5`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (isMounted && json?.success && json.data) {
            setNotifications(json.data);
            setUnreadCount(json.meta?.unreadCount || 0);
          }
        })
        .catch((err) => {
          console.warn('[NotificationBell] Failed to fetch notifications:', err);
        });
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 60000); // 1 minute auto-refresh
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [basePath]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      setLoading(true);
      fetch(`${basePath}?limit=5`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.success && json.data) {
            setNotifications(json.data);
            setUnreadCount(json.meta?.unreadCount || 0);
          }
        })
        .finally(() => setLoading(false));
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${basePath}/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('[NotificationBell] Mark as read failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch(basePath, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[NotificationBell] Mark all as read failed:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MEAL_UPDATE':
      case 'MEAL_REQUEST':
        return <Utensils className="h-3.5 w-3.5 text-amber-600" />;
      case 'PAYMENT':
      case 'BILLING':
        return <Wallet className="h-3.5 w-3.5 text-emerald-600" />;
      case 'COMPLAINT':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-600" />;
      case 'EVENT':
        return <Calendar className="h-3.5 w-3.5 text-blue-600" />;
      case 'GENERAL':
      default:
        return <Megaphone className="h-3.5 w-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted hover:text-slate-900 dark:hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xl z-50 animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-800 dark:text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-border/60">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                Loading alerts...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center mb-2">
                  <Sparkles className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-foreground">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No recent notifications found.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) {
                      fetch(`${basePath}/${notif.id}/read`, { method: 'PATCH' });
                      setUnreadCount((c) => Math.max(0, c - 1));
                    }
                    if (notif.link) {
                      setIsOpen(false);
                      router.push(notif.link);
                    }
                  }}
                  className={`group relative flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer ${
                    notif.isRead
                      ? 'bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted/40'
                      : 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  {/* Category icon */}
                  <div className="mt-0.5 shrink-0 rounded-lg bg-slate-100 dark:bg-muted p-1.5 border border-slate-200/60 dark:border-border">
                    {getCategoryIcon(notif.category)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-semibold truncate ${
                        notif.isRead ? 'text-slate-700 dark:text-foreground/90' : 'text-slate-900 dark:text-foreground font-bold'
                      }`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-muted-foreground line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400">
                        {notif.formattedCreatedAt || notif.createdAt}
                      </span>
                      {notif.link && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          View details <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Single mark as read button */}
                  {!notif.isRead && (
                    <button
                      type="button"
                      title="Mark as read"
                      onClick={(e) => handleMarkAsRead(e, notif.id)}
                      className="absolute top-3.5 right-3 p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-border bg-slate-50/60 dark:bg-muted/20 px-4 py-2.5 text-center">
            <Link
              href={viewAllPath}
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              View all notifications & settings →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
