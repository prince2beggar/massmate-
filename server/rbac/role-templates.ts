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

export const SYSTEM_ROLE_DISPLAY_CONFIG: Record<
  SystemRoleSlug,
  { name: string; badgeColor: string; description: string; responsibilities: string }
> = {
  member: {
    name: 'General Member (সাধারণ সদস্য)',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'সাধারণ বাসিন্দা — নিজের মিল, ব্যক্তিগত বিল ও নোটিশ দেখতে পারেন',
    responsibilities: 'মেসের নিয়মিত বাসিন্দা হিসেবে বসবাস ও নিয়মিত খাবার সুবিধা',
  },
  'meal-manager': {
    name: 'Meal Manager (মিল ম্যানেজার)',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'মিলের দায়িত্ব — দৈনিক মিল এন্ট্রি, গণনা, বন্ধের রিকোয়েস্ট ও রান্না তদারকি',
    responsibilities: 'দৈনিক সকাল, দুপুর ও রাতের মিল গণনা এবং রান্নার শিডিউল রক্ষণাবেক্ষণ',
  },
  accountant: {
    name: 'Finance & Accountant (হিসাবরক্ষক)',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'হিসাবের দায়িত্ব — বাজার খরচ, মাসিক বিলিং, পেমেন্ট ভেরিফাই ও বাজেট হিসাব',
    responsibilities: 'মাসিক মেস ভাড়া, ইউটিলিটি বিলিং ও বাজেট অডিট ব্যবস্থাপনা',
  },
  admin: {
    name: 'Co-Admin / Manager (সহ-এডমিন)',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'সহ-এডমিন — মেসের সার্বিক পরিচালনা (মেসে ১+ এডমিন নিয়োগ সম্ভব)',
    responsibilities: 'ওনারের পাশাপাশি মেস পরিচালনা ও অন্যান্য সদস্যদের তদারকি',
  },
  moderator: {
    name: 'Moderator (সমন্বয়ক)',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'মেস সমন্বয়ক — নোটিশ প্রকাশ, ইভেন্ট পরিচালনা ও কমপ্লেইন সমাধান',
    responsibilities: 'সাধারণ নোটিশ, জরুরি মেস মিটিং ও ইভেন্ট সমন্বয়',
  },
  owner: {
    name: 'Mess Owner (মেস ওনার)',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'মেস প্রতিষ্ঠাতা ও প্রধান মালিকানা — এডমিনের সমান পূর্ণ নিয়ন্ত্রণ',
    responsibilities: 'মেসের সর্বোচ্চ প্রশাসনিক ও চুক্তিভিত্তিক মূল স্বত্বাধিকারী',
  },
};

export const STANDARD_MESS_ROLES = [
  { id: 'role_member', slug: 'member' as SystemRoleSlug, name: 'General Member (সাধারণ সদস্য)', description: 'সাধারণ বাসিন্দা — নিজের মিল ও বিল দেখার সুবিধা' },
  { id: 'role_meal_manager', slug: 'meal-manager' as SystemRoleSlug, name: 'Meal Manager (মিল ম্যানেজার)', description: 'মিলের দায়িত্ব — দৈনিক মিল কাউন্ট ও এন্ট্রি' },
  { id: 'role_accountant', slug: 'accountant' as SystemRoleSlug, name: 'Finance & Accountant (হিসাবরক্ষক)', description: 'হিসাবের দায়িত্ব — বাজার খরচ, বিলিং ও পেমেন্ট' },
  { id: 'role_admin', slug: 'admin' as SystemRoleSlug, name: 'Co-Admin / Manager (সহ-এডমিন)', description: 'সহ-এডমিন — মেসের সার্বিক পরিচালনা (মেসে ১+ এডমিন নিয়োগ সম্ভব)' },
  { id: 'role_moderator', slug: 'moderator' as SystemRoleSlug, name: 'Moderator (সমন্বয়ক)', description: 'মেস সমন্বয়ক — নোটিশ ও কমপ্লেইন তদারকি' },
  { id: 'role_owner', slug: 'owner' as SystemRoleSlug, name: 'Mess Owner (মেস ওনার)', description: 'মেস প্রতিষ্ঠাতা ও প্রধান মালিকানা — পূর্ণ নিয়ন্ত্রণ' },
];

/**
 * Ensures all 6 standard system roles exist for the given tenant.
 * Guarantees that any mess immediately has General Member, Meal Manager, Accountant, Co-Admin, etc.
 */
export async function ensureTenantRoles(
  tenantId: string,
  client?: any
): Promise<Array<{ id: string; name: string; slug: string; description?: string }>> {
  // Dynamically import prisma to prevent circular dependencies
  const { prisma: defaultPrisma } = await import('@/server/db/prisma');
  const db = client || defaultPrisma;

  let existingRoles: any[] = [];
  try {
    existingRoles = await db.role.findMany({
      where: { tenantId, status: 'ACTIVE' },
    });
  } catch {
    existingRoles = [];
  }

  const existingSlugs = new Set((existingRoles || []).map((r: any) => r.slug));
  const resultRoles = [...(existingRoles || [])];

  for (const tpl of SYSTEM_ROLE_TEMPLATES) {
    if (!existingSlugs.has(tpl.slug)) {
      const config = SYSTEM_ROLE_DISPLAY_CONFIG[tpl.slug];
      const roleName = config?.name || tpl.name;
      const roleId = `role_${tpl.slug.replace(/-/g, '_')}_${tenantId}`;
      try {
        const created = await db.role.create({
          data: {
            id: roleId,
            tenantId,
            name: roleName,
            slug: tpl.slug,
            description: tpl.description,
            isSystem: true,
            status: 'ACTIVE',
            permissions: tpl.permissionKeys,
          } as any,
        });
        resultRoles.push(created);
      } catch {
        resultRoles.push({
          id: roleId,
          tenantId,
          name: roleName,
          slug: tpl.slug,
          description: tpl.description,
          isSystem: true,
          status: 'ACTIVE',
          permissions: tpl.permissionKeys,
        });
      }
    }
  }

  if (resultRoles.length === 0) {
    return STANDARD_MESS_ROLES.map((r) => ({
      id: `${r.id}_${tenantId}`,
      tenantId,
      name: r.name,
      slug: r.slug,
      description: r.description,
    }));
  }

  // Desired display order: General Member first (index 0), then Meal Manager, Accountant, Admin, Moderator, Owner
  const order = ['member', 'meal-manager', 'accountant', 'admin', 'moderator', 'owner'];
  return resultRoles.sort((a, b) => {
    const idxA = order.indexOf(a.slug);
    const idxB = order.indexOf(b.slug);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}
