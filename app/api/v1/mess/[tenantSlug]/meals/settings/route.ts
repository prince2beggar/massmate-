import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { mealService } from '@/server/meals/meal-service';

export const GET = withTenantAuth(
  { permission: 'meals.view' },
  async (_req, { tenantContext }) => {
    const settings = await mealService.getMealSettings(tenantContext.tenantId);
    return NextResponse.json({
      success: true,
      data: settings,
    });
  }
);

export const PATCH = withTenantAuth(
  { permission: 'meals.manage_settings' },
  async (req, { tenantContext }) => {
    const body = await req.json();
    const updated = await mealService.updateMealSettings(
      tenantContext.tenantId,
      body,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  }
);
