import React from 'react';
import type { Metadata } from 'next';
import { MaintenanceManagementView } from '@/components/maintenance/MaintenanceManagementView';

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
    title: `Maintenance & Work Orders — ${cleanName} | MessMate`,
    description: `Track maintenance work orders, technician assignments, operational tasks, and repair expenditure for ${cleanName}.`,
  };
}

export default async function MessMaintenancePage({
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
    <MaintenanceManagementView
      tenantSlug={tenantSlug}
      tenantName={cleanName}
    />
  );
}
