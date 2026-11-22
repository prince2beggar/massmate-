import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMemberPortalSession } from '@/server/member-portal/member-session';
import { expenseService } from '@/server/bazar/expense-service';
import { MemberBazarView } from '@/components/member-portal/MemberBazarView';

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
  searchParams?: Promise<{ month?: string }>;
}

export default async function MemberPortalBazarPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const month = resolvedSearchParams?.month;

  if (!tenantSlug) {
    notFound();
  }

  const session = await getMemberPortalSession(tenantSlug);
  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized_member&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  let initialSummary = null;
  let initialMyExpenses: any[] = [];
  let initialCategories: any[] = [];

  try {
    const [summary, myExpensesResult, categories] = await Promise.all([
      expenseService.getMemberBazarSummary(tenantSlug, month).catch(() => null),
      expenseService
        .listExpenses(tenantSlug, {
          purchaserMembershipId: session.membershipId,
          monthString: month,
          limit: 100,
        })
        .catch(() => ({ expenses: [] })),
      expenseService.listCategories(tenantSlug, false).catch(() => []),
    ]);

    initialSummary = summary;
    initialMyExpenses = myExpensesResult.expenses || [];
    initialCategories = categories || [];
  } catch {
    // Falls back to client-side fetch
  }

  return (
    <MemberBazarView
      tenantSlug={tenantSlug}
      membershipId={session.membershipId}
      initialSummary={initialSummary}
      initialMyExpenses={initialMyExpenses}
      initialCategories={initialCategories}
    />
  );
}
