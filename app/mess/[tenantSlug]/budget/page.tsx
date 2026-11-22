import React from 'react';
import type { Metadata } from 'next';
import { MessBudgetManagementView } from '@/components/budget/MessBudgetManagementView';

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
    title: `Budget Management — ${cleanName} | MessMate`,
    description: `Operational budget planning, utilization analytics, and expense integration for ${cleanName}.`,
  };
}

export default async function MessBudgetPage({
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
    <MessBudgetManagementView
      tenantSlug={tenantSlug}
      tenantName={cleanName}
    />
  );
}
