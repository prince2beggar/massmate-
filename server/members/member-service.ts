if (typeof window !== 'undefined') {
  throw new Error('MemberService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { auditService } from '@/server/audit/audit-service';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '@/server/api/errors';
import type { MembershipStatus, UserStatus } from '@/types/database';

export interface MemberListOptions {
  search?: string;
  status?: string; // 'ALL' | MembershipStatus
  roleId?: string;
  sortBy?: 'name' | 'joinedAt' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateMemberInput {
  name: string;
  phone: string;
  email?: string | null;
  roleId: string;
  status?: MembershipStatus;
  memberCode?: string | null;
  joinedAt?: string | Date | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
}

export interface UpdateMemberInput {
  name?: string;
  phone?: string;
  email?: string | null;
  memberCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
}

export interface MemberDto {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  profileImage: string | null;
  status: MembershipStatus;
  roleId: string;
  roleName: string;
  roleSlug: string;
  memberCode: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
  joinedAt: string | null;
  invitedAt: string | null;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberDetailDto extends MemberDto {
  roomAssignment: {
    isAssigned: boolean;
    roomNumber?: string;
    bedNumber?: string;
    note: string;
  };
  mealSummary: {
    totalThisMonth: number;
    systemStatus: string;
    note: string;
  };
  financialSummary?: {
    totalBilled: string;
    confirmedPayments: string;
    outstandingBalance: string;
    isRestricted: boolean;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    description: string;
    actorName: string;
    createdAt: string;
  }>;
}

export type MemberDbClient = Pick<
  PrismaClient,
  'tenant' | 'user' | 'membership' | 'role' | 'subscriptionInvoice' | 'auditLog'
>;

export class MemberService {
  private readonly db: MemberDbClient;

  constructor(customDb?: MemberDbClient) {
    this.db = customDb ?? (defaultPrisma as unknown as MemberDbClient);
  }

  /**
   * Lists members for a tenant with search, filtering, and pagination.
   */
  async listMembers(tenantId: string, options: MemberListOptions = {}) {
    if (!tenantId) {
      throw new ValidationError('tenantId is required');
    }

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const search = options.search?.trim().toLowerCase();
    const statusFilter =
      options.status && options.status !== 'ALL'
        ? (options.status as MembershipStatus)
        : undefined;

    // 1. Fetch total counts by status in this tenant
    const [totalCount, activeCount, pendingCount, suspendedCount, leftCount] =
      await Promise.all([
        this.db.membership.count({ where: { tenantId } }),
        this.db.membership.count({ where: { tenantId, status: 'ACTIVE' } }),
        this.db.membership.count({ where: { tenantId, status: 'PENDING' } }),
        this.db.membership.count({ where: { tenantId, status: 'SUSPENDED' } }),
        this.db.membership.count({ where: { tenantId, status: 'LEFT' } }),
      ]);

    // 2. Fetch memberships with User and Role
    const allMemberships = await this.db.membership.findMany({
      where: {
        tenantId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(options.roleId ? { roleId: options.roleId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            status: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. In-memory search & sort (safe for multi-tenant and supports mock DB)
    let filtered = allMemberships.filter((m: any) => {
      if (!search) return true;
      const name = (m.user?.name || '').toLowerCase();
      const email = (m.user?.email || '').toLowerCase();
      const phone = (m.user?.phone || '').toLowerCase();
      const code = (m.memberCode || '').toLowerCase();
      return (
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        code.includes(search)
      );
    });

    // Sorting
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    filtered.sort((a: any, b: any) => {
      let valA: any;
      let valB: any;
      if (sortBy === 'name') {
        valA = (a.user?.name || '').toLowerCase();
        valB = (b.user?.name || '').toLowerCase();
      } else if (sortBy === 'joinedAt') {
        valA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
        valB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      } else if (sortBy === 'status') {
        valA = a.status;
        valB = b.status;
      } else {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalFiltered = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    const members: MemberDto[] = paginated.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      tenantId: m.tenantId,
      name: m.user?.name || 'Unknown User',
      email: m.user?.email || null,
      phone: m.user?.phone || null,
      profileImage: m.user?.profileImage || null,
      status: m.status,
      roleId: m.roleId,
      roleName: m.role?.name || 'Member',
      roleSlug: m.role?.slug || 'member',
      memberCode: m.memberCode || null,
      emergencyContactName: m.emergencyContactName || null,
      emergencyContactPhone: m.emergencyContactPhone || null,
      notes: m.notes || null,
      joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
      invitedAt: m.invitedAt ? m.invitedAt.toISOString() : null,
      leftAt: m.leftAt ? m.leftAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    return {
      members,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
        hasPreviousPage: page > 1,
        hasNextPage: page < Math.ceil(totalFiltered / limit),
      },
      counts: {
        total: totalCount,
        active: activeCount,
        pending: pendingCount,
        suspended: suspendedCount,
        left: leftCount,
      },
    };
  }

  /**
   * Retrieves single member profile with tenant-isolation and privacy safeguards.
   */
  async getMemberById(
    tenantId: string,
    memberId: string,
    viewerContext?: { permissions?: Set<string>; isOwner?: boolean; roleSlug?: string }
  ): Promise<MemberDetailDto> {
    if (!tenantId || !memberId) {
      throw new ValidationError('tenantId and memberId are required');
    }

    const membership = await this.db.membership.findFirst({
      where: {
        id: memberId,
        tenantId, // Strict tenant-scope
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundError(`Member '${memberId}' does not exist in this mess.`);
    }

    // Permission guard for private financial data
    const canViewFinance =
      viewerContext?.isOwner ||
      viewerContext?.permissions?.has('finance.view') ||
      viewerContext?.roleSlug === 'owner' ||
      viewerContext?.roleSlug === 'admin';

    // Fetch tenant audit activities for this member
    const auditEvents = this.db.auditLog
      ? await this.db.auditLog.findMany({
          where: {
            tenantId,
            entityType: 'membership',
            entityId: memberId,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : [];

    const recentActivities = auditEvents.map((a: any) => ({
      id: a.id,
      action: a.action,
      description: a.description || a.action,
      actorName: 'System Staff',
      createdAt: a.createdAt.toISOString(),
    }));

    const member: MemberDetailDto = {
      id: membership.id,
      userId: membership.userId,
      tenantId: membership.tenantId,
      name: membership.user?.name || 'Unknown User',
      email: membership.user?.email || null,
      phone: membership.user?.phone || null,
      profileImage: membership.user?.profileImage || null,
      status: membership.status,
      roleId: membership.roleId,
      roleName: membership.role?.name || 'Member',
      roleSlug: membership.role?.slug || 'member',
      memberCode: (membership as any).memberCode || null,
      emergencyContactName: (membership as any).emergencyContactName || null,
      emergencyContactPhone: (membership as any).emergencyContactPhone || null,
      notes: (membership as any).notes || null,
      joinedAt: membership.joinedAt ? membership.joinedAt.toISOString() : null,
      invitedAt: membership.invitedAt ? membership.invitedAt.toISOString() : null,
      leftAt: membership.leftAt ? membership.leftAt.toISOString() : null,
      createdAt: membership.createdAt.toISOString(),
      updatedAt: membership.updatedAt.toISOString(),

      roomAssignment: {
        isAssigned: false,
        note: 'Room & bed allocation launches in Task 32',
      },
      mealSummary: {
        totalThisMonth: 0,
        systemStatus: 'NOT_CONFIGURED',
        note: 'Daily meal tracking launches in Task 33',
      },
      recentActivities,
    };

    if (canViewFinance) {
      member.financialSummary = {
        totalBilled: '0.00',
        confirmedPayments: '0.00',
        outstandingBalance: '0.00',
        isRestricted: false,
      };
    }

    return member;
  }

  /**
   * Onboards or invites a new member into the tenant.
   */
  async createMember(
    tenantId: string,
    input: CreateMemberInput,
    actor: { userId: string; roleName?: string }
  ): Promise<MemberDto> {
    if (!tenantId) {
      throw new ValidationError('tenantId is required');
    }
    const name = input.name?.trim();
    const phone = input.phone?.trim();
    const email = input.email?.trim().toLowerCase() || null;

    if (!name) {
      throw new ValidationError('Member full name is required');
    }
    if (!phone) {
      throw new ValidationError('Member phone number is required');
    }
    if (!input.roleId) {
      throw new ValidationError('Role assignment is required');
    }

    // 1. Verify Role belongs to this Tenant
    const role = await this.db.role.findFirst({
      where: {
        id: input.roleId,
        tenantId,
      },
    });

    if (!role) {
      throw new NotFoundError('Selected role does not belong to this mess.');
    }

    // 2. Find or Create User Identity
    let user = await this.db.user.findFirst({
      where: {
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
    });

    if (!user) {
      user = await this.db.user.create({
        data: {
          name,
          phone,
          email,
          status: 'ACTIVE',
        },
      });
    }

    // 3. Guard against duplicate membership in the same tenant
    const existingMembership = await this.db.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictError(
        `User "${name}" (${phone}) is already a registered member of this mess.`
      );
    }

    // 4. Generate Member Code if omitted
    const totalCount = await this.db.membership.count({ where: { tenantId } });
    const memberCode =
      input.memberCode?.trim() ||
      `MM-${String(totalCount + 1).padStart(3, '0')}`;

    const initialStatus = input.status || 'ACTIVE';
    const joinedAt = input.joinedAt ? new Date(input.joinedAt) : new Date();
    const invitedAt = initialStatus === 'PENDING' ? new Date() : null;

    // 5. Create Membership record
    const membership = await this.db.membership.create({
      data: {
        userId: user.id,
        tenantId,
        roleId: role.id,
        status: initialStatus,
        memberCode,
        emergencyContactName: input.emergencyContactName?.trim() || null,
        emergencyContactPhone: input.emergencyContactPhone?.trim() || null,
        notes: input.notes?.trim() || null,
        joinedAt: initialStatus === 'ACTIVE' ? joinedAt : null,
        invitedAt,
      },
      include: {
        user: true,
        role: true,
      },
    });

    // 6. Record Audit Event
    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor.userId,
      action: initialStatus === 'PENDING' ? 'member.invite' : 'member.create',
      entityType: 'membership',
      entityId: membership.id,
      description: `Added new resident "${name}" as ${role.name} (${initialStatus})`,
      afterData: {
        memberId: membership.id,
        userId: user.id,
        name,
        phone,
        status: initialStatus,
        roleId: role.id,
        memberCode,
      },
    });

    return {
      id: membership.id,
      userId: user.id,
      tenantId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      status: membership.status,
      roleId: role.id,
      roleName: role.name,
      roleSlug: role.slug,
      memberCode,
      emergencyContactName: (membership as any).emergencyContactName || null,
      emergencyContactPhone: (membership as any).emergencyContactPhone || null,
      notes: (membership as any).notes || null,
      joinedAt: membership.joinedAt ? membership.joinedAt.toISOString() : null,
      invitedAt: membership.invitedAt ? membership.invitedAt.toISOString() : null,
      leftAt: null,
      createdAt: membership.createdAt.toISOString(),
      updatedAt: membership.updatedAt.toISOString(),
    };
  }

  /**
   * Updates an existing member profile.
   */
  async updateMember(
    tenantId: string,
    memberId: string,
    input: UpdateMemberInput,
    actor: { userId: string }
  ): Promise<MemberDto> {
    if (!tenantId || !memberId) {
      throw new ValidationError('tenantId and memberId are required');
    }

    const membership = await this.db.membership.findFirst({
      where: {
        id: memberId,
        tenantId,
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundError(`Member '${memberId}' does not exist in this mess.`);
    }

    // 1. Update User Identity details if provided
    const userUpdates: any = {};
    if (input.name?.trim()) userUpdates.name = input.name.trim();
    if (input.phone?.trim()) userUpdates.phone = input.phone.trim();
    if (input.email !== undefined)
      userUpdates.email = input.email ? input.email.trim().toLowerCase() : null;

    if (Object.keys(userUpdates).length > 0) {
      await this.db.user.update({
        where: { id: membership.userId },
        data: userUpdates,
      });
    }

    // 2. Update Membership fields
    const membershipUpdates: any = {};
    if (input.memberCode !== undefined)
      membershipUpdates.memberCode = input.memberCode ? input.memberCode.trim() : null;
    if (input.emergencyContactName !== undefined)
      membershipUpdates.emergencyContactName = input.emergencyContactName
        ? input.emergencyContactName.trim()
        : null;
    if (input.emergencyContactPhone !== undefined)
      membershipUpdates.emergencyContactPhone = input.emergencyContactPhone
        ? input.emergencyContactPhone.trim()
        : null;
    if (input.notes !== undefined)
      membershipUpdates.notes = input.notes ? input.notes.trim() : null;

    const updated = await this.db.membership.update({
      where: { id: memberId },
      data: membershipUpdates,
      include: {
        user: true,
        role: true,
      },
    });

    // 3. Record Audit Event
    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor.userId,
      action: 'member.update',
      entityType: 'membership',
      entityId: memberId,
      description: `Updated member details for "${updated.user.name}"`,
      beforeData: {
        name: membership.user.name,
        phone: membership.user.phone,
        memberCode: (membership as any).memberCode,
      },
      afterData: {
        name: updated.user.name,
        phone: updated.user.phone,
        memberCode: (updated as any).memberCode,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      tenantId,
      name: updated.user.name,
      email: updated.user.email,
      phone: updated.user.phone,
      profileImage: updated.user.profileImage,
      status: updated.status,
      roleId: updated.roleId,
      roleName: updated.role.name,
      roleSlug: updated.role.slug,
      memberCode: (updated as any).memberCode || null,
      emergencyContactName: (updated as any).emergencyContactName || null,
      emergencyContactPhone: (updated as any).emergencyContactPhone || null,
      notes: (updated as any).notes || null,
      joinedAt: updated.joinedAt ? updated.joinedAt.toISOString() : null,
      invitedAt: updated.invitedAt ? updated.invitedAt.toISOString() : null,
      leftAt: updated.leftAt ? updated.leftAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Changes membership lifecycle state (ACTIVE, SUSPENDED, LEFT).
   * Safe Archival: Soft-deletes without removing historical records.
   */
  async changeMemberStatus(
    tenantId: string,
    memberId: string,
    newStatus: MembershipStatus,
    reason: string,
    actor: { userId: string }
  ): Promise<MemberDto> {
    if (!tenantId || !memberId) {
      throw new ValidationError('tenantId and memberId are required');
    }
    if (!newStatus) {
      throw new ValidationError('New membership status is required');
    }
    const cleanReason = reason?.trim();
    if (!cleanReason) {
      throw new ValidationError('A reason is mandatory for member status changes.');
    }

    const membership = await this.db.membership.findFirst({
      where: { id: memberId, tenantId },
      include: { user: true, role: true },
    });

    if (!membership) {
      throw new NotFoundError(`Member '${memberId}' does not exist in this mess.`);
    }

    // Protection of Last Active Owner
    if (
      membership.role.slug === 'owner' &&
      (newStatus === 'SUSPENDED' || newStatus === 'LEFT')
    ) {
      const activeOwnerCount = await this.db.membership.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          role: { slug: 'owner' },
        },
      });
      if (activeOwnerCount <= 1) {
        throw new ForbiddenError(
          'Cannot deactivate or archive the last active Owner of this mess.'
        );
      }
    }

    const data: any = { status: newStatus };
    if (newStatus === 'ACTIVE' && !membership.joinedAt) {
      data.joinedAt = new Date();
    }
    if (newStatus === 'LEFT') {
      data.leftAt = new Date();
    }

    const updated = await this.db.membership.update({
      where: { id: memberId },
      data,
      include: { user: true, role: true },
    });

    // Record Audit Event
    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor.userId,
      action: 'member.status_change',
      entityType: 'membership',
      entityId: memberId,
      description: `Changed status of "${updated.user.name}" from ${membership.status} to ${newStatus}. Reason: ${cleanReason}`,
      beforeData: { status: membership.status },
      afterData: { status: newStatus, reason: cleanReason },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      tenantId,
      name: updated.user.name,
      email: updated.user.email,
      phone: updated.user.phone,
      profileImage: updated.user.profileImage,
      status: updated.status,
      roleId: updated.roleId,
      roleName: updated.role.name,
      roleSlug: updated.role.slug,
      memberCode: (updated as any).memberCode || null,
      emergencyContactName: (updated as any).emergencyContactName || null,
      emergencyContactPhone: (updated as any).emergencyContactPhone || null,
      notes: (updated as any).notes || null,
      joinedAt: updated.joinedAt ? updated.joinedAt.toISOString() : null,
      invitedAt: updated.invitedAt ? updated.invitedAt.toISOString() : null,
      leftAt: updated.leftAt ? updated.leftAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Reassigns member role within the tenant.
   */
  async changeMemberRole(
    tenantId: string,
    memberId: string,
    newRoleId: string,
    actor: { userId: string }
  ): Promise<MemberDto> {
    if (!tenantId || !memberId || !newRoleId) {
      throw new ValidationError('tenantId, memberId, and newRoleId are required');
    }

    const membership = await this.db.membership.findFirst({
      where: { id: memberId, tenantId },
      include: { user: true, role: true },
    });

    if (!membership) {
      throw new NotFoundError(`Member '${memberId}' does not exist in this mess.`);
    }

    // Role must belong to this tenant
    const newRole = await this.db.role.findFirst({
      where: { id: newRoleId, tenantId },
    });

    if (!newRole) {
      throw new NotFoundError('Target role does not belong to this mess.');
    }

    // Protection of Last Active Owner
    if (membership.role.slug === 'owner' && newRole.slug !== 'owner') {
      const activeOwnerCount = await this.db.membership.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          role: { slug: 'owner' },
        },
      });
      if (activeOwnerCount <= 1) {
        throw new ForbiddenError(
          'Cannot demote the last active Owner of this mess. Promote another Owner first.'
        );
      }
    }

    const updated = await this.db.membership.update({
      where: { id: memberId },
      data: { roleId: newRoleId },
      include: { user: true, role: true },
    });

    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor.userId,
      action: 'member.role_change',
      entityType: 'membership',
      entityId: memberId,
      description: `Reassigned role for "${updated.user.name}" from ${membership.role.name} to ${newRole.name}`,
      beforeData: { roleId: membership.roleId, roleName: membership.role.name },
      afterData: { roleId: newRoleId, roleName: newRole.name },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      tenantId,
      name: updated.user.name,
      email: updated.user.email,
      phone: updated.user.phone,
      profileImage: updated.user.profileImage,
      status: updated.status,
      roleId: updated.roleId,
      roleName: updated.role.name,
      roleSlug: updated.role.slug,
      memberCode: (updated as any).memberCode || null,
      emergencyContactName: (updated as any).emergencyContactName || null,
      emergencyContactPhone: (updated as any).emergencyContactPhone || null,
      notes: (updated as any).notes || null,
      joinedAt: updated.joinedAt ? updated.joinedAt.toISOString() : null,
      invitedAt: updated.invitedAt ? updated.invitedAt.toISOString() : null,
      leftAt: updated.leftAt ? updated.leftAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}

export const memberService = new MemberService();
