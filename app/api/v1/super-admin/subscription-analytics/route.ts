import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { subscriptionAnalyticsService } from '@/server/subscription/subscription-analytics-service';
import { apiSuccess } from '@/server/api/response';

/**
 * GET /api/v1/super-admin/subscription-analytics
 * Live subscription analytics, active counts, MRR, collected and pending revenue.
 */
export const GET = withPlatformAuth(
  {
    permission: 'subscriptions.view',
  },
  async () => {
    const analytics = await subscriptionAnalyticsService.getSubscriptionAnalytics();
    return apiSuccess(analytics, 'Subscription analytics retrieved successfully.');
  }
);
