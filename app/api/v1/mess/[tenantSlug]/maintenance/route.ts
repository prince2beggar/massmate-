import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { maintenanceService } from '@/server/maintenance/maintenance-service';

export const GET = withTenantAuth(
  { permissions: ['rooms.view', 'settings.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const status = searchParams.get('status') || undefined;
    const assignedUserId = searchParams.get('assignedUserId') || undefined;
    const roomId = searchParams.get('roomId') || undefined;
    const overdueOnly = searchParams.get('overdueOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await maintenanceService.listWorkOrders(
      tenantContext.tenantSlug,
      {
        search,
        category,
        priority,
        status,
        assignedUserId,
        roomId,
        overdueOnly,
        limit,
        offset,
      },
      true
    );

    return NextResponse.json({
      success: true,
      data: result.workOrders,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    });
  }
);

export const POST = withTenantAuth(
  { permissions: ['rooms.create', 'settings.manage'] },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const created = await maintenanceService.createWorkOrder(
      tenantContext.tenantSlug,
      tenantContext.userId,
      body
    );

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Maintenance work order created successfully.',
    });
  }
);
