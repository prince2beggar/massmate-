import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { planService } from '@/server/subscription/plan-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { NotFoundError } from '@/server/api/errors';
import { updatePlanSchema } from '@/server/subscription/validation';

/**
 * GET /api/v1/super-admin/plans/[id]
 */
export const GET = withPlatformAuth(
  {
    permission: 'subscriptions.view',
  },
  async (req, { params }) => {
    const id = params.id as string;
    const plan = await planService.getPlanById(id);

    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    return apiSuccess(plan, 'Plan details retrieved successfully.');
  }
);

/**
 * PATCH /api/v1/super-admin/plans/[id]
 * Updates plan definition. Existing subscription locked prices are preserved.
 */
export const PATCH = withPlatformAuth(
  {
    permission: 'subscriptions.manage',
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const body = await validateBody(req, updatePlanSchema);

    const updated = await planService.updatePlan(id, body, platformContext.userId);
    return apiSuccess(updated, 'Plan updated successfully. Existing subscriptions retain locked pricing.');
  }
);
