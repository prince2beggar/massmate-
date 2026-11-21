import React from 'react';
import { redirect } from 'next/navigation';
import { getPlatformSession } from '@/server/platform/platform-session';
import {
  platformAnalyticsService,
  resolveDateRange,
} from '@/server/platform/platform-analytics-service';
import { PlatformAnalyticsView } from '@/components/admin/analytics/PlatformAnalyticsView';

export default async function SuperAdminAnalyticsPage() {
  const platformSession = await getPlatformSession();

  if (!platformSession) {
    redirect('/super-admin/access-denied');
  }

  const dateFilter = resolveDateRange('30d');
  const analytics = await platformAnalyticsService.getAnalytics(dateFilter);

  return (
    <PlatformAnalyticsView
      initialAnalytics={analytics}
      currentUserRole={platformSession.platformRole}
    />
  );
}
