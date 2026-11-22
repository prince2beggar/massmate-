import React from 'react';
import type { Metadata } from 'next';
import { MessDocumentVaultView } from '@/components/documents/MessDocumentVaultView';

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
    title: `Document Vault — ${cleanName} | MessMate`,
    description: `Secure document repository and private file management for ${cleanName}.`,
  };
}

export default async function MessDocumentsPage({
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
    <MessDocumentVaultView
      tenantSlug={tenantSlug}
      tenantName={cleanName}
    />
  );
}
