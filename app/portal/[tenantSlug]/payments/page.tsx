import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMemberPortalSession } from '@/server/member-portal/member-session';
import { memberPortalService } from '@/server/member-portal/member-portal-service';
import { MemberPaymentsView } from '@/components/member-portal/MemberPaymentsView';

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
  searchParams?: Promise<{ status?: string; month?: string }>;
}

export default async function MemberPortalPaymentsPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = resolvedSearchParams?.status;
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
    initialData = await memberPortalService.listMemberPayments(session.userId, tenantSlug, { status, month });
  } catch {
    // Falls back to client fetch
  }

  return <MemberPaymentsView tenantSlug={tenantSlug} initialData={initialData} />;
}
