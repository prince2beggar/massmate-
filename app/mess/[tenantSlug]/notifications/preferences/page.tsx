import React from 'react';
import type { Metadata } from 'next';
import { MessNotificationSettingsView } from '@/components/notifications/MessNotificationSettingsView';

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
    title: `Delivery Preferences & Reminders — ${cleanName} | MessMate`,
    description: `Configure delivery channels, quiet hours, and automated staff reminders for ${cleanName}.`,
  };
}

export default async function MessNotificationPreferencesPage({
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
    <MessNotificationSettingsView
      tenantSlug={tenantSlug}
      tenantName={cleanName}
    />
  );
}
