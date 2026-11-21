import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { roomService } from '@/server/rooms/room-service';

export const GET = withTenantAuth(
  { permission: 'rooms.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const floor = url.searchParams.get('floor') || undefined;
    const sortBy = (url.searchParams.get('sortBy') as any) || undefined;
    const sortOrder = (url.searchParams.get('sortOrder') as any) || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const result = await roomService.listRooms(tenantContext.tenantId, {
      search,
      status,
      floor,
      sortBy,
      sortOrder,
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

    const room = await roomService.createRoom(
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
        data: room,
      },
      { status: 201 }
    );
  }
);
