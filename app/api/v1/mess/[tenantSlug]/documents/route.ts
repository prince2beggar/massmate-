import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { documentService } from '@/server/documents/document-service';

export const GET = withTenantAuth(
  { permissions: ['settings.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const fileType = searchParams.get('fileType') || undefined;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const visibility = searchParams.get('visibility') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await documentService.listDocuments(
      tenantContext.tenantSlug,
      {
        categoryId,
        fileType,
        search,
        status,
        visibility,
        includeArchived,
        limit,
        offset,
      },
      true, // isStaff = true
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: result.documents,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    });
  }
);

export const POST = withTenantAuth(
  { permissions: ['settings.manage', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const created = await documentService.createDocument(
      tenantContext.tenantSlug,
      tenantContext.userId,
      body
    );

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Document uploaded and registered successfully in vault.',
    });
  }
);
