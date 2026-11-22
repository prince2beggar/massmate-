/**
 * MessMate — System Role Constants and Client-Safe Templates
 *
 * Defines the 6 standardized system role templates:
 * 1. Owner
 * 2. Admin
 * 3. Moderator
 * 4. Accountant
 * 5. Meal Manager
 * 6. Member
 *
 * This file contains purely declarative types and constants with ZERO server/database
 * dependencies, safe for direct import by client components (Next.js 'use client').
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
  // 1. Owner
  {
    name: 'Owner',
    slug: 'owner',
    description: 'Full administrative ownership, financial control, and tenant governance.',
    isSystem: true,
    permissionKeys: PERMISSION_CATALOG.map((p) => p.key), // All 44 permissions
  },

  // 2. Admin
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Operational manager handling daily mess operations, members, and resources.',
    isSystem: true,
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'members.create',
      'members.update',
      'members.manage_status',
      'members.invite',
      'rooms.view',
      'rooms.create',
      'rooms.update',
      'rooms.manage_allocation',
      'meals.view',
      'meals.create',
      'meals.update',
      'meals.delete',
      'meals.manage_settings',
      'bazar.view',
      'bazar.create',
      'bazar.update',
      'bazar.verify',
      'finance.view',
      'finance.manage_bills',
      'finance.view_reports',
      'payments.view',
      'payments.create',
      'payments.confirm',
      'notices.view',
      'notices.create',
      'notices.update',
      'notices.delete',
      'events.manage',
      'complaints.manage',
      'reports.view',
      'reports.export',
      'settings.view',
      'roles.view',
      'audit_logs.view',
    ],
  },

  // 3. Moderator
  {
    name: 'Moderator',
    slug: 'moderator',
    description: 'Mess supervisor assisting in day-to-day coordination, notices, and complaints.',
    isSystem: true,
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'rooms.view',
      'meals.view',
      'meals.create',
      'meals.update',
      'bazar.view',
      'bazar.create',
      'finance.view',
      'payments.view',
      'payments.create',
      'notices.view',
      'notices.create',
      'notices.update',
      'events.manage',
      'complaints.manage',
      'reports.view',
    ],
  },

  // 4. Accountant
  {
    name: 'Accountant',
    slug: 'accountant',
    description: 'Finance and billing manager handling member deposits, bazar expenses, and statements.',
    isSystem: true,
    permissionKeys: [
      'dashboard.view',
      'members.view',
      'rooms.view',
      'bazar.view',
      'bazar.create',
      'bazar.update',
      'bazar.verify',
      'finance.view',
      'finance.manage_bills',
      'finance.view_reports',
      'payments.view',
      'payments.create',
      'payments.confirm',
      'payments.refund',
      'reports.view',
      'reports.export',
      'audit_logs.view',
    ],
  },

  // 5. Meal Manager
  {
    name: 'Meal Manager',
    slug: 'meal-manager',
    description: 'Dining coordinator managing daily meal counts, meal-offs, guest meals, and cook schedules.',
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
      'reports.view',
    ],
  },

  // 6. Member
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

export const ROLE_TEMPLATES_INFO = SYSTEM_ROLE_DISPLAY_CONFIG;

