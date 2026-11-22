import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;

  const complaints = await memberPortalService.listMemberComplaints(
    memberContext.userId,
    memberContext.tenantSlug,
    status
  );

  return NextResponse.json({
    success: true,
    data: complaints,
  });
});

export const POST = withMemberAuth(async (req, { memberContext }) => {
  const body = await req.json().catch(() => ({}));

  const created = await memberPortalService.createMemberComplaint(
    memberContext.userId,
    memberContext.tenantSlug,
    body
  );

  return NextResponse.json(
    {
      success: true,
      data: created,
      message: 'Complaint ticket submitted successfully.',
    },
    { status: 201 }
  );
});
