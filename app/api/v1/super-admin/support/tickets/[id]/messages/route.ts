import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { supportTicketService } from '@/server/support/support-ticket-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const postMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  isInternal: z.boolean().optional().default(false),
  attachments: z.any().optional(),
});

/**
 * POST /api/v1/super-admin/support/tickets/[id]/messages
 * Posts a message to a ticket conversation (customer reply or internal note).
 */
export const POST = withPlatformAuth(
  {
    permission: 'support.manage',
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const body = await validateBody(req, postMessageSchema);

    const message = await supportTicketService.addMessage(
      id,
      body,
      platformContext.userId,
      platformContext
    );

    return apiSuccess(message, 'Message posted successfully.', null, 201);
  }
);
