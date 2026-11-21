import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { memberService } from '@/server/members/member-service';

export const GET = withTenantAuth(
  { permission: 'members.view' },
  async (req, { tenantContext, params }) => {
    const memberId = String(params.id);

    const member = await memberService.getMemberById(
      tenantContext.tenantId,
      memberId,
      {
        permissions: tenantContext.permissions,
        isOwner: tenantContext.isOwner,
        roleSlug: tenantContext.roleSlug,
      }
    );

    return NextResponse.json({
      success: true,
      data: member,
    });
  }
);

export const PATCH = withTenantAuth(
  { permission: 'members.update' },
  async (req, { tenantContext, params }) => {
    const memberId = String(params.id);
    const body = await req.json();

    const updated = await memberService.updateMember(
      tenantContext.tenantId,
      memberId,
      body,
      { userId: tenantContext.userId }
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  }
);
