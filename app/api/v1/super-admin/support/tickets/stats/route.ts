import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { supportTicketService } from '@/server/support/support-ticket-service';
import { apiSuccess } from '@/server/api/response';

/**
 * GET /api/v1/super-admin/support/tickets/stats
 * Counter summaries across all support statuses.
 */
export const GET = withPlatformAuth(
  {
    permission: 'support.view',
  },
  async () => {
    const stats = await supportTicketService.getTicketStats();
    return apiSuccess(stats, 'Support ticket statistics retrieved successfully.');
  }
);
