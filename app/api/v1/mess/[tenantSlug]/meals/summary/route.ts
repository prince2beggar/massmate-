import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { mealService } from '@/server/meals/meal-service';
import { getDhakaMonthString } from '@/server/meals/meal-utils';

export const GET = withTenantAuth(
  { permission: 'meals.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const month = url.searchParams.get('month') || getDhakaMonthString();

    const summary = await mealService.getMonthlyMealSummary(
      tenantContext.tenantId,
      month
    );

    return NextResponse.json({
      success: true,
      data: summary,
    });
  }
);
