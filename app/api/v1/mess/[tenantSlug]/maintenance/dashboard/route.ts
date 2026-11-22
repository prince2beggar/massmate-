import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { maintenanceService } from '@/server/maintenance/maintenance-service';

export const GET = withTenantAuth(
  { permissions: ['rooms.view', 'settings.view', 'dashboard.view'] },
  async (_req, { tenantContext }) => {
    const dashboard = await maintenanceService.getMaintenanceDashboard(
      tenantContext.tenantSlug,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  }
);
