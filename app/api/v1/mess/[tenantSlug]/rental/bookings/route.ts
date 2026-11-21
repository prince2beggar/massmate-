import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { roomService } from '@/server/rooms/room-service';

export const GET = withTenantAuth(
  { permission: 'rooms.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const listingId = url.searchParams.get('listingId') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const result = await roomService.listBookingRequests(tenantContext.tenantId, {
      listingId,
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'rooms.view' },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const booking = await roomService.createBookingRequest(
      tenantContext.tenantId,
      body
    );

    return NextResponse.json(
      {
        success: true,
        data: booking,
      },
      { status: 201 }
    );
  }
);
