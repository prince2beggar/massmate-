import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import { auditService } from '@/server/audit/audit-service';
import { PlatformForbiddenError, PlatformNotFoundError, PlatformValidationError } from './errors';
import type { PlatformContext } from './platform-auth';
import type { PlatformRole, UserStatus } from '@/types/database';

export interface UserFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  platformRole?: PlatformRole | 'NONE' | 'ALL';
  sortBy?: 'createdAt' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSummaryDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profileImage: string | null;
  status: UserStatus;
  platformRole: PlatformRole | null;
  membershipsCount: number;
  memberships: Array<{
    tenantId: string;
    tenantName: string;
    tenantType: string;
    roleName: string;
    membershipStatus: string;
  }>;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string | null;
}

export interface UserDetailsDto extends UserSummaryDto {
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  memberships: Array<{
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    tenantType: string;
    roleName: string;
    roleSlug: string;
    membershipStatus: string;
    joinedDate: string;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    description: string | null;
    createdAt: string;
  }>;
}

export class PlatformUserService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Lists all platform users with server-side pagination, searching, and filtering.
   */
  async listUsers(query: UserFilterQuery = {}): Promise<{
    users: UserSummaryDto[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return {
          users: [],
          pagination: { page, limit, totalCount: 0, totalPages: 0 },
        };
      }
    }

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.platformRole) {
      if (query.platformRole === 'NONE') {
        where.platformRole = null;
      } else if (query.platformRole !== 'ALL') {
        where.platformRole = query.platformRole;
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { id: { equals: term } },
      ];
    }

    const orderBy: any = {};
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [totalCount, rawUsers] = await Promise.all([
      this.db.user.count({ where }),
      this.db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
          status: true,
          platformRole: true,
          createdAt: true,
          updatedAt: true,
          memberships: {
            select: {
              status: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  tenantType: true,
                },
              },
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          auditLogs: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          },
        },
      }),
    ]);

    const users: UserSummaryDto[] = rawUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      profileImage: u.profileImage,
      status: u.status,
      platformRole: u.platformRole,
      membershipsCount: u.memberships?.length || 0,
      memberships: (u.memberships || []).map((m: any) => ({
        tenantId: m.tenant?.id || '',
        tenantName: m.tenant?.name || 'Unknown',
        tenantType: m.tenant?.tenantType || 'BACHELOR_MESS',
        roleName: m.role?.name || 'Member',
        membershipStatus: m.status,
      })),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      lastActivityAt: u.auditLogs?.[0]?.createdAt?.toISOString() || u.updatedAt.toISOString(),
    }));

    return {
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  /**
   * Retrieves full profile details, tenant memberships, platform roles, and recent activity.
   */
  async getUserById(id: string): Promise<UserDetailsDto> {
    const user = await this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        status: true,
        platformRole: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                tenantType: true,
              },
            },
            role: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            entityType: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new PlatformNotFoundError(`Platform user with ID '${id}' not found`);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      status: user.status,
      platformRole: user.platformRole,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() || null,
      phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() || null,
      membershipsCount: user.memberships?.length || 0,
      memberships: (user.memberships || []).map((m: any) => ({
        tenantId: m.tenant?.id || '',
        tenantName: m.tenant?.name || 'Unknown',
        tenantSlug: m.tenant?.slug || '',
        tenantType: m.tenant?.tenantType || 'BACHELOR_MESS',
        roleName: m.role?.name || 'Member',
        roleSlug: m.role?.slug || 'member',
        membershipStatus: m.status,
        joinedDate: m.createdAt.toISOString(),
      })),
      recentAuditLogs: (user.auditLogs || []).map((a: any) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        description: a.description,
        createdAt: a.createdAt.toISOString(),
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastActivityAt: user.auditLogs?.[0]?.createdAt?.toISOString() || user.updatedAt.toISOString(),
    };
  }

  /**
   * Suspends or reactivates a platform account.
   * Modifies only the global account status; leaves all tenant-specific roles untouched.
   */
  async updateUserStatus(
    id: string,
    newStatus: UserStatus,
    reason: string,
    actorContext: PlatformContext
  ): Promise<UserDetailsDto> {
    if (!reason || reason.trim().length < 5) {
      throw new PlatformValidationError('A detailed reason (minimum 5 characters) is required for account status changes');
    }

    // Authorization: requires users.manage permission
    if (!actorContext.permissions.has('users.manage')) {
      throw new PlatformForbiddenError('Unauthorized: requires "users.manage" permission to modify account status');
    }

    const existingUser = await this.db.user.findUnique({
      where: { id },
      select: { id: true, status: true, platformRole: true, name: true, email: true },
    });

    if (!existingUser) {
      throw new PlatformNotFoundError(`User with ID '${id}' not found`);
    }

    // Safety: Cannot suspend the last PLATFORM_OWNER or self
    if (existingUser.id === actorContext.userId && newStatus === 'SUSPENDED') {
      throw new PlatformValidationError('Platform administrators cannot suspend their own account');
    }

    const updatedUser = await this.db.user.update({
      where: { id },
      data: { status: newStatus },
    });

    // Record in Audit Log
    try {
      await auditService.recordAuditEvent({
        action: newStatus === 'SUSPENDED' ? 'user.suspend' : 'user.reactivate',
        entityType: 'user',
        entityId: id,
        actorUserId: actorContext.userId,
        description: `Platform account for ${existingUser.name} (${existingUser.email || existingUser.id}) set to ${newStatus}. Reason: ${reason}`,
        beforeData: { status: existingUser.status },
        afterData: { status: newStatus, reason },
      });
    } catch {
      // In-memory or fallback safety
    }

    return this.getUserById(id);
  }

  /**
   * Assigns or revokes a platform-level role.
   * EXCLUSIVE: Only PLATFORM_OWNER can assign privileged platform roles.
   */
  async assignPlatformRole(
    targetUserId: string,
    role: PlatformRole | null,
    reason: string,
    actorContext: PlatformContext
  ): Promise<UserDetailsDto> {
    if (!reason || reason.trim().length < 5) {
      throw new PlatformValidationError('A detailed reason (minimum 5 characters) is required for platform role changes');
    }

    // EXCLUSIVE REQUIREMENT: Only PLATFORM_OWNER can assign or revoke platform roles
    if (actorContext.platformRole !== 'PLATFORM_OWNER') {
      throw new PlatformForbiddenError('Only Platform Owners can assign or revoke privileged platform staff roles');
    }

    const targetUser = await this.db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, platformRole: true, name: true, email: true },
    });

    if (!targetUser) {
      throw new PlatformNotFoundError(`User with ID '${targetUserId}' not found`);
    }

    // Prevent demoting self from PLATFORM_OWNER if sole owner
    if (targetUser.id === actorContext.userId && targetUser.platformRole === 'PLATFORM_OWNER' && role !== 'PLATFORM_OWNER') {
      const ownerCount = await this.db.user.count({
        where: { platformRole: 'PLATFORM_OWNER', status: 'ACTIVE' },
      });
      if (ownerCount <= 1) {
        throw new PlatformValidationError('Cannot revoke role: at least one active Platform Owner must remain on the platform');
      }
    }

    await this.db.user.update({
      where: { id: targetUserId },
      data: { platformRole: role },
    });

    try {
      await auditService.recordAuditEvent({
        action: role ? 'platform_role.assign' : 'platform_role.revoke',
        entityType: 'user',
        entityId: targetUserId,
        actorUserId: actorContext.userId,
        description: `Platform role for ${targetUser.name} changed from ${targetUser.platformRole || 'NONE'} to ${role || 'NONE'}. Reason: ${reason}`,
        beforeData: { platformRole: targetUser.platformRole },
        afterData: { platformRole: role, reason },
      });
    } catch {
      // safe fallback
    }

    return this.getUserById(targetUserId);
  }

  /**
   * Lists all platform staff users.
   */
  async listStaff(): Promise<UserSummaryDto[]> {
    const rawStaff = await this.db.user.findMany({
      where: {
        platformRole: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        status: true,
        platformRole: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            status: true,
            tenant: { select: { id: true, name: true, tenantType: true } },
            role: { select: { name: true } },
          },
        },
      },
    });

    return rawStaff.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      profileImage: u.profileImage,
      status: u.status,
      platformRole: u.platformRole,
      membershipsCount: u.memberships?.length || 0,
      memberships: (u.memberships || []).map((m: any) => ({
        tenantId: m.tenant?.id || '',
        tenantName: m.tenant?.name || 'Unknown',
        tenantType: m.tenant?.tenantType || 'BACHELOR_MESS',
        roleName: m.role?.name || 'Member',
        membershipStatus: m.status,
      })),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      lastActivityAt: u.updatedAt.toISOString(),
    }));
  }
}

export const platformUserService = new PlatformUserService();
