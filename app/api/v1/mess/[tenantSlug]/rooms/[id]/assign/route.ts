import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { roomService } from '@/server/rooms/room-service';

export const POST = withTenantAuth(
  { permission: 'rooms.manage_allocation' },
  async (req, { tenantContext, params }) => {
    const roomId = params.id as string;
    const body = await req.json();

    const result = await roomService.assignMemberToBed(
      tenantContext.tenantId,
      { ...body, roomId },
      {
        userId: tenantContext.userId,
        roleName: tenantContext.roleName,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  }
);
