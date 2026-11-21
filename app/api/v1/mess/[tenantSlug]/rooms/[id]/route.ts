import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { roomService } from '@/server/rooms/room-service';

export const GET = withTenantAuth(
  { permission: 'rooms.view' },
  async (_req, { tenantContext, params }) => {
    const roomId = params.id as string;
    const room = await roomService.getRoomById(tenantContext.tenantId, roomId);

    return NextResponse.json({
      success: true,
      data: room,
    });
  }
);

export const PATCH = withTenantAuth(
  { permission: 'rooms.update' },
  async (req, { tenantContext, params }) => {
    const roomId = params.id as string;
    const body = await req.json();

    const updated = await roomService.updateRoom(
      tenantContext.tenantId,
      roomId,
      body,
      {
        userId: tenantContext.userId,
        roleName: tenantContext.roleName,
      }
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  }
);
