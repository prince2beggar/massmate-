import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { supportTicketService } from '@/server/support/support-ticket-service';
import { apiPaginated, apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';
import type {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/types/database';

const createTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  description: z.string().optional(),
  category: z.enum([
    'ACCOUNT_LOGIN',
    'SUBSCRIPTION_BILLING',
    'DOMAIN_WEBSITE',
    'TECHNICAL_ISSUE',
    'FEATURE_REQUEST',
    'GENERAL_INQUIRY',
    'OTHER',
  ]).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  tenantId: z.string().optional(),
});

/**
 * GET /api/v1/super-admin/support/tickets
 * Paginated support ticket directory.
 */
export const GET = withPlatformAuth(
  {
    permission: 'support.view',
  },
  async (req) => {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || undefined;
    const category = (searchParams.get('category') as SupportTicketCategory) || undefined;
    const priority = (searchParams.get('priority') as SupportTicketPriority) || undefined;
    const status = (searchParams.get('status') as SupportTicketStatus) || undefined;
    const assignedStaffId = searchParams.get('assignedStaffId') || undefined;
    const tenantId = searchParams.get('tenantId') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const result = await supportTicketService.listTickets({
      search,
      category,
      priority,
      status,
      assignedStaffId,
      tenantId,
      page,
      limit,
    });

    return apiPaginated(
      result.tickets,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.totalCount,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.page < result.pagination.totalPages,
        hasPreviousPage: result.pagination.page > 1,
      },
      'Support tickets retrieved successfully.'
    );
  }
);

/**
 * POST /api/v1/super-admin/support/tickets
 * Creates a support ticket on behalf of a requester or tenant.
 */
export const POST = withPlatformAuth(
  {
    permission: 'support.manage',
  },
  async (req, { platformContext }) => {
    const body = await validateBody(req, createTicketSchema);

    const ticket = await supportTicketService.createTicket(body, {
      userId: platformContext.userId,
      tenantId: body.tenantId,
    });

    return apiSuccess(ticket, 'Support ticket created successfully.', null, 201);
  }
);
