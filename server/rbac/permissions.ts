/**
 * MessMate — Comprehensive RBAC Permission Catalog (Task 21)
 *
 * Defines all 44 granular capability keys across 10 functional modules.
 * This catalog is extensible and strictly typed to prevent untrusted client input.
 */

export interface PermissionDefinition {
  key: PermissionKey;
  name: string;
  module: PermissionModule;
  description: string;
}

export type PermissionModule =
  | 'dashboard'
  | 'members'
  | 'rooms'
  | 'meals'
  | 'bazar'
  | 'finance'
  | 'payments'
  | 'notices'
  | 'reports'
  | 'settings';

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  // ---------------------------------------------------------------------------
  // 1. Dashboard Module
  // ---------------------------------------------------------------------------
  {
    key: 'dashboard.view',
    name: 'View Dashboard',
    module: 'dashboard',
    description: 'Access the mess overview dashboard, live stats, and quick summary cards.',
  },

  // ---------------------------------------------------------------------------
  // 2. Members Module
  // ---------------------------------------------------------------------------
  {
    key: 'members.view',
    name: 'View Members',
    module: 'members',
    description: 'View active and historical member roster and public profile cards.',
  },
  {
    key: 'members.create',
    name: 'Create Members',
    module: 'members',
    description: 'Register and onboard new member profiles directly into the mess.',
  },
  {
    key: 'members.update',
    name: 'Update Members',
    module: 'members',
    description: 'Edit member personal information, contact numbers, and profile details.',
  },
  {
    key: 'members.delete',
    name: 'Delete Members',
    module: 'members',
    description: 'Permanently remove or archive member records from the mess.',
  },
  {
    key: 'members.manage_status',
    name: 'Manage Member Status',
    module: 'members',
    description: 'Change membership lifecycle state (Pending, Active, Suspended, Left).',
  },
  {
    key: 'members.invite',
    name: 'Invite Members',
    module: 'members',
    description: 'Generate invitations and share join codes for new residents.',
  },

  // ---------------------------------------------------------------------------
  // 3. Rooms & Accommodation Module
  // ---------------------------------------------------------------------------
  {
    key: 'rooms.view',
    name: 'View Rooms',
    module: 'rooms',
    description: 'View room allocations, seat occupancies, and vacancies.',
  },
  {
    key: 'rooms.create',
    name: 'Create Rooms',
    module: 'rooms',
    description: 'Add new rooms and configure bed capacity within the mess.',
  },
  {
    key: 'rooms.update',
    name: 'Update Rooms',
    module: 'rooms',
    description: 'Edit room numbers, seat configurations, and monthly seat rents.',
  },
  {
    key: 'rooms.delete',
    name: 'Delete Rooms',
    module: 'rooms',
    description: 'Remove empty rooms or archive unused accommodation spaces.',
  },
  {
    key: 'rooms.manage_allocation',
    name: 'Manage Room Allocation',
    module: 'rooms',
    description: 'Assign residents to specific beds and process room seat transfers.',
  },

  // ---------------------------------------------------------------------------
  // 4. Meals Module
  // ---------------------------------------------------------------------------
  {
    key: 'meals.view',
    name: 'View Meals',
    module: 'meals',
    description: 'View daily breakfast, lunch, and dinner meal logs and counts.',
  },
  {
    key: 'meals.create',
    name: 'Create Meals',
    module: 'meals',
    description: 'Book and enter daily meal counts for residents.',
  },
  {
    key: 'meals.update',
    name: 'Update Meals',
    module: 'meals',
    description: 'Edit recorded meal counts before daily cutoff times.',
  },
  {
    key: 'meals.delete',
    name: 'Delete Meals',
    module: 'meals',
    description: 'Cancel or remove meal bookings.',
  },
  {
    key: 'meals.manage_settings',
    name: 'Manage Meal Settings',
    module: 'meals',
    description: 'Configure meal booking cutoff hours, guest meal multipliers, and dining rules.',
  },

  // ---------------------------------------------------------------------------
  // 5. Bazar (Grocery) Module
  // ---------------------------------------------------------------------------
  {
    key: 'bazar.view',
    name: 'View Bazar',
    module: 'bazar',
    description: 'View itemized daily grocery purchases and scheduled shopping duties.',
  },
  {
    key: 'bazar.create',
    name: 'Create Bazar Entry',
    module: 'bazar',
    description: 'Record grocery purchases, costs, item names, and receipt vouchers.',
  },
  {
    key: 'bazar.update',
    name: 'Update Bazar Entry',
    module: 'bazar',
    description: 'Edit grocery item entries and update provisional shopping expenses.',
  },
  {
    key: 'bazar.delete',
    name: 'Delete Bazar Entry',
    module: 'bazar',
    description: 'Remove erroneous grocery purchase entries.',
  },
  {
    key: 'bazar.verify',
    name: 'Verify Bazar Expenses',
    module: 'bazar',
    description: 'Audit and officially approve grocery expenses submitted by members.',
  },

  // ---------------------------------------------------------------------------
  // 6. Finance Module
  // ---------------------------------------------------------------------------
  {
    key: 'finance.view',
    name: 'View Finance',
    module: 'finance',
    description: 'View mess balance sheets, monthly fund tallies, and overall financial health.',
  },
  {
    key: 'finance.manage',
    name: 'Manage Finance',
    module: 'finance',
    description: 'Perform monthly account closures, meal rate calculations, and balance adjustments.',
  },
  {
    key: 'finance.manage_bills',
    name: 'Manage Utility & Common Bills',
    module: 'finance',
    description: 'Record and split cook bills, gas, electricity, water, and internet bills.',
  },
  {
    key: 'finance.view_reports',
    name: 'View Financial Reports',
    module: 'finance',
    description: 'Access detailed financial calculation sheets and monthly ledger audits.',
  },

  // ---------------------------------------------------------------------------
  // 7. Payments Module
  // ---------------------------------------------------------------------------
  {
    key: 'payments.view',
    name: 'View Payments',
    module: 'payments',
    description: 'View payment transactions, deposit histories, and member dues.',
  },
  {
    key: 'payments.create',
    name: 'Create Payments',
    module: 'payments',
    description: 'Record cash deposits or initiate payment transactions.',
  },
  {
    key: 'payments.confirm',
    name: 'Confirm Payments',
    module: 'payments',
    description: 'Verify and approve bKash, Nagad, bank, or cash payments submitted by members.',
  },
  {
    key: 'payments.reject',
    name: 'Reject Payments',
    module: 'payments',
    description: 'Reject invalid or unverified deposit and payment submissions.',
  },
  {
    key: 'payments.refund',
    name: 'Refund Payments',
    module: 'payments',
    description: 'Process and issue balance refunds to departing members.',
  },

  // ---------------------------------------------------------------------------
  // 8. Notices and Community Module
  // ---------------------------------------------------------------------------
  {
    key: 'notices.view',
    name: 'View Notices',
    module: 'notices',
    description: 'Read mess notices, announcement boards, and community updates.',
  },
  {
    key: 'notices.create',
    name: 'Create Notices',
    module: 'notices',
    description: 'Post new announcements and messages to the mess notice board.',
  },
  {
    key: 'notices.update',
    name: 'Update Notices',
    module: 'notices',
    description: 'Edit existing notices and toggle pinned priority.',
  },
  {
    key: 'notices.delete',
    name: 'Delete Notices',
    module: 'notices',
    description: 'Remove notices from the notice board.',
  },
  {
    key: 'events.manage',
    name: 'Manage Community Events',
    module: 'notices',
    description: 'Organize feasts, mess meetings, elections, and cleaning drives.',
  },
  {
    key: 'complaints.manage',
    name: 'Manage Complaints & Grievances',
    module: 'notices',
    description: 'Review resident complaints, resolve disputes, and respond to issues.',
  },

  // ---------------------------------------------------------------------------
  // 9. Reports Module
  // ---------------------------------------------------------------------------
  {
    key: 'reports.view',
    name: 'View Reports',
    module: 'reports',
    description: 'View monthly mess performance, meal consumption charts, and expense graphs.',
  },
  {
    key: 'reports.export',
    name: 'Export Reports',
    module: 'reports',
    description: 'Download PDF and spreadsheet exports of monthly mess accounts.',
  },

  // ---------------------------------------------------------------------------
  // 10. Settings and Administration Module
  // ---------------------------------------------------------------------------
  {
    key: 'settings.view',
    name: 'View Settings',
    module: 'settings',
    description: 'View mess profile, general rules, and operational configurations.',
  },
  {
    key: 'settings.manage',
    name: 'Manage Settings',
    module: 'settings',
    description: 'Edit mess metadata, operational rules, address, and billing configurations.',
  },
  {
    key: 'roles.view',
    name: 'View Roles',
    module: 'settings',
    description: 'View tenant roles, assigned permissions, and role rosters.',
  },
  {
    key: 'roles.manage',
    name: 'Manage Roles',
    module: 'settings',
    description: 'Create custom roles, edit role permissions, and assign roles to members.',
  },
  {
    key: 'audit_logs.view',
    name: 'View Audit Logs',
    module: 'settings',
    description: 'Inspect administrative audit trails and security activity logs.',
  },
];

// Extracted string union type of all 44 permissions
export type PermissionKey =
  | 'dashboard.view'
  | 'members.view'
  | 'members.create'
  | 'members.update'
  | 'members.delete'
  | 'members.manage_status'
  | 'members.invite'
  | 'rooms.view'
  | 'rooms.create'
  | 'rooms.update'
  | 'rooms.delete'
  | 'rooms.manage_allocation'
  | 'meals.view'
  | 'meals.create'
  | 'meals.update'
  | 'meals.delete'
  | 'meals.manage_settings'
  | 'bazar.view'
  | 'bazar.create'
  | 'bazar.update'
  | 'bazar.delete'
  | 'bazar.verify'
  | 'finance.view'
  | 'finance.manage'
  | 'finance.manage_bills'
  | 'finance.view_reports'
  | 'payments.view'
  | 'payments.create'
  | 'payments.confirm'
  | 'payments.reject'
  | 'payments.refund'
  | 'notices.view'
  | 'notices.create'
  | 'notices.update'
  | 'notices.delete'
  | 'events.manage'
  | 'complaints.manage'
  | 'reports.view'
  | 'reports.export'
  | 'settings.view'
  | 'settings.manage'
  | 'roles.view'
  | 'roles.manage'
  | 'audit_logs.view';

// Fast lookup sets and maps
export const PERMISSION_KEYS_SET = new Set<string>(
  PERMISSION_CATALOG.map((p) => p.key)
);

export const PERMISSION_BY_KEY_MAP = new Map<PermissionKey, PermissionDefinition>(
  PERMISSION_CATALOG.map((p) => [p.key, p])
);

/**
 * Validates whether an arbitrary input string is a valid, registered permission key.
 */
export function isValidPermissionKey(key: string): key is PermissionKey {
  return PERMISSION_KEYS_SET.has(key);
}

/**
 * Returns all permissions filtered by functional module.
 */
export function getPermissionsByModule(module: PermissionModule): PermissionDefinition[] {
  return PERMISSION_CATALOG.filter((p) => p.module === module);
}
