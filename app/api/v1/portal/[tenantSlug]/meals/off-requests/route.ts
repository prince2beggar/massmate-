import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';

export const POST = withMemberAuth(async (req, { memberContext }) => {
  const body = await req.json().catch(() => ({}));

  const result = await memberPortalService.submitMemberMealOffRequest(
    memberContext.userId,
    memberContext.tenantSlug,
    body
  );

  return NextResponse.json(
    {
      success: true,
      data: result,
      message: 'Meal-off request submitted successfully.',
    },
    { status: 201 }
  );
});
