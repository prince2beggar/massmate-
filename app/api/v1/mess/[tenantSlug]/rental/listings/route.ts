import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { roomService } from '@/server/rooms/room-service';

export const GET = withTenantAuth(
  { permission: 'rooms.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const isPublicParam = url.searchParams.get('isPublic');
    const isPublic = isPublicParam !== null ? isPublicParam === 'true' : undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const result = await roomService.listRentalListings(tenantContext.tenantId, {
      search,
      status,
      isPublic,
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
  { permission: 'rooms.create' },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const listing = await roomService.createRentalListing(
      tenantContext.tenantId,
      body,
      {
        userId: tenantContext.userId,
        roleName: tenantContext.roleName,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: listing,
      },
      { status: 201 }
    );
  }
);
