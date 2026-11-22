import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { expenseService } from '@/server/bazar/expense-service';

export const POST = withTenantAuth(
  { permission: 'bazar.verify' },
  async (req, { tenantContext, params }) => {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const expenseId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    const body = await req.json();

    const reversed = await expenseService.reverseExpense(
      tenantContext.tenantId,
      expenseId,
      body.reason,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: reversed,
    });
  }
);
