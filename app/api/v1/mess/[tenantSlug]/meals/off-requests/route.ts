import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { mealService } from '@/server/meals/meal-service';

export const GET = withTenantAuth(
  { permission: 'meals.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const status = (url.searchParams.get('status') as any) || undefined;
    const membershipId = url.searchParams.get('membershipId') || undefined;
    const monthString = url.searchParams.get('month') || undefined;

    const list = await mealService.listMealOffRequests(tenantContext.tenantId, {
      status,
      membershipId,
      monthString,
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
    const isAdmin =
      tenantContext.roleName === 'Owner' ||
      tenantContext.roleName === 'Admin' ||
      tenantContext.permissions.has('meals.manage_settings');

    const request = await mealService.createMealOffRequest(
      tenantContext.tenantId,
      body,
      tenantContext.userId,
      isAdmin
    );

    return NextResponse.json(
      {
        success: true,
        data: request,
      },
      { status: 201 }
    );
  }
);
