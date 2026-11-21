import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { platformUserService } from '@/server/platform/platform-user-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const assignPlatformRoleSchema = z.object({
  role: z.enum(['PLATFORM_OWNER', 'PLATFORM_ADMIN', 'SUPPORT_STAFF', 'FINANCE_STAFF']).nullable(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

/**
 * POST /api/v1/super-admin/users/[id]/role
 * Assigns or revokes platform-level staff roles.
 * EXCLUSIVE: Only PLATFORM_OWNER can perform this action.
 */
export const POST = withPlatformAuth(
  {
    allowedRoles: ['PLATFORM_OWNER'],
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const body = await validateBody(req, assignPlatformRoleSchema);

    const updated = await platformUserService.assignPlatformRole(
      id,
      body.role,
      body.reason,
      platformContext
    );

    return apiSuccess(updated, 'Platform role updated successfully.');
  }
);
