/**
 * MessMate — Idempotent Database Seed Script
 *
 * Seeds:
 * 1. Global Granular Permissions (44 platform capability definitions from RBAC catalog)
 * 2. System Role Templates (Owner, Admin, Moderator, Accountant, Meal Manager, Member)
 * 3. Role-Template Permission Junctions
 *
 * Guarantees:
 * - 100% Idempotent (uses Prisma `upsert`, safe to run repeatedly)
 * - Safe for production (does NOT wipe or overwrite user/tenant records)
 * - Zero mock real-world users or messes created
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { inspectDatabaseConfig } from '../server/db/config';
import {
  PERMISSION_CATALOG,
  SYSTEM_ROLE_TEMPLATES,
} from '../server/rbac';

// Re-export for backward compatibility with existing test runners
export const SYSTEM_PERMISSIONS = PERMISSION_CATALOG;
export { SYSTEM_ROLE_TEMPLATES };

export async function runSeed(): Promise<{
  permissionsSeeded: number;
  templatesSeeded: number;
  junctionsSeeded: number;
}> {
  const config = inspectDatabaseConfig();
  if (!config.configured || !config.runtimeUrl) {
    console.warn(
      '\n[MessMate Seed] Cannot connect to database: Neon connection strings are not configured in .env.'
    );
    console.warn('               Set valid DATABASE_URL in .env before executing database seed.');
    return { permissionsSeeded: 0, templatesSeeded: 0, junctionsSeeded: 0 };
  }

  const pool = new Pool({
    connectionString: config.runtimeUrl,
    max: 5,
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  try {
    console.log('[MessMate Seed] Starting idempotent multi-tenant bootstrap seed...');

    // 1. Seed Granular Permissions (44 items)
    let permissionsSeeded = 0;
    for (const perm of PERMISSION_CATALOG) {
      await client.permission.upsert({
        where: { key: perm.key },
        update: {
          name: perm.name,
          module: perm.module,
          description: perm.description,
        },
        create: {
          key: perm.key,
          name: perm.name,
          module: perm.module,
          description: perm.description,
        },
      });
      permissionsSeeded++;
    }
    console.log(`[MessMate Seed] ✔ Upserted ${permissionsSeeded} system permissions.`);

    // Pre-fetch all permissions map for fast linking
    const allDbPermissions = await client.permission.findMany();
    const permMap = new Map<string, string>(allDbPermissions.map((p) => [p.key, p.id]));

    // 2. Seed System Role Templates and Junctions
    let templatesSeeded = 0;
    let junctionsSeeded = 0;

    for (const tmpl of SYSTEM_ROLE_TEMPLATES) {
      const templateRecord = await client.roleTemplate.upsert({
        where: { slug: tmpl.slug },
        update: {
          name: tmpl.name,
          description: tmpl.description,
          isDefault: true,
        },
        create: {
          name: tmpl.name,
          slug: tmpl.slug,
          description: tmpl.description,
          isDefault: true,
        },
      });
      templatesSeeded++;

      for (const pKey of tmpl.permissionKeys) {
        const permissionId = permMap.get(pKey);
        if (!permissionId) continue;

        await client.roleTemplatePermission.upsert({
          where: {
            templateId_permissionId: {
              templateId: templateRecord.id,
              permissionId,
            },
          },
          update: {},
          create: {
            templateId: templateRecord.id,
            permissionId,
          },
        });
        junctionsSeeded++;
      }
    }

    console.log(`[MessMate Seed] ✔ Upserted ${templatesSeeded} system role templates.`);
    console.log(`[MessMate Seed] ✔ Upserted ${junctionsSeeded} role-template permission mappings.`);
    console.log('[MessMate Seed] Completed successfully.\n');

    return { permissionsSeeded, templatesSeeded, junctionsSeeded };
  } finally {
    await client.$disconnect();
    await pool.end();
  }
}

// Auto-run when executed directly via CLI
if (require.main === module || process.argv[1]?.includes('seed')) {
  runSeed()
    .then((result) => {
      if (result.permissionsSeeded > 0) {
        console.log('[MessMate Seed] Seed execution finished with success.');
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('[MessMate Seed] Fatal error executing seed:', err);
      process.exit(1);
    });
}
