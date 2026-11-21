import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMessAdminSession } from '@/server/mess-admin/mess-session';
import { roomService } from '@/server/rooms/room-service';
import { RoomDirectoryView } from '@/components/mess-admin/rooms/RoomDirectoryView';

export default async function RoomsPage({
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

  const initialData = await roomService.listRooms(session.tenantContext.tenantId, {
    page: 1,
    limit: 20,
    sortBy: 'roomNumber',
    sortOrder: 'asc',
  });

  return <RoomDirectoryView tenantSlug={tenantSlug} initialData={initialData} />;
}
