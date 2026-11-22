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
    title: `Maintenance & Complaints — ${cleanName} | MessMate`,
    description: `Manage member grievances, convert complaints to maintenance work orders, and track repairs for ${cleanName}.`,
  };
}

export default async function ComplaintsPage({
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
