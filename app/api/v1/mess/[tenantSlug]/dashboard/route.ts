import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import {
  messDashboardService,
  type DashboardPeriodFilter,
} from '@/server/mess-admin/mess-dashboard-service';

export const GET = withTenantAuth(
  { permission: 'dashboard.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const period =
      (url.searchParams.get('period') as DashboardPeriodFilter) || 'current-month';
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    const overview = await messDashboardService.getDashboardOverview(
      tenantContext,
      {
        period,
        startDate,
        endDate,
      }
    );

    return NextResponse.json({
      success: true,
      data: overview,
    });
  }
);
