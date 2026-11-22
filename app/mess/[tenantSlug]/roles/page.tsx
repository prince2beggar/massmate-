import React from 'react';
import { RolesManagementView } from '@/components/mess-admin/roles/RolesManagementView';

export default async function RolesPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  return <RolesManagementView tenantSlug={tenantSlug} />;
}
