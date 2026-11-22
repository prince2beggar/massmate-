import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const PATCH = withMemberAuth(async (_req, { memberContext, params }) => {
  const rawId = params?.id;
  const notificationId = Array.isArray(rawId) ? rawId[0] : rawId || '';

  const updated = await tenantNotificationService.markAsRead(
    memberContext.tenantSlug,
    memberContext.userId,
    notificationId
  );

  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Notification marked as read.',
  });
});
