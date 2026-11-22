import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { financeService } from '@/server/finance/finance-service';

export const POST = withTenantAuth(
  { permission: 'finance.manage_bills' },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const result = await financeService.publishBills(
      tenantContext.tenantSlug,
      body.monthString,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  }
);
