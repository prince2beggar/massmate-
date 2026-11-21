import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { platformUserService } from '@/server/platform/platform-user-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING', 'INACTIVE']),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

/**
 * GET /api/v1/super-admin/users/[id]
 * User details with multi-tenant memberships and platform roles.
 */
export const GET = withPlatformAuth(
  {
    permission: 'users.view',
  },
  async (req, { params }) => {
    const id = params.id as string;
    const user = await platformUserService.getUserById(id);
    return apiSuccess(user, 'User details retrieved successfully.');
  }
);

/**
 * PATCH /api/v1/super-admin/users/[id]
 * Suspends or reactivates platform account.
 */
export const PATCH = withPlatformAuth(
  {
    permission: 'users.manage',
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const body = await validateBody(req, updateUserStatusSchema);

    const updated = await platformUserService.updateUserStatus(
      id,
      body.status,
      body.reason,
      platformContext
    );

    return apiSuccess(updated, `Platform user status updated to ${body.status}.`);
  }
);
