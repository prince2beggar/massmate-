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
    const isAdmin =
      tenantContext.isOwner ||
      tenantContext.roleName === 'Owner' ||
      tenantContext.roleName === 'Admin' ||
      tenantContext.roleSlug === 'owner' ||
      tenantContext.roleSlug === 'admin' ||
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
