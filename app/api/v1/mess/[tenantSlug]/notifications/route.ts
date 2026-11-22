import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const GET = withTenantAuth({}, async (req, { tenantContext }) => {
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const result = await tenantNotificationService.listNotifications(
    tenantContext.tenantSlug,
    tenantContext.userId,
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

export const PATCH = withTenantAuth({}, async (_req, { tenantContext }) => {
  const result = await tenantNotificationService.markAllAsRead(
    tenantContext.tenantSlug,
    tenantContext.userId
  );

  return NextResponse.json({
    success: true,
    data: result,
    message: `Marked ${result.count} notification(s) as read.`,
  });
});
