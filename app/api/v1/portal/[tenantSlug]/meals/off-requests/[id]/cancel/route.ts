import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';
import { ValidationError } from '@/server/api/errors';

export const PATCH = withMemberAuth(async (_req, { memberContext, params }) => {
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!rawId) {
    throw new ValidationError('Request ID is required.');
  }

  await memberPortalService.cancelMemberMealOffRequest(
    memberContext.userId,
    memberContext.tenantSlug,
    rawId
  );

  return NextResponse.json({
    success: true,
    message: 'Meal-off request cancelled successfully.',
  });
});
