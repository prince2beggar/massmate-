import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { memberPortalService } from '@/server/member-portal/member-portal-service';

export const GET = withMemberAuth(async (req, { memberContext, params }) => {
  const resolvedParams = await Promise.resolve(params);
  const rawId = resolvedParams?.id;
  const paymentId = Array.isArray(rawId) ? rawId[0] : rawId || '';

  if (!paymentId) {
    return NextResponse.json({ success: false, message: 'Payment ID is required.' }, { status: 400 });
  }

  const receipt = await memberPortalService.getMemberPaymentReceipt(
    memberContext.userId,
    memberContext.tenantSlug,
    paymentId
  );

  return NextResponse.json({
    success: true,
    data: receipt,
  });
});
