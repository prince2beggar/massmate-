/**
 * MessMate — Multi-Tenant Database TypeScript Definitions
 *
 * Re-exports core Prisma generated types, enums, and composite domain interfaces
 * for clean, consistent typing across the application.
 */

import type {
  User as PrismaUser,
  Tenant as PrismaTenant,
  Role as PrismaRole,
  RoleTemplate as PrismaRoleTemplate,
  Permission as PrismaPermission,
  RolePermission as PrismaRolePermission,
  RoleTemplatePermission as PrismaRoleTemplatePermission,
  Membership as PrismaMembership,
  AuditLog as PrismaAuditLog,
  TenantVerification as PrismaTenantVerification,
  Plan as PrismaPlan,
  Subscription as PrismaSubscription,
  SubscriptionInvoice as PrismaSubscriptionInvoice,
  CustomPlanInquiry as PrismaCustomPlanInquiry,
  CustomQuotation as PrismaCustomQuotation,
  Domain as PrismaDomain,
  SupportTicket as PrismaSupportTicket,
  SupportTicketMessage as PrismaSupportTicketMessage,
  PlatformNotification as PrismaPlatformNotification,
  Room as PrismaRoom,
  Bed as PrismaBed,
  RoomAssignment as PrismaRoomAssignment,
  RentalListing as PrismaRentalListing,
  BookingRequest as PrismaBookingRequest,
  MealSetting as PrismaMealSetting,
  MealDailyLog as PrismaMealDailyLog,
  MemberMealEntry as PrismaMemberMealEntry,
  MealOffRequest as PrismaMealOffRequest,
  GuestMeal as PrismaGuestMeal,
  MealPeriodLock as PrismaMealPeriodLock,
  ExpenseCategory as PrismaExpenseCategory,
  Expense as PrismaExpense,
  ExpenseItem as PrismaExpenseItem,
  BazarSchedule as PrismaBazarSchedule,
  FinancialCategory as PrismaFinancialCategory,
  MonthlyBillingPeriod as PrismaMonthlyBillingPeriod,
  MemberBill as PrismaMemberBill,
  BillItem as PrismaBillItem,
  MemberPayment as PrismaMemberPayment,
  BalanceAdjustment as PrismaBalanceAdjustment,
  MessSetting as PrismaMessSetting,
  Notice as PrismaNotice,
  AllocationRule,
  BillingPeriodStatus,
  BillStatus,
  MemberPaymentStatus,
  AdjustmentType,
  RoomStatus,
  BedStatus,
  AssignmentStatus,
  RentalListingStatus,
  BookingStatus,
  BookingPaymentStatus,
  MealSystemType,
  MealType,
  MealOffStatus,
  GuestMealChargeType,
  ExpenseStatus,
  BazarScheduleStatus,
  UserStatus,
  TenantType,
  TenantStatus,
  MembershipStatus,
  RoleStatus,
  PlatformRole,
  VerificationStatus,
  VerificationDocumentType,
  PlanType,
  PlanStatus,
  BillingInterval,
  SubscriptionStatus,
  TrialStatus,
  PaymentStatus,
  PaymentMethod,
  InquiryStatus,
  QuotationStatus,
  DomainType,
  DomainVerificationStatus,
  DnsStatus,
  SslStatus,
  DomainStatus,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
  NotificationType,
  Prisma,
} from '@/generated/prisma/client';

// Re-export Enums
export type {
  UserStatus,
  TenantType,
  TenantStatus,
  MembershipStatus,
  RoleStatus,
  PlatformRole,
  VerificationStatus,
  VerificationDocumentType,
  PlanType,
  PlanStatus,
  BillingInterval,
  SubscriptionStatus,
  TrialStatus,
  PaymentStatus,
  PaymentMethod,
  InquiryStatus,
  QuotationStatus,
  DomainType,
  DomainVerificationStatus,
  DnsStatus,
  SslStatus,
  DomainStatus,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
  NotificationType,
  RoomStatus,
  BedStatus,
  AssignmentStatus,
  RentalListingStatus,
  BookingStatus,
  BookingPaymentStatus,
  MealSystemType,
  MealType,
  MealOffStatus,
  GuestMealChargeType,
  ExpenseStatus,
  BazarScheduleStatus,
  AllocationRule,
  BillingPeriodStatus,
  BillStatus,
  MemberPaymentStatus,
  AdjustmentType,
};

// Re-export Base Models
export type User = PrismaUser;
export type Tenant = PrismaTenant;
export type Role = PrismaRole;
export type RoleTemplate = PrismaRoleTemplate;
export type Permission = PrismaPermission;
export type RolePermission = PrismaRolePermission;
export type RoleTemplatePermission = PrismaRoleTemplatePermission;
export type Membership = PrismaMembership;
export type AuditLog = PrismaAuditLog;
export type TenantVerification = PrismaTenantVerification;
export type Plan = PrismaPlan;
export type Subscription = PrismaSubscription;
export type SubscriptionInvoice = PrismaSubscriptionInvoice;
export type Room = PrismaRoom;
export type Bed = PrismaBed;
export type RoomAssignment = PrismaRoomAssignment;
export type RentalListing = PrismaRentalListing;
export type BookingRequest = PrismaBookingRequest;
export type MealSetting = PrismaMealSetting;
export type MealDailyLog = PrismaMealDailyLog;
export type MemberMealEntry = PrismaMemberMealEntry;
export type MealOffRequest = PrismaMealOffRequest;
export type GuestMeal = PrismaGuestMeal;
export type MealPeriodLock = PrismaMealPeriodLock;
export type ExpenseCategory = PrismaExpenseCategory;
export type Expense = PrismaExpense;
export type ExpenseItem = PrismaExpenseItem;
export type BazarSchedule = PrismaBazarSchedule;
export type FinancialCategory = PrismaFinancialCategory;
export type MonthlyBillingPeriod = PrismaMonthlyBillingPeriod;
export type MemberBill = PrismaMemberBill;
export type BillItem = PrismaBillItem;
export type MemberPayment = PrismaMemberPayment;
export type BalanceAdjustment = PrismaBalanceAdjustment;
export type MessSetting = PrismaMessSetting;
export type Notice = PrismaNotice;
export type CustomPlanInquiry = PrismaCustomPlanInquiry;
export type CustomQuotation = PrismaCustomQuotation;
export type Domain = PrismaDomain;
export type SupportTicket = PrismaSupportTicket;
export type SupportTicketMessage = PrismaSupportTicketMessage;
export type PlatformNotification = PrismaPlatformNotification;

// -----------------------------------------------------------------------------
// COMPOSITE & RELATIONAL TYPES
// -----------------------------------------------------------------------------

/**
 * Role with attached permissions
 */
export type RoleWithPermissions = Role & {
  rolePermissions: Array<
    RolePermission & {
      permission: Permission;
    }
  >;
};

/**
 * System Role Template with blueprint permissions
 */
export type RoleTemplateWithPermissions = RoleTemplate & {
  permissions: Array<
    RoleTemplatePermission & {
      permission: Permission;
    }
  >;
};

/**
 * Membership with full User, Tenant, and Role details
 */
export type MembershipWithDetails = Membership & {
  user: User;
  tenant: Tenant;
  role: RoleWithPermissions;
};

/**
 * User with all their multi-tenant memberships
 */
export type UserWithMemberships = User & {
  memberships: Array<
    Membership & {
      tenant: Tenant;
      role: Role;
    }
  >;
};

/**
 * Tenant with its active roles and member count
 */
export type TenantWithRoles = Tenant & {
  roles: Role[];
  _count?: {
    memberships: number;
    roles: number;
  };
};

/**
 * Multi-Tenant Request Context (for future server-side session/authorization)
 */
export interface TenantContext {
  tenantId: string;
  userId: string;
  membershipId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

// Re-export RBAC Authorization Types
export type {
  PermissionKey,
  PermissionModule,
  PermissionDefinition,
} from '@/server/rbac/permissions';
export type {
  SystemRoleSlug,
  SystemRoleTemplateDefinition,
} from '@/server/rbac/role-templates';
export type { VerifiedTenantAccess } from '@/server/rbac/authorization-service';

export type { Prisma };
