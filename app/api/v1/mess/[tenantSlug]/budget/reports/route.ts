import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { budgetService } from '@/server/budget/budget-service';

export const GET = withTenantAuth(
  { permissions: ['finance.view', 'reports.view', 'dashboard.view'] },
  async (req, { tenantContext }) => {
    const { searchParams } = new URL(req.url);
    const budgetId = searchParams.get('budgetId') || undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
    const format = searchParams.get('format') || 'json';

    const report = await budgetService.getBudgetReports(tenantContext.tenantSlug, {
      budgetId,
      year,
    });

    if (format === 'csv') {
      return new NextResponse(report.csvExportContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="budget-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  }
);
