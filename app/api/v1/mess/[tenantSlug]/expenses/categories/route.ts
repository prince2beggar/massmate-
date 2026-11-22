import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { expenseService } from '@/server/bazar/expense-service';

export const GET = withTenantAuth(
  { permission: 'bazar.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    const categories = await expenseService.listCategories(
      tenantContext.tenantId,
      includeInactive
    );

    return NextResponse.json({
      success: true,
      data: categories,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'bazar.verify' },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const category = await expenseService.createCategory(
      tenantContext.tenantId,
      body,
      tenantContext.userId
    );

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      { status: 201 }
    );
  }
);
