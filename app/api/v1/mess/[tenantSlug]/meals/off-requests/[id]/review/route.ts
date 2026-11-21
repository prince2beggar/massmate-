import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { mealService } from '@/server/meals/meal-service';

export const PATCH = withTenantAuth(
  { permission: 'meals.manage_settings' },
  async (req, { tenantContext, params }) => {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const requestId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    const body = await req.json();

    const reviewed = await mealService.reviewMealOffRequest(
      tenantContext.tenantId,
      requestId,
      body.decision,
      body.reviewNote,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: reviewed,
    });
  }
);
