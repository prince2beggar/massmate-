import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { customProposalService } from '@/server/subscription/custom-proposal-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { approveQuotationSchema } from '@/server/subscription/validation';

/**
 * POST /api/v1/super-admin/custom-inquiries/[id]/quotations/[quoteId]
 * Approve a quotation and activate custom business subscription.
 */
export const POST = withPlatformAuth(
  {
    permission: 'subscriptions.manage',
  },
  async (req, { platformContext, params }) => {
    const quoteId = params.quoteId as string;
    const body = await validateBody(req, approveQuotationSchema);

    const quote = await customProposalService.approveQuotation(
      quoteId,
      platformContext.userId,
      body.tenantId
    );

    return apiSuccess(quote, 'Custom quotation approved and subscription package provisioned.');
  }
);
