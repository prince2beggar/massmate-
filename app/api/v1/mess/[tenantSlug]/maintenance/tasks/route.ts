import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { maintenanceService } from '@/server/maintenance/maintenance-service';

export const GET = withTenantAuth(
  { permissions: ['rooms.view', 'settings.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const status = searchParams.get('status') || undefined;
    const assignedUserId = searchParams.get('assignedUserId') || undefined;
    const workOrderId = searchParams.get('workOrderId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await maintenanceService.listOperationalTasks(
      tenantContext.tenantSlug,
      {
        category,
        priority,
        status,
        assignedUserId,
        workOrderId,
        limit,
        offset,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.tasks,
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

    const created = await maintenanceService.createOperationalTask(
      tenantContext.tenantSlug,
      tenantContext.userId,
      body
    );

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Operational task created successfully.',
    });
  }
);
