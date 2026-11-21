'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import type { PlatformContext } from '@/server/platform/platform-auth';
import { cn } from '@/lib/utils';

interface AdminLayoutShellProps {
  children: React.ReactNode;
  platformSession?: PlatformContext | null;
  dbConfigured?: boolean;
}

export function AdminLayoutShell({
  children,
  platformSession,
  dbConfigured = true,
}: AdminLayoutShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      {/* 1. Sidebar (Desktop Persistent & Mobile Drawer) */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        platformSession={platformSession}
      />

      {/* 2. Main Content Area */}
      <div
        className={cn(
          'flex flex-col transition-all duration-200 ease-in-out min-h-screen',
          collapsed ? 'md:pl-18' : 'md:pl-64'
        )}
      >
        <AdminHeader
          onOpenMobileNav={() => setMobileOpen(true)}
          platformSession={platformSession}
          dbConfigured={dbConfigured}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
