import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { messSettingsService } from '@/server/settings/mess-settings-service';

export const GET = withTenantAuth(
  { permission: 'settings.view' },
  async (_req, { tenantContext }) => {
    const settings = await messSettingsService.getSettings(tenantContext.tenantSlug);
    return NextResponse.json({
      success: true,
      data: settings,
    });
  }
);
