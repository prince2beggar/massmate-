import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMessAdminSession } from '@/server/mess-admin/mess-session';
import { roomService } from '@/server/rooms/room-service';
import { RentalWorkspaceView } from '@/components/mess-admin/rental/RentalWorkspaceView';

export default async function RentalPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  if (!tenantSlug) notFound();

  const session = await getMessAdminSession(tenantSlug);
  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  const initialListingsData = await roomService.listRentalListings(session.tenantContext.tenantId, {
    page: 1,
    limit: 20,
  });

  return (
    <RentalWorkspaceView
      tenantSlug={tenantSlug}
      initialListings={initialListingsData.listings}
      initialSummary={initialListingsData.summary}
    />
  );
}
