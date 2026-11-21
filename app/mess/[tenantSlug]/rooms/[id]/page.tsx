import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMessAdminSession } from '@/server/mess-admin/mess-session';
import { roomService } from '@/server/rooms/room-service';
import { RoomDetailView } from '@/components/mess-admin/rooms/RoomDetailView';

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; id: string }>;
}) {
  const { tenantSlug, id } = await params;
  if (!tenantSlug || !id) notFound();

  const session = await getMessAdminSession(tenantSlug);
  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  let initialRoom = null;
  try {
    initialRoom = await roomService.getRoomById(session.tenantContext.tenantId, id);
  } catch {
    notFound();
  }

  return <RoomDetailView tenantSlug={tenantSlug} roomId={id} initialRoom={initialRoom} />;
}
