import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { budgetService } from '@/server/budget/budget-service';

export const GET = withTenantAuth(
  { permissions: ['finance.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const dashboard = await budgetService.getBudgetDashboard(tenantContext.tenantSlug);

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  }
);
