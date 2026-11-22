import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const result = await tenantNotificationService.listNotifications(
    memberContext.tenantSlug,
    memberContext.userId,
    {
      unreadOnly,
      category,
      limit,
      offset,
    }
  );

  return NextResponse.json({
    success: true,
    data: result.notifications,
    meta: {
      unreadCount: result.unreadCount,
      total: result.total,
      limit,
      offset,
    },
  });
});

export const PATCH = withMemberAuth(async (_req, { memberContext }) => {
  const result = await tenantNotificationService.markAllAsRead(
    memberContext.tenantSlug,
    memberContext.userId
  );

  return NextResponse.json({
    success: true,
    data: result,
    message: `Marked ${result.count} notification(s) as read.`,
  });
});
