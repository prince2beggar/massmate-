import React from 'react';
import type { Metadata } from 'next';
import { MessNotificationCenterView } from '@/components/notifications/MessNotificationCenterView';

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
    title: `Notification Center — ${cleanName} | MessMate`,
    description: `Manage in-app operational alerts, notices, and billing updates for ${cleanName}.`,
  };
}

export default async function MessNotificationsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const cleanName = tenantSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <MessNotificationCenterView
      tenantSlug={tenantSlug}
      tenantName={cleanName}
    />
  );
}
