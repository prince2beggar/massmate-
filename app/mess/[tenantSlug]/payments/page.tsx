import React from 'react';
import { financeService } from '@/server/finance/finance-service';
import { memberService } from '@/server/members/member-service';
import { getDhakaMonthString } from '@/server/meals/meal-utils';
import { PaymentsWorkspaceView } from '@/components/mess-admin/payments/PaymentsWorkspaceView';

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  const currentMonthStr = getDhakaMonthString();

  // Prefetch data on the server
  const [initialPayments, memberList] = await Promise.all([
    financeService.listPayments(tenantSlug, { month: currentMonthStr }).catch(() => []),
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
    <PaymentsWorkspaceView
      tenantSlug={tenantSlug}
      initialPayments={initialPayments || []}
      members={members}
      currentMonth={currentMonthStr}
    />
  );
}
