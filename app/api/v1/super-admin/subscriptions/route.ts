import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { subscriptionService } from '@/server/subscription/subscription-service';
import { apiPaginated } from '@/server/api/response';
import type { SubscriptionStatus, PlanType } from '@/types/database';

/**
 * GET /api/v1/super-admin/subscriptions
 * Paginated subscription directory.
 */
export const GET = withPlatformAuth(
  {
    permission: 'subscriptions.view',
  },
  async (req) => {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as SubscriptionStatus | 'ALL') || 'ALL';
    const subscriptionType = (searchParams.get('subscriptionType') as PlanType | 'ALL') || 'ALL';
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const result = await subscriptionService.listSubscriptions({
      search,
      status,
      subscriptionType,
      page,
      limit,
    });

    return apiPaginated(
      result.subscriptions,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.totalCount,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.page < result.pagination.totalPages,
        hasPreviousPage: result.pagination.page > 1,
      },
      'Subscriptions retrieved successfully.'
    );
  }
);
