import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { planService } from '@/server/subscription/plan-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { createPlanSchema } from '@/server/subscription/validation';

/**
 * GET /api/v1/super-admin/plans
 * List all available SaaS plans.
 */
export const GET = withPlatformAuth(
  {
    permission: 'subscriptions.view',
  },
  async (req) => {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const plans = await planService.listPlans(includeInactive);
    return apiSuccess(plans, 'Plans retrieved successfully.');
  }
);

/**
 * POST /api/v1/super-admin/plans
 * Create a new SaaS plan.
 */
export const POST = withPlatformAuth(
  {
    permission: 'subscriptions.manage',
  },
  async (req, { platformContext }) => {
    const body = await validateBody(req, createPlanSchema);
    const plan = await planService.createPlan(body, platformContext.userId);

    return apiSuccess(plan, 'SaaS plan created successfully.', null, 201);
  }
);
