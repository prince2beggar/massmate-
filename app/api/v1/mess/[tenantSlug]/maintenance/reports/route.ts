import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { maintenanceService } from '@/server/maintenance/maintenance-service';

export const GET = withTenantAuth(
  { permissions: ['reports.view', 'rooms.view', 'settings.view'] },
  async (_req, { tenantContext }) => {
    const reports = await maintenanceService.getMaintenanceReports(
      tenantContext.tenantSlug
    );

    return NextResponse.json({
      success: true,
      data: reports,
    });
  }
);
