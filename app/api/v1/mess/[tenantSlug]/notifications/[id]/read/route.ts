import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const PATCH = withTenantAuth({}, async (_req, { tenantContext, params }) => {
  const rawId = params?.id;
  const notificationId = Array.isArray(rawId) ? rawId[0] : rawId || '';

  const updated = await tenantNotificationService.markAsRead(
    tenantContext.tenantSlug,
    tenantContext.userId,
    notificationId
  );

  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Notification marked as read.',
  });
});
