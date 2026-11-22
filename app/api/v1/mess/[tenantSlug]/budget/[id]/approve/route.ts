import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { budgetService } from '@/server/budget/budget-service';

export const POST = withTenantAuth(
  { permissions: ['finance.manage', 'settings.manage'] },
  async (req, { tenantContext, params }) => {
    const rawId = (params as any)?.id;
    const budgetId = Array.isArray(rawId) ? rawId[0] : rawId || '';
    const body = await req.json();

    const reviewed = await budgetService.reviewBudget(
      tenantContext.tenantSlug,
      budgetId,
      body,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: reviewed,
      message: `Budget successfully ${body.decision === 'APPROVE' ? 'approved' : 'rejected'}.`,
    });
  }
);
