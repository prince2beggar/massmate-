'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  Search,
  HelpCircle,
  User,
  ChevronDown,
  Building2,
  Check,
  LogOut,
  Settings,
  X,
} from 'lucide-react';
import type { TenantContext } from '@/server/tenant/tenant-context';
import type { AccessibleMess } from '@/server/mess-admin/mess-session';
import { MESS_NAV_ITEMS } from './mess-nav-data';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface MessHeaderProps {
  tenantSlug: string;
  tenantName: string;
  tenantContext?: TenantContext | null;
  accessibleMesses?: AccessibleMess[];
  userName?: string;
  userEmail?: string | null;
  onOpenMobileNav: () => void;
}

export function MessHeader({
  tenantSlug,
  tenantName,
  tenantContext,
  accessibleMesses = [],
  userName = 'Mess Administrator',
  userEmail,
  onOpenMobileNav,
}: MessHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const switcherRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(e.target as Node)
      ) {
        setSwitcherOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current page title for breadcrumb
  const currentSubPath = pathname.replace(`/mess/${tenantSlug}`, '').replace(/^\//, '');
  const activeNavItem = MESS_NAV_ITEMS.find((item) =>
    item.path ? currentSubPath.startsWith(item.path) : currentSubPath === ''
  );
  const pageTitle = activeNavItem ? activeNavItem.name : 'Overview';

  // Filter accessible messes for switcher
  const hasMultipleMesses = accessibleMesses.length > 1;

  // Search filtered nav items
  const filteredNavItems = searchQuery.trim()
    ? MESS_NAV_ITEMS.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MESS_NAV_ITEMS.slice(0, 5);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open mobile navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumbs"
            className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex"
          >
            <Link
              href={`/mess/${tenantSlug}`}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              MessMate
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-semibold truncate max-w-[160px]">
              {tenantName}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-emerald-700 font-semibold">{pageTitle}</span>
          </nav>
        </div>

        {/* Center: Mess Switcher (Only if user has multiple messes) */}
        {hasMultipleMesses && (
          <div className="relative" ref={switcherRef}>
            <button
              type="button"
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              aria-expanded={switcherOpen}
              aria-haspopup="listbox"
            >
              <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[200px]">
                {tenantName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {switcherOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Mess
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {accessibleMesses.map((mess) => {
                    const isCurrent = mess.slug === tenantSlug;
                    return (
                      <button
                        key={mess.id}
                        type="button"
                        onClick={() => {
                          setSwitcherOpen(false);
                          router.push(`/mess/${mess.slug}`);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span
                            className={`truncate font-semibold ${
                              isCurrent ? 'text-emerald-700' : 'text-slate-800'
                            }`}
                          >
                            {mess.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Role: {mess.roleName}
                          </span>
                        </div>
                        {isCurrent && (
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right: Search, Notifications, Help, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Search actions and modules"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-xs">Search...</span>
            <kbd className="hidden md:inline rounded bg-slate-200 px-1 py-0.2 text-[10px] text-slate-600">
              Ctrl+K
            </kbd>
          </button>

          {/* Help & Support Link */}
          <Link
            href="/faq"
            target="_blank"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Help & FAQ"
          >
            <HelpCircle className="h-4 w-4" />
          </Link>

          {/* Live Notification Bell with Dropdown (Task 41) */}
          <NotificationBell tenantSlug={tenantSlug} />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 transition-colors"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden flex-col text-left sm:flex">
                <span className="truncate text-xs font-bold text-slate-800 max-w-[120px]">
                  {userName}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600">
                  {tenantContext?.roleName || 'Owner'}
                </span>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50">
                <div className="border-b border-slate-100 px-4 py-2">
                  <p className="text-xs font-bold text-slate-800">{userName}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {userEmail || `${tenantSlug}@messmate.app`}
                  </p>
                  <span className="mt-1 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    {tenantContext?.roleName || 'Owner'}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href={`/mess/${tenantSlug}/settings`}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>Mess Settings</span>
                  </Link>
                  <Link
                    href="/emergency-safety"
                    target="_blank"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Emergency Contacts</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <Link
                    href="/mess-admin-login"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSearchModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-10 mx-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Jump to a module or setting..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-1 max-h-72 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const path = item.path
                  ? `/mess/${tenantSlug}/${item.path}`
                  : `/mess/${tenantSlug}`;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSearchModalOpen(false);
                      router.push(path);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {!item.isImplemented && (
                      <span className="text-[10px] text-slate-400">Upcoming</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
