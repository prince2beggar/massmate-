import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { globalSearchService } from '@/server/platform/global-search-service';
import { apiSuccess } from '@/server/api/response';

/**
 * GET /api/v1/super-admin/search?q=...
 * Global platform search across tenants, users, subscriptions, tickets, and domains.
 */
export const GET = withPlatformAuth(
  {
    permission: 'tenants.view',
  },
  async (req, { platformContext }) => {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const results = await globalSearchService.search(query, platformContext);
    return apiSuccess(results, 'Global search executed successfully.');
  }
);
