import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DomainService } from './domain-service';
import { normalizeDomainName, isValidDomainName, isValidSubdomainSlug } from './validation';
import {
  PLATFORM_BASE_DOMAIN,
  VERIFICATION_TXT_PREFIX,
  VERIFICATION_CHALLENGE_SUBDOMAIN,
} from './constants';
import type { Domain, AuditLog } from '@/types/database';

describe('Task 27: Domain & Subdomain Management Tests', () => {
  function createMockDomainDb() {
    const domains: any[] = [];
    const auditLogs: any[] = [];

    const db = {
      domain: {
        create: async ({ data }: any) => {
          const item = {
            id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          };
          domains.push(item);
          return item;
        },
        findUnique: async ({ where }: any) => {
          return domains.find((d) => d.id === where.id || (where.domainName && d.domainName === where.domainName)) || null;
        },
        findFirst: async ({ where }: any) => {
          return domains.find((d) => {
            if (where.domainName && d.domainName !== where.domainName) return false;
            if (where.status && d.status !== where.status) return false;
            return true;
          }) || null;
        },
        findMany: async ({ where }: any = {}) => {
          return domains
            .filter((d) => {
              if (where?.status && d.status !== where.status) return false;
              if (where?.domainType && d.domainType !== where.domainType) return false;
              if (where?.verificationStatus && d.verificationStatus !== where.verificationStatus) return false;
              if (where?.tenantId && d.tenantId !== where.tenantId) return false;
              return true;
            })
            .map((d) => ({
              ...d,
              tenant: { id: d.tenantId, name: 'Prince Mess', slug: 'prince-mess' },
            }));
        },
        count: async ({ where }: any = {}) => {
          return domains.filter((d) => {
            if (where?.status && d.status !== where.status) return false;
            if (where?.domainType && d.domainType !== where.domainType) return false;
            return true;
          }).length;
        },
        upsert: async ({ where, update, create }: any) => {
          const idx = domains.findIndex((d) => d.domainName === where.domainName);
          if (idx !== -1) {
            domains[idx] = { ...domains[idx], ...update, updatedAt: new Date() };
            return domains[idx];
          } else {
            const item = {
              id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...create,
            };
            domains.push(item);
            return item;
          }
        },
        update: async ({ where, data }: any) => {
          const idx = domains.findIndex((d) => d.id === where.id);
          if (idx === -1) throw new Error('Domain not found');
          // Handle { increment: 1 }
          const updatedAttempts =
            data.verificationAttempts && typeof data.verificationAttempts === 'object' && 'increment' in data.verificationAttempts
              ? (domains[idx].verificationAttempts || 0) + data.verificationAttempts.increment
              : data.verificationAttempts !== undefined
                ? data.verificationAttempts
                : domains[idx].verificationAttempts;

          domains[idx] = {
            ...domains[idx],
            ...data,
            verificationAttempts: updatedAttempts,
            updatedAt: new Date(),
          };
          return domains[idx];
        },
        updateMany: async ({ where, data }: any) => {
          let count = 0;
          for (let i = 0; i < domains.length; i++) {
            if (where.tenantId && domains[i].tenantId !== where.tenantId) continue;
            if (where.isPrimary !== undefined && domains[i].isPrimary !== where.isPrimary) continue;
            domains[i] = { ...domains[i], ...data, updatedAt: new Date() };
            count++;
          }
          return { count };
        },
      },
      auditLog: {
        create: async ({ data }: any) => {
          const item = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date(),
            ...data,
          };
          auditLogs.push(item);
          return item;
        },
        findMany: async () => auditLogs,
      },
      _auditLogs: auditLogs,
    };

    return db;
  }

  // Scenario 1: Unique subdomain generation
  it('Scenario 1 — Generate unique platform subdomain from tenant slug', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    const domain = await service.createPlatformSubdomain(
      'tnt_prince_mess',
      'prince-mess',
      'admin_user_1'
    );

    assert.ok(domain.id);
    assert.equal(domain.domainName, `prince-mess.${PLATFORM_BASE_DOMAIN}`);
    assert.equal(domain.domainType, 'PLATFORM_SUBDOMAIN');
    assert.equal(domain.isPrimary, true);
    assert.equal(domain.verificationStatus, 'NOT_REQUIRED');
    assert.equal(domain.status, 'ACTIVE');
  });

  // Scenario 2: Duplicate subdomain rejection
  it('Scenario 2 — Reject duplicate platform subdomain registration', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    await service.createPlatformSubdomain('tnt_first_tenant', 'green-view');

    // Attempting to claim the same subdomain for another tenant must fail
    await assert.rejects(
      async () => {
        await service.createPlatformSubdomain('tnt_second_tenant', 'green-view');
      },
      /already claimed by another organization/
    );
  });

  // Scenario 3: Duplicate custom domain rejection
  it('Scenario 3 — Reject duplicate custom domain assignment across tenants', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    // Seed existing custom domain for tenant 1
    await db.domain.create({
      data: {
        tenantId: 'tnt_first',
        domainName: 'mess.studenthub.bd',
        domainType: 'CUSTOM_DOMAIN',
        status: 'ACTIVE',
      },
    });

    // Tenant 2 attempting to register the same custom domain must be blocked
    await assert.rejects(
      async () => {
        await service.requestCustomDomain('tnt_second', 'MESS.STUDENTHUB.BD', 'operator_2');
      },
      /already claimed by another organization/
    );
  });

  // Scenario 4: Domain normalization
  it('Scenario 4 — Normalizes domain names (lowercase, strips trailing dot and ports)', () => {
    assert.equal(normalizeDomainName('  WWW.PRINCE-MESS.BD.  '), 'www.prince-mess.bd');
    assert.equal(normalizeDomainName('Hostel.Example.com:3000'), 'hostel.example.com');
    assert.equal(normalizeDomainName('MESSMATE.COM:8080.'), 'messmate.com');
  });

  // Scenario 5: Invalid domain rejection
  it('Scenario 5 — Reject invalid domain formats and IP addresses', () => {
    assert.equal(isValidDomainName('192.168.1.1'), false, 'Bare IP must be rejected');
    assert.equal(isValidDomainName('-invalid.com'), false, 'Hyphen prefix must be rejected');
    assert.equal(isValidDomainName('invalid-.com'), false, 'Hyphen suffix must be rejected');
    assert.equal(isValidDomainName('not_a_domain'), false, 'Single label must be rejected');
    assert.equal(isValidDomainName('valid-mess.example.com'), true, 'Valid FQDN must be accepted');
    assert.equal(isValidSubdomainSlug('super-admin'), false, 'Reserved subdomain must be rejected');
    assert.equal(isValidSubdomainSlug('prince-mess'), true, 'Valid slug must be accepted');
  });

  // Scenario 6: Pending verification state
  it('Scenario 6 — Custom domain request initiates as PENDING with challenge token and expiration', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    const domain = await service.requestCustomDomain(
      'tnt_custom_mess',
      'hostel.dhakastudents.com',
      'tenant_admin_1'
    );

    assert.equal(domain.domainType, 'CUSTOM_DOMAIN');
    assert.equal(domain.verificationStatus, 'PENDING');
    assert.equal(domain.status, 'PENDING_VERIFICATION');
    assert.equal(domain.isPrimary, false, 'Custom domain must NOT start as primary');
    assert.ok(domain.verificationToken, 'Challenge token must be generated');
    assert.ok(domain.verificationExpiresAt, 'Expiration timestamp must be present');
  });

  // Scenario 7: Successful verification using actual DNS evidence
  it('Scenario 7 — Successful verification via matching DNS TXT record activates domain', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    const domain = await service.requestCustomDomain(
      'tnt_verified_mess',
      'live.bachelorflat.bd',
      'admin_user_1'
    );

    const expectedRecord = `${VERIFICATION_TXT_PREFIX}${domain.verificationToken}`;

    // Mock DNS resolver simulating valid published TXT record
    const mockDnsResolver = async (host: string) => {
      assert.ok(host.includes(VERIFICATION_CHALLENGE_SUBDOMAIN));
      return [[expectedRecord]];
    };

    const result = await service.verifyDomain(domain.id, 'admin_user_1', mockDnsResolver);

    assert.equal(result.verified, true);
    assert.equal(result.verificationStatus, 'VERIFIED');

    const updated = await service.getDomainById(domain.id);
    assert.ok(updated);
    assert.equal(updated.verificationStatus, 'VERIFIED');
    assert.equal(updated.status, 'ACTIVE');
    assert.equal(updated.dnsStatus, 'CONFIGURED');
    assert.ok(updated.verifiedAt);
  });

  // Scenario 8: Failed verification
  it('Scenario 8 — Failed verification when DNS TXT record does not match token', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    const domain = await service.requestCustomDomain(
      'tnt_unverified_mess',
      'wrong.tokenmess.bd',
      'admin_user_1'
    );

    // Mock DNS resolver with mismatched token
    const mockDnsResolver = async () => {
      return [['some-unrelated-txt-record']];
    };

    const result = await service.verifyDomain(domain.id, 'admin_user_1', mockDnsResolver);

    assert.equal(result.verified, false);
    assert.equal(result.verificationStatus, 'FAILED');

    const updated = await service.getDomainById(domain.id);
    assert.ok(updated);
    assert.equal(updated.verificationStatus, 'FAILED');
    assert.ok(updated.verificationFailedReason);
  });

  // Scenario 9: Expired verification challenge
  it('Scenario 9 — Expired verification challenge transitions domain to EXPIRED', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
    const item = await db.domain.create({
      data: {
        tenantId: 'tnt_expired_mess',
        domainName: 'expired.messdomain.bd',
        domainType: 'CUSTOM_DOMAIN',
        verificationStatus: 'PENDING',
        verificationToken: 'token_expired_123',
        verificationExpiresAt: pastDate,
        status: 'PENDING_VERIFICATION',
      },
    });

    const result = await service.verifyDomain(item.id, 'admin_user_1');

    assert.equal(result.verified, false);
    assert.equal(result.verificationStatus, 'EXPIRED');

    const updated = await service.getDomainById(item.id);
    assert.ok(updated);
    assert.equal(updated.verificationStatus, 'EXPIRED');
  });

  // Scenario 10: Unauthorized primary domain changes
  it('Scenario 10 — Unverified custom domain cannot be designated as primary', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    const domain = await service.requestCustomDomain(
      'tnt_unverified_primary',
      'unverified.mess.org',
      'admin_user_1'
    );

    await assert.rejects(
      async () => {
        await service.setPrimaryDomain(domain.id, 'admin_user_1');
      },
      /Unverified custom domains cannot be designated as primary/
    );
  });

  // Scenario 11: Inactive domain access denial
  it('Scenario 11 — Inactive or suspended domains deny tenant routing', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    await db.domain.create({
      data: {
        tenantId: 'tnt_suspended_domain',
        domainName: 'suspended.mess.com',
        domainType: 'CUSTOM_DOMAIN',
        verificationStatus: 'VERIFIED',
        status: 'SUSPENDED',
      },
    });

    const resolution = await service.resolveTenantFromHost('suspended.mess.com');
    assert.ok(resolution);
    assert.equal(resolution.isActive, false, 'Suspended domain must report isActive=false');
  });

  // Scenario 12: Tenant routing by verified domain
  it('Scenario 12 — Resolve tenant by active verified domain', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    await db.domain.create({
      data: {
        tenantId: 'tnt_live_verified',
        domainName: 'mess.farmgateresidents.com',
        domainType: 'CUSTOM_DOMAIN',
        verificationStatus: 'VERIFIED',
        status: 'ACTIVE',
        isPrimary: true,
      },
    });

    const res = await service.resolveTenantFromHost('mess.farmgateresidents.com');
    assert.ok(res);
    assert.equal(res.tenantId, 'tnt_live_verified');
    assert.equal(res.domainType, 'CUSTOM_DOMAIN');
    assert.equal(res.isPrimary, true);
    assert.equal(res.isActive, true);
  });

  // Scenario 13: Cross-tenant domain resolution protection
  it('Scenario 13 — Cross-tenant isolation guarantees one domain resolves to exactly one tenant', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    await db.domain.create({
      data: {
        tenantId: 'tnt_mess_alpha',
        domainName: 'alpha.messmate.com',
        domainType: 'PLATFORM_SUBDOMAIN',
        status: 'ACTIVE',
      },
    });

    const alphaRes = await service.resolveTenantFromHost('alpha.messmate.com');
    assert.ok(alphaRes);
    assert.equal(alphaRes.tenantId, 'tnt_mess_alpha');

    // Unknown domain returns null
    const unknownRes = await service.resolveTenantFromHost('unregistered-random-hostel.bd');
    assert.equal(unknownRes, null);
  });

  // Scenario 14: Audit logging of domain changes
  it('Scenario 14 — Audit logs track domain requests, verifications, status changes, and primary updates', async () => {
    const db = createMockDomainDb();
    const service = new DomainService(db);

    // 1. Request
    const domain = await service.requestCustomDomain(
      'tnt_audit_tracking',
      'audit.messhostel.bd',
      'operator_audit_1'
    );

    // 2. Verification
    const mockResolver = async () => [[`${VERIFICATION_TXT_PREFIX}${domain.verificationToken}`]];
    await service.verifyDomain(domain.id, 'operator_audit_1', mockResolver);

    // 3. Set Primary
    await service.setPrimaryDomain(domain.id, 'operator_audit_1');

    // 4. Status Update (Suspend)
    await service.updateDomainStatus(
      domain.id,
      'SUSPENDED',
      'Temporary maintenance suspension',
      'operator_audit_1'
    );

    const logs = await db.auditLog.findMany();
    const actions = logs.map((l: any) => l.action);

    assert.ok(actions.includes('domain.requested'));
    assert.ok(actions.includes('domain.verified'));
    assert.ok(actions.includes('domain.primary_changed'));
    assert.ok(actions.includes('domain.status_suspended'));
  });
});
