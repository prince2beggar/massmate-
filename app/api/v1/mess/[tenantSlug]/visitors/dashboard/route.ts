import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { visitorService } from '@/server/visitors/visitor-service';

export const GET = withTenantAuth(
  { permissions: ['members.view', 'settings.view', 'dashboard.view'] },
  async (_req, { tenantContext }) => {
    const dashboard = await visitorService.getVisitorDashboard(
      tenantContext.tenantSlug,
      tenantContext.userId,
      true
    );

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  }
);
