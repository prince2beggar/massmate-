import React from 'react';
import type { Metadata } from 'next';
import { MessVisitorManagementView } from '@/components/visitors/MessVisitorManagementView';

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
    title: `Visitor & Entry Management — ${cleanName} | MessMate`,
    description: `Gate log, visitor pre-registrations, approval workflows, and check-in / check-out register for ${cleanName}.`,
  };
}

export default async function MessVisitorsPage({
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
    <MessVisitorManagementView
      tenantSlug={tenantSlug}
      tenantName={cleanName}
    />
  );
}
