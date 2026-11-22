import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { visitorService } from '@/server/visitors/visitor-service';

export const POST = withTenantAuth(
  { permissions: ['members.update', 'settings.manage'] },
  async (_req, { tenantContext, params }) => {
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId || '';

    const updated = await visitorService.checkOutVisitor(
      tenantContext.tenantSlug,
      tenantContext.userId,
      id
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Visitor checked out successfully.',
    });
  }
);
