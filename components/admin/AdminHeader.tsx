'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Database,
  ChevronDown,
  User,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  Building2,
  Globe,
  Headphones,
  CreditCard,
  X,
  RefreshCw,
} from 'lucide-react';
import { ADMIN_NAV_ITEMS } from './admin-nav-data';
import type { PlatformContext } from '@/server/platform/platform-auth';
import type { GlobalSearchResult } from '@/server/platform/global-search-service';
import type { NotificationDto } from '@/server/platform/platform-notification-service';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  onOpenMobileNav: () => void;
  platformSession?: PlatformContext | null;
  dbConfigured?: boolean;
}

export function AdminHeader({
  onOpenMobileNav,
  platformSession,
  dbConfigured = true,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Dynamic breadcrumb resolution
  const currentItem = ADMIN_NAV_ITEMS.find((item) =>
    item.href === '/super-admin'
      ? pathname === '/super-admin'
      : pathname?.startsWith(item.href)
  ) || { label: 'Super Admin', href: '/super-admin' };

  // Fetch notifications
  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        const res = await fetch('/api/v1/super-admin/notifications');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.data) {
            setNotifications(data.data.notifications || []);
            setUnreadCount(data.data.unreadCount || 0);
          }
        }
      } catch {
        // quiet fallback
      }
    }
    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  // Global Search debounce query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/v1/super-admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.data);
          setSearchOpen(true);
        }
      } catch {
        // quiet fallback
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/v1/super-admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // quiet fallback
    }
  };

  const hasSearchResults =
    searchResults &&
    (searchResults.tenants.length > 0 ||
      searchResults.users.length > 0 ||
      searchResults.subscriptions.length > 0 ||
      searchResults.tickets.length > 0 ||
      searchResults.domains.length > 0);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* 1. Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/super-admin"
            className="font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Super Admin
          </Link>
          {pathname !== '/super-admin' && (
            <>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-900">{currentItem.label}</span>
            </>
          )}
        </div>
      </div>

      {/* 2. Middle: Live Global Search */}
      <div ref={searchRef} className="relative hidden max-w-sm flex-1 px-4 lg:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length < 2) {
                setSearchResults(null);
              }
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search messes, users, domains... (⌘K)"
            aria-label="Search platform records"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          {isSearching && (
            <RefreshCw className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {searchOpen && searchQuery.length >= 2 && (
          <div className="absolute left-4 right-4 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-2xl z-50 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="font-semibold text-slate-700">Platform Search</span>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {!hasSearchResults ? (
              <p className="py-4 text-center text-slate-400">No results found for &ldquo;{searchQuery}&rdquo;</p>
            ) : (
              <div className="space-y-3">
                {/* Tenants */}
                {searchResults!.tenants.length > 0 && (
                  <div>
                    <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                      <Building2 className="h-3 w-3" /> Tenants
                    </span>
                    <div className="space-y-1">
                      {searchResults!.tenants.map((t) => (
                        <Link
                          key={t.id}
                          href={t.link}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-medium text-slate-900">{t.name}</span>
                          <span className="text-[10px] text-slate-400">{t.city || t.slug}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {searchResults!.users.length > 0 && (
                  <div>
                    <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" /> Users
                    </span>
                    <div className="space-y-1">
                      {searchResults!.users.map((u) => (
                        <Link
                          key={u.id}
                          href={u.link}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-medium text-slate-900">{u.name}</span>
                          <span className="text-[10px] text-slate-400">{u.email || u.phone}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tickets */}
                {searchResults!.tickets.length > 0 && (
                  <div>
                    <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                      <Headphones className="h-3 w-3" /> Support Tickets
                    </span>
                    <div className="space-y-1">
                      {searchResults!.tickets.map((tk) => (
                        <Link
                          key={tk.id}
                          href={tk.link}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-medium text-slate-900">{tk.subject}</span>
                          <span className="font-mono text-[10px] text-slate-400">{tk.ticketNumber}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Domains */}
                {searchResults!.domains.length > 0 && (
                  <div>
                    <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                      <Globe className="h-3 w-3" /> Domains
                    </span>
                    <div className="space-y-1">
                      {searchResults!.domains.map((d) => (
                        <Link
                          key={d.id}
                          href={d.link}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-medium text-slate-900">{d.domainName}</span>
                          <span className="text-[10px] text-slate-400">{d.tenantName}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Right: Database Status, Notifications & Profile Menu */}
      <div className="flex items-center gap-2.5">
        {/* DB Connection Badge */}
        <div
          className={cn(
            'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:flex',
            dbConfigured
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          )}
          title={
            dbConfigured
              ? 'Neon PostgreSQL Connected'
              : 'Development Database Fallback Mode'
          }
        >
          <Database className="h-3.5 w-3.5" />
          <span>{dbConfigured ? 'Neon PostgreSQL' : 'Dev DB Mode'}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserMenuOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-900">
                  Platform Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto py-2 space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500">
                    <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
                    No urgent platform alerts require attention.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'rounded-lg p-2 text-xs transition-colors',
                        n.isRead ? 'bg-white' : 'bg-indigo-50/50 border border-indigo-100'
                      )}
                    >
                      <div className="font-semibold text-slate-900">{n.title}</div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5 transition-colors hover:bg-slate-50"
            aria-label="User profile menu"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {platformSession?.userName ? platformSession.userName[0].toUpperCase() : 'A'}
            </div>
            <span className="hidden text-xs font-medium text-slate-700 sm:block">
              {platformSession?.userName || 'Platform Admin'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50">
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="text-xs font-semibold text-slate-900">
                  {platformSession?.userName || 'Platform Admin'}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {platformSession?.userEmail || 'superadmin@messmate.dev'}
                </p>
                <span className="mt-1 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                  {platformSession?.platformRole || 'PLATFORM_OWNER'}
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/super-admin/audit-logs"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>My Activity Log</span>
                </Link>
                <Link
                  href="/super-admin/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                  <span>Security & Access</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <Link
                  href="/"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  <span>Public Website</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
