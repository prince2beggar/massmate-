import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { inventoryService } from '@/server/inventory/inventory-service';

export const GET = withTenantAuth(
  { permissions: ['bazar.view', 'settings.view'] },
  async (_req, { tenantContext, params }) => {
    const rawId = params?.id;
    const itemId = Array.isArray(rawId) ? rawId[0] : rawId || '';

    const item = await inventoryService.getItemById(
      tenantContext.tenantSlug,
      itemId
    );

    return NextResponse.json({
      success: true,
      data: item,
    });
  }
);

export const PATCH = withTenantAuth(
  { permissions: ['bazar.update', 'settings.manage'] },
  async (req, { tenantContext, params }) => {
    const rawId = params?.id;
    const itemId = Array.isArray(rawId) ? rawId[0] : rawId || '';
    const body = await req.json();

    const updated = await inventoryService.updateItem(
      tenantContext.tenantSlug,
      tenantContext.userId,
      itemId,
      body
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Inventory item updated successfully.',
    });
  }
);

export const DELETE = withTenantAuth(
  { permissions: ['bazar.delete', 'settings.manage'] },
  async (_req, { tenantContext, params }) => {
    const rawId = params?.id;
    const itemId = Array.isArray(rawId) ? rawId[0] : rawId || '';

    const archived = await inventoryService.archiveItem(
      tenantContext.tenantSlug,
      tenantContext.userId,
      itemId
    );

    return NextResponse.json({
      success: true,
      data: archived,
      message: 'Inventory item archived successfully.',
    });
  }
);
