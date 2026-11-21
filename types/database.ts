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
  UserStatus,
  TenantType,
  TenantStatus,
  MembershipStatus,
  RoleStatus,
  Prisma,
} from '@/generated/prisma/client';

// Re-export Enums
export type {
  UserStatus,
  TenantType,
  TenantStatus,
  MembershipStatus,
  RoleStatus,
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
