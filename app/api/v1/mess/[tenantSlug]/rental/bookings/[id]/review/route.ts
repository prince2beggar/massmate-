import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { roomService } from '@/server/rooms/room-service';

export const PATCH = withTenantAuth(
  { permission: 'rooms.manage_allocation' },
  async (req, { tenantContext, params }) => {
    const bookingId = params.id as string;
    const body = await req.json();

    const result = await roomService.reviewBookingRequest(
      tenantContext.tenantId,
      bookingId,
      body.decision,
      body.reason,
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
