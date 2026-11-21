/**
 * Canonical re-export of the centralized server-only Prisma client singleton.
 *
 * All runtime database operations must execute server-side via this module.
 * Direct browser/client component imports are forbidden by `import 'server-only'`.
 */

export {
  prisma,
  getPrismaClient,
  checkDatabaseConnection,
  type ConnectionCheckResult,
} from '@/server/db/prisma';
