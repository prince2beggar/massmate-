import type { PlatformRole } from '@/types/database';

export type PlatformPermissionKey =
  | 'tenants.view'
  | 'tenants.manage'
  | 'users.view'
  | 'users.manage'
  | 'subscriptions.view'
  | 'subscriptions.manage'
  | 'revenue.view'
  | 'domains.view'
  | 'domains.manage'
  | 'support.view'
  | 'support.manage'
  | 'audit.view'
  | 'settings.manage'
  | 'analytics.view'
  | 'reports.export';

export interface PlatformPermissionDefinition {
  key: PlatformPermissionKey;
  name: string;
  module: 'tenants' | 'users' | 'subscriptions' | 'revenue' | 'domains' | 'support' | 'audit' | 'settings' | 'analytics' | 'reports';
  description: string;
}

export const PLATFORM_PERMISSIONS: PlatformPermissionDefinition[] = [
  {
    key: 'tenants.view',
    name: 'View Tenants',
    module: 'tenants',
    description: 'View registered messes, accommodation businesses, and aggregate tenant metrics.',
  },
  {
    key: 'tenants.manage',
    name: 'Manage Tenants',
    module: 'tenants',
    description: 'Suspend, activate, verify, or configure platform tenants.',
  },
  {
    key: 'users.view',
    name: 'View Platform Users',
    module: 'users',
    description: 'View global user profiles, statuses, and multi-tenant memberships.',
  },
  {
    key: 'users.manage',
    name: 'Manage Platform Users',
    module: 'users',
    description: 'Assign platform administrator roles, suspend accounts, and manage identities.',
  },
  {
    key: 'subscriptions.view',
    name: 'View Subscriptions',
    module: 'subscriptions',
    description: 'Inspect subscription tiers, trial statuses, and active organization plans.',
  },
  {
    key: 'subscriptions.manage',
    name: 'Manage Subscriptions',
    module: 'subscriptions',
    description: 'Create, update, or archive platform subscription plans and custom pricing.',
  },
  {
    key: 'revenue.view',
    name: 'View Platform Revenue',
    module: 'revenue',
    description: 'Access financial summaries, collected revenue, payments, and billing analytics.',
  },
  {
    key: 'domains.view',
    name: 'View Domains',
    module: 'domains',
    description: 'Inspect platform subdomains, custom domains, DNS statuses, and SSL provisioning.',
  },
  {
    key: 'domains.manage',
    name: 'Manage Domains',
    module: 'domains',
    description: 'Approve, verify, suspend, or configure tenant custom domains and primary routing.',
  },
  {
    key: 'support.view',
    name: 'View Support Tickets',
    module: 'support',
    description: 'Read customer support requests, verification inquiries, and reports.',
  },
  {
    key: 'support.manage',
    name: 'Manage Support Tickets',
    module: 'support',
    description: 'Respond to and resolve platform support tickets and escalation issues.',
  },
  {
    key: 'audit.view',
    name: 'View Platform Audit Trail',
    module: 'audit',
    description: 'Audit platform-wide administrative events and compliance logs.',
  },
  {
    key: 'settings.manage',
    name: 'Manage Platform Settings',
    module: 'settings',
    description: 'Update platform-level configurations, subdomains, features, and security gates.',
  },
  {
    key: 'analytics.view',
    name: 'View Platform Analytics',
    module: 'analytics',
    description: 'Inspect multi-tenant KPIs, growth trends, cohorts, and operational statistics.',
  },
  {
    key: 'reports.export',
    name: 'Export Platform Reports',
    module: 'reports',
    description: 'Generate and download authorized CSV reports of platform datasets.',
  },
];

export const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRole, PlatformPermissionKey[]> = {
  PLATFORM_OWNER: [
    'tenants.view',
    'tenants.manage',
    'users.view',
    'users.manage',
    'subscriptions.view',
    'subscriptions.manage',
    'revenue.view',
    'domains.view',
    'domains.manage',
    'support.view',
    'support.manage',
    'audit.view',
    'settings.manage',
    'analytics.view',
    'reports.export',
  ],
  PLATFORM_ADMIN: [
    'tenants.view',
    'tenants.manage',
    'users.view',
    'subscriptions.view',
    'subscriptions.manage',
    'domains.view',
    'domains.manage',
    'support.view',
    'support.manage',
    'audit.view',
    'analytics.view',
    'reports.export',
  ],
  SUPPORT_STAFF: [
    'tenants.view',
    'users.view',
    'domains.view',
    'support.view',
    'support.manage',
    'audit.view',
    'analytics.view',
  ],
  FINANCE_STAFF: [
    'tenants.view',
    'subscriptions.view',
    'subscriptions.manage',
    'revenue.view',
    'analytics.view',
    'reports.export',
  ],
};

export function isPlatformRole(role: unknown): role is PlatformRole {
  return (
    typeof role === 'string' &&
    ['PLATFORM_OWNER', 'PLATFORM_ADMIN', 'SUPPORT_STAFF', 'FINANCE_STAFF'].includes(role)
  );
}

export function getPlatformRolePermissions(role: PlatformRole): Set<PlatformPermissionKey> {
  const perms = PLATFORM_ROLE_PERMISSIONS[role] || [];
  return new Set<PlatformPermissionKey>(perms);
}
