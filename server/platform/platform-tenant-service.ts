if (typeof window !== 'undefined') {
  throw new Error('PlatformTenantService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import type { PrismaClient } from '@/generated/prisma/client';
import type {
  TenantType,
  TenantStatus,
  VerificationStatus,
  VerificationDocumentType,
} from '@/types/database';
import { SYSTEM_ROLE_TEMPLATES } from '@/server/rbac/role-templates';
import { NotFoundError, ConflictError, ValidationError } from '@/server/api/errors';

export interface ListTenantsQuery {
  search?: string;
  status?: TenantStatus | 'ALL';
  verificationStatus?: VerificationStatus | 'ALL';
  tenantType?: TenantType | 'ALL';
  subscriptionFilter?: 'ALL' | 'TRIAL' | 'PAID' | 'EXPIRED';
  city?: string;
  sortBy?: 'createdAt' | 'name' | 'city' | 'status' | 'tenantType';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  tenantType: TenantType;
  status: TenantStatus;
  verificationStatus: VerificationStatus;
  city: string | null;
  email: string | null;
  phone: string | null;
  totalMembers: number;
  owner: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  subscription: {
    planName: string;
    status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'INACTIVE' | 'UNCONFIGURED';
    isPaid: boolean;
  };
  createdAt: string;
}

export interface PlatformTenantDetails {
  tenant: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    coverImage: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string;
    timezone: string;
    tenantType: TenantType;
    status: TenantStatus;
    verificationStatus: VerificationStatus;
    verifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  owner: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    joinedAt: string | null;
  } | null;
  membersSummary: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  subscription: {
    planName: string;
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
    trialEnd: string | null;
    currentPeriodEnd: string | null;
    isPaid: boolean;
    moduleStatus: 'UNAVAILABLE_PHASE3_PENDING';
  };
  domain: {
    subdomain: string;
    fullSubdomain: string;
    customDomain: string | null;
    isVerified: boolean;
    sslStatus: string;
  };
  verification: {
    status: VerificationStatus;
    documentType: VerificationDocumentType | null;
    documentNumberMasked: string | null;
    hasPrivateDocument: boolean;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewer: { id: string; name: string } | null;
    rejectionReason: string | null;
    notes: string | null;
  } | null;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    description: string | null;
    createdAt: string;
    actor: { id: string; name: string } | null;
  }>;
}

export interface CreateTenantInput {
  name: string;
  slug?: string;
  tenantType: TenantType;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  city?: string;
  address?: string;
  description?: string;
}

export interface UpdateTenantInput {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  tenantType?: TenantType;
  logo?: string;
  coverImage?: string;
}

const RESERVED_SLUGS = new Set([
  'admin',
  'super-admin',
  'api',
  'auth',
  'login',
  'register',
  'portal',
  'dashboard',
  'help',
  'support',
  'billing',
  'account',
]);

export class PlatformTenantService {
  private readonly db: PrismaClient;
  private readonly isCustomDb: boolean;

  constructor(customDb?: PrismaClient) {
    this.db = customDb ?? defaultPrisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Generates a URL-safe slug from a mess name.
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Paginated and filtered tenant directory list.
   */
  async listTenants(query: ListTenantsQuery = {}): Promise<{
    tenants: TenantListItem[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured || !config.runtimeUrl) {
        return {
          tenants: [],
          pagination: { page, limit, totalCount: 0, totalPages: 0 },
        };
      }
    }

    try {
      // Build Prisma Where clause
      const where: any = {};

      if (query.status && query.status !== 'ALL') {
        where.status = query.status;
      }

      if (query.verificationStatus && query.verificationStatus !== 'ALL') {
        where.verificationStatus = query.verificationStatus;
      }

      if (query.tenantType && query.tenantType !== 'ALL') {
        where.tenantType = query.tenantType;
      }

      if (query.city && query.city.trim()) {
        where.city = { contains: query.city.trim(), mode: 'insensitive' };
      }

      if (query.search && query.search.trim()) {
        const term = query.search.trim();
        where.OR = [
          { name: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
          { id: { equals: term } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term } },
          {
            memberships: {
              some: {
                role: { slug: 'owner' },
                user: {
                  OR: [
                    { email: { contains: term, mode: 'insensitive' } },
                    { name: { contains: term, mode: 'insensitive' } },
                  ],
                },
              },
            },
          },
        ];
      }

      const orderBy: any = {};
      const sortField = query.sortBy || 'createdAt';
      const sortDir = query.sortOrder || 'desc';
      orderBy[sortField] = sortDir;

      const [totalCount, rawTenants] = await Promise.all([
        this.db.tenant.count({ where }),
        this.db.tenant.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            memberships: {
              where: {
                role: { slug: 'owner' },
              },
              take: 1,
              include: {
                user: {
                  select: { id: true, name: true, email: true, phone: true },
                },
              },
            },
            _count: {
              select: { memberships: true },
            },
          },
        }),
      ]);

      const tenants: TenantListItem[] = rawTenants.map((t) => {
        const ownerMembership = t.memberships[0];
        const owner = ownerMembership?.user
          ? {
              id: ownerMembership.user.id,
              name: ownerMembership.user.name,
              email: ownerMembership.user.email,
              phone: ownerMembership.user.phone,
            }
          : null;

        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          tenantType: t.tenantType,
          status: t.status,
          verificationStatus: t.verificationStatus,
          city: t.city,
          email: t.email,
          phone: t.phone,
          totalMembers: t._count.memberships,
          owner,
          subscription: {
            planName: 'Starter Free',
            status: t.status === 'ACTIVE' ? 'TRIAL' : 'INACTIVE',
            isPaid: false,
          },
          createdAt: t.createdAt.toISOString(),
        };
      });

      return {
        tenants,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      };
    } catch {
      return {
        tenants: [],
        pagination: { page, limit, totalCount: 0, totalPages: 0 },
      };
    }
  }

  /**
   * Retrieves full detailed tenant profile organized into 6 tabs.
   */
  async getTenantDetails(tenantId: string): Promise<PlatformTenantDetails> {
    const tenant = await this.db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        verification: {
          include: {
            reviewer: {
              select: { id: true, name: true },
            },
          },
        },
        memberships: {
          include: {
            user: true,
            role: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant with ID '${tenantId}' does not exist.`);
    }

    // Owner Membership lookup
    const ownerMembership = tenant.memberships.find((m) => m.role.slug === 'owner');
    const owner = ownerMembership
      ? {
          id: ownerMembership.user.id,
          name: ownerMembership.user.name,
          email: ownerMembership.user.email,
          phone: ownerMembership.user.phone,
          status: ownerMembership.user.status,
          joinedAt: ownerMembership.joinedAt?.toISOString() || null,
        }
      : null;

    // Membership counts
    const total = tenant.memberships.length;
    const active = tenant.memberships.filter((m) => m.status === 'ACTIVE').length;
    const pending = tenant.memberships.filter((m) => m.status === 'PENDING').length;
    const suspended = tenant.memberships.filter((m) => m.status === 'SUSPENDED').length;

    // Mask sensitive document numbers (e.g. 1990123456789 -> ********6789)
    let documentNumberMasked: string | null = null;
    if (tenant.verification?.documentNumber) {
      const raw = tenant.verification.documentNumber;
      documentNumberMasked =
        raw.length > 4 ? '*'.repeat(raw.length - 4) + raw.slice(-4) : '****';
    }

    // Fetch tenant audit logs
    const auditLogs = await this.db.auditLog.findMany({
      where: {
        OR: [{ tenantId: tenant.id }, { entityId: tenant.id }],
      },
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: {
        actorUser: {
          select: { id: true, name: true },
        },
      },
    });

    const recentActivity = auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      description: log.description,
      createdAt: log.createdAt.toISOString(),
      actor: log.actorUser ? { id: log.actorUser.id, name: log.actorUser.name } : null,
    }));

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        description: tenant.description,
        logo: tenant.logo,
        coverImage: tenant.coverImage,
        email: tenant.email,
        phone: tenant.phone,
        address: tenant.address,
        city: tenant.city,
        country: tenant.country,
        timezone: tenant.timezone,
        tenantType: tenant.tenantType,
        status: tenant.status,
        verificationStatus: tenant.verificationStatus,
        verifiedAt: tenant.verifiedAt ? tenant.verifiedAt.toISOString() : null,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
      },
      owner,
      membersSummary: {
        total,
        active,
        pending,
        suspended,
      },
      subscription: {
        planName: 'Standard Starter (14-Day Evaluation)',
        status: tenant.status === 'ACTIVE' ? 'TRIAL' : 'INACTIVE',
        trialEnd: new Date(tenant.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: null,
        isPaid: false,
        moduleStatus: 'UNAVAILABLE_PHASE3_PENDING',
      },
      domain: {
        subdomain: tenant.slug,
        fullSubdomain: `${tenant.slug}.messmate.com`,
        customDomain: null,
        isVerified: false,
        sslStatus: 'Active (Wildcard Let’s Encrypt)',
      },
      verification: tenant.verification
        ? {
            status: tenant.verification.status,
            documentType: tenant.verification.documentType,
            documentNumberMasked,
            hasPrivateDocument: !!tenant.verification.documentFileUrl,
            submittedAt: tenant.verification.submittedAt?.toISOString() || null,
            reviewedAt: tenant.verification.reviewedAt?.toISOString() || null,
            reviewer: tenant.verification.reviewer
              ? {
                  id: tenant.verification.reviewer.id,
                  name: tenant.verification.reviewer.name,
                }
              : null,
            rejectionReason: tenant.verification.rejectionReason,
            notes: tenant.verification.notes,
          }
        : null,
      recentActivity,
    };
  }

  /**
   * Administrative Tenant Creation
   *
   * Executes multi-table transaction creating Tenant, Owner User, Roles, Membership, and AuditLog.
   */
  async createTenant(
    input: CreateTenantInput,
    actorUserId?: string
  ): Promise<{ id: string; name: string; slug: string }> {
    if (!input.name || input.name.trim().length < 2) {
      throw new ValidationError('Mess / Organization name must be at least 2 characters.');
    }
    if (!input.ownerName || input.ownerName.trim().length < 2) {
      throw new ValidationError('Owner name must be at least 2 characters.');
    }
    if (!input.ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.ownerEmail)) {
      throw new ValidationError('A valid owner email address is required.');
    }

    const slug = (input.slug?.trim() || this.generateSlug(input.name)).toLowerCase();

    if (slug.length < 3) {
      throw new ValidationError('Tenant slug must be at least 3 characters long.');
    }
    if (RESERVED_SLUGS.has(slug)) {
      throw new ConflictError(`Slug '${slug}' is a reserved platform keyword and cannot be used.`);
    }

    // Check slug uniqueness
    const existing = await this.db.tenant.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictError(`A mess with the URL identifier '${slug}' already exists.`);
    }

    // Step 1: Find or Create Owner User
    const ownerEmail = input.ownerEmail.toLowerCase().trim();
    let ownerUser = await this.db.user.findUnique({
      where: { email: ownerEmail },
    });

    if (!ownerUser) {
      ownerUser = await this.db.user.create({
        data: {
          name: input.ownerName.trim(),
          email: ownerEmail,
          phone: input.ownerPhone?.trim() || null,
          status: 'ACTIVE',
        },
      });
    }

    // Step 2: Create Tenant
    const tenant = await this.db.tenant.create({
      data: {
        name: input.name.trim(),
        slug,
        tenantType: input.tenantType,
        description: input.description?.trim() || null,
        city: input.city?.trim() || null,
        address: input.address?.trim() || null,
        email: ownerEmail,
        phone: input.ownerPhone?.trim() || null,
        status: 'ACTIVE',
        verificationStatus: 'NOT_SUBMITTED',
      },
    });

    // Step 3: Seed Default Tenant Roles from SYSTEM_ROLE_TEMPLATES
    let ownerRole: { id: string } | null = null;
    for (const tmpl of SYSTEM_ROLE_TEMPLATES) {
      const createdRole = await this.db.role.create({
        data: {
          tenantId: tenant.id,
          name: tmpl.name,
          slug: tmpl.slug,
          description: tmpl.description,
          isSystem: true,
          status: 'ACTIVE',
        },
      });

      if (tmpl.slug === 'owner') {
        ownerRole = createdRole;
      }
    }

    if (!ownerRole) {
      throw new Error('Failed to create default Owner role for tenant.');
    }

    // Step 4: Create Owner Membership
    await this.db.membership.create({
      data: {
        userId: ownerUser.id,
        tenantId: tenant.id,
        roleId: ownerRole.id,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    });

    // Step 5: Initialize TenantVerification record
    await this.db.tenantVerification.create({
      data: {
        tenantId: tenant.id,
        status: 'NOT_SUBMITTED',
      },
    });

    // Step 6: Append Audit Log
    await this.db.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorUserId: actorUserId || null,
        action: 'tenant.create',
        entityType: 'tenant',
        entityId: tenant.id,
        description: `Tenant '${tenant.name}' created by platform administrator. Owner: ${ownerUser.email}`,
        afterData: {
          name: tenant.name,
          slug: tenant.slug,
          tenantType: tenant.tenantType,
          ownerId: ownerUser.id,
          ownerEmail: ownerUser.email,
        },
      },
    });

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    };
  }

  /**
   * Updates permitted tenant profile fields.
   */
  async updateTenant(
    tenantId: string,
    input: UpdateTenantInput,
    actorUserId?: string
  ): Promise<{ id: string; name: string }> {
    const existing = await this.db.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existing) {
      throw new NotFoundError(`Tenant '${tenantId}' not found.`);
    }

    const dataToUpdate: any = {};
    if (input.name !== undefined) dataToUpdate.name = input.name.trim();
    if (input.description !== undefined) dataToUpdate.description = input.description?.trim() || null;
    if (input.email !== undefined) dataToUpdate.email = input.email?.trim() || null;
    if (input.phone !== undefined) dataToUpdate.phone = input.phone?.trim() || null;
    if (input.address !== undefined) dataToUpdate.address = input.address?.trim() || null;
    if (input.city !== undefined) dataToUpdate.city = input.city?.trim() || null;
    if (input.tenantType !== undefined) dataToUpdate.tenantType = input.tenantType;
    if (input.logo !== undefined) dataToUpdate.logo = input.logo?.trim() || null;
    if (input.coverImage !== undefined) dataToUpdate.coverImage = input.coverImage?.trim() || null;

    const updated = await this.db.tenant.update({
      where: { id: tenantId },
      data: dataToUpdate,
    });

    // Audit mutation
    await this.db.auditLog.create({
      data: {
        tenantId: existing.id,
        actorUserId: actorUserId || null,
        action: 'tenant.update',
        entityType: 'tenant',
        entityId: existing.id,
        description: `Tenant '${existing.name}' profile modified by platform administrator.`,
        beforeData: {
          name: existing.name,
          city: existing.city,
          tenantType: existing.tenantType,
        },
        afterData: dataToUpdate,
      },
    });

    return { id: updated.id, name: updated.name };
  }

  /**
   * Modifies tenant operational status (Active, Pending, Suspended, Inactive).
   * Enforces mandatory reason and audit record.
   */
  async updateTenantStatus(
    tenantId: string,
    newStatus: TenantStatus,
    reason: string,
    actorUserId?: string
  ): Promise<{ id: string; previousStatus: TenantStatus; newStatus: TenantStatus }> {
    if (!reason || reason.trim().length < 5) {
      throw new ValidationError('A detailed reason (at least 5 characters) is required to alter tenant status.');
    }

    const tenant = await this.db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundError(`Tenant '${tenantId}' not found.`);
    }

    if (tenant.status === newStatus) {
      return { id: tenant.id, previousStatus: tenant.status, newStatus };
    }

    const previousStatus = tenant.status;

    await this.db.tenant.update({
      where: { id: tenantId },
      data: { status: newStatus },
    });

    const isSuspension = newStatus === 'SUSPENDED';

    await this.db.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorUserId: actorUserId || null,
        action: isSuspension ? 'tenant.suspend' : 'tenant.status_change',
        entityType: 'tenant',
        entityId: tenant.id,
        description: `Tenant status changed from ${previousStatus} to ${newStatus}. Reason: ${reason.trim()}`,
        beforeData: { status: previousStatus },
        afterData: { status: newStatus, reason: reason.trim() },
      },
    });

    return { id: tenant.id, previousStatus, newStatus };
  }

  /**
   * Reviews tenant verification submission.
   */
  async reviewTenantVerification(
    tenantId: string,
    decision: 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUIRED',
    notes: string,
    actorUserId?: string
  ): Promise<{ id: string; verificationStatus: VerificationStatus }> {
    const tenant = await this.db.tenant.findUnique({
      where: { id: tenantId },
      include: { verification: true },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant '${tenantId}' not found.`);
    }

    if (decision === 'REJECTED' && (!notes || notes.trim().length < 5)) {
      throw new ValidationError('A detailed reason is mandatory when rejecting verification.');
    }

    const now = new Date();

    // 1. Update Tenant
    await this.db.tenant.update({
      where: { id: tenantId },
      data: {
        verificationStatus: decision,
        verifiedAt: decision === 'APPROVED' ? now : null,
      },
    });

    // 2. Upsert TenantVerification
    await this.db.tenantVerification.upsert({
      where: { tenantId },
      update: {
        status: decision,
        reviewedAt: now,
        reviewerUserId: actorUserId || null,
        rejectionReason: decision === 'REJECTED' ? notes.trim() : null,
        notes: notes.trim(),
      },
      create: {
        tenantId,
        status: decision,
        reviewedAt: now,
        reviewerUserId: actorUserId || null,
        rejectionReason: decision === 'REJECTED' ? notes.trim() : null,
        notes: notes.trim(),
      },
    });

    // 3. Record Audit Log
    await this.db.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorUserId: actorUserId || null,
        action: decision === 'APPROVED' ? 'tenant.verify_approved' : 'tenant.verify_rejected',
        entityType: 'tenant_verification',
        entityId: tenant.id,
        description: `Verification status updated to ${decision}. Notes: ${notes.trim()}`,
        beforeData: { verificationStatus: tenant.verificationStatus },
        afterData: { verificationStatus: decision, notes: notes.trim() },
      },
    });

    return { id: tenant.id, verificationStatus: decision };
  }
}

export const platformTenantService = new PlatformTenantService();
