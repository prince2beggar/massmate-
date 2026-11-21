import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { memberService } from '@/server/members/member-service';

export const PATCH = withTenantAuth(
  { permission: 'members.manage_status' },
  async (req, { tenantContext, params }) => {
    const memberId = String(params.id);
    const body = await req.json();

    const updated = await memberService.changeMemberStatus(
      tenantContext.tenantId,
      memberId,
      body.status,
      body.reason,
      { userId: tenantContext.userId }
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  }
);
