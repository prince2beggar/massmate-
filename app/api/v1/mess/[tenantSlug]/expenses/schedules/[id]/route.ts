import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { expenseService } from '@/server/bazar/expense-service';

export const PATCH = withTenantAuth(
  { permission: 'bazar.create' },
  async (req, { tenantContext, params }) => {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const scheduleId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    const body = await req.json();

    const updated = await expenseService.updateBazarScheduleStatus(
      tenantContext.tenantId,
      scheduleId,
      body.status,
      body.actualPurchaserMembershipId,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  }
);
