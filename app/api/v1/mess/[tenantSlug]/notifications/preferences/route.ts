import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const GET = withTenantAuth({}, async (_req, { tenantContext }) => {
  const preferences = await tenantNotificationService.getPreferences(
    tenantContext.tenantSlug,
    tenantContext.userId
  );

  return NextResponse.json({
    success: true,
    data: preferences,
  });
});

export const PUT = withTenantAuth({}, async (req, { tenantContext }) => {
  const body = await req.json();

  const updated = await tenantNotificationService.updatePreferences(
    tenantContext.tenantSlug,
    tenantContext.userId,
    body
  );

  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Notification preferences updated successfully.',
  });
});
