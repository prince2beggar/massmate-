import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { mealService } from '@/server/meals/meal-service';
import { getDhakaMonthString } from '@/server/meals/meal-utils';

export const GET = withTenantAuth(
  { permission: 'meals.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const month = url.searchParams.get('month') || getDhakaMonthString();

    const calculation = await mealService.getMealRateCalculation(
      tenantContext.tenantId,
      month
    );

    return NextResponse.json({
      success: true,
      data: calculation,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'meals.manage_settings' },
  async (req, { tenantContext }) => {
    const body = await req.json();
    const { action, month, notes, reason } = body;

    if (action === 'lock') {
      const locked = await mealService.lockMealPeriod(
        tenantContext.tenantId,
        month,
        tenantContext.userId,
        notes
      );
      return NextResponse.json({
        success: true,
        data: locked,
      });
    }

    if (action === 'unlock') {
      const unlocked = await mealService.unlockMealPeriod(
        tenantContext.tenantId,
        month,
        tenantContext.userId,
        reason
      );
      return NextResponse.json({
        success: true,
        data: unlocked,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid action. Supported actions: lock, unlock.',
      },
      { status: 400 }
    );
  }
);
