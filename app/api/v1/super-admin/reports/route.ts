import { withPlatformAuth } from '@/server/platform/with-platform-auth';
import { reportExportService, type ReportType } from '@/server/platform/report-export-service';
import { NextResponse } from 'next/server';
import { validateBody } from '@/server/api/validation';
import { z } from 'zod';

const exportReportSchema = z.object({
  reportType: z.enum(['tenants', 'subscriptions', 'payments', 'users', 'domains', 'tickets']),
});

/**
 * POST /api/v1/super-admin/reports
 * Generates and downloads an authorized CSV dataset.
 */
export const POST = withPlatformAuth(
  {
    permission: 'reports.export',
  },
  async (req, { platformContext }) => {
    const body = await validateBody(req, exportReportSchema);

    const { filename, csvContent } = await reportExportService.exportReport(
      body.reportType as ReportType,
      platformContext
    );

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }
);
