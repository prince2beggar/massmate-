import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { documentService } from '@/server/documents/document-service';

export const GET = withTenantAuth(
  { permissions: ['settings.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const dashboard = await documentService.getDocumentDashboard(
      tenantContext.tenantSlug,
      tenantContext.userId,
      true
    );

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  }
);
