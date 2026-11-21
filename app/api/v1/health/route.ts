import { NextResponse } from 'next/server';
import { performHealthCheck } from '@/server/health/health-service';
import { apiSuccess } from '@/server/api/response';

/**
 * GET /api/v1/health
 *
 * Safe backend and database health diagnostic endpoint.
 *
 * Security:
 * - Never returns raw database passwords, hosts, or connection strings.
 * - Returns 200 when healthy or degraded in dev.
 * - Returns 503 when critical services are disconnected.
 */
export async function GET() {
  const report = await performHealthCheck();

  if (report.status === 'unhealthy') {
    return NextResponse.json(
      {
        success: false,
        message: 'System health check detected unavailable services.',
        data: report,
        error: {
          code: 'DATABASE_ERROR',
        },
      },
      { status: 503 }
    );
  }

  const message =
    report.status === 'ok'
      ? 'System is healthy and database is connected'
      : 'System is running with degraded configuration (database unconfigured)';

  return apiSuccess(report, message, null, 200);
}
