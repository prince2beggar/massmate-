import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import {
  platformAnalyticsService,
  resolveDateRange,
  type AnalyticsDatePreset,
} from '@/server/platform/platform-analytics-service';
import { apiSuccess } from '@/server/api/response';

/**
 * GET /api/v1/super-admin/analytics
 * Platform analytics across tenants, users, subscriptions, collected revenue, domains, and support.
 */
export const GET = withPlatformAuth(
  {
    permission: 'analytics.view',
  },
  async (req) => {
    const { searchParams } = new URL(req.url);
    const preset = (searchParams.get('preset') as AnalyticsDatePreset) || '30d';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const dateFilter = resolveDateRange(preset, startDate, endDate);
    const analytics = await platformAnalyticsService.getAnalytics(dateFilter);

    return apiSuccess(analytics, 'Platform analytics retrieved successfully.');
  }
);
