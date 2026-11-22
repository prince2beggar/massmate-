import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || undefined;

  const overview = await memberPortalService.getMemberMealOverview(
    memberContext.userId,
    memberContext.tenantSlug,
    month
  );

  return NextResponse.json({
    success: true,
    data: overview,
  });
});
