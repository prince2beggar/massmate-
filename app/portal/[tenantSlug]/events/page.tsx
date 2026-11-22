import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMemberPortalSession } from '@/server/member-portal/member-session';
import { memberPortalService } from '@/server/member-portal/member-portal-service';
import { MemberEventsView } from '@/components/member-portal/MemberEventsView';

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function MemberPortalEventsPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  if (!tenantSlug) {
    notFound();
  }

  const session = await getMemberPortalSession(tenantSlug);
  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized_member&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  let initialData = null;
  try {
    initialData = await memberPortalService.listMemberEvents(session.userId, tenantSlug);
  } catch {
    // Falls back to client-side fetch
  }

  return <MemberEventsView tenantSlug={tenantSlug} initialData={initialData} />;
}
