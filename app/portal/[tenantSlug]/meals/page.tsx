import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMemberPortalSession } from '@/server/member-portal/member-session';
import { memberPortalService } from '@/server/member-portal/member-portal-service';
import { MemberMealsView } from '@/components/member-portal/MemberMealsView';

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
  searchParams?: Promise<{ month?: string }>;
}

export default async function MemberPortalMealsPage({ params, searchParams }: PageProps) {
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
    initialData = await memberPortalService.getMemberMealOverview(session.userId, tenantSlug, month);
  } catch {
    // Falls back to client-side fetch
  }

  return <MemberMealsView tenantSlug={tenantSlug} initialData={initialData} />;
}
