import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { mealService } from '@/server/meals/meal-service';
import { getDhakaDateString } from '@/server/meals/meal-utils';

export const GET = withTenantAuth(
  { permission: 'meals.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || getDhakaDateString();

    const sheet = await mealService.getDailyMealSheet(tenantContext.tenantId, date);
    return NextResponse.json({
      success: true,
      data: sheet,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'meals.create' },
  async (req, { tenantContext }) => {
    const body = await req.json();
    const isAdmin =
      tenantContext.roleName === 'Owner' ||
      tenantContext.roleName === 'Admin' ||
      tenantContext.permissions.has('meals.manage_settings');

    const result = await mealService.saveDailyMealSheet(
      tenantContext.tenantId,
      body,
      tenantContext.userId,
      isAdmin
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  }
);
