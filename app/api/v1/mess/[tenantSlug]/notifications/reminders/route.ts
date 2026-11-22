import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const GET = withTenantAuth(
  { permissions: ['settings.view', 'settings.manage'] },
  async (_req, { tenantContext }) => {
    const reminders = await tenantNotificationService.listReminders(
      tenantContext.tenantSlug
    );

    return NextResponse.json({
      success: true,
      data: reminders,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'settings.manage' },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const created = await tenantNotificationService.createReminder(
      tenantContext.tenantSlug,
      tenantContext.userId,
      body
    );

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Scheduled reminder created successfully.',
    });
  }
);
