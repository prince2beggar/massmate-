'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  ExternalLink,
  X,
  LogOut,
  Building,
} from 'lucide-react';
import { ADMIN_NAV_ITEMS } from './admin-nav-data';
import { cn } from '@/lib/utils';
import type { PlatformContext } from '@/server/platform/platform-auth';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  platformSession?: PlatformContext | null;
}

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  platformSession,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const roleLabelMap: Record<string, string> = {
    PLATFORM_OWNER: 'Platform Owner',
    PLATFORM_ADMIN: 'Platform Admin',
    SUPPORT_STAFF: 'Support Staff',
    FINANCE_STAFF: 'Finance Staff',
  };

  const currentRoleName = platformSession?.platformRole
    ? roleLabelMap[platformSession.platformRole] || platformSession.platformRole
    : 'Platform Admin';

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-100">
      {/* 1. Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <Link
            href="/super-admin"
            className="flex items-center gap-2.5 font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white">
                  MessMate
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                  Super Admin
                </span>
              </div>
            )}
          </Link>

          {/* Desktop collapse button */}
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

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close mobile navigation"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Navigation Items */}
        <nav className="space-y-1 px-3 py-4" aria-label="Super Admin Navigation">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/super-admin'
                ? pathname === '/super-admin'
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />

                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase',
                          isActive
                            ? 'bg-indigo-700 text-indigo-100'
                            : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. Footer Profile & Exit */}
      <div className="border-t border-slate-800 p-3">
        {/* User Card */}
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg bg-slate-800/60 p-2.5',
            collapsed && 'justify-center p-2'
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-400 border border-indigo-500/30">
            {platformSession?.userName ? platformSession.userName[0].toUpperCase() : 'A'}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-200">
                {platformSession?.userName || 'Platform Admin'}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="truncate text-[10px] font-medium text-indigo-400">
                  {currentRoleName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Exit to Public Web */}
        <Link
          href="/"
          className={cn(
            'mt-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200',
            collapsed && 'justify-center px-2'
          )}
          title="Exit to Public Website"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Exit to Public Website</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden transition-all duration-200 ease-in-out md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:flex-col border-r border-slate-800 bg-slate-900',
          collapsed ? 'md:w-18' : 'md:w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
