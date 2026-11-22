import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const requestType = searchParams.get('requestType') || undefined;
  const status = searchParams.get('status') || undefined;

  const requests = await memberPortalService.listMemberRequests(
    memberContext.userId,
    memberContext.tenantSlug,
    { requestType, status }
  );

  return NextResponse.json({
    success: true,
    data: requests,
  });
});

export const POST = withMemberAuth(async (req, { memberContext }) => {
  const body = await req.json().catch(() => ({}));
  const newRequest = await memberPortalService.createMemberRequest(
    memberContext.userId,
    memberContext.tenantSlug,
    body
  );

  return NextResponse.json(
    {
      success: true,
      data: newRequest,
      message: 'Request submitted successfully.',
    },
    { status: 201 }
  );
});
