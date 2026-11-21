import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { platformTenantService } from '@/server/platform/platform-tenant-service';
import { apiSuccess, apiPaginated } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';
import type { TenantStatus, TenantType, VerificationStatus } from '@/types/database';

const createTenantSchema = z.object({
  name: z.string().min(2, 'Mess name must be at least 2 characters'),
  slug: z.string().optional(),
  tenantType: z.enum(['STUDENT_MESS', 'BACHELOR_MESS', 'HOSTEL', 'SHARED_APARTMENT', 'OTHER']),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerEmail: z.string().email('Valid owner email is required'),
  ownerPhone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/v1/super-admin/tenants
 *
 * Paginated tenant directory with global search & multi-status filtering.
 * Protected by platform-level authorization: requires `tenants.view`.
 */
export const GET = withPlatformAuth(
  {
    permission: 'tenants.view',
  },
  async (req) => {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as TenantStatus) || undefined;
    const verificationStatus = (searchParams.get('verificationStatus') as VerificationStatus) || undefined;
    const tenantType = (searchParams.get('tenantType') as TenantType) || undefined;
    const city = searchParams.get('city') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const sortBy = (searchParams.get('sortBy') as any) || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as any) || 'desc';

    const result = await platformTenantService.listTenants({
      search,
      status,
      verificationStatus,
      tenantType,
      city,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return apiPaginated(
      result.tenants,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.totalCount,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.page < result.pagination.totalPages,
        hasPreviousPage: result.pagination.page > 1,
      },
      'Tenants retrieved successfully.'
    );
  }
);

/**
 * POST /api/v1/super-admin/tenants
 *
 * Administrative tenant registration & owner assignment.
 * Protected by platform-level authorization: requires `tenants.manage`.
 */
export const POST = withPlatformAuth(
  {
    permission: 'tenants.manage',
  },
  async (req, { platformContext }) => {
    const body = await validateBody(req, createTenantSchema);
    const created = await platformTenantService.createTenant(body, platformContext.userId);

    return apiSuccess(created, `Mess '${created.name}' created successfully.`, null, 201);
  }
);
