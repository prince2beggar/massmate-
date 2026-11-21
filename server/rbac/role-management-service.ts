if (typeof window !== 'undefined') {
  throw new Error('RoleManagementService can only be executed in a server environment.');
}
import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { AuthorizationService } from './authorization-service';
import {
  isValidPermissionKey,
  type PermissionKey,
} from './permissions';
import {
  ForbiddenError,
  PrivilegeEscalationError,
  OwnerProtectionError,
  CrossTenantError,
} from './errors';

export interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  permissionKeys: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionKeys?: string[];
}

export type RoleManagementDbClient = Pick<
  PrismaClient,
  'membership' | 'role' | 'permission' | 'rolePermission'
>;

/**
 * Server-Side Role Management Service
 *
 * Enforces critical security invariants:
 * - Anti-Privilege Escalation: Administrators cannot grant permissions they lack.
 * - Anti-Self-Promotion: Members cannot alter their own roles or privileges.
 * - Owner Protection: The sole active Owner of a mess can never be demoted or removed.
 * - Cross-Tenant Shield: Roles from one tenant cannot be assigned in another.
 * - System Role Guard: Default system roles cannot be destructively renamed.
 */
export class RoleManagementService {
  private readonly db: RoleManagementDbClient;
  private readonly auth: AuthorizationService;

  constructor(customDb?: RoleManagementDbClient, customAuth?: AuthorizationService) {
    this.db = customDb ?? (defaultPrisma as unknown as RoleManagementDbClient);
    this.auth = customAuth ?? new AuthorizationService(this.db);
  }

  /**
   * Creates a new custom role scoped strictly to the specified tenant.
   */
  async createTenantRole(actorUserId: string, tenantId: string, input: CreateRoleInput) {
    // 1. Authorize: Actor must hold roles.manage in this tenant
    const actorAccess = await this.auth.requirePermission(
      actorUserId,
      tenantId,
      'roles.manage'
    );

    // 2. Validate input strings
    const name = input.name?.trim();
    const slug = input.slug?.trim().toLowerCase();

    if (!name || !slug) {
      throw new ForbiddenError('Role name and slug are required.');
    }

    // 3. Validate permissions against catalog and verify no privilege escalation
    this.validatePermissionKeys(input.permissionKeys);

    if (!actorAccess.isOwner) {
      this.ensureNoPrivilegeEscalation(actorAccess.permissions, input.permissionKeys);
    }

    // 4. Check for duplicate name or slug within this tenant
    const existingRole = await this.db.role.findFirst({
      where: {
        tenantId,
        OR: [{ name }, { slug }],
      },
    });

    if (existingRole) {
      throw new ForbiddenError(
        `A role with the name "${name}" or slug "${slug}" already exists in this mess.`
      );
    }

    // 5. Look up permission records in database
    const dbPermissions = await this.db.permission.findMany({
      where: {
        key: { in: input.permissionKeys },
      },
    });

    // 6. Create the tenant-scoped role
    const newRole = await this.db.role.create({
      data: {
        tenantId,
        name,
        slug,
        description: input.description,
        isSystem: false,
        status: 'ACTIVE',
        rolePermissions: {
          create: dbPermissions.map((perm) => ({
            permissionId: perm.id,
          })),
        },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return newRole;
  }

  /**
   * Updates an existing tenant-scoped role.
   */
  async updateTenantRole(
    actorUserId: string,
    tenantId: string,
    roleId: string,
    input: UpdateRoleInput
  ) {
    const actorAccess = await this.auth.requirePermission(
      actorUserId,
      tenantId,
      'roles.manage'
    );

    const targetRole = await this.db.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!targetRole) {
      throw new ForbiddenError('Target role was not found.');
    }

    // Cross-tenant guard
    if (targetRole.tenantId !== tenantId) {
      throw new CrossTenantError('Cannot modify a role belonging to another mess.');
    }

    // System role protection: non-owners cannot modify Owner role
    if (targetRole.slug === 'owner' && !actorAccess.isOwner) {
      throw new ForbiddenError('Only an Owner can modify the Owner role.');
    }

    // System role protection: cannot rename system roles
    if (targetRole.isSystem && input.name && input.name !== targetRole.name) {
      throw new ForbiddenError('System-defined role names cannot be renamed.');
    }

    // Privilege escalation check if permissions are being modified
    if (input.permissionKeys) {
      this.validatePermissionKeys(input.permissionKeys);

      if (!actorAccess.isOwner) {
        this.ensureNoPrivilegeEscalation(actorAccess.permissions, input.permissionKeys);
      }
    }

    // Perform update
    const updated = await this.db.role.update({
      where: { id: roleId },
      data: {
        name: input.name ? input.name.trim() : undefined,
        description: input.description,
        ...(input.permissionKeys
          ? {
              rolePermissions: {
                deleteMany: {},
                create: (
                  await this.db.permission.findMany({
                    where: { key: { in: input.permissionKeys } },
                  })
                ).map((p) => ({ permissionId: p.id })),
              },
            }
          : {}),
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Assigns a role to a membership with comprehensive security checks.
   */
  async assignRoleToMembership(
    actorUserId: string,
    tenantId: string,
    targetMembershipId: string,
    newRoleId: string
  ) {
    // 1. Authorize actor (must have roles.manage or members.manage_status)
    const actorAccess = await this.auth.requireAnyPermission(actorUserId, tenantId, [
      'roles.manage',
      'members.manage_status',
    ]);

    // 2. Retrieve target membership
    const targetMembership = await this.db.membership.findUnique({
      where: { id: targetMembershipId },
      include: {
        role: true,
      },
    });

    if (!targetMembership) {
      throw new ForbiddenError('Target membership not found.');
    }

    // 3. Cross-Tenant Guard on target membership
    if (targetMembership.tenantId !== tenantId) {
      throw new CrossTenantError('Cannot modify a membership from another mess.');
    }

    // 4. Retrieve candidate new role
    const newRole = await this.db.role.findUnique({
      where: { id: newRoleId },
    });

    if (!newRole) {
      throw new ForbiddenError('Target role does not exist.');
    }

    // 5. Cross-Tenant Guard on candidate role
    if (newRole.tenantId !== tenantId) {
      throw new CrossTenantError(
        'Cannot assign a role that belongs to a different mess.'
      );
    }

    // 6. Anti-Self-Promotion: Users cannot change their own role
    if (targetMembership.userId === actorUserId && !actorAccess.isOwner) {
      throw new ForbiddenError('You cannot change or escalate your own role.');
    }

    // 7. Non-owner cannot change an Owner's role
    if (targetMembership.role.slug === 'owner' && !actorAccess.isOwner) {
      throw new ForbiddenError('Only an Owner can modify another Owner’s membership.');
    }

    // 8. Non-owner cannot promote anyone to Owner
    if (newRole.slug === 'owner' && !actorAccess.isOwner) {
      throw new ForbiddenError('Only an Owner can grant the Owner role.');
    }

    // 9. OWNER PROTECTION: Prevent removal/demotion of the sole active Owner
    if (targetMembership.role.slug === 'owner' && newRole.slug !== 'owner') {
      const activeOwnerCount = await this.db.membership.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          role: {
            slug: 'owner',
          },
        },
      });

      if (activeOwnerCount <= 1) {
        throw new OwnerProtectionError();
      }
    }

    // 10. Update membership
    const updatedMembership = await this.db.membership.update({
      where: { id: targetMembershipId },
      data: {
        roleId: newRoleId,
      },
      include: {
        role: true,
      },
    });

    return updatedMembership;
  }

  /**
   * Validates that all permission keys in an array are registered in the catalog.
   */
  private validatePermissionKeys(keys: string[]) {
    for (const key of keys) {
      if (!isValidPermissionKey(key)) {
        throw new ForbiddenError(
          `Invalid or unregistered permission key: '${key}'.`
        );
      }
    }
  }

  /**
   * Verifies that the actor does not grant any permission they do not personally hold.
   */
  private ensureNoPrivilegeEscalation(
    actorPermissions: Set<string>,
    requestedKeys: string[]
  ) {
    for (const key of requestedKeys) {
      if (!actorPermissions.has(key)) {
        throw new PrivilegeEscalationError(
          `Cannot delegate permission '${key}' because you do not hold it.`
        );
      }
    }
  }
}

export const roleManagementService = new RoleManagementService();
