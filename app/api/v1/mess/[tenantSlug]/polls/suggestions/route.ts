import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { pollService } from '@/server/polls/poll-service';

export const GET = withTenantAuth(
  { permissions: ['notices.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await pollService.listSuggestions(
      tenantContext.tenantSlug,
      { status, category, limit, offset },
      true, // isStaff = true
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: result.suggestions,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    });
  }
);
