import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { domainService } from '@/server/domain/domain-service';
import { apiSuccess } from '@/server/api/response';

/**
 * POST /api/v1/super-admin/domains/[id]/verify
 * Evaluates DNS TXT record challenge for custom domain.
 */
export const POST = withPlatformAuth(
  {
    permission: 'domains.manage',
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const result = await domainService.verifyDomain(id, platformContext.userId);

    const message = result.verified
      ? 'Domain ownership verified successfully via DNS TXT record.'
      : (result.reason || 'DNS verification failed. Record not detected yet.');

    return apiSuccess(result, message);
  }
);
