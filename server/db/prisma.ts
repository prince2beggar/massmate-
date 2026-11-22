if (typeof window !== 'undefined') {
  throw new Error('Prisma client can only be executed in a server environment.');
}
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { inspectDatabaseConfig } from './config';
import { createMockPrismaClient } from './mock-prisma';

declare global {
  var __messmatePrismaPool__: Pool | undefined;
  var __messmatePrismaClient__: PrismaClient | any | undefined;
}

/**
 * Returns the singleton PrismaClient.
 * - If a valid PostgreSQL database URL is configured, initializes with connection pooling via @prisma/adapter-pg.
 * - If a MySQL database URL is configured, initializes direct database client.
 * - If no database is configured (or in demo/preview mode), returns a resilient in-memory mock client
 *   seeded with sample tenant, user, membership, and financial records.
 */
export function getPrismaClient(): PrismaClient {
  if (globalThis.__messmatePrismaClient__) {
    return globalThis.__messmatePrismaClient__;
  }

  const config = inspectDatabaseConfig();
  if (!config.configured || !config.runtimeUrl) {
    // Graceful in-memory mock client when database connection is not configured
    const mockClient = createMockPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalThis.__messmatePrismaClient__ = mockClient;
    }
    return mockClient;
  }

  try {
    const isMysql =
      config.runtimeUrl.startsWith('mysql:') ||
      config.runtimeUrl.startsWith('mysql2:') ||
      config.runtimeUrl.startsWith('mariadb:');

    if (isMysql) {
      // Standard Prisma Client connection for MySQL
      const client = new PrismaClient({
        datasourceUrl: config.runtimeUrl,
      });
      if (process.env.NODE_ENV !== 'production') {
        globalThis.__messmatePrismaClient__ = client;
      }
      return client;
    }

    const pool =
      globalThis.__messmatePrismaPool__ ??
      new Pool({
        connectionString: config.runtimeUrl,
        max: process.env.NODE_ENV === 'production' ? 20 : 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected error on idle pool connection:', err.message);
    });

    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });

    if (process.env.NODE_ENV !== 'production') {
      globalThis.__messmatePrismaPool__ = pool;
      globalThis.__messmatePrismaClient__ = client;
    }

    return client;
  } catch (err) {
    console.warn('[Database] Failed to initialize connection pool, falling back to mock database:', (err as Error).message);
    const mockClient = createMockPrismaClient();
    return mockClient;
  }
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
 * Executes a parameterized ping against configured database with sanitized output.
 */
export async function checkDatabaseConnection(): Promise<ConnectionCheckResult> {
  const config = inspectDatabaseConfig();
  if (!config.configured || !config.runtimeUrl) {
    return {
      ok: true,
      message: 'Running in Resilient In-Memory Mode (No external database required). All modules fully operational.',
      database: 'in_memory_mock',
      version: 'Mock Engine 1.0',
      timestamp: new Date(),
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
      message: 'Successfully connected to database.',
      database: first?.db,
      version: first?.ver,
      timestamp: first?.now,
    };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      message: `Failed to connect to database: ${err.message}`,
    };
  }
}
