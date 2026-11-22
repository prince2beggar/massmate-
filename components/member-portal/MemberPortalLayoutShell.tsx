'use client';

import React, { useState } from 'react';
import { MemberPortalNavbar } from './MemberPortalNavbar';
import { MemberPortalSidebar } from './MemberPortalSidebar';

interface MemberPortalLayoutShellProps {
  tenantSlug: string;
  tenantName: string;
  tenantLogo?: string | null;
  memberName: string;
  memberRole: string;
  memberStatus: string;
  children: React.ReactNode;
}

export function MemberPortalLayoutShell({
  tenantSlug,
  tenantName,
  tenantLogo = null,
  memberName,
  memberRole,
  memberStatus,
  children,
}: MemberPortalLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col">
      <MemberPortalNavbar
        tenantSlug={tenantSlug}
        tenantName={tenantName}
        tenantLogo={tenantLogo}
        memberName={memberName}
        memberRole={memberRole}
        memberStatus={memberStatus}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1 relative overflow-hidden">
        <MemberPortalSidebar
          tenantSlug={tenantSlug}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
