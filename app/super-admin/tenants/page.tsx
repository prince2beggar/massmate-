import React from 'react';
import { redirect } from 'next/navigation';
import { getPlatformSession } from '@/server/platform/platform-session';
import { platformTenantService } from '@/server/platform/platform-tenant-service';
import { TenantDirectoryView } from '@/components/admin/tenants/TenantDirectoryView';

export default async function SuperAdminTenantsPage() {
  const platformSession = await getPlatformSession();

  if (!platformSession) {
    redirect('/super-admin/access-denied');
  }

  // Pre-load initial page on the server
  const result = await platformTenantService.listTenants({ page: 1, limit: 10 });

  return (
    <TenantDirectoryView
      initialTenants={result.tenants}
      initialPagination={result.pagination}
    />
  );
}
