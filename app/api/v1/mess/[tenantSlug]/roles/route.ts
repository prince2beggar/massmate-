import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { messSettingsService } from '@/server/settings/mess-settings-service';

export const GET = withTenantAuth(
  { permission: 'roles.view' },
  async (_req, { tenantContext }) => {
    const roles = await messSettingsService.listRoles(tenantContext.tenantSlug);
    return NextResponse.json({
      success: true,
      data: roles,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'roles.manage' },
  async (req, { tenantContext }) => {
    const body = await req.json();
    const created = await messSettingsService.createRole(
      tenantContext.tenantSlug,
      body,
      tenantContext.userId,
      tenantContext.isOwner,
      tenantContext.permissions
    );
    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  }
);
