import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { pollService } from '@/server/polls/poll-service';

export const PATCH = withTenantAuth(
  { permissions: ['notices.update', 'settings.manage'] },
  async (req, { tenantContext, params }) => {
    const rawId = (params as any)?.id;
    const suggestionId = Array.isArray(rawId) ? rawId[0] : rawId || '';
    const body = await req.json();

    const reviewed = await pollService.reviewSuggestion(
      tenantContext.tenantSlug,
      tenantContext.userId,
      suggestionId,
      body
    );

    return NextResponse.json({
      success: true,
      data: reviewed,
      message: 'Suggestion status updated successfully.',
    });
  }
);
