import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { financeService } from '@/server/finance/finance-service';

export const GET = withTenantAuth(
  { permission: 'finance.view' },
  async (req, { tenantContext, params }) => {
    const { membershipId } = await params;
    const targetMembershipId =
      typeof membershipId === 'string'
        ? membershipId
        : Array.isArray(membershipId)
        ? membershipId[0]
        : '';

    const url = new URL(req.url);
    const month = url.searchParams.get('month') || undefined;

    const statement = await financeService.getMemberStatement(
      tenantContext.tenantSlug,
      targetMembershipId,
      month,
      {
        isOwner: tenantContext.isOwner,
        permissions: tenantContext.permissions,
        viewerMembershipId: tenantContext.membershipId,
      }
    );

    return NextResponse.json({
      success: true,
      data: statement,
    });
  }
);
