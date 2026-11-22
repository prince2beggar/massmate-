import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMemberPortalSession } from '@/server/member-portal/member-session';
import { memberPortalService } from '@/server/member-portal/member-portal-service';
import { MemberDashboardView } from '@/components/member-portal/MemberDashboardView';

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function MemberPortalDashboardPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  if (!tenantSlug) {
    notFound();
  }

  const session = await getMemberPortalSession(tenantSlug);

  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized_member&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  // Pre-fetch initial member dashboard data for immediate SSR hydration
  let initialData = null;
  try {
    initialData = await memberPortalService.getMemberDashboard(session.userId, tenantSlug);
  } catch {
    // Falls back to client-side loading state
  }

  return (
    <MemberDashboardView
      tenantSlug={tenantSlug}
      initialData={initialData}
    />
  );
}
