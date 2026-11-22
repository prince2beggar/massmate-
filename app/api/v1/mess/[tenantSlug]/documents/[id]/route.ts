import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { documentService } from '@/server/documents/document-service';

export const GET = withTenantAuth(
  { permissions: ['settings.view', 'dashboard.view'] },
  async (req, { tenantContext, params }) => {
    const rawId = (params as any)?.id;
    const documentId = Array.isArray(rawId) ? rawId[0] : rawId || '';

    const doc = await documentService.getDocumentById(
      tenantContext.tenantSlug,
      documentId,
      true,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: doc,
    });
  }
);

export const PATCH = withTenantAuth(
  { permissions: ['settings.manage', 'dashboard.view'] },
  async (req, { tenantContext, params }) => {
    const rawId = (params as any)?.id;
    const documentId = Array.isArray(rawId) ? rawId[0] : rawId || '';
    const body = await req.json();

    if (body.action === 'ARCHIVE') {
      const archived = await documentService.archiveDocument(
        tenantContext.tenantSlug,
        documentId,
        tenantContext.userId
      );
      return NextResponse.json({
        success: true,
        data: archived,
        message: 'Document archived successfully.',
      });
    }

    const updated = await documentService.updateDocument(
      tenantContext.tenantSlug,
      documentId,
      tenantContext.userId,
      body
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Document metadata updated successfully.',
    });
  }
);

export const DELETE = withTenantAuth(
  { permissions: ['settings.manage', 'dashboard.view'] },
  async (req, { tenantContext, params }) => {
    const rawId = (params as any)?.id;
    const documentId = Array.isArray(rawId) ? rawId[0] : rawId || '';

    const result = await documentService.deleteDocument(
      tenantContext.tenantSlug,
      documentId,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Document permanently deleted from vault.',
    });
  }
);
