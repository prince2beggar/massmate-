import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { mealService } from '@/server/meals/meal-service';
import { getDhakaDateString } from '@/server/meals/meal-utils';

export const GET = withTenantAuth(
  { permission: 'meals.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    const data = await mealService.getPeriodMealGrid(
      tenantContext.tenantId,
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      data,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'meals.create' },
  async (req, { tenantContext }) => {
    // Enforce role authorization: Owner, Admin, Meal-Manager, Moderator
    const isAuthorizedManager =
      tenantContext.isOwner ||
      tenantContext.roleSlug === 'owner' ||
      tenantContext.roleSlug === 'admin' ||
      tenantContext.roleSlug === 'meal-manager' ||
      tenantContext.roleName === 'Owner' ||
      tenantContext.roleName === 'Admin' ||
      tenantContext.roleName?.toLowerCase().includes('meal') ||
      tenantContext.roleName?.toLowerCase().includes('moderator') ||
      tenantContext.permissions.has('meals.create') ||
      tenantContext.permissions.has('meals.update') ||
      tenantContext.permissions.has('meals.manage_settings');

    if (!isAuthorizedManager) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message:
              'অননুমোদিত: শুধুমাত্র মেস এডমিন বা মিল ম্যানেজার মিল আপডেট করতে পারেন। সাধারণ সদস্যরা মিল পরিবর্তন করতে পারবেন না।',
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { dateString, membershipId, breakfastCount, lunchCount, dinnerCount, customCount, notes } = body;

    if (!dateString || !membershipId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'তারিখ (dateString) এবং সদস্য (membershipId) আবশ্যক।',
          },
        },
        { status: 400 }
      );
    }

    const isAdmin =
      tenantContext.isOwner ||
      tenantContext.roleName === 'Owner' ||
      tenantContext.roleName === 'Admin' ||
      tenantContext.roleSlug === 'owner' ||
      tenantContext.roleSlug === 'admin' ||
      tenantContext.permissions.has('meals.manage_settings');

    const result = await mealService.updatePeriodMealEntry(
      tenantContext.tenantId,
      {
        dateString,
        membershipId,
        breakfastCount: breakfastCount !== undefined ? Number(breakfastCount) : 0,
        lunchCount: lunchCount !== undefined ? Number(lunchCount) : 0,
        dinnerCount: dinnerCount !== undefined ? Number(dinnerCount) : 0,
        customCount: customCount !== undefined ? Number(customCount) : 0,
        notes: notes || null,
      },
      tenantContext.userId,
      isAdmin
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'মিল সফলভাবে আপডেট করা হয়েছে।',
    });
  }
);
