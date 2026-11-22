import React from 'react';
import type { Metadata } from 'next';
import { PortalDocumentVaultView } from '@/components/member-portal/PortalDocumentVaultView';

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
    title: `My Documents — ${cleanName} Member Portal | MessMate`,
    description: `View agreements, rent vouchers, and permitted personal documents for ${cleanName}.`,
  };
}

export default async function PortalDocumentsPage({
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
    <PortalDocumentVaultView
      tenantSlug={tenantSlug}
      tenantName={cleanName}
    />
  );
}
