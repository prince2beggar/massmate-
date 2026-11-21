'use client';

import React, { useState } from 'react';
import { MessSidebar } from './MessSidebar';
import { MessHeader } from './MessHeader';
import type { TenantContext } from '@/server/tenant/tenant-context';
import type { AccessibleMess } from '@/server/mess-admin/mess-session';
import { cn } from '@/lib/utils';

interface MessAdminLayoutShellProps {
  tenantSlug: string;
  tenantName: string;
  tenantContext?: TenantContext | null;
  accessibleMesses?: AccessibleMess[];
  userName?: string;
  userEmail?: string | null;
  children: React.ReactNode;
}

export function MessAdminLayoutShell({
  tenantSlug,
  tenantName,
  tenantContext,
  accessibleMesses = [],
  userName = 'Mess Administrator',
  userEmail,
  children,
}: MessAdminLayoutShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* 1. Left Sidebar Navigation */}
      <MessSidebar
        tenantSlug={tenantSlug}
        tenantName={tenantName}
        tenantContext={tenantContext}
        userName={userName}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* 2. Main Content Wrapper */}
      <div
        className={cn(
          'flex flex-col transition-all duration-200 ease-in-out min-h-screen',
          collapsed ? 'md:pl-18' : 'md:pl-64'
        )}
      >
        <MessHeader
          tenantSlug={tenantSlug}
          tenantName={tenantName}
          tenantContext={tenantContext}
          accessibleMesses={accessibleMesses}
          userName={userName}
          userEmail={userEmail}
          onOpenMobileNav={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
