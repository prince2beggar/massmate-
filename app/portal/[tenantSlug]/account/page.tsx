import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMemberPortalSession } from '@/server/member-portal/member-session';
import { memberPortalService } from '@/server/member-portal/member-portal-service';
import { MemberAccountView } from '@/components/member-portal/MemberAccountView';

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
  searchParams?: Promise<{ month?: string }>;
}

export default async function MemberPortalAccountPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const month = resolvedSearchParams?.month;

  if (!tenantSlug) {
    notFound();
  }

  const session = await getMemberPortalSession(tenantSlug);
  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized_member&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  let initialData = null;
  try {
    initialData = await memberPortalService.getMemberAccountOverview(session.userId, tenantSlug, month);
  } catch {
    // Falls back to client fetch
  }

  return <MemberAccountView tenantSlug={tenantSlug} initialData={initialData} />;
}
