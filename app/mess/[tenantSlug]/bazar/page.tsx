import React from 'react';
import { expenseService } from '@/server/bazar/expense-service';
import { memberService } from '@/server/members/member-service';
import { getDhakaMonthString } from '@/server/meals/meal-utils';
import { BazarExpensesWorkspaceView } from '@/components/mess-admin/bazar/BazarExpensesWorkspaceView';

export default async function BazarPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  const currentMonthStr = getDhakaMonthString();

  // Prefetch data on the server
  const [expensesResult, initialCategories, initialSchedules, memberList] = await Promise.all([
    expenseService
      .listExpenses(tenantSlug, { monthString: currentMonthStr, limit: 100 })
      .catch(() => ({
        expenses: [],
        total: 0,
      })),
    expenseService.listCategories(tenantSlug).catch(() => []),
    expenseService
      .listBazarSchedules(tenantSlug, { monthString: currentMonthStr })
      .catch(() => []),
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
    <BazarExpensesWorkspaceView
      tenantSlug={tenantSlug}
      initialExpenses={expensesResult.expenses || []}
      initialCategories={initialCategories || []}
      initialSchedules={initialSchedules || []}
      members={members}
      currentMonth={currentMonthStr}
    />
  );
}
