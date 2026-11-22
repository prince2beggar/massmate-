import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { inventoryService } from '@/server/inventory/inventory-service';

export const GET = withTenantAuth(
  { permissions: ['bazar.view', 'settings.view'] },
  async (req, { tenantContext }) => {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId') || undefined;
    const movementType = searchParams.get('movementType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await inventoryService.listMovements(
      tenantContext.tenantSlug,
      {
        itemId,
        movementType,
        limit,
        offset,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.movements,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    });
  }
);

export const POST = withTenantAuth(
  { permissions: ['bazar.create', 'bazar.update', 'settings.manage'] },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const movement = await inventoryService.recordStockMovement(
      tenantContext.tenantSlug,
      tenantContext.userId,
      body
    );

    return NextResponse.json({
      success: true,
      data: movement,
      message: `Stock movement '${movement.movementType}' recorded successfully.`,
    });
  }
);
