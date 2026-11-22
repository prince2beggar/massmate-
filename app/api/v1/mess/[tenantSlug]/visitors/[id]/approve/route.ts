import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { visitorService } from '@/server/visitors/visitor-service';

export const POST = withTenantAuth(
  { permissions: ['members.manage_status', 'settings.manage'] },
  async (req, { tenantContext, params }) => {
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId || '';
    const body = await req.json();

    const action = body.action === 'REJECT' ? 'REJECT' : 'APPROVE';
    const reason = body.reason || undefined;

    const updated = await visitorService.reviewVisitorRequest(
      tenantContext.tenantSlug,
      tenantContext.userId,
      id,
      action,
      reason
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Visitor request ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`,
    });
  }
);
