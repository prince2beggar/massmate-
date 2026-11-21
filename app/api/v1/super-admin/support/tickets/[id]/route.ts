import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { supportTicketService } from '@/server/support/support-ticket-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const updateTicketSchema = z.object({
  status: z
    .enum(['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'])
    .optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignedStaffId: z.string().nullable().optional(),
  reason: z.string().optional(),
});

/**
 * GET /api/v1/super-admin/support/tickets/[id]
 * Retrieves ticket details, customer thread, and internal notes for platform staff.
 */
export const GET = withPlatformAuth(
  {
    permission: 'support.view',
  },
  async (req, { params }) => {
    const id = params.id as string;
    // Platform staff can inspect internal notes
    const ticket = await supportTicketService.getTicketById(id, {
      includeInternalNotes: true,
    });
    return apiSuccess(ticket, 'Support ticket retrieved successfully.');
  }
);

/**
 * PATCH /api/v1/super-admin/support/tickets/[id]
 * Updates ticket assignment, status, or priority.
 */
export const PATCH = withPlatformAuth(
  {
    permission: 'support.manage',
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const body = await validateBody(req, updateTicketSchema);

    let updatedTicket;

    if (body.assignedStaffId !== undefined) {
      updatedTicket = await supportTicketService.assignTicket(
        id,
        body.assignedStaffId,
        platformContext
      );
    }

    if (body.priority) {
      updatedTicket = await supportTicketService.updateTicketPriority(
        id,
        body.priority,
        platformContext
      );
    }

    if (body.status) {
      updatedTicket = await supportTicketService.updateTicketStatus(
        id,
        body.status,
        platformContext,
        body.reason
      );
    }

    if (!updatedTicket) {
      updatedTicket = await supportTicketService.getTicketById(id, {
        includeInternalNotes: true,
      });
    }

    return apiSuccess(updatedTicket, 'Support ticket updated successfully.');
  }
);
