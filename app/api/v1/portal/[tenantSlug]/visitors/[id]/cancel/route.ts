import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { visitorService } from '@/server/visitors/visitor-service';

export const PATCH = withMemberAuth(async (_req, { memberContext, params }) => {
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId || '';

  const cancelled = await visitorService.cancelVisitorRequest(
    memberContext.tenantSlug,
    memberContext.userId,
    id,
    false // isStaff = false
  );

  return NextResponse.json({
    success: true,
    data: cancelled,
    message: 'Visitor request cancelled successfully.',
  });
});
