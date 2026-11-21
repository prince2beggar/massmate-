import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { mealService } from '@/server/meals/meal-service';

export const GET = withTenantAuth(
  { permission: 'meals.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const dateString = url.searchParams.get('date') || undefined;
    const monthString = url.searchParams.get('month') || undefined;
    const hostMembershipId = url.searchParams.get('hostMembershipId') || undefined;

    const list = await mealService.listGuestMeals(tenantContext.tenantId, {
      dateString,
      monthString,
      hostMembershipId,
    });

    return NextResponse.json({
      success: true,
      data: list,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'meals.create' },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const record = await mealService.recordGuestMeal(
      tenantContext.tenantId,
      body,
      tenantContext.userId
    );

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 201 }
    );
  }
);
