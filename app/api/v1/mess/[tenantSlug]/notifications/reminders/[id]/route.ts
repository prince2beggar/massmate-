import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const PATCH = withTenantAuth(
  { permission: 'settings.manage' },
  async (req, { tenantContext, params }) => {
    const rawId = params?.id;
    const reminderId = Array.isArray(rawId) ? rawId[0] : rawId || '';
    const body = await req.json();

    const updated = await tenantNotificationService.toggleReminder(
      tenantContext.tenantSlug,
      tenantContext.userId,
      reminderId,
      body.isActive ?? true
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Reminder ${updated.isActive ? 'activated' : 'paused'} successfully.`,
    });
  }
);

export const DELETE = withTenantAuth(
  { permission: 'settings.manage' },
  async (_req, { tenantContext, params }) => {
    const rawId = params?.id;
    const reminderId = Array.isArray(rawId) ? rawId[0] : rawId || '';

    await tenantNotificationService.deleteReminder(
      tenantContext.tenantSlug,
      tenantContext.userId,
      reminderId
    );

    return NextResponse.json({
      success: true,
      message: 'Reminder deleted successfully.',
    });
  }
);
