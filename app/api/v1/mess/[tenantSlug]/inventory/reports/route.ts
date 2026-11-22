import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { inventoryService } from '@/server/inventory/inventory-service';

export const GET = withTenantAuth(
  { permissions: ['reports.view', 'settings.view', 'bazar.view'] },
  async (_req, { tenantContext }) => {
    const reports = await inventoryService.getInventoryReports(
      tenantContext.tenantSlug
    );

    return NextResponse.json({
      success: true,
      data: reports,
    });
  }
);
