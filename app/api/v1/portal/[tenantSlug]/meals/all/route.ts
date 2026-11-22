import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { mealService } from '@/server/meals/meal-service';
import { getDhakaDateString, getDhakaMonthString } from '@/server/meals/meal-utils';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || getDhakaDateString();
  const month = searchParams.get('month') || getDhakaMonthString();

  const [dailySheet, monthlySummary] = await Promise.all([
    mealService.getDailyMealSheet(memberContext.tenantSlug, date).catch(() => null),
    mealService.getMonthlyMealSummary(memberContext.tenantSlug, month).catch(() => null),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      date,
      month,
      dailySheet,
      monthlySummary,
    },
  });
});
