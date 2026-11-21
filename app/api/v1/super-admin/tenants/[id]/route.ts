import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { platformTenantService } from '@/server/platform/platform-tenant-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  tenantType: z.enum(['STUDENT_MESS', 'BACHELOR_MESS', 'HOSTEL', 'SHARED_APARTMENT', 'OTHER']).optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
});

/**
 * GET /api/v1/super-admin/tenants/[id]
 *
 * Detailed multi-tab tenant profile with owner, memberships, domain, and activity history.
 * Protected: requires `tenants.view`.
 */
export const GET = withPlatformAuth(
  {
    permission: 'tenants.view',
  },
  async (_req, { params }) => {
    const tenantId = params.id as string;
    const details = await platformTenantService.getTenantDetails(tenantId);
    return apiSuccess(details, 'Tenant details retrieved successfully.');
  }
);

/**
 * PATCH /api/v1/super-admin/tenants/[id]
 *
 * Updates permitted tenant profile details.
 * Protected: requires `tenants.manage`.
 */
export const PATCH = withPlatformAuth(
  {
    permission: 'tenants.manage',
  },
  async (req, { params, platformContext }) => {
    const tenantId = params.id as string;
    const body = await validateBody(req, updateTenantSchema);
    const updated = await platformTenantService.updateTenant(tenantId, body, platformContext.userId);

    return apiSuccess(updated, 'Tenant profile updated successfully.');
  }
);
