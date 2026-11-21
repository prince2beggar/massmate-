import React from 'react';
import type { Metadata } from 'next';
import { getPlatformSession } from '@/server/platform/platform-session';
import { inspectDatabaseConfig } from '@/server/db/config';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';

export const metadata: Metadata = {
  title: 'Super Admin Panel | MessMate',
  description: 'Central platform administration and multi-tenant management for MessMate SaaS.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const platformSession = await getPlatformSession();
  const dbConfig = inspectDatabaseConfig();

  return (
    <AdminLayoutShell
      platformSession={platformSession}
      dbConfigured={dbConfig.configured && !!dbConfig.runtimeUrl}
    >
      {children}
    </AdminLayoutShell>
  );
}
