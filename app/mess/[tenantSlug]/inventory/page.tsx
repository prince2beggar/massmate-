import React from 'react';
import type { Metadata } from 'next';
import { InventoryManagementView } from '@/components/inventory/InventoryManagementView';

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
    title: `Inventory & Stock Management — ${cleanName} | MessMate`,
    description: `Track consumables, kitchen supplies, reusable assets, stock movements, and valuation for ${cleanName}.`,
  };
}

export default async function MessInventoryPage({
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
    <InventoryManagementView
      tenantSlug={tenantSlug}
      tenantName={cleanName}
    />
  );
}
