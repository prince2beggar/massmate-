import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { domainService } from '@/server/domain/domain-service';
import { apiSuccess, apiPaginated } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { requestCustomDomainSchema } from '@/server/domain/validation';
import type { DomainStatus, DomainType, DomainVerificationStatus } from '@/types/database';

/**
 * GET /api/v1/super-admin/domains
 * Paginated central domain directory with search and multi-state filtering.
 */
export const GET = withPlatformAuth(
  {
    permission: 'domains.view',
  },
  async (req) => {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || undefined;
    const domainType = (searchParams.get('domainType') as DomainType | 'ALL') || 'ALL';
    const verificationStatus =
      (searchParams.get('verificationStatus') as DomainVerificationStatus | 'ALL') || 'ALL';
    const status = (searchParams.get('status') as DomainStatus | 'ALL') || 'ALL';
    const tenantId = searchParams.get('tenantId') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const result = await domainService.listDomains({
      search,
      domainType,
      verificationStatus,
      status,
      tenantId,
      page,
      limit,
    });

    return apiPaginated(
      result.domains,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.totalCount,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.page < result.pagination.totalPages,
        hasPreviousPage: result.pagination.page > 1,
      },
      'Domains retrieved successfully.'
    );
  }
);

/**
 * POST /api/v1/super-admin/domains
 * Request a new custom domain for a tenant.
 */
export const POST = withPlatformAuth(
  {
    permission: 'domains.manage',
  },
  async (req, { platformContext }) => {
    const body = await validateBody(req, requestCustomDomainSchema);
    const domain = await domainService.requestCustomDomain(
      body.tenantId,
      body.domainName,
      platformContext.userId
    );

    return apiSuccess(
      domain,
      'Custom domain requested. DNS TXT verification challenge generated.',
      null,
      201
    );
  }
);
