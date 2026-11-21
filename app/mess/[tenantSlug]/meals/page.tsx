import React from 'react';
import { mealService } from '@/server/meals/meal-service';
import { memberService } from '@/server/members/member-service';
import { getDhakaDateString, getDhakaMonthString } from '@/server/meals/meal-utils';
import { MealsWorkspaceView } from '@/components/mess-admin/meals/MealsWorkspaceView';

export default async function MealsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  const todayStr = getDhakaDateString();
  const currentMonthStr = getDhakaMonthString();

  // Prefetch data on the server
  const [initialSheet, initialSettings, initialSummary, initialMealOffs, initialGuests, memberList] =
    await Promise.all([
      mealService.getDailyMealSheet(tenantSlug, todayStr).catch(() => null),
      mealService.getMealSettings(tenantSlug).catch(() => null),
      mealService.getMonthlyMealSummary(tenantSlug, currentMonthStr).catch(() => null),
      mealService.listMealOffRequests(tenantSlug).catch(() => []),
      mealService.listGuestMeals(tenantSlug).catch(() => []),
      memberService.listMembers(tenantSlug, { status: 'ACTIVE', limit: 100 }).catch(() => ({
        members: [],
      })),
    ]);

  const members =
    memberList?.members?.map((m: any) => ({
      id: m.id,
      name: m.name,
      memberCode: m.memberCode || null,
    })) || [];

  return (
    <MealsWorkspaceView
      tenantSlug={tenantSlug}
      initialSheet={initialSheet}
      initialSettings={initialSettings}
      initialSummary={initialSummary}
      initialMealOffRequests={initialMealOffs}
      initialGuestMeals={initialGuests}
      members={members}
    />
  );
}
