import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { domainService } from '@/server/domain/domain-service';
import { apiSuccess } from '@/server/api/response';

/**
 * POST /api/v1/super-admin/domains/[id]/primary
 * Designates a verified domain as the tenant's primary domain.
 */
export const POST = withPlatformAuth(
  {
    permission: 'domains.manage',
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const domain = await domainService.setPrimaryDomain(id, platformContext.userId);

    return apiSuccess(domain, `Domain ${domain.domainName} designated as primary routing domain.`);
  }
);
