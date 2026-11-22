import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { inventoryService } from '@/server/inventory/inventory-service';

export const GET = withTenantAuth(
  { permissions: ['bazar.view', 'settings.view'] },
  async (_req, { tenantContext }) => {
    const dashboard = await inventoryService.getInventoryDashboard(
      tenantContext.tenantSlug
    );

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  }
);
