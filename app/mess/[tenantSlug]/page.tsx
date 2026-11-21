import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMessAdminSession } from '@/server/mess-admin/mess-session';
import { messDashboardService } from '@/server/mess-admin/mess-dashboard-service';
import { MessDashboardView } from '@/components/mess-admin/MessDashboardView';

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function MessDashboardOverviewPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  if (!tenantSlug) {
    notFound();
  }

  const session = await getMessAdminSession(tenantSlug);

  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  // Pre-fetch initial overview data for instant hydration
  const initialData = await messDashboardService.getDashboardOverview(
    session.tenantContext,
    { period: 'current-month' }
  );

  return (
    <MessDashboardView
      tenantSlug={tenantSlug}
      initialData={initialData}
    />
  );
}
