import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { customProposalService } from '@/server/subscription/custom-proposal-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { createCustomQuotationSchema } from '@/server/subscription/validation';
import type { InquiryStatus } from '@/types/database';

/**
 * GET /api/v1/super-admin/custom-inquiries
 * Lists all custom business plan inquiries.
 */
export const GET = withPlatformAuth(
  {
    permission: 'subscriptions.view',
  },
  async (req) => {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') as InquiryStatus | 'ALL') || 'ALL';
    const search = searchParams.get('search') || undefined;

    const inquiries = await customProposalService.listInquiries({ status, search });
    return apiSuccess(inquiries, 'Custom inquiries retrieved successfully.');
  }
);

/**
 * POST /api/v1/super-admin/custom-inquiries
 * Create a new custom quotation for an inquiry.
 */
export const POST = withPlatformAuth(
  {
    permission: 'subscriptions.manage',
  },
  async (req, { platformContext }) => {
    const body = await validateBody(req, createCustomQuotationSchema);
    const quote = await customProposalService.createQuotation(body, platformContext.userId);

    return apiSuccess(quote, 'Custom quotation created and dispatched successfully.', null, 201);
  }
);
