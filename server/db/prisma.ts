if (typeof window !== 'undefined') {
  throw new Error('Prisma client can only be executed in a server environment.');
}
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { inspectDatabaseConfig } from './config';

declare global {
  var __messmatePrismaPool__: Pool | undefined;
  var __messmatePrismaClient__: PrismaClient | undefined;
}

/**
 * Returns the singleton PrismaClient configured with Neon PostgreSQL connection pooling.
 * Lazy initialization ensures build-time imports succeed even if DATABASE_URL is not yet configured.
 */
export function getPrismaClient(): PrismaClient {
  if (globalThis.__messmatePrismaClient__) {
    return globalThis.__messmatePrismaClient__;
  }

  const config = inspectDatabaseConfig();
  if (!config.configured || !config.runtimeUrl) {
    const errorDetails = config.issues
      .filter((i) => i.severity === 'error')
      .map((i) => i.message)
      .join(' ');
    throw new Error(
      `Neon PostgreSQL database is not configured. ${errorDetails || 'Set DATABASE_URL in your local .env file.'}`
    );
  }

  const pool =
    globalThis.__messmatePrismaPool__ ??
    new Pool({
      connectionString: config.runtimeUrl,
      max: process.env.NODE_ENV === 'production' ? 20 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

  // Guard against idle scale-to-zero disconnects crashing the process
  pool.on('error', (err) => {
    console.error('[Neon PostgreSQL] Unexpected error on idle pool connection:', err.message);
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__messmatePrismaPool__ = pool;
    globalThis.__messmatePrismaClient__ = client;
  }

  return client;
}

/**
 * Proxy singleton allowing standard `prisma.user.findMany()` usage with lazy runtime instantiation.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return (client as unknown as Record<string, unknown>)[prop as string];
  },
});

export interface ConnectionCheckResult {
  ok: boolean;
  message: string;
  database?: string;
  version?: string;
  timestamp?: Date;
}

/**
 * Executes a parameterized `SELECT 1` ping against Neon PostgreSQL with sanitized error output.
 */
export async function checkDatabaseConnection(): Promise<ConnectionCheckResult> {
  const config = inspectDatabaseConfig();
  if (!config.configured || !config.runtimeUrl) {
    return {
      ok: false,
      message: `Database is not configured: ${config.issues.map((i) => i.message).join(' ')}`,
    };
  }

  try {
    const client = getPrismaClient();
    const rows = await client.$queryRawUnsafe<Array<{ now: Date; db: string; ver: string }>>(
      'SELECT NOW() as now, current_database() as db, version() as ver'
    );
    const first = rows[0];
    return {
      ok: true,
      message: 'Successfully connected to Neon PostgreSQL database.',
      database: first?.db,
      version: first?.ver,
      timestamp: first?.now,
    };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      message: `Failed to connect to Neon PostgreSQL: ${err.message}`,
    };
  }
}
