import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { roomService } from '@/server/rooms/room-service';

export const GET = withTenantAuth(
  { permission: 'rooms.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const month = url.searchParams.get('month') || undefined;

    const calendar = await roomService.getAvailabilityCalendar(
      tenantContext.tenantId,
      month
    );

    return NextResponse.json({
      success: true,
      data: calendar,
    });
  }
);
