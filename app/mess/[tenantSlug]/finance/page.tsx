import React from 'react';
import { financeService } from '@/server/finance/finance-service';
import { memberService } from '@/server/members/member-service';
import { getDhakaMonthString } from '@/server/meals/meal-utils';
import { FinanceWorkspaceView } from '@/components/mess-admin/finance/FinanceWorkspaceView';

export default async function FinancePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  const currentMonthStr = getDhakaMonthString();

  // Prefetch data on the server
  const [initialOverview, initialCategories, memberList] = await Promise.all([
    financeService.getFinancialOverview(tenantSlug, currentMonthStr).catch(() => null),
    financeService.listCategories(tenantSlug, true).catch(() => []),
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
    <FinanceWorkspaceView
      tenantSlug={tenantSlug}
      initialOverview={initialOverview}
      initialCategories={initialCategories || []}
      members={members}
      currentMonth={currentMonthStr}
    />
  );
}
