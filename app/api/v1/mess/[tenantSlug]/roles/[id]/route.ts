import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { messSettingsService } from '@/server/settings/mess-settings-service';

export const PATCH = withTenantAuth(
  { permission: 'roles.manage' },
  async (req, { tenantContext, params }) => {
    const roleId = String(params.id);
    const body = await req.json();

    const updated = await messSettingsService.updateRole(
      tenantContext.tenantSlug,
      roleId,
      body,
      tenantContext.userId,
      tenantContext.isOwner,
      tenantContext.permissions
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  }
);

export const DELETE = withTenantAuth(
  { permission: 'roles.manage' },
  async (_req, { tenantContext, params }) => {
    const roleId = String(params.id);

    await messSettingsService.deleteRole(
      tenantContext.tenantSlug,
      roleId,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  }
);
