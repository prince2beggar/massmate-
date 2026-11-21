/**
 * MessMate — Default System Role Templates (Task 21)
 *
 * Defines the 6 standardized system role templates:
 * 1. Owner
 * 2. Admin
 * 3. Moderator
 * 4. Accountant
 * 5. Meal Manager
 * 6. Member
 *
 * Each template maps out sensible default permission sets that tenants inherit
 * upon creation, while remaining fully customizable per tenant.
 */

import { PERMISSION_CATALOG, type PermissionKey } from './permissions';

export type SystemRoleSlug =
  | 'owner'
  | 'admin'
  | 'moderator'
  | 'accountant'
  | 'meal-manager'
  | 'member';

export interface SystemRoleTemplateDefinition {
  name: string;
  slug: SystemRoleSlug;
  description: string;
  isSystem: boolean;
  permissionKeys: PermissionKey[];
}

export const SYSTEM_ROLE_TEMPLATES: SystemRoleTemplateDefinition[] = [
  // ---------------------------------------------------------------------------
  // 1. Owner
  // ---------------------------------------------------------------------------
  {
    name: 'Owner',
    slug: 'owner',
    description: 'Full administrative ownership, financial control, and tenant governance.',
    isSystem: true,
    permissionKeys: PERMISSION_CATALOG.map((p) => p.key), // All 44 permissions
  },

  // ---------------------------------------------------------------------------
  // 2. Admin
  // ---------------------------------------------------------------------------
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Operational manager handling daily mess operations, members, and resources.',
    isSystem: true,
    permissionKeys: [
      // Dashboard
      'dashboard.view',
      // Members
      'members.view',
      'members.create',
      'members.update',
      'members.manage_status',
      'members.invite',
      // Rooms
      'rooms.view',
      'rooms.create',
      'rooms.update',
      'rooms.manage_allocation',
      // Meals
      'meals.view',
      'meals.create',
      'meals.update',
      'meals.delete',
      'meals.manage_settings',
      // Bazar
      'bazar.view',
      'bazar.create',
      'bazar.update',
      'bazar.verify',
      // Finance
      'finance.view',
      'finance.manage_bills',
      'finance.view_reports',
      // Payments
      'payments.view',
      'payments.create',
      'payments.confirm',
      // Notices
      'notices.view',
      'notices.create',
      'notices.update',
      'notices.delete',
      'events.manage',
      'complaints.manage',
      // Reports
      'reports.view',
      'reports.export',
      // Settings & Roles (view-only; cannot alter owner/system configs)
      'settings.view',
      'roles.view',
      'audit_logs.view',
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. Moderator
  // ---------------------------------------------------------------------------
  {
    name: 'Moderator',
    slug: 'moderator',
    description: 'Community lead handling member onboarding, notices, dispute resolution, and events.',
    isSystem: true,
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'members.create',
      'members.update',
      'members.manage_status',
      'members.invite',
      'rooms.view',
      'meals.view',
      'bazar.view',
      'notices.view',
      'notices.create',
      'notices.update',
      'notices.delete',
      'events.manage',
      'complaints.manage',
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. Accountant
  // ---------------------------------------------------------------------------
  {
    name: 'Accountant',
    slug: 'accountant',
    description: 'Financial custodian managing grocery audits, deposits, bills, and monthly accounts.',
    isSystem: true,
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'rooms.view',
      'meals.view',
      'bazar.view',
      'bazar.verify',
      'finance.view',
      'finance.manage',
      'finance.manage_bills',
      'finance.view_reports',
      'payments.view',
      'payments.create',
      'payments.confirm',
      'payments.reject',
      'payments.refund',
      'reports.view',
      'reports.export',
      'notices.view',
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. Meal Manager
  // ---------------------------------------------------------------------------
  {
    name: 'Meal Manager',
    slug: 'meal-manager',
    description: 'Resident manager coordinating daily dining, meal entries, cook timing, and grocery lists.',
    isSystem: true,
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'meals.view',
      'meals.create',
      'meals.update',
      'meals.delete',
      'meals.manage_settings',
      'bazar.view',
      'bazar.create',
      'notices.view',
      'notices.create',
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. Member
  // ---------------------------------------------------------------------------
  {
    name: 'Member',
    slug: 'member',
    description: 'Standard mess resident with view access to meals, personal bills, notices, and room info.',
    isSystem: true,
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'rooms.view',
      'meals.view',
      'bazar.view',
      'payments.view',
      'notices.view',
    ],
  },
];

export const SYSTEM_ROLE_SLUGS_SET = new Set<string>(
  SYSTEM_ROLE_TEMPLATES.map((t) => t.slug)
);

export function isSystemRoleSlug(slug: string): slug is SystemRoleSlug {
  return SYSTEM_ROLE_SLUGS_SET.has(slug);
}

export function getSystemRoleTemplate(slug: SystemRoleSlug): SystemRoleTemplateDefinition | undefined {
  return SYSTEM_ROLE_TEMPLATES.find((t) => t.slug === slug);
}
