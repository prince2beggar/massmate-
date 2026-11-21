import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { subscriptionService } from '@/server/subscription/subscription-service';
import { apiSuccess } from '@/server/api/response';
import { NotFoundError } from '@/server/api/errors';

/**
 * GET /api/v1/super-admin/subscriptions/[id]
 * Retrieves subscription profile by tenant ID.
 */
export const GET = withPlatformAuth(
  {
    permission: 'subscriptions.view',
  },
  async (req, { params }) => {
    const id = params.id as string;
    const sub = await subscriptionService.getSubscriptionByTenantId(id);

    if (!sub) {
      throw new NotFoundError('Subscription not found for this tenant.');
    }

    return apiSuccess(sub, 'Subscription retrieved successfully.');
  }
);
