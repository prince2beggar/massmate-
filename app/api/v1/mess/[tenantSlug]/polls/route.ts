import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { pollService } from '@/server/polls/poll-service';

export const GET = withTenantAuth(
  { permissions: ['notices.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const pollType = searchParams.get('pollType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await pollService.listPolls(
      tenantContext.tenantSlug,
      { search, status, pollType, limit, offset },
      true, // isStaff = true
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: result.polls,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    });
  }
);

export const POST = withTenantAuth(
  { permissions: ['notices.create', 'settings.manage'] },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const created = await pollService.createPoll(
      tenantContext.tenantSlug,
      tenantContext.userId,
      body
    );

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Community poll draft created successfully.',
    });
  }
);
