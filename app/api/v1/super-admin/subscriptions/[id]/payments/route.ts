import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { subscriptionService } from '@/server/subscription/subscription-service';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { recordPaymentSchema } from '@/server/subscription/validation';

/**
 * POST /api/v1/super-admin/subscriptions/[id]/payments
 * Record an invoice or verified payment for a tenant subscription.
 */
export const POST = withPlatformAuth(
  {
    permission: 'subscriptions.manage',
  },
  async (req, { platformContext, params }) => {
    const id = params.id as string;
    const body = await validateBody(req, recordPaymentSchema);

    const invoice = await subscriptionService.recordPayment(
      {
        tenantId: id,
        amount: body.amount,
        currency: body.currency,
        periodMonths: body.periodMonths,
        paymentStatus: body.paymentStatus,
        paymentMethod: body.paymentMethod,
        transactionReference: body.transactionReference,
        notes: body.notes,
      },
      platformContext.userId
    );

    const message =
      body.paymentStatus === 'CONFIRMED'
        ? 'Payment confirmed and subscription activated.'
        : 'Billing invoice created. Paid access remains pending until payment is confirmed.';

    return apiSuccess(invoice, message, null, 201);
  }
);
