import { NextResponse } from 'next/server';
import { customProposalService } from '@/server/subscription/custom-proposal-service';
import { apiSuccess, apiError } from '@/server/api/response';

/**
 * POST /api/v1/inquiries/custom-plan
 * Public endpoint to accept custom pricing inquiries from prospective multi-property operators.
 */
export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    if (!body.businessName || !body.contactName) {
      return apiError('VALIDATION_ERROR', 'Business name and contact name are required.', [], 400);
    }

    const inquiry = await customProposalService.createInquiry({
      businessName: body.businessName,
      businessCategory: body.businessCategory || 'multiple-mess',
      contactName: body.contactName,
      contactEmail: body.contactEmail || (body.contactChannel?.includes('@') ? body.contactChannel : undefined),
      contactPhone: body.contactPhone || (!body.contactChannel?.includes('@') ? body.contactChannel : undefined),
      propertyCount: Number(body.propertyCount) || 1,
      estimatedMembers: Number(body.estimatedMembers) || 10,
      requiredFeatures: Array.isArray(body.requiredFeatures) ? body.requiredFeatures : [],
      additionalRequirements: body.additionalRequirements || body.preferredCustomization,
    });

    return apiSuccess(
      inquiry,
      'Your inquiry has been received. Our team will review your requirements.',
      null,
      201
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Failed to submit inquiry' } },
      { status: 500 }
    );
  }
};
