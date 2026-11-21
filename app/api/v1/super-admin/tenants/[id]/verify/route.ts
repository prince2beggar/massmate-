import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { platformTenantService } from '@/server/platform/platform-tenant-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const verifySchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'ADDITIONAL_INFO_REQUIRED']),
  notes: z.string().min(5, 'Review notes or reason (at least 5 characters) are required'),
});

/**
 * POST /api/v1/super-admin/tenants/[id]/verify
 *
 * Reviews tenant verification submission.
 * Protected: requires `tenants.manage`.
 */
export const POST = withPlatformAuth(
  {
    permission: 'tenants.manage',
  },
  async (req, { params, platformContext }) => {
    const tenantId = params.id as string;
    const body = await validateBody(req, verifySchema);
    const result = await platformTenantService.reviewTenantVerification(
      tenantId,
      body.decision,
      body.notes,
      platformContext.userId
    );

    return apiSuccess(result, `Tenant verification updated to ${result.verificationStatus}.`);
  }
);
