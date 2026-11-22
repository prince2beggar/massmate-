import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { expenseService } from '@/server/bazar/expense-service';

export const GET = withTenantAuth(
  { permission: 'bazar.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const monthString = url.searchParams.get('month') || undefined;
    const categoryId = url.searchParams.get('categoryId') || undefined;
    const purchaserMembershipId = url.searchParams.get('purchaserMembershipId') || undefined;
    const status = (url.searchParams.get('status') as any) || undefined;
    const search = url.searchParams.get('search') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const result = await expenseService.listExpenses(tenantContext.tenantId, {
      monthString,
      categoryId,
      purchaserMembershipId,
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'bazar.create' },
  async (req, { tenantContext }) => {
    const body = await req.json();
    const isAdmin =
      tenantContext.roleName === 'Owner' ||
      tenantContext.roleName === 'Admin' ||
      tenantContext.permissions.has('bazar.verify');

    const created = await expenseService.createExpense(
      tenantContext.tenantId,
      body,
      tenantContext.userId,
      Boolean(body.autoApprove && isAdmin)
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
