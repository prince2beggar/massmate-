import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { platformUserService } from '@/server/platform/platform-user-service';
import { apiPaginated } from '@/server/api/response';
import type { PlatformRole, UserStatus } from '@/types/database';

/**
 * GET /api/v1/super-admin/users
 * Directory of platform users across all messes with search, filters, and pagination.
 */
export const GET = withPlatformAuth(
  {
    permission: 'users.view',
  },
  async (req) => {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as UserStatus) || undefined;
    const platformRole = (searchParams.get('platformRole') as PlatformRole | 'NONE' | 'ALL') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const result = await platformUserService.listUsers({
      search,
      status,
      platformRole,
      page,
      limit,
    });

    return apiPaginated(
      result.users,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.totalCount,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.page < result.pagination.totalPages,
        hasPreviousPage: result.pagination.page > 1,
      },
      'Platform users retrieved successfully.'
    );
  }
);
