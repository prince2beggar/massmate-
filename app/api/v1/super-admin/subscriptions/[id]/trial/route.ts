import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { subscriptionService } from '@/server/subscription/subscription-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const trialActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start'),
    planSlug: z.string().default('starter'),
    allowDuplicate: z.boolean().default(false),
  }),
  z.object({
    action: z.literal('extend'),
    additionalDays: z.number().int().min(1).max(30),
    reason: z.string().min(5, 'A reason (minimum 5 characters) is required for trial extension'),
  }),
]);

/**
 * POST /api/v1/super-admin/subscriptions/[id]/trial
 * Start or extend a free trial for a tenant.
 */
export const POST = withPlatformAuth(
  {
    permission: 'subscriptions.manage',
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const body = await validateBody(req, trialActionSchema);

    if (body.action === 'start') {
      const sub = await subscriptionService.startFreeTrial(
        id,
        { planSlug: body.planSlug, allowDuplicate: body.allowDuplicate },
        platformContext.userId
      );
      return apiSuccess(sub, '7-day free trial activated successfully.');
    } else {
      const sub = await subscriptionService.extendTrial(
        id,
        body.additionalDays,
        body.reason,
        platformContext.userId
      );
      return apiSuccess(sub, `Trial successfully extended by ${body.additionalDays} days.`);
    }
  }
);
