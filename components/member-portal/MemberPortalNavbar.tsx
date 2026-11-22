'use client';

import React from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  LogOut,
  User,
  Shield,
  Building,
  CheckCircle,
} from 'lucide-react';

interface MemberPortalNavbarProps {
  tenantSlug: string;
  tenantName: string;
  tenantLogo: string | null;
  memberName: string;
  memberRole: string;
  memberStatus: string;
  onToggleSidebar?: () => void;
}

export function MemberPortalNavbar({
  tenantSlug,
  tenantName,
  tenantLogo,
  memberName,
  memberRole,
  memberStatus,
  onToggleSidebar,
}: MemberPortalNavbarProps) {
  const handleSignOut = () => {
    // Clear session and return to portal sign-in / homepage
    window.location.href = '/member-portal';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4 sm:px-6">
      {/* Left: Mobile Menu Toggle & Mess Branding */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link
          href={`/portal/${tenantSlug}`}
          className="flex items-center gap-2.5 font-bold text-foreground text-sm sm:text-base tracking-tight hover:opacity-90 transition-opacity"
        >
          {tenantLogo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={tenantLogo}
              alt={tenantName}
              className="h-8 w-8 rounded-lg object-cover border border-border"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm">
              <Building className="h-4 w-4" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="leading-tight truncate max-w-[150px] sm:max-w-[220px]">
              {tenantName}
            </span>
            <span className="text-[10px] font-medium text-primary tracking-normal uppercase">
              Resident Member Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Right: Status Badges, Profile & Sign Out */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="h-3 w-3" />
          {memberStatus}
        </span>

        {/* Member Profile Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/60">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase">
            {memberName ? memberName.charAt(0) : <User className="h-4 w-4" />}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">
              {memberName}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Shield className="h-2.5 w-2.5 text-primary" />
              {memberRole}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          title="Sign out of Member Portal"
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground text-xs font-medium inline-flex items-center gap-1 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
