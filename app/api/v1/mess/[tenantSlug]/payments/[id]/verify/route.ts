import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { financeService } from '@/server/finance/finance-service';

export const PATCH = withTenantAuth(
  { permission: 'payments.confirm' },
  async (req, { tenantContext, params }) => {
    const { id } = await params;
    const paymentId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    const body = await req.json();

    const verified = await financeService.verifyPayment(
      tenantContext.tenantSlug,
      paymentId,
      body,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: verified,
    });
  }
);
