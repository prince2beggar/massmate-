import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { financeService } from '@/server/finance/finance-service';

export const POST = withTenantAuth(
  { permission: 'payments.refund' },
  async (req, { tenantContext, params }) => {
    const { id } = await params;
    const paymentId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    const body = await req.json();

    const refunded = await financeService.refundPayment(
      tenantContext.tenantSlug,
      paymentId,
      body,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: refunded,
    });
  }
);
