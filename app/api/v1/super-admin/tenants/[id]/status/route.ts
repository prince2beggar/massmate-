import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { platformTenantService } from '@/server/platform/platform-tenant-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE']),
  reason: z.string().min(5, 'A clear reason (at least 5 characters) is required for tenant status alteration'),
});

/**
 * POST /api/v1/super-admin/tenants/[id]/status
 *
 * Updates tenant operational status with mandatory reason and immutable audit event.
 * Protected: requires `tenants.manage`.
 */
export const POST = withPlatformAuth(
  {
    permission: 'tenants.manage',
  },
  async (req, { params, platformContext }) => {
    const tenantId = params.id as string;
    const body = await validateBody(req, updateStatusSchema);
    const result = await platformTenantService.updateTenantStatus(
      tenantId,
      body.status,
      body.reason,
      platformContext.userId
    );

    return apiSuccess(result, `Tenant status updated to ${result.newStatus}.`);
  }
);
