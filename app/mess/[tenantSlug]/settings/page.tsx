import React from 'react';
import { MessSettingsView } from '@/components/mess-admin/settings/MessSettingsView';

export default async function MessSettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  return <MessSettingsView tenantSlug={tenantSlug} />;
}
