import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { platformOverviewService } from '@/server/platform/platform-overview-service';
import { apiSuccess } from '@/server/api/response';

/**
 * GET /api/v1/super-admin/overview
 *
 * Central Super Admin Overview Aggregation Endpoint.
 * Protected by platform authorization: requires valid PlatformRole with `tenants.view` capability.
 * Rejects regular tenant users (mess owners, admins, members) with HTTP 403 Forbidden.
 */
export const GET = withPlatformAuth(
  {
    permission: 'tenants.view',
  },
  async (req, { platformContext }) => {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';

    const data = await platformOverviewService.getOverviewData(range);

    return apiSuccess(
      {
        ...data,
        authenticatedAdmin: {
          id: platformContext.userId,
          name: platformContext.userName,
          role: platformContext.platformRole,
        },
      },
      'Platform overview analytics aggregated successfully.'
    );
  }
);
