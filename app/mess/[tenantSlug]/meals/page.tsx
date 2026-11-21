import React from 'react';
import { MessModulePlaceholder } from '@/components/mess-admin/MessModulePlaceholder';

export default async function MealsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  return <MessModulePlaceholder tenantSlug={tenantSlug} moduleId="meals" />;
}
