import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { financeService } from '@/server/finance/finance-service';

export const GET = withTenantAuth(
  { permission: 'finance.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    const categories = await financeService.listCategories(
      tenantContext.tenantSlug,
      includeInactive
    );

    return NextResponse.json({
      success: true,
      data: categories,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'finance.manage' },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const created = await financeService.createCategory(
      tenantContext.tenantSlug,
      body,
      tenantContext.userId
    );

    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  }
);
