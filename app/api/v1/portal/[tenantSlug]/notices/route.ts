import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;

  const notices = await memberPortalService.listMemberNotices(
    memberContext.userId,
    memberContext.tenantSlug,
    category
  );

  return NextResponse.json({
    success: true,
    data: notices,
  });
});
