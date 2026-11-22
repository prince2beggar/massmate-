import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getMemberPortalSession } from '@/server/member-portal/member-session';
import { PortalNotificationCenterView } from '@/components/notifications/PortalNotificationCenterView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  const cleanName = tenantSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    title: `Notifications — ${cleanName} | Member Portal`,
    description: `Personal alerts, dining reminders, and billing statements for ${cleanName}.`,
  };
}

export default async function MemberPortalNotificationsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  if (!tenantSlug) {
    notFound();
  }

  const session = await getMemberPortalSession(tenantSlug);
  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized_member&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  return (
    <PortalNotificationCenterView
      tenantSlug={tenantSlug}
      tenantName={session.tenantName}
    />
  );
}
