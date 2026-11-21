if (typeof window !== 'undefined') {
  throw new Error('TenantScopedDb can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import type { TenantContext } from './tenant-context';
import { CrossTenantViolationError } from './errors';

export type TenantDbClient = Pick<
  PrismaClient,
  'membership' | 'role' | 'permission' | 'rolePermission' | '$transaction'
>;

/**
 * Tenant-Scoped Database Access Layer
 *
 * Wraps Prisma operations to ensure:
 * 1. All queries are unconditionally constrained by the verified tenantId.
 * 2. Client-submitted tenantId values are completely ignored.
 * 3. Cross-tenant relations (e.g. assigning Tenant B role to Tenant A membership) are blocked.
 * 4. Future modules (Meals, Bazar, Rooms, Finances) plug into this exact isolation pattern.
 */
export class TenantScopedDb {
  public readonly tenantId: string;
  private readonly db: TenantDbClient;

  constructor(tenantContextOrId: TenantContext | string, customDb?: TenantDbClient) {
    this.tenantId =
      typeof tenantContextOrId === 'string'
        ? tenantContextOrId
        : tenantContextOrId.tenantId;

    if (!this.tenantId || typeof this.tenantId !== 'string') {
      throw new CrossTenantViolationError('TenantScopedDb requires a valid, verified tenantId.');
    }

    this.db = customDb ?? (defaultPrisma as unknown as TenantDbClient);
  }

  /**
   * Verified Tenant Memberships Namespace
   */
  get memberships() {
    const tenantId = this.tenantId;
    const membershipClient = this.db.membership;

    return {
      findUnique: async (membershipId: string) => {
        return membershipClient.findFirst({
          where: { id: membershipId, tenantId },
          include: { role: true },
        });
      },

      findMany: async (args?: { status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LEFT'; roleId?: string }) => {
        return membershipClient.findMany({
          where: {
            tenantId,
            ...(args?.status ? { status: args.status } : {}),
            ...(args?.roleId ? { roleId: args.roleId } : {}),
          },
          include: { role: true },
        });
      },

      count: async (args?: { status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LEFT' }) => {
        return membershipClient.count({
          where: {
            tenantId,
            ...(args?.status ? { status: args.status } : {}),
          },
        });
      },
    };
  }

  /**
   * Verified Tenant Roles Namespace
   */
  get roles() {
    const tenantId = this.tenantId;
    const roleClient = this.db.role;

    return {
      findUnique: async (roleId: string) => {
        return roleClient.findFirst({
          where: { id: roleId, tenantId },
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        });
      },

      findMany: async () => {
        return roleClient.findMany({
          where: { tenantId },
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        });
      },
    };
  }

  /**
   * Verifies that a target foreign record (e.g. roleId or membershipId) strictly
   * belongs to this tenant, preventing cross-tenant injection.
   */
  async ensureBelongsToTenant(model: 'roles' | 'memberships', recordId: string): Promise<void> {
    if (model === 'roles') {
      const role = await this.db.role.findFirst({
        where: { id: recordId, tenantId: this.tenantId },
      });
      if (!role) {
        throw new CrossTenantViolationError(
          `Target role "${recordId}" does not belong to authorized mess "${this.tenantId}".`
        );
      }
    } else if (model === 'memberships') {
      const membership = await this.db.membership.findFirst({
        where: { id: recordId, tenantId: this.tenantId },
      });
      if (!membership) {
        throw new CrossTenantViolationError(
          `Target membership "${recordId}" does not belong to authorized mess "${this.tenantId}".`
        );
      }
    }
  }
}

/**
 * Factory helper creating a verified TenantScopedDb from a verified TenantContext or tenantId.
 */
export function createTenantScopedDb(
  tenantContextOrId: TenantContext | string,
  client?: TenantDbClient
): TenantScopedDb {
  return new TenantScopedDb(tenantContextOrId, client);
}
