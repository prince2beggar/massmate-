import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';

export const GET = withMemberAuth(async (_req, { memberContext }) => {
  const profile = await memberPortalService.getMemberProfile(
    memberContext.userId,
    memberContext.tenantSlug
  );

  return NextResponse.json({
    success: true,
    data: profile,
  });
});

export const PATCH = withMemberAuth(async (req, { memberContext }) => {
  const body = await req.json().catch(() => ({}));
  const result = await memberPortalService.updateMemberProfile(
    memberContext.userId,
    memberContext.tenantSlug,
    body
  );

  return NextResponse.json({
    success: true,
    data: result.profile,
    message: result.message,
    requestedNameChange: result.requestedNameChange,
  });
});
