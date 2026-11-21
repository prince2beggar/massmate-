import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Layers,
  Globe,
  Users,
  Headphones,
  ShieldCheck,
  BarChart3,
  History,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'neutral' | 'warning' | 'success';
  status: 'active' | 'upcoming';
  description: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/super-admin',
    icon: LayoutDashboard,
    status: 'active',
    description: 'Platform KPIs, tenant metrics, and health overview',
  },
  {
    id: 'tenants',
    label: 'Mess / Tenant Management',
    href: '/super-admin/tenants',
    icon: Building2,
    badge: 'Task 25',
    badgeVariant: 'neutral',
    status: 'upcoming',
    description: 'Monitor registered messes, approval queues, and suspensions',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    href: '/super-admin/subscriptions',
    icon: CreditCard,
    badge: 'Phase 3',
    badgeVariant: 'neutral',
    status: 'upcoming',
    description: 'Track active subscriptions, trial accounts, and renewal dates',
  },
  {
    id: 'plans',
    label: 'Plans & Pricing',
    href: '/super-admin/plans',
    icon: Layers,
    badge: 'Phase 3',
    badgeVariant: 'neutral',
    status: 'upcoming',
    description: 'Manage SaaS tiers, feature limits, and business pricing',
  },
  {
    id: 'domains',
    label: 'Domains',
    href: '/super-admin/domains',
    icon: Globe,
    badge: 'Phase 3',
    badgeVariant: 'neutral',
    status: 'upcoming',
    description: 'Subdomain allocations and custom domain mapping requests',
  },
  {
    id: 'users',
    label: 'Platform Users',
    href: '/super-admin/users',
    icon: Users,
    status: 'active',
    description: 'Global identities, multi-tenant memberships, and platform roles',
  },
  {
    id: 'support',
    label: 'Support Center',
    href: '/super-admin/support',
    icon: Headphones,
    status: 'active',
    description: 'Tenant inquiries, support tickets, and urgent resolutions',
  },
  {
    id: 'verification',
    label: 'Verification',
    href: '/super-admin/verification',
    icon: ShieldCheck,
    badge: 'Phase 3',
    badgeVariant: 'neutral',
    status: 'upcoming',
    description: 'National ID, trade license, and mess manager verifications',
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    href: '/super-admin/analytics',
    icon: BarChart3,
    status: 'active',
    description: 'In-depth growth metrics, retention, and platform usage reports',
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    href: '/super-admin/audit-logs',
    icon: History,
    status: 'active',
    description: 'Immutable platform audit trail and security compliance records',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/super-admin/settings',
    icon: Settings,
    badge: 'Phase 3',
    badgeVariant: 'neutral',
    status: 'upcoming',
    description: 'Platform parameters, maintenance switches, and security policies',
  },
];
