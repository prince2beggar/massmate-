import React from 'react';
import { redirect } from 'next/navigation';
import { getPlatformSession } from '@/server/platform/platform-session';
import { platformOverviewService } from '@/server/platform/platform-overview-service';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';

export default async function SuperAdminOverviewPage() {
  const platformSession = await getPlatformSession();

  // Guard: Unauthorized users are redirected to dedicated Access Denied page
  if (!platformSession) {
    redirect('/super-admin/access-denied');
  }

  // Pre-load initial 30-day platform aggregation on the server
  const initialData = await platformOverviewService.getOverviewData('30d');

  return (
    <SuperAdminDashboard
      initialData={initialData}
      platformSession={platformSession}
    />
  );
}
