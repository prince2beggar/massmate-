import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 configuration for MessMate (Neon PostgreSQL).
 *
 * - Prisma CLI commands (migrations, introspection, db push) prefer DIRECT_URL
 *   (Neon's unpooled direct host) because DDL/advisory locks require a direct
 *   PostgreSQL session rather than PgBouncer transaction pooling.
 * - Falls back to DATABASE_URL (or empty string during credential-free
 *   `prisma generate` runs) so local builds work before credentials are added.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  },
});
