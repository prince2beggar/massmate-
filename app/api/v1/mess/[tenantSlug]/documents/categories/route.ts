import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { documentService } from '@/server/documents/document-service';

export const GET = withTenantAuth(
  { permissions: ['settings.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const categories = await documentService.listCategories(tenantContext.tenantSlug);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  }
);

export const POST = withTenantAuth(
  { permissions: ['settings.manage', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const created = await documentService.createCategory(
      tenantContext.tenantSlug,
      body
    );

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Document category created successfully.',
    });
  }
);
