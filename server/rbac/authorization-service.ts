if (typeof window !== 'undefined') {
  throw new Error('AuthorizationService can only be executed in a server environment.');
}
import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import type { PermissionKey } from './permissions';
import {
  TenantAccessDeniedError,
  InactiveMembershipError,
  ForbiddenError,
} from './errors';

export interface VerifiedTenantAccess {
  userId: string;
  tenantId: string;
  membershipId: string;
  roleId: string;
  roleName: string;
  roleSlug: string;
  isOwner: boolean;
  permissions: Set<string>;
}

export type DatabaseClient = Pick<
  PrismaClient,
  'membership' | 'role' | 'permission' | 'rolePermission'
>;

/**
 * Server-Side RBAC Authorization Service
 *
 * Implements strict, server-verified capability authorization for MessMate.
 * Adheres to secure default-deny principles: any missing user, tenant, membership,
 * or permission context immediately denies access.
 */
export class AuthorizationService {
  private readonly db: DatabaseClient;

  constructor(customDb?: DatabaseClient) {
    this.db = customDb ?? (defaultPrisma as unknown as DatabaseClient);
  }

  /**
   * Retrieves the user's membership in the target tenant, including its assigned role
   * and granted permissions.
   *
   * @param userId - Global user identity ID
   * @param tenantId - Target mess / tenant ID
   * @param strictActive - If true, throws InactiveMembershipError when status !== ACTIVE
   */
  async getUserMembership(userId: string, tenantId: string, strictActive = false) {
    if (!userId || !tenantId) {
      return null;
    }

    const membership = await this.db.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return null;
    }

    if (strictActive && membership.status !== 'ACTIVE') {
      throw new InactiveMembershipError(
        membership.status,
        `Membership in this mess is currently ${membership.status.toLowerCase()}. Access denied.`
      );
    }

    return membership;
  }

  /**
   * Retrieves the role assigned to a user within a specific tenant.
   */
  async getUserRole(userId: string, tenantId: string) {
    const membership = await this.getUserMembership(userId, tenantId);
    if (!membership || membership.status !== 'ACTIVE') {
      return null;
    }
    return membership.role;
  }

  /**
   * Retrieves the full set of permission keys granted to a user within a specific tenant.
   * Returns an empty Set if the user has no active membership.
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<Set<string>> {
    const membership = await this.getUserMembership(userId, tenantId);
    if (!membership || membership.status !== 'ACTIVE' || !membership.role) {
      return new Set();
    }

    const keys = membership.role.rolePermissions.map((rp) => rp.permission.key);
    return new Set(keys);
  }

  /**
   * Checks whether the user has a specific granular permission in the tenant.
   * Secure Default-Deny: returns false if any parameter is missing or unauthorized.
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    permission: PermissionKey
  ): Promise<boolean> {
    if (!userId || !tenantId || !permission) {
      return false;
    }

    try {
      const membership = await this.getUserMembership(userId, tenantId, true);
      if (!membership || !membership.role) {
        return false;
      }

      // Check if granted permission keys include the requested key
      return membership.role.rolePermissions.some(
        (rp) => rp.permission.key === permission
      );
    } catch {
      return false;
    }
  }

  /**
   * Checks whether the user has AT LEAST ONE of the specified permissions.
   */
  async hasAnyPermission(
    userId: string,
    tenantId: string,
    permissions: PermissionKey[]
  ): Promise<boolean> {
    if (!userId || !tenantId || !permissions.length) {
      return false;
    }

    try {
      const membership = await this.getUserMembership(userId, tenantId, true);
      if (!membership || !membership.role) {
        return false;
      }

      const grantedKeys = new Set(
        membership.role.rolePermissions.map((rp) => rp.permission.key)
      );

      return permissions.some((perm) => grantedKeys.has(perm));
    } catch {
      return false;
    }
  }

  /**
   * Checks whether the user has ALL of the specified permissions.
   */
  async hasAllPermissions(
    userId: string,
    tenantId: string,
    permissions: PermissionKey[]
  ): Promise<boolean> {
    if (!userId || !tenantId || !permissions.length) {
      return false;
    }

    try {
      const membership = await this.getUserMembership(userId, tenantId, true);
      if (!membership || !membership.role) {
        return false;
      }

      const grantedKeys = new Set(
        membership.role.rolePermissions.map((rp) => rp.permission.key)
      );

      return permissions.every((perm) => grantedKeys.has(perm));
    } catch {
      return false;
    }
  }

  /**
   * Enforces that a user has a specific permission.
   * Throws TenantAccessDeniedError, InactiveMembershipError, or ForbiddenError.
   */
  async requirePermission(
    userId: string,
    tenantId: string,
    permission: PermissionKey
  ): Promise<VerifiedTenantAccess> {
    const access = await this.resolveTenantAccess(userId, tenantId);

    if (!access.permissions.has(permission)) {
      throw new ForbiddenError(
        `Action requires permission: '${permission}'. Access denied.`,
        permission
      );
    }

    return access;
  }

  /**
   * Enforces that a user has AT LEAST ONE of the specified permissions.
   */
  async requireAnyPermission(
    userId: string,
    tenantId: string,
    permissions: PermissionKey[]
  ): Promise<VerifiedTenantAccess> {
    const access = await this.resolveTenantAccess(userId, tenantId);

    const hasAny = permissions.some((p) => access.permissions.has(p));
    if (!hasAny) {
      throw new ForbiddenError(
        `Action requires at least one of: [${permissions.join(', ')}]. Access denied.`
      );
    }

    return access;
  }

  /**
   * Enforces that a user has ALL of the specified permissions.
   */
  async requireAllPermissions(
    userId: string,
    tenantId: string,
    permissions: PermissionKey[]
  ): Promise<VerifiedTenantAccess> {
    const access = await this.resolveTenantAccess(userId, tenantId);

    const hasAll = permissions.every((p) => access.permissions.has(p));
    if (!hasAll) {
      throw new ForbiddenError(
        `Action requires all of the following permissions: [${permissions.join(', ')}]. Access denied.`
      );
    }

    return access;
  }

  /**
   * Resolves, validates, and returns the complete VerifiedTenantAccess context for an actor.
   * Validates:
   * 1. User has a membership record in target tenant.
   * 2. Membership status is strictly ACTIVE.
   * 3. Tenant ID matches without cross-tenant ambiguity.
   */
  async resolveTenantAccess(
    userId: string,
    tenantId: string
  ): Promise<VerifiedTenantAccess> {
    if (!userId || !tenantId) {
      throw new TenantAccessDeniedError('Both userId and tenantId are required.');
    }

    const membership = await this.getUserMembership(userId, tenantId, true);

    if (!membership) {
      throw new TenantAccessDeniedError(
        'You do not have an active membership in this mess.'
      );
    }

    if (membership.tenantId !== tenantId) {
      throw new TenantAccessDeniedError('Membership tenant verification mismatch.');
    }

    const role = membership.role;
    if (!role) {
      throw new ForbiddenError('No role assigned to this membership.');
    }

    const permissionSet = new Set<string>(
      role.rolePermissions.map((rp) => rp.permission.key)
    );

    return {
      userId,
      tenantId,
      membershipId: membership.id,
      roleId: role.id,
      roleName: role.name,
      roleSlug: role.slug,
      isOwner: role.slug === 'owner',
      permissions: permissionSet,
    };
  }
}

// Export default singleton instance
export const authService = new AuthorizationService();
