import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { messSettingsService } from '@/server/settings/mess-settings-service';

export const PATCH = withTenantAuth(
  { permission: 'settings.manage' },
  async (req, { tenantContext }) => {
    const body = await req.json();
    const updated = await messSettingsService.updateGeneralSettings(
      tenantContext.tenantSlug,
      body,
      tenantContext.userId
    );
    return NextResponse.json({
      success: true,
      data: updated,
    });
  }
);
