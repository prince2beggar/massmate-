/**
 * MessMate — Subscription, Plan & Entitlement Constants
 *
 * Defines canonical plan feature keys, starter plan specifications,
 * safety invariants, and default business rules.
 */

export type PlanFeatureKey =
  | 'mess_website'
  | 'member_management'
  | 'meal_management'
  | 'bazar_management'
  | 'finance_management'
  | 'room_management'
  | 'room_rental'
  | 'community'
  | 'reports'
  | 'custom_branding'
  | 'custom_domain'
  | 'multiple_properties'
  | 'advanced_analytics';

export interface PlanFeatureDefinition {
  key: PlanFeatureKey;
  name: string;
  category: 'core' | 'operations' | 'finance' | 'customization' | 'enterprise';
  description: string;
}

export const PLAN_FEATURE_CATALOG: readonly PlanFeatureDefinition[] = [
  {
    key: 'mess_website',
    name: 'Mess Public Website',
    category: 'core',
    description: 'Public mess listing page with seat availability and details.',
  },
  {
    key: 'member_management',
    name: 'Member Management',
    category: 'core',
    description: 'Resident roster, invitations, role assignments, and check-ins.',
  },
  {
    key: 'meal_management',
    name: 'Meal Management',
    category: 'operations',
    description: 'Daily breakfast, lunch, and dinner meal count tracking and schedules.',
  },
  {
    key: 'bazar_management',
    name: 'Bazar Management',
    category: 'operations',
    description: 'Daily grocery shopping logs, assignee rotations, and expense receipts.',
  },
  {
    key: 'finance_management',
    name: 'Finance & Accounts',
    category: 'finance',
    description: 'Shared mess treasury, member deposits, meal rates, and month-end settlement.',
  },
  {
    key: 'room_management',
    name: 'Room & Bed Management',
    category: 'operations',
    description: 'Room inventories, bed allocations, and occupant tracking.',
  },
  {
    key: 'room_rental',
    name: 'Room Rental Listings',
    category: 'operations',
    description: 'Public vacancy listings and tenant applications for prospective boarders.',
  },
  {
    key: 'community',
    name: 'Community & Notice Board',
    category: 'core',
    description: 'Internal announcements, house rules, emergency notices, and polls.',
  },
  {
    key: 'reports',
    name: 'Monthly Reports',
    category: 'finance',
    description: 'Exportable monthly ledger, individual balance sheets, and meal math summaries.',
  },
  {
    key: 'custom_branding',
    name: 'Custom Branding',
    category: 'customization',
    description: 'Organization logo, custom theme colors, and custom cover banners.',
  },
  {
    key: 'custom_domain',
    name: 'Custom Domain Support',
    category: 'customization',
    description: 'Mount mess portal on a proprietary domain name.',
  },
  {
    key: 'multiple_properties',
    name: 'Multiple Properties',
    category: 'enterprise',
    description: 'Unified oversight across multiple messes, hostels, or apartment floors.',
  },
  {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    category: 'enterprise',
    description: 'Historical grocery inflation trends, meal count trends, and occupancy projections.',
  },
] as const;

/**
 * Universal platform features that are ALWAYS allowed regardless of plan tier.
 * Safety and emergency info must NEVER be paywalled.
 */
export const ALWAYS_ALLOWED_FEATURES: readonly string[] = [
  'emergency_contacts',
  'safety_info',
  'security_compliance',
  'account_profile',
  'legal_terms',
] as const;

/**
 * Standard Starter Plan Specifications (Matches Public Pricing)
 */
export const STARTER_PLAN_DEFAULTS = {
  name: 'Starter',
  slug: 'starter',
  description: 'Everything you need to organize a single mess with clarity, transparent meal math, and simple monthly reporting.',
  planType: 'STARTER' as const,
  priceMonthly: 99.0, // ৳99 / month
  currency: 'BDT',
  billingInterval: 'MONTHLY' as const,
  trialEligible: true,
  trialDays: 7,
  entitlements: [
    'mess_website',
    'member_management',
    'meal_management',
    'bazar_management',
    'finance_management',
    'room_management',
    'community',
    'reports',
  ] as PlanFeatureKey[],
  limits: {
    maxMembers: 50,
    maxProperties: 1,
    maxRooms: 15,
  },
};

/**
 * Custom Business Template Specifications
 */
export const CUSTOM_BUSINESS_TEMPLATE_DEFAULTS = {
  name: 'Customized Business Plan',
  slug: 'custom-business',
  description: 'Designed for businesses managing multiple messes, hostels, boarding houses, co-living communities, or accommodation properties.',
  planType: 'CUSTOM_BUSINESS' as const,
  priceMonthly: 0.0, // Negotiated custom pricing
  currency: 'BDT',
  billingInterval: 'MONTHLY' as const,
  trialEligible: false,
  trialDays: 0,
  entitlements: PLAN_FEATURE_CATALOG.map((f) => f.key),
  limits: {
    maxMembers: 500,
    maxProperties: 10,
    maxRooms: 100,
  },
};

export const BUSINESS_TIMEZONE = 'Asia/Dhaka';
