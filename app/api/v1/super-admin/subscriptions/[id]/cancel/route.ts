import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { subscriptionService } from '@/server/subscription/subscription-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const cancelSchema = z.object({
  reason: z.string().min(5, 'A clear reason is required to cancel a subscription'),
});

/**
 * POST /api/v1/super-admin/subscriptions/[id]/cancel
 */
export const POST = withPlatformAuth(
  {
    permission: 'subscriptions.manage',
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const body = await validateBody(req, cancelSchema);

    const sub = await subscriptionService.cancelSubscription(id, body.reason, platformContext.userId);
    return apiSuccess(sub, 'Subscription cancelled successfully.');
  }
);
