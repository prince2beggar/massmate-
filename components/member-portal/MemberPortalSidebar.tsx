'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Lock, ShieldCheck } from 'lucide-react';
import { MEMBER_NAV_ITEMS } from './member-nav-data';

interface MemberPortalSidebarProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberPortalSidebar({
  tenantSlug,
  isOpen,
  onClose,
}: MemberPortalSidebarProps) {
  const pathname = usePathname();

  const getHref = (path: string) => {
    return path ? `/portal/${tenantSlug}/${path}` : `/portal/${tenantSlug}`;
  };

  const isActive = (path: string) => {
    const target = getHref(path);
    if (path === '') {
      return pathname === target;
    }
    return pathname.startsWith(target);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden animate-in fade-in-0"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:static md:z-20 md:shadow-none`}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-border md:hidden">
          <span className="font-bold text-sm text-foreground">Portal Navigation</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Resident Workspace
          </div>

          {MEMBER_NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const href = getHref(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={href}
                onClick={onClose}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active ? 'text-primary-foreground' : 'text-primary/80 group-hover:text-primary'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {!item.isImplemented && (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono bg-muted/60 text-muted-foreground/80 border border-border/40">
                    {item.upcomingTask || 'Upcoming'}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Security Badge */}
        <div className="p-4 border-t border-border/80 bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>Encrypted Member Session</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Your records are tenant-isolated and protected under strict personal data boundaries.
          </p>
        </div>
      </aside>
    </>
  );
}
