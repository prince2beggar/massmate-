import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { messSettingsService } from '@/server/settings/mess-settings-service';

export const GET = withTenantAuth(
  { permission: 'audit_logs.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const moduleFilter = url.searchParams.get('module') || undefined;
    const action = url.searchParams.get('action') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25', 10);

    const result = await messSettingsService.listAuditLogs(tenantContext.tenantSlug, {
      module: moduleFilter,
      action,
      search,
      startDate,
      endDate,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    });
  }
);
