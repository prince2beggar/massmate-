if (typeof window !== 'undefined') {
  throw new Error('TenantContext service can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import type { PermissionKey } from '@/server/rbac/permissions';
import {
  UnauthenticatedError,
  TenantNotFoundError,
  TenantAccessDeniedError,
  MembershipInactiveError,
  TenantSuspendedError,
  TenantInactiveError,
  PermissionDeniedError,
} from './errors';
import { resolveTenantIdentifier, type TenantResolutionRequest } from './tenant-resolution';

export interface TenantContext {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  tenantStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'INACTIVE';
  membershipId: string;
  membershipStatus: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LEFT';
  roleId: string;
  roleSlug: string;
  roleName: string;
  isOwner: boolean;
  permissions: Set<string>;
}

export interface ResolveTenantContextInput extends TenantResolutionRequest {
  userId?: string | null;
}

export type TenantContextDbClient = Pick<
  PrismaClient,
  'tenant' | 'membership' | 'role' | 'permission'
>;

/**
 * Server-Side Multi-Tenant Context Resolver
 *
 * Implements strict tenant-boundary establishment for every tenant-scoped request:
 * 1. Authenticated user identity (userId).
 * 2. Requested tenant identity (tenantId/slug resolved from route/subdomain/header).
 * 3. Verified active tenant status (rejects suspended or pending messes).
 * 4. Verified active membership status (rejects pending, suspended, or departing members).
 * 5. Strict role alignment (ensures membership role belongs strictly to this tenant).
 * 6. Authorized capability set (Set of granted PermissionKeys).
 */
export class TenantContextService {
  private readonly db: TenantContextDbClient;

  constructor(customDb?: TenantContextDbClient) {
    this.db = customDb ?? (defaultPrisma as unknown as TenantContextDbClient);
  }

  /**
   * Resolves and establishes verified TenantContext for an authenticated user request.
   * Secure Default-Deny: Any validation anomaly throws a typed TenantSecurityError.
   */
  async resolveTenantContext(input: ResolveTenantContextInput): Promise<TenantContext> {
    // 1. Authenticated User Identity Guard
    if (!input.userId || typeof input.userId !== 'string' || !input.userId.trim()) {
      throw new UnauthenticatedError();
    }
    const userId = input.userId.trim();

    // 2. Tenant Identifier Resolution
    const identifier = resolveTenantIdentifier(input);
    if (!identifier) {
      throw new TenantNotFoundError('No valid mess identifier could be resolved from request.');
    }

    // 3. Database Tenant Verification (Lookup by Slug or ID)
    const tenant = await this.db.tenant.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });

    if (!tenant) {
      throw new TenantNotFoundError();
    }

    // 4. Tenant Lifecycle State Verification
    if (tenant.status === 'SUSPENDED') {
      throw new TenantSuspendedError();
    }
    if (tenant.status !== 'ACTIVE') {
      throw new TenantInactiveError(tenant.status);
    }

    // 5. Membership Verification (Direct (userId, tenantId) Lookup)
    const membership = await this.db.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: tenant.id,
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
      throw new TenantAccessDeniedError();
    }

    // 6. Membership Status Verification
    if (membership.status !== 'ACTIVE') {
      throw new MembershipInactiveError(
        membership.status,
        `Your membership in "${tenant.name}" is currently ${membership.status.toLowerCase()}. Access denied.`
      );
    }

    // 7. Role Alignment Guard
    const role = membership.role;
    if (!role || role.tenantId !== tenant.id) {
      throw new TenantAccessDeniedError('Assigned role does not belong to this mess.');
    }

    // 8. Permission Set Assembly
    const permissionSet = new Set<string>(
      role.rolePermissions.map((rp) => rp.permission.key)
    );

    return {
      userId,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      tenantStatus: tenant.status,
      membershipId: membership.id,
      membershipStatus: membership.status,
      roleId: role.id,
      roleSlug: role.slug,
      roleName: role.name,
      isOwner: role.slug === 'owner',
      permissions: permissionSet,
    };
  }

  /**
   * Alias for resolveTenantContext with explicit semantic enforcement.
   */
  async requireTenantContext(input: ResolveTenantContextInput): Promise<TenantContext> {
    return this.resolveTenantContext(input);
  }

  /**
   * Validates that a user holds an active membership in the target tenant.
   */
  async validateTenantMembership(userId: string, tenantId: string): Promise<boolean> {
    if (!userId || !tenantId) return false;
    try {
      const context = await this.resolveTenantContext({ userId, tenantId });
      return context.membershipStatus === 'ACTIVE';
    } catch {
      return false;
    }
  }

  /**
   * Enforces that the request has an active tenant context and holds the required permission.
   */
  async requireTenantPermission(
    contextOrInput: TenantContext | ResolveTenantContextInput,
    permission: PermissionKey
  ): Promise<TenantContext> {
    const context =
      'permissions' in contextOrInput && contextOrInput.permissions instanceof Set
        ? (contextOrInput as TenantContext)
        : await this.resolveTenantContext(contextOrInput as ResolveTenantContextInput);

    if (!context.permissions.has(permission)) {
      throw new PermissionDeniedError(
        `Action requires '${permission}' in ${context.tenantName}. Access denied.`,
        permission
      );
    }

    return context;
  }
}

export const tenantContextService = new TenantContextService();
