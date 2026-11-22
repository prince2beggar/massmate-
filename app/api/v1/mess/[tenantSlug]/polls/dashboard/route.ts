import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { pollService } from '@/server/polls/poll-service';

export const GET = withTenantAuth(
  { permissions: ['notices.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const dashboard = await pollService.getPollDashboard(
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
