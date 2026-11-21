import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { platformNotificationService } from '@/server/platform/platform-notification-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const updateNotificationSchema = z.object({
  id: z.string().optional(),
  markAll: z.boolean().optional(),
});

/**
 * GET /api/v1/super-admin/notifications
 * Lists recent platform events and unread notification counter.
 */
export const GET = withPlatformAuth(
  {
    permission: 'tenants.view',
  },
  async (req, { platformContext }) => {
    const { notifications, unreadCount } = await platformNotificationService.listNotifications(
      platformContext.userId
    );

    return apiSuccess({ notifications, unreadCount }, 'Notifications retrieved successfully.');
  }
);

/**
 * PATCH /api/v1/super-admin/notifications
 * Marks a notification or all notifications as read.
 */
export const PATCH = withPlatformAuth(
  {
    permission: 'tenants.view',
  },
  async (req, { platformContext }) => {
    const body = await validateBody(req, updateNotificationSchema);

    if (body.markAll) {
      const count = await platformNotificationService.markAllAsRead(platformContext.userId);
      return apiSuccess({ markedCount: count }, 'All notifications marked as read.');
    }

    if (body.id) {
      await platformNotificationService.markAsRead(body.id);
      return apiSuccess({ id: body.id }, 'Notification marked as read.');
    }

    return apiSuccess({}, 'No changes applied.');
  }
);
