import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { expenseService } from '@/server/bazar/expense-service';

export const GET = withTenantAuth(
  { permission: 'bazar.view' },
  async (_req, { tenantContext, params }) => {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const expenseId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

    const expense = await expenseService.getExpenseById(
      tenantContext.tenantId,
      expenseId
    );

    return NextResponse.json({
      success: true,
      data: expense,
    });
  }
);
