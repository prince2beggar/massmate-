import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { maintenanceService } from '@/server/maintenance/maintenance-service';

export const GET = withTenantAuth(
  { permissions: ['rooms.view', 'settings.view'] },
  async (_req, { tenantContext, params }) => {
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId || '';

    const workOrder = await maintenanceService.getWorkOrderById(
      tenantContext.tenantSlug,
      id,
      true
    );

    return NextResponse.json({
      success: true,
      data: workOrder,
    });
  }
);

export const PATCH = withTenantAuth(
  { permissions: ['rooms.update', 'settings.manage'] },
  async (req, { tenantContext, params }) => {
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId || '';
    const body = await req.json();

    const updated = await maintenanceService.updateWorkOrder(
      tenantContext.tenantSlug,
      tenantContext.userId,
      id,
      body,
      false
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Work order updated successfully.',
    });
  }
);
