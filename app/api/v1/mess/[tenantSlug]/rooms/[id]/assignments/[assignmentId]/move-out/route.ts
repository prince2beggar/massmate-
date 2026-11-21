import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { roomService } from '@/server/rooms/room-service';

export const POST = withTenantAuth(
  { permission: 'rooms.manage_allocation' },
  async (req, { tenantContext, params }) => {
    const assignmentId = params.assignmentId as string;
    const body = await req.json();

    const result = await roomService.moveOutMember(
      tenantContext.tenantId,
      assignmentId,
      body,
      {
        userId: tenantContext.userId,
        roleName: tenantContext.roleName,
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  }
);
