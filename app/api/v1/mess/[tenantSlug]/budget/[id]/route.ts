import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { budgetService } from '@/server/budget/budget-service';

export const GET = withTenantAuth(
  { permissions: ['finance.view', 'dashboard.view'] },
  async (req, { tenantContext, params }) => {
    const rawId = (params as any)?.id;
    const budgetId = Array.isArray(rawId) ? rawId[0] : rawId || '';

    const budget = await budgetService.getBudgetById(tenantContext.tenantSlug, budgetId);

    return NextResponse.json({
      success: true,
      data: budget,
    });
  }
);

export const PATCH = withTenantAuth(
  { permissions: ['finance.manage', 'settings.manage'] },
  async (req, { tenantContext, params }) => {
    const rawId = (params as any)?.id;
    const budgetId = Array.isArray(rawId) ? rawId[0] : rawId || '';
    const body = await req.json();

    const updated = await budgetService.updateBudget(
      tenantContext.tenantSlug,
      budgetId,
      body,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Budget plan updated successfully with audit history.',
    });
  }
);
