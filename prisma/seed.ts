/**
 * MessMate — Idempotent Database Seed Script
 *
 * Seeds:
 * 1. Global Granular Permissions (Platform capability definitions)
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

// Standard Granular Permissions for Mess & Accommodation SaaS
export const SYSTEM_PERMISSIONS = [
  // Dashboard Module
  {
    key: 'dashboard.view',
    name: 'View Dashboard',
    module: 'dashboard',
    description: 'Access the mess overview dashboard, quick stats, and daily summary widgets.',
  },

  // Members Module
  {
    key: 'members.view',
    name: 'View Members',
    module: 'members',
    description: 'View the active and historical member roster and public profile cards.',
  },
  {
    key: 'members.create',
    name: 'Invite & Create Members',
    module: 'members',
    description: 'Invite new residents and register member profiles into the mess.',
  },
  {
    key: 'members.update',
    name: 'Update Member Profiles',
    module: 'members',
    description: 'Edit member details, change membership statuses, and update seat assignments.',
  },
  {
    key: 'members.delete',
    name: 'Remove Members',
    module: 'members',
    description: 'Deactivate, suspend, or archive member memberships from the mess.',
  },

  // Meals Module
  {
    key: 'meals.view',
    name: 'View Meals',
    module: 'meals',
    description: 'View daily meal counts, meal status logs, and member meal schedules.',
  },
  {
    key: 'meals.manage',
    name: 'Manage Daily Meals',
    module: 'meals',
    description: 'Add, update, adjust, and lock daily breakfast, lunch, and dinner meal counts.',
  },

  // Bazar (Grocery) Module
  {
    key: 'bazar.view',
    name: 'View Bazar Records',
    module: 'bazar',
    description: 'View daily grocery purchases, itemized receipts, and scheduled bazar duties.',
  },
  {
    key: 'bazar.manage',
    name: 'Manage Bazar & Expenses',
    module: 'bazar',
    description: 'Record grocery purchases, verify receipts, and assign bazar shopping turns.',
  },

  // Finance Module
  {
    key: 'finance.view',
    name: 'View Financial Summary',
    module: 'finance',
    description: 'View overall fund balances, monthly calculation sheets, and meal rates.',
  },
  {
    key: 'finance.manage',
    name: 'Manage Financials & Monthly Close',
    module: 'finance',
    description: 'Finalize monthly accounts, record utility/cook bills, and adjust balances.',
  },

  // Payments Module
  {
    key: 'payments.view',
    name: 'View Payments & Receipts',
    module: 'payments',
    description: 'View payment histories, member dues, and transaction records.',
  },
  {
    key: 'payments.manage',
    name: 'Manage Payments & Approvals',
    module: 'payments',
    description: 'Approve manual bKash/Nagad payments, record cash deposits, and manage refunds.',
  },

  // Rooms & Beds Module
  {
    key: 'rooms.view',
    name: 'View Rooms & Bed Availability',
    module: 'rooms',
    description: 'View room allocations, bed availability, and seat rates.',
  },
  {
    key: 'rooms.manage',
    name: 'Manage Rooms & Allocations',
    module: 'rooms',
    description: 'Create rooms, configure seat rents, and assign residents to beds.',
  },

  // Notices Module
  {
    key: 'notices.manage',
    name: 'Manage Notice Board',
    module: 'notices',
    description: 'Create, pin, edit, and delete mess announcement notices.',
  },

  // Reports Module
  {
    key: 'reports.view',
    name: 'View & Export Reports',
    module: 'reports',
    description: 'View and export monthly audit sheets, member summaries, and expense charts.',
  },

  // Settings Module
  {
    key: 'settings.manage',
    name: 'Manage Mess Settings',
    module: 'settings',
    description: 'Configure mess rules, meal booking cutoff times, and mess profile info.',
  },

  // Roles & Security Module
  {
    key: 'roles.manage',
    name: 'Manage Roles & Permissions',
    module: 'roles',
    description: 'Create, modify, and assign tenant-specific roles and capability sets.',
  },
];

// System Default Role Templates with Baseline Permissions
export const SYSTEM_ROLE_TEMPLATES: Array<{
  name: string;
  slug: string;
  description: string;
  permissionKeys: string[];
}> = [
  {
    name: 'Owner',
    slug: 'owner',
    description: 'Full administrative ownership of the mess, financial authority, and system control.',
    permissionKeys: SYSTEM_PERMISSIONS.map((p) => p.key), // All 19 permissions
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Complete operational management of members, meals, bazar, finances, and rooms.',
    permissionKeys: SYSTEM_PERMISSIONS.map((p) => p.key).filter((k) => k !== 'settings.manage'),
  },
  {
    name: 'Moderator',
    slug: 'moderator',
    description: 'Operational supervisor assisting with member coordination, notices, and dispute resolution.',
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'members.create',
      'members.update',
      'meals.view',
      'bazar.view',
      'rooms.view',
      'notices.manage',
    ],
  },
  {
    name: 'Accountant',
    slug: 'accountant',
    description: 'Financial custodian responsible for bazar verification, payments, monthly audits, and dues.',
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'meals.view',
      'bazar.view',
      'bazar.manage',
      'finance.view',
      'finance.manage',
      'payments.view',
      'payments.manage',
      'reports.view',
    ],
  },
  {
    name: 'Meal Manager',
    slug: 'meal-manager',
    description: 'Mess manager in charge of meal bookings, daily counts, cook coordination, and groceries.',
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'meals.view',
      'meals.manage',
      'bazar.view',
      'bazar.manage',
      'notices.manage',
    ],
  },
  {
    name: 'Member',
    slug: 'member',
    description: 'Standard resident with view access to their meals, personal dues, notice board, and room details.',
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'meals.view',
      'bazar.view',
      'rooms.view',
      'payments.view',
    ],
  },
];

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

    // 1. Seed Granular Permissions
    let permissionsSeeded = 0;
    for (const perm of SYSTEM_PERMISSIONS) {
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
