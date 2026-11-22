import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { visitorService } from '@/server/visitors/visitor-service';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const result = await visitorService.listVisitors(
    memberContext.tenantSlug,
    { status, limit, offset },
    false, // isStaff = false (enforces strict member privacy)
    memberContext.userId
  );

  return NextResponse.json({
    success: true,
    data: result.visitors,
    meta: {
      total: result.total,
      limit,
      offset,
    },
  });
});

export const POST = withMemberAuth(async (req, { memberContext }) => {
  const body = await req.json();

  const created = await visitorService.preRegisterVisitor(
    memberContext.tenantSlug,
    memberContext.userId,
    body
  );

  return NextResponse.json({
    success: true,
    data: created,
    message: 'Expected visitor request submitted successfully.',
  });
});
