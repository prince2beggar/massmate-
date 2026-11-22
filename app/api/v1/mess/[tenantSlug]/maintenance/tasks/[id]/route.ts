import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { maintenanceService } from '@/server/maintenance/maintenance-service';

export const PATCH = withTenantAuth(
  { permissions: ['rooms.update', 'settings.manage'] },
  async (req, { tenantContext, params }) => {
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId || '';
    const body = await req.json();

    const updated = await maintenanceService.updateOperationalTask(
      tenantContext.tenantSlug,
      tenantContext.userId,
      id,
      body
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Operational task updated successfully.',
    });
  }
);
