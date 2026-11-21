import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { getPlatformSession } from '@/server/platform/platform-session';
import { platformTenantService } from '@/server/platform/platform-tenant-service';
import { TenantDetailsView } from '@/components/admin/tenants/TenantDetailsView';

export default async function SuperAdminTenantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const platformSession = await getPlatformSession();

  if (!platformSession) {
    redirect('/super-admin/access-denied');
  }

  const resolvedParams = await Promise.resolve(params);

  let details: any = null;
  try {
    details = await platformTenantService.getTenantDetails(resolvedParams.id);
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.message?.includes('does not exist')) {
      notFound();
    }
    throw err;
  }

  if (!details) {
    notFound();
  }

  return <TenantDetailsView initialDetails={details} />;
}
