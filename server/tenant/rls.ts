if (typeof window !== 'undefined') {
  throw new Error('RLS utilities can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { CrossTenantViolationError } from './errors';

/**
 * PostgreSQL Row-Level Security (RLS) Configuration & Isolation Runner
 *
 * Security Architecture:
 * - Employs PostgreSQL `set_config('app.current_tenant_id', $1, true)` where `is_local = true`.
 * - The `is_local = true` flag strictly confines the tenant setting to the current transaction.
 * - When the transaction completes (COMMIT or ROLLBACK), PostgreSQL automatically discards the setting.
 * - This guarantees ZERO tenant context leakage when connection pooling (PgBouncer/Neon) reuses sockets.
 */

export const RLS_ISOLATED_TABLES = ['roles', 'memberships'] as const;

export const RLS_POLICY_SQL = `
-- Enable Row-Level Security (RLS) on tenant-scoped tables
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" FORCE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;

-- Drop existing policies if re-applying
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "roles";
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "memberships";

-- Policy: roles table isolated by transaction-local setting
CREATE POLICY "tenant_isolation_policy" ON "roles"
  FOR ALL
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
  )
  WITH CHECK (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
  );

-- Policy: memberships table isolated by transaction-local setting
CREATE POLICY "tenant_isolation_policy" ON "memberships"
  FOR ALL
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
  )
  WITH CHECK (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
  );
`;

/**
 * Executes a callback inside an isolated PostgreSQL transaction with transaction-local
 * `app.current_tenant_id` context.
 *
 * @param tenantId - Verified tenant ID to bind
 * @param callback - Operation executed within the transaction scope
 * @param client - Optional custom PrismaClient (defaults to centralized singleton)
 */
export async function withTenantRlsContext<T>(
  tenantId: string,
  callback: (tx: PrismaClient) => Promise<T>,
  client: PrismaClient = defaultPrisma as unknown as PrismaClient
): Promise<T> {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new CrossTenantViolationError('Invalid tenantId provided for RLS transaction context.');
  }

  // Execute inside an interactive transaction to guarantee transaction-local scope
  return client.$transaction(async (tx) => {
    // Parameterized local setting (is_local = true)
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_tenant_id', $1, true)`,
      tenantId
    );

    return callback(tx as unknown as PrismaClient);
  });
}
