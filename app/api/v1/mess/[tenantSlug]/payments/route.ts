import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { financeService } from '@/server/finance/finance-service';

export const GET = withTenantAuth(
  { permission: 'payments.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const month = url.searchParams.get('month') || undefined;
    const membershipId = url.searchParams.get('membershipId') || undefined;

    const payments = await financeService.listPayments(tenantContext.tenantSlug, {
      status,
      month,
      membershipId,
    });

    return NextResponse.json({
      success: true,
      data: payments,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'payments.create' },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const payment = await financeService.recordPayment(
      tenantContext.tenantSlug,
      body,
      tenantContext.userId
    );

    return NextResponse.json(
      {
        success: true,
        data: payment,
      },
      { status: 201 }
    );
  }
);
