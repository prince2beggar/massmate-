import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { expenseService } from '@/server/bazar/expense-service';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || undefined;

  const [summary, myExpensesResult, categories] = await Promise.all([
    expenseService.getMemberBazarSummary(memberContext.tenantSlug, month),
    expenseService.listExpenses(memberContext.tenantSlug, {
      purchaserMembershipId: memberContext.membershipId,
      monthString: month,
      limit: 100,
    }),
    expenseService.listCategories(memberContext.tenantSlug, false),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      summary,
      myExpenses: myExpensesResult.expenses || [],
      categories: categories || [],
      currentMembershipId: memberContext.membershipId,
    },
  });
});

export const POST = withMemberAuth(async (req, { memberContext }) => {
  const body = await req.json();

  // Enforce logged-in member as the purchaser
  const input = {
    ...body,
    purchaserMembershipId: memberContext.membershipId,
  };

  const created = await expenseService.createExpense(
    memberContext.tenantSlug,
    input,
    memberContext.userId,
    false // Requires admin/moderator review
  );

  return NextResponse.json(
    {
      success: true,
      data: created,
      message: 'আপনার বাজার খরচ সফলভাবে জমা দেওয়া হয়েছে। এডমিন অনুমোদনের পর তা চূড়ান্ত হবে।',
    },
    { status: 201 }
  );
});
