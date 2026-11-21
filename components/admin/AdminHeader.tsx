'use client';

import React, { useState } from 'react';
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
  LogOut,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { ADMIN_NAV_ITEMS } from './admin-nav-data';
import type { PlatformContext } from '@/server/platform/platform-auth';
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

  // Dynamic breadcrumb resolution
  const currentItem = ADMIN_NAV_ITEMS.find((item) =>
    item.href === '/super-admin'
      ? pathname === '/super-admin'
      : pathname?.startsWith(item.href)
  ) || { label: 'Super Admin', href: '/super-admin' };

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

      {/* 2. Middle: Global Search Input */}
      <div className="hidden max-w-xs flex-1 px-4 lg:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search messes, users, domains... (⌘K)"
            aria-label="Search platform records"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
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
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-900">
                  Platform Notifications
                </span>
                <span className="text-[10px] text-slate-400">All Systems Normal</span>
              </div>
              <div className="py-4 text-center text-xs text-slate-500">
                <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
                No urgent platform alerts require attention.
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
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
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
