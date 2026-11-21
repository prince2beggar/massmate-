import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import {
  PLATFORM_BASE_DOMAIN,
  RESERVED_SUBDOMAIN_SET,
  VERIFICATION_TXT_PREFIX,
  VERIFICATION_CHALLENGE_SUBDOMAIN,
  VERIFICATION_TTL_HOURS,
  MAX_VERIFICATION_ATTEMPTS,
} from './constants';
import { normalizeDomainName, isValidDomainName, isValidSubdomainSlug } from './validation';
import { entitlementService } from '@/server/subscription/entitlement-service';
import type {
  DomainDto,
  DomainFilterQuery,
  DnsVerificationResult,
  DomainResolutionResult,
} from './types';
import type { DomainStatus, DomainType, DomainVerificationStatus } from '@/types/database';

export class DomainService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Lists domains with server-side pagination, search, and filtering.
   */
  async listDomains(query: DomainFilterQuery = {}): Promise<{
    domains: DomainDto[];
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
          domains: [],
          pagination: { page, limit, totalCount: 0, totalPages: 0 },
        };
      }
    }

    try {
      const where: any = {};

      if (query.domainType && query.domainType !== 'ALL') {
        where.domainType = query.domainType;
      }

      if (query.verificationStatus && query.verificationStatus !== 'ALL') {
        where.verificationStatus = query.verificationStatus;
      }

      if (query.status && query.status !== 'ALL') {
        where.status = query.status;
      }

      if (query.tenantId) {
        where.tenantId = query.tenantId;
      }

      if (query.search && query.search.trim()) {
        const term = query.search.trim().toLowerCase();
        where.OR = [
          { domainName: { contains: term, mode: 'insensitive' } },
          { tenant: { name: { contains: term, mode: 'insensitive' } } },
          { tenant: { slug: { contains: term, mode: 'insensitive' } } },
        ];
      }

      const [totalCount, rows] = await Promise.all([
        this.db.domain.count({ where }),
        this.db.domain.findMany({
          where,
          include: { tenant: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
        }),
      ]);

      const domains: DomainDto[] = rows.map((d: any) => this.mapDomainDto(d));

      return {
        domains,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      };
    } catch {
      return {
        domains: [],
        pagination: { page, limit, totalCount: 0, totalPages: 0 },
      };
    }
  }

  /**
   * Retrieves a domain by primary key ID.
   */
  async getDomainById(id: string): Promise<DomainDto | null> {
    try {
      const row = await this.db.domain.findUnique({
        where: { id },
        include: { tenant: true },
      });
      return row ? this.mapDomainDto(row) : null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves a domain by normalized hostname.
   */
  async getDomainByName(domainName: string): Promise<DomainDto | null> {
    const normalized = normalizeDomainName(domainName);
    try {
      const row = await this.db.domain.findUnique({
        where: { domainName: normalized },
        include: { tenant: true },
      });
      return row ? this.mapDomainDto(row) : null;
    } catch {
      return null;
    }
  }

  /**
   * Provisions or links canonical platform subdomain for a tenant.
   * Format: <slug>.messmate.com
   */
  async createPlatformSubdomain(
    tenantId: string,
    slug: string,
    actorUserId?: string
  ): Promise<DomainDto> {
    if (!isValidSubdomainSlug(slug)) {
      throw new Error(`Subdomain slug "${slug}" is invalid or reserved by the platform.`);
    }

    const domainName = `${slug.toLowerCase()}.${PLATFORM_BASE_DOMAIN}`;

    // Check if domain is already claimed by another tenant
    const existing = await this.db.domain.findUnique({ where: { domainName } });
    if (existing && existing.tenantId !== tenantId) {
      throw new Error(`Subdomain "${domainName}" is already claimed by another organization.`);
    }

    const domain = await this.db.domain.upsert({
      where: { domainName },
      update: {
        tenantId,
        domainType: 'PLATFORM_SUBDOMAIN',
        isPrimary: true,
        verificationStatus: 'NOT_REQUIRED',
        dnsStatus: 'CONFIGURED',
        sslStatus: 'ACTIVE',
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
      create: {
        tenantId,
        domainName,
        domainType: 'PLATFORM_SUBDOMAIN',
        isPrimary: true,
        verificationStatus: 'NOT_REQUIRED',
        dnsStatus: 'CONFIGURED',
        sslStatus: 'ACTIVE',
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
      include: { tenant: true },
    });

    if (actorUserId) {
      await this.logAudit({
        action: 'domain.subdomain_provisioned',
        tenantId,
        actorUserId,
        entityId: domain.id,
        description: `Provisioned canonical platform subdomain: ${domainName}`,
        afterData: { domainName, isPrimary: true, status: 'ACTIVE' },
      });
    }

    return this.mapDomainDto(domain);
  }

  /**
   * Submits a request for a custom domain.
   * Validates syntax, prevents duplicate assignments, and enforces subscription entitlement.
   */
  async requestCustomDomain(
    tenantId: string,
    rawDomain: string,
    actorUserId: string
  ): Promise<DomainDto> {
    const domainName = normalizeDomainName(rawDomain);

    if (!isValidDomainName(domainName)) {
      throw new Error(`Domain name "${rawDomain}" is invalid. Provide a valid FQDN (e.g. mess.example.com).`);
    }

    // Check platform base domain collision
    if (domainName.endsWith(`.${PLATFORM_BASE_DOMAIN}`) || domainName === PLATFORM_BASE_DOMAIN) {
      throw new Error(`Cannot register a platform domain as a custom domain.`);
    }

    // 1. Verify Uniqueness across entire platform
    const existing = await this.db.domain.findUnique({ where: { domainName } });
    if (existing) {
      if (existing.tenantId === tenantId) {
        throw new Error(`Domain "${domainName}" is already registered for this organization.`);
      }
      throw new Error(`Domain "${domainName}" is already claimed by another organization on MessMate.`);
    }

    // 2. Verify Subscription Entitlement for Custom Domains
    const entitlement = await entitlementService.checkPlanEntitlement(tenantId, 'custom_domain');
    if (!entitlement.allowed) {
      throw new Error('Custom domains are not included in your current subscription tier. Upgrade required.');
    }

    // 3. Generate Secure Cryptographic Verification Token
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_HOURS * 60 * 60 * 1000);

    const domain = await this.db.domain.create({
      data: {
        tenantId,
        domainName,
        domainType: 'CUSTOM_DOMAIN',
        isPrimary: false, // Custom domains start non-primary until verified
        verificationStatus: 'PENDING',
        verificationToken: token,
        verificationExpiresAt: expiresAt,
        verificationAttempts: 0,
        dnsStatus: 'PENDING_CONFIGURATION',
        sslStatus: 'NOT_CONFIGURED',
        status: 'PENDING_VERIFICATION',
      },
      include: { tenant: true },
    });

    await this.logAudit({
      action: 'domain.requested',
      tenantId,
      actorUserId,
      entityId: domain.id,
      description: `Requested custom domain: ${domainName}. Verification challenge issued.`,
      afterData: {
        domainName,
        verificationStatus: 'PENDING',
        expiresAt: expiresAt.toISOString(),
      },
    });

    return this.mapDomainDto(domain);
  }

  /**
   * Verifies custom domain ownership via DNS TXT challenge.
   * Accepts optional custom dnsResolver for deterministic testing.
   */
  async verifyDomain(
    domainId: string,
    actorUserId: string,
    dnsResolver?: (hostname: string) => Promise<string[][]>
  ): Promise<DnsVerificationResult> {
    const domain = await this.db.domain.findUnique({
      where: { id: domainId },
      include: { tenant: true },
    });

    if (!domain) {
      throw new Error(`Domain with ID "${domainId}" not found.`);
    }

    if (domain.domainType === 'PLATFORM_SUBDOMAIN') {
      return {
        verified: true,
        domainName: domain.domainName,
        verificationStatus: 'NOT_REQUIRED',
        checkedAt: new Date().toISOString(),
      };
    }

    const now = new Date();

    // 1. Check Challenge Expiration
    if (domain.verificationExpiresAt && new Date(domain.verificationExpiresAt) < now) {
      await this.db.domain.update({
        where: { id: domainId },
        data: {
          verificationStatus: 'EXPIRED',
          verificationFailedReason: 'DNS verification challenge expired. Generate a new request.',
        },
      });

      await this.logAudit({
        action: 'domain.verification_expired',
        tenantId: domain.tenantId,
        actorUserId,
        entityId: domain.id,
        description: `Verification challenge expired for ${domain.domainName}`,
      });

      return {
        verified: false,
        domainName: domain.domainName,
        verificationStatus: 'EXPIRED',
        reason: 'Verification challenge expired. Please re-issue domain verification.',
        checkedAt: now.toISOString(),
      };
    }

    // 2. Check Rate Limits / Max Attempts
    if (domain.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      await this.db.domain.update({
        where: { id: domainId },
        data: {
          verificationStatus: 'FAILED',
          verificationFailedReason: 'Exceeded maximum verification attempts.',
        },
      });

      return {
        verified: false,
        domainName: domain.domainName,
        verificationStatus: 'FAILED',
        reason: 'Exceeded maximum verification attempts (10). Contact support.',
        checkedAt: now.toISOString(),
      };
    }

    // Increment attempt count
    await this.db.domain.update({
      where: { id: domainId },
      data: { verificationAttempts: { increment: 1 } },
    });

    // 3. DNS TXT Resolution
    const challengeHost = `${VERIFICATION_CHALLENGE_SUBDOMAIN}.${domain.domainName}`;
    const expectedTokenRecord = `${VERIFICATION_TXT_PREFIX}${domain.verificationToken}`;
    let foundTxtRecords: string[] = [];
    let isMatched = false;

    try {
      if (dnsResolver) {
        const records = await dnsResolver(challengeHost);
        foundTxtRecords = records.flat();
      } else {
        // Query challenge subdomain first, then fall back to apex domain
        try {
          const records = await dns.resolveTxt(challengeHost);
          foundTxtRecords = records.flat();
        } catch {
          const apexRecords = await dns.resolveTxt(domain.domainName);
          foundTxtRecords = apexRecords.flat();
        }
      }

      isMatched = foundTxtRecords.some((txt) => txt.trim() === expectedTokenRecord);
    } catch {
      // DNS record resolution failure / NXDOMAIN
      isMatched = false;
    }

    if (isMatched) {
      await this.db.domain.update({
        where: { id: domainId },
        data: {
          verificationStatus: 'VERIFIED',
          verificationFailedReason: null,
          verifiedAt: now,
          activatedAt: now,
          dnsStatus: 'CONFIGURED',
          sslStatus: 'PENDING', // Provisioning pending with reverse-proxy
          status: 'ACTIVE',
        },
      });

      await this.logAudit({
        action: 'domain.verified',
        tenantId: domain.tenantId,
        actorUserId,
        entityId: domain.id,
        description: `Verified ownership of custom domain ${domain.domainName} via DNS TXT challenge.`,
        afterData: {
          verificationStatus: 'VERIFIED',
          dnsStatus: 'CONFIGURED',
          status: 'ACTIVE',
        },
      });

      return {
        verified: true,
        domainName: domain.domainName,
        verificationStatus: 'VERIFIED',
        dnsEvidence: foundTxtRecords,
        checkedAt: now.toISOString(),
      };
    } else {
      const reason = `DNS TXT record matching "${expectedTokenRecord}" not found on ${challengeHost}. Found: [${foundTxtRecords.join(', ')}]`;

      await this.db.domain.update({
        where: { id: domainId },
        data: {
          verificationStatus: 'FAILED',
          verificationFailedReason: reason,
        },
      });

      await this.logAudit({
        action: 'domain.verification_failed',
        tenantId: domain.tenantId,
        actorUserId,
        entityId: domain.id,
        description: `DNS verification check failed for ${domain.domainName}.`,
        afterData: { reason },
      });

      return {
        verified: false,
        domainName: domain.domainName,
        verificationStatus: 'FAILED',
        reason: 'DNS TXT verification challenge record not found. Please verify DNS propagation.',
        dnsEvidence: foundTxtRecords,
        checkedAt: now.toISOString(),
      };
    }
  }

  /**
   * Designates a verified domain as the primary routing domain for a tenant.
   * Ensures only ONE primary domain exists per tenant.
   */
  async setPrimaryDomain(domainId: string, actorUserId: string): Promise<DomainDto> {
    const domain = await this.db.domain.findUnique({
      where: { id: domainId },
      include: { tenant: true },
    });

    if (!domain) {
      throw new Error(`Domain with ID "${domainId}" not found.`);
    }

    if (domain.domainType === 'CUSTOM_DOMAIN' && domain.verificationStatus !== 'VERIFIED') {
      throw new Error('Unverified custom domains cannot be designated as primary.');
    }

    if (domain.status !== 'ACTIVE') {
      throw new Error(`Inactive or suspended domain cannot be designated as primary.`);
    }

    // Atomically reset existing primary domains for this tenant and promote target
    await this.db.domain.updateMany({
      where: { tenantId: domain.tenantId, isPrimary: true },
      data: { isPrimary: false },
    });

    const updated = await this.db.domain.update({
      where: { id: domainId },
      data: { isPrimary: true },
      include: { tenant: true },
    });

    await this.logAudit({
      action: 'domain.primary_changed',
      tenantId: domain.tenantId,
      actorUserId,
      entityId: domain.id,
      description: `Set ${domain.domainName} as primary routing domain for ${domain.tenant?.name || domain.tenantId}`,
      afterData: { isPrimary: true, domainName: domain.domainName },
    });

    return this.mapDomainDto(updated);
  }

  /**
   * Suspends, reactivates, or removes a domain.
   */
  async updateDomainStatus(
    domainId: string,
    status: DomainStatus,
    reason: string,
    actorUserId: string
  ): Promise<DomainDto> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A reason (minimum 5 characters) is required to modify domain operational status.');
    }

    const domain = await this.db.domain.findUnique({
      where: { id: domainId },
      include: { tenant: true },
    });

    if (!domain) {
      throw new Error(`Domain with ID "${domainId}" not found.`);
    }

    const updated = await this.db.domain.update({
      where: { id: domainId },
      data: {
        status,
        ...(status !== 'ACTIVE' ? { isPrimary: false } : {}),
      },
      include: { tenant: true },
    });

    await this.logAudit({
      action: `domain.status_${status.toLowerCase()}`,
      tenantId: domain.tenantId,
      actorUserId,
      entityId: domain.id,
      description: `Changed domain status to ${status}. Reason: ${reason.trim()}`,
      beforeData: { status: domain.status },
      afterData: { status, reason: reason.trim() },
    });

    return this.mapDomainDto(updated);
  }

  /**
   * Resolves a tenant from an incoming HTTP Host header.
   * Guarantees that only verified, active domains resolve to tenants.
   */
  async resolveTenantFromHost(hostname?: string | null): Promise<DomainResolutionResult | null> {
    if (!hostname) return null;

    const normalized = normalizeDomainName(hostname);
    if (!normalized) return null;

    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return null;
      }
    }

    try {
      // 1. Direct match in Domain registry
      const domain = await this.db.domain.findUnique({
        where: { domainName: normalized },
        include: { tenant: true },
      });

      if (domain) {
        // Enforce verified status for custom domains
        if (domain.domainType === 'CUSTOM_DOMAIN' && domain.verificationStatus !== 'VERIFIED') {
          return null;
        }

        return {
          tenantId: domain.tenantId,
          tenantSlug: domain.tenant?.slug || '',
          domainName: domain.domainName,
          domainType: domain.domainType,
          isPrimary: domain.isPrimary,
          isActive: domain.status === 'ACTIVE',
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private mapDomainDto(row: any): DomainDto {
    const rawToken = row.verificationToken || null;
    const verificationTokenMasked = rawToken
      ? `${rawToken.substring(0, 4)}...${rawToken.substring(rawToken.length - 4)}`
      : null;

    return {
      id: row.id,
      tenantId: row.tenantId,
      tenantName: row.tenant?.name || 'Unknown Mess',
      tenantSlug: row.tenant?.slug || '',
      domainName: row.domainName,
      domainType: row.domainType,
      isPrimary: Boolean(row.isPrimary),
      verificationStatus: row.verificationStatus,
      verificationToken: rawToken,
      verificationTokenMasked,
      verificationExpiresAt: row.verificationExpiresAt
        ? new Date(row.verificationExpiresAt).toISOString()
        : null,
      verificationAttempts: row.verificationAttempts || 0,
      verificationFailedReason: row.verificationFailedReason || null,
      dnsStatus: row.dnsStatus,
      sslStatus: row.sslStatus,
      status: row.status,
      verifiedAt: row.verifiedAt ? new Date(row.verifiedAt).toISOString() : null,
      activatedAt: row.activatedAt ? new Date(row.activatedAt).toISOString() : null,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }

  private async logAudit(params: {
    action: string;
    entityId: string;
    tenantId?: string;
    actorUserId?: string;
    description: string;
    beforeData?: any;
    afterData?: any;
  }) {
    try {
      await this.db.auditLog.create({
        data: {
          action: params.action,
          entityType: 'domain',
          entityId: params.entityId,
          tenantId: params.tenantId || null,
          actorUserId: params.actorUserId || null,
          description: params.description,
          beforeData: params.beforeData || null,
          afterData: params.afterData || null,
        },
      });
    } catch {
      // Non-blocking audit logger
    }
  }
}

export const domainService = new DomainService();
