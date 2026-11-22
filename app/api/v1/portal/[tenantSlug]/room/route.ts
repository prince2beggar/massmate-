import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';

export const GET = withMemberAuth(async (_req, { memberContext }) => {
  const roomDetails = await memberPortalService.getMemberRoomDetails(
    memberContext.userId,
    memberContext.tenantSlug
  );

  return NextResponse.json({
    success: true,
    data: roomDetails,
  });
});
