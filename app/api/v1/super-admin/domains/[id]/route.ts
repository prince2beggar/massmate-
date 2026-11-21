import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { domainService } from '@/server/domain/domain-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { NotFoundError } from '@/server/api/errors';
import { updateDomainStatusSchema } from '@/server/domain/validation';

/**
 * GET /api/v1/super-admin/domains/[id]
 */
export const GET = withPlatformAuth(
  {
    permission: 'domains.view',
  },
  async (req, { params }) => {
    const id = params.id as string;
    const domain = await domainService.getDomainById(id);

    if (!domain) {
      throw new NotFoundError('Domain not found.');
    }

    return apiSuccess(domain, 'Domain details retrieved successfully.');
  }
);

/**
 * PATCH /api/v1/super-admin/domains/[id]
 * Updates domain status (ACTIVE, SUSPENDED, REMOVED) with mandatory reason.
 */
export const PATCH = withPlatformAuth(
  {
    permission: 'domains.manage',
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const body = await validateBody(req, updateDomainStatusSchema);

    const updated = await domainService.updateDomainStatus(
      id,
      body.status,
      body.reason,
      platformContext.userId
    );

    return apiSuccess(updated, `Domain status updated to ${body.status}.`);
  }
);
