import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { expenseService } from '@/server/bazar/expense-service';

export const PATCH = withTenantAuth(
  { permission: 'bazar.verify' },
  async (req, { tenantContext, params }) => {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const categoryId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    const body = await req.json();

    const updated = await expenseService.updateCategory(
      tenantContext.tenantId,
      categoryId,
      body,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  }
);
