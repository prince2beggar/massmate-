import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';
import { ValidationError } from '@/server/api/errors';

export const POST = withMemberAuth(async (req, { memberContext, params }) => {
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!rawId) {
    throw new ValidationError('Event ID is required.');
  }

  const body = await req.json().catch(() => ({}));

  const updatedEvent = await memberPortalService.rsvpMemberEvent(
    memberContext.userId,
    memberContext.tenantSlug,
    rawId,
    body
  );

  return NextResponse.json({
    success: true,
    data: updatedEvent,
    message: 'RSVP updated successfully.',
  });
});
