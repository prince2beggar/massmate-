import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { roomService } from '@/server/rooms/room-service';

export const PATCH = withTenantAuth(
  { permission: 'rooms.update' },
  async (req, { tenantContext, params }) => {
    const listingId = params.id as string;
    const body = await req.json();

    if (body.status) {
      const result = await roomService.updateRentalListingStatus(
        tenantContext.tenantId,
        listingId,
        body.status,
        {
          userId: tenantContext.userId,
          roleName: tenantContext.roleName,
        }
      );
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: true });
  }
);
