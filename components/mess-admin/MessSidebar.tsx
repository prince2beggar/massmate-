'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  X,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { MESS_NAV_ITEMS } from './mess-nav-data';
import { cn } from '@/lib/utils';
import type { TenantContext } from '@/server/tenant/tenant-context';

interface MessSidebarProps {
  tenantSlug: string;
  tenantName: string;
  tenantContext?: TenantContext | null;
  userName?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function MessSidebar({
  tenantSlug,
  tenantName,
  tenantContext,
  userName = 'Mess Admin',
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: MessSidebarProps) {
  const pathname = usePathname();

  const basePath = `/mess/${tenantSlug}`;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-100">
      {/* 1. Header / Mess Brand */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <Link
            href={basePath}
            className="flex items-center gap-2.5 font-bold tracking-tight text-white transition-opacity hover:opacity-90"
            onClick={onCloseMobile}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-extrabold tracking-tight text-white max-w-[140px]">
                  {tenantName || 'MessMate'}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Mess Dashboard
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white md:flex"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close mobile navigation"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Navigation Items (17 Items) */}
        <nav
          className="space-y-0.5 px-3 py-3 overflow-y-auto max-h-[calc(100vh-140px)]"
          aria-label="Mess Admin Navigation"
        >
          {MESS_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const fullPath = item.path ? `${basePath}/${item.path}` : basePath;
            const isExactMatch = pathname === fullPath;
            const isSubMatch = item.path && pathname.startsWith(`${fullPath}/`);
            const isActive = isExactMatch || isSubMatch;

            return (
              <Link
                key={item.id}
                href={fullPath}
                onClick={onCloseMobile}
                title={collapsed ? item.name : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  )}
                />
                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <span className="truncate">{item.name}</span>
                    {!item.isImplemented && item.upcomingTask && (
                      <span className="ml-1.5 inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 border border-slate-700">
                        {item.upcomingTask}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. User Identity & Logout at bottom */}
      <div className="border-t border-slate-800 p-3">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700/60 text-xs font-bold text-white border border-emerald-500/40">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-semibold text-white">
                  {userName}
                </span>
                <span className="truncate text-[10px] text-emerald-400">
                  {tenantContext?.roleName || 'Owner'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <Link
                href="/pricing"
                target="_blank"
                className="hover:text-slate-200 flex items-center gap-1"
              >
                <span>Docs</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
              <Link
                href="/mess-admin-login"
                className="hover:text-rose-400 flex items-center gap-1 text-slate-400"
              >
                <LogOut className="h-3 w-3" />
                <span>Logout</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700/60 text-xs font-bold text-white border border-emerald-500/40"
              title={`${userName} (${tenantContext?.roleName || 'Owner'})`}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <Link
              href="/mess-admin-login"
              title="Logout"
              className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-slate-800 transition-all duration-200 ease-in-out md:block',
          collapsed ? 'w-18' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sliding Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
