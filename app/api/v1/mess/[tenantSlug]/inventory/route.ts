import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { inventoryService } from '@/server/inventory/inventory-service';

export const GET = withTenantAuth(
  { permissions: ['bazar.view', 'settings.view'] },
  async (req, { tenantContext }) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const itemType = searchParams.get('itemType') || undefined;
    const status = searchParams.get('status') || undefined;
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await inventoryService.listItems(
      tenantContext.tenantSlug,
      {
        search,
        category,
        itemType,
        status,
        lowStockOnly,
        limit,
        offset,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    });
  }
);

export const POST = withTenantAuth(
  { permissions: ['bazar.create', 'settings.manage'] },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const created = await inventoryService.createItem(
      tenantContext.tenantSlug,
      tenantContext.userId,
      body
    );

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Inventory item created successfully.',
    });
  }
);
