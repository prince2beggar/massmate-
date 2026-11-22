import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { financeService } from '@/server/finance/finance-service';

export const POST = withTenantAuth(
  { permission: 'finance.manage' },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const adjustment = await financeService.createAdjustment(
      tenantContext.tenantSlug,
      body,
      tenantContext.userId
    );

    return NextResponse.json(
      {
        success: true,
        data: adjustment,
      },
      { status: 201 }
    );
  }
);
