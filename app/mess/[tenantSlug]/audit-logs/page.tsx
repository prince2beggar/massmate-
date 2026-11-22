import React from 'react';
import { AuditLogsWorkspaceView } from '@/components/mess-admin/audit/AuditLogsWorkspaceView';

export default async function AuditLogsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  return <AuditLogsWorkspaceView tenantSlug={tenantSlug} />;
}
