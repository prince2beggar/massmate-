import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { visitorService } from '@/server/visitors/visitor-service';

export const GET = withTenantAuth(
  { permissions: ['members.view', 'settings.view'] },
  async (_req, { tenantContext, params }) => {
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId || '';

    const visitor = await visitorService.getVisitorById(
      tenantContext.tenantSlug,
      id,
      true,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: visitor,
    });
  }
);
