import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { visitorService } from '@/server/visitors/visitor-service';

export const GET = withTenantAuth(
  { permissions: ['members.view', 'settings.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const visitPurpose = searchParams.get('visitPurpose') || undefined;
    const hostUserId = searchParams.get('hostUserId') || undefined;
    const checkedInOnly = searchParams.get('checkedInOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await visitorService.listVisitors(
      tenantContext.tenantSlug,
      {
        search,
        status,
        visitPurpose,
        hostUserId,
        checkedInOnly,
        limit,
        offset,
      },
      true, // isStaff = true
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: result.visitors,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    });
  }
);

export const POST = withTenantAuth(
  { permissions: ['members.update', 'settings.manage'] },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const created = await visitorService.registerWalkInVisitor(
      tenantContext.tenantSlug,
      tenantContext.userId,
      body
    );

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Walk-in visitor registered and checked in successfully.',
    });
  }
);
