import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { memberService } from '@/server/members/member-service';

export const PATCH = withTenantAuth(
  { permission: 'roles.manage' },
  async (req, { tenantContext, params }) => {
    const memberId = String(params.id);
    const body = await req.json();

    const updated = await memberService.changeMemberRole(
      tenantContext.tenantId,
      memberId,
      body.roleId,
      { userId: tenantContext.userId },
      body.assignedRoles
    );

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully',
      data: updated,
    });
  }
);
