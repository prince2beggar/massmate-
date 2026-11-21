import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { platformUserService } from '@/server/platform/platform-user-service';
import { apiSuccess } from '@/server/api/response';

/**
 * GET /api/v1/super-admin/staff
 * Lists all users with an active platform role.
 */
export const GET = withPlatformAuth(
  {
    permission: 'users.view',
  },
  async () => {
    const staff = await platformUserService.listStaff();
    return apiSuccess(staff, 'Platform staff roster retrieved successfully.');
  }
);
