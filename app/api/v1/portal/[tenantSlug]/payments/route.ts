import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const month = searchParams.get('month') || undefined;

  const payments = await memberPortalService.listMemberPayments(
    memberContext.userId,
    memberContext.tenantSlug,
    { status, month }
  );

  return NextResponse.json({
    success: true,
    data: payments,
  });
});

export const POST = withMemberAuth(async (req, { memberContext }) => {
  const body = await req.json().catch(() => ({}));

  const payment = await memberPortalService.submitMemberPayment(
    memberContext.userId,
    memberContext.tenantSlug,
    body
  );

  return NextResponse.json(
    {
      success: true,
      message:
        'Payment voucher submitted for review. An administrator will verify the transaction before your balance is updated.',
      data: payment,
    },
    { status: 201 }
  );
});
