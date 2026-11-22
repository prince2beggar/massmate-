import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { expenseService } from '@/server/bazar/expense-service';

export const GET = withTenantAuth(
  { permission: 'bazar.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const month = url.searchParams.get('month') || undefined;

    const summary = await expenseService.getMemberBazarSummary(
      tenantContext.tenantId,
      month
    );

    return NextResponse.json({
      success: true,
      data: summary,
    });
  }
);
