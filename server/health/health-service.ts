import { checkDatabaseConnection } from '@/server/db/prisma';
import { validateEnvironment } from '@/server/config/env';

export interface HealthCheckReport {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'unconfigured';
      message: string;
    };
    environment: {
      status: 'valid' | 'invalid';
      mode: string;
    };
  };
}

/**
 * Checks system health and database connectivity safely without exposing credentials or hosts.
 */
export async function performHealthCheck(): Promise<HealthCheckReport> {
  const envValidation = validateEnvironment();
  const dbCheck = await checkDatabaseConnection();

  let dbStatus: 'connected' | 'disconnected' | 'unconfigured' = 'disconnected';
  let dbMessage = 'Database is unreachable.';

  if (dbCheck.ok) {
    dbStatus = 'connected';
    dbMessage = 'Neon PostgreSQL database is responding normally.';
  } else if (!envValidation.database.configured) {
    dbStatus = 'unconfigured';
    dbMessage = 'Database connection strings are not configured in local environment.';
  }

  const isHealthy = dbCheck.ok && envValidation.valid;
  const isDegraded = !dbCheck.ok && !envValidation.database.configured; // unconfigured in dev

  const status: HealthCheckReport['status'] = isHealthy
    ? 'ok'
    : isDegraded
      ? 'degraded'
      : 'unhealthy';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      database: {
        status: dbStatus,
        message: dbMessage,
      },
      environment: {
        status: envValidation.valid ? 'valid' : 'invalid',
        mode: envValidation.environment,
      },
    },
  };
}
