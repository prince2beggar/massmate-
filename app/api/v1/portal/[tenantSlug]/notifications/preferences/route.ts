import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const GET = withMemberAuth(async (_req, { memberContext }) => {
  const preferences = await tenantNotificationService.getPreferences(
    memberContext.tenantSlug,
    memberContext.userId
  );

  return NextResponse.json({
    success: true,
    data: preferences,
  });
});

export const PUT = withMemberAuth(async (req, { memberContext }) => {
  const body = await req.json();

  const updated = await tenantNotificationService.updatePreferences(
    memberContext.tenantSlug,
    memberContext.userId,
    body
  );

  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Notification preferences updated successfully.',
  });
});
