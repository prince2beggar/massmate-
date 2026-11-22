import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { budgetService } from '@/server/budget/budget-service';

export const GET = withTenantAuth(
  { permissions: ['finance.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const periodType = searchParams.get('periodType') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await budgetService.listBudgets(tenantContext.tenantSlug, {
      status,
      periodType,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  }
);

export const POST = withTenantAuth(
  { permissions: ['finance.manage', 'settings.manage'] },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const created = await budgetService.createBudget(
      tenantContext.tenantSlug,
      body,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Budget plan created successfully.',
    });
  }
);
