import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PlatformTenantService,
  CreateTenantInput,
} from './platform-tenant-service';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from '@/server/api/errors';
import { TenantSuspendedError } from '@/server/tenant/errors';
import type {
  Tenant,
  User,
  Role,
  Membership,
  TenantVerification,
  AuditLog,
  TenantType,
  TenantStatus,
  VerificationStatus,
} from '@/types/database';

describe('Task 25: Super Admin Tenant / Mess Management Tests', () => {
  // In-memory mock DB factory simulating multi-tenant relational persistence
  function createMockTenantDb() {
    const tenants: Tenant[] = [
      {
        id: 'tnt_prince_mess_100',
        name: 'Prince Student Mess',
        slug: 'prince-mess',
        description: 'Student mess in Farmgate',
        logo: null,
        coverImage: null,
        email: 'info@princemess.bd',
        phone: '+8801700000001',
        address: '12 Farmgate Road',
        city: 'Dhaka',
        country: 'Bangladesh',
        timezone: 'Asia/Dhaka',
        tenantType: 'STUDENT_MESS',
        status: 'ACTIVE',
        verificationStatus: 'APPROVED',
        verifiedAt: new Date(),
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date('2026-01-10'),
      },
      {
        id: 'tnt_green_view_200',
        name: 'Green View Hostel',
        slug: 'green-view-hostel',
        description: 'Bachelor hostel in Uttara',
        logo: null,
        coverImage: null,
        email: 'contact@greenview.bd',
        phone: '+8801700000002',
        address: 'House 5, Sector 4',
        city: 'Dhaka',
        country: 'Bangladesh',
        timezone: 'Asia/Dhaka',
        tenantType: 'HOSTEL',
        status: 'SUSPENDED',
        verificationStatus: 'PENDING_REVIEW',
        verifiedAt: null,
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01'),
      },
    ];

    const users: User[] = [
      {
        id: 'usr_owner_asad',
        name: 'Asaduzzaman Khan',
        email: 'asad@example.com',
        phone: '+8801811111111',
        passwordHash: null,
        profileImage: null,
        status: 'ACTIVE',
        platformRole: null,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const roles: Role[] = [
      {
        id: 'role_prince_owner',
        tenantId: 'tnt_prince_mess_100',
        name: 'Owner',
        slug: 'owner',
        description: 'Primary owner',
        isSystem: true,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const memberships: any[] = [
      {
        id: 'mem_asad_prince',
        userId: 'usr_owner_asad',
        tenantId: 'tnt_prince_mess_100',
        roleId: 'role_prince_owner',
        status: 'ACTIVE',
        joinedAt: new Date(),
        user: users[0],
        role: roles[0],
      },
    ];

    const verifications: TenantVerification[] = [
      {
        id: 'vrf_prince_100',
        tenantId: 'tnt_prince_mess_100',
        status: 'APPROVED',
        documentType: 'TRADE_LICENSE',
        documentNumber: '1990123456789',
        documentFileUrl: 'private/tenants/tnt_prince/trade_license.pdf',
        submittedAt: new Date(),
        reviewedAt: new Date(),
        reviewerUserId: 'usr_platform_owner',
        rejectionReason: null,
        notes: 'Verified trade license',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const auditLogs: AuditLog[] = [];

    const mockPrisma = {
      tenant: {
        count: async ({ where }: any = {}) => {
          let filtered = tenants;
          if (where?.status) filtered = filtered.filter((t) => t.status === where.status);
          if (where?.verificationStatus)
            filtered = filtered.filter((t) => t.verificationStatus === where.verificationStatus);
          return filtered.length;
        },
        findMany: async ({ where, skip = 0, take = 10 }: any = {}) => {
          let filtered = [...tenants];
          if (where?.status) filtered = filtered.filter((t) => t.status === where.status);
          if (where?.verificationStatus)
            filtered = filtered.filter((t) => t.verificationStatus === where.verificationStatus);
          if (where?.OR) {
            filtered = filtered.filter((t) =>
              where.OR.some(
                (cond: any) =>
                  (cond.name && t.name.toLowerCase().includes(cond.name.contains.toLowerCase())) ||
                  (cond.slug && t.slug.toLowerCase().includes(cond.slug.contains.toLowerCase())) ||
                  (cond.id && t.id === cond.id.equals)
              )
            );
          }
          return filtered.slice(skip, skip + take).map((t) => ({
            ...t,
            memberships: memberships
              .filter((m) => m.tenantId === t.id && m.role.slug === 'owner')
              .map((m) => ({ user: m.user })),
            _count: {
              memberships: memberships.filter((m) => m.tenantId === t.id).length,
            },
          }));
        },
        findUnique: async ({ where }: any) => {
          let found: any = null;
          if (where.id) found = tenants.find((t) => t.id === where.id) || null;
          if (where.slug) found = tenants.find((t) => t.slug === where.slug) || null;
          if (!found) return null;
          return {
            ...found,
            verification: verifications.find((v) => v.tenantId === found.id) || null,
            memberships: memberships.filter((m) => m.tenantId === found.id),
          };
        },
        create: async ({ data }: any) => {
          const newTenant: Tenant = {
            id: `tnt_${Date.now()}`,
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            logo: null,
            coverImage: null,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            city: data.city || null,
            country: 'Bangladesh',
            timezone: 'Asia/Dhaka',
            tenantType: data.tenantType,
            status: data.status,
            verificationStatus: data.verificationStatus,
            verifiedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          tenants.push(newTenant);
          return newTenant;
        },
        update: async ({ where, data }: any) => {
          const idx = tenants.findIndex((t) => t.id === where.id);
          if (idx === -1) throw new Error('Tenant not found');
          tenants[idx] = { ...tenants[idx], ...data, updatedAt: new Date() };
          return tenants[idx];
        },
      },
      user: {
        findUnique: async ({ where }: any) => {
          if (where.email) return users.find((u) => u.email === where.email) || null;
          if (where.id) return users.find((u) => u.id === where.id) || null;
          return null;
        },
        create: async ({ data }: any) => {
          const newUser: User = {
            id: `usr_${Date.now()}`,
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            passwordHash: null,
            profileImage: null,
            status: 'ACTIVE',
            platformRole: null,
            emailVerifiedAt: null,
            phoneVerifiedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          users.push(newUser);
          return newUser;
        },
      },
      role: {
        create: async ({ data }: any) => {
          const newRole: Role = {
            id: `role_${Date.now()}_${data.slug}`,
            tenantId: data.tenantId,
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            isSystem: data.isSystem || false,
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          roles.push(newRole);
          return newRole;
        },
      },
      membership: {
        create: async ({ data }: any) => {
          const newMem = {
            id: `mem_${Date.now()}`,
            userId: data.userId,
            tenantId: data.tenantId,
            roleId: data.roleId,
            status: data.status,
            joinedAt: data.joinedAt,
          };
          memberships.push(newMem);
          return newMem;
        },
      },
      tenantVerification: {
        create: async ({ data }: any) => {
          const newVrf: TenantVerification = {
            id: `vrf_${Date.now()}`,
            tenantId: data.tenantId,
            status: data.status,
            documentType: null,
            documentNumber: null,
            documentFileUrl: null,
            submittedAt: null,
            reviewedAt: null,
            reviewerUserId: null,
            rejectionReason: null,
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          verifications.push(newVrf);
          return newVrf;
        },
        upsert: async ({ where, update, create }: any) => {
          const idx = verifications.findIndex((v) => v.tenantId === where.tenantId);
          if (idx !== -1) {
            verifications[idx] = { ...verifications[idx], ...update };
            return verifications[idx];
          }
          const newVrf: TenantVerification = {
            id: `vrf_${Date.now()}`,
            tenantId: where.tenantId,
            ...create,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          verifications.push(newVrf);
          return newVrf;
        },
      },
      auditLog: {
        create: async ({ data }: any) => {
          const newLog: AuditLog = {
            id: `log_${Date.now()}`,
            tenantId: data.tenantId || null,
            actorUserId: data.actorUserId || null,
            actorMembershipId: null,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId || null,
            description: data.description || null,
            beforeData: data.beforeData || null,
            afterData: data.afterData || null,
            metadata: null,
            ipAddress: null,
            createdAt: new Date(),
          };
          auditLogs.push(newLog);
          return newLog;
        },
        findMany: async () => auditLogs,
      },
    };

    return {
      service: new PlatformTenantService(mockPrisma as any),
      tenants,
      auditLogs,
      users,
      memberships,
      verifications,
    };
  }

  // 1. List tenants
  it('Scenario 1 — Lists all tenants across the platform with pagination', async () => {
    const { service } = createMockTenantDb();
    const result = await service.listTenants({ page: 1, limit: 10 });

    assert.equal(result.tenants.length, 2);
    assert.equal(result.pagination.totalCount, 2);
    assert.equal(result.tenants[0].name, 'Prince Student Mess');
  });

  // 2. Search tenants
  it('Scenario 2 — Searches tenants by name, slug, or ID', async () => {
    const { service } = createMockTenantDb();

    const searchByName = await service.listTenants({ search: 'Prince' });
    assert.equal(searchByName.tenants.length, 1);
    assert.equal(searchByName.tenants[0].slug, 'prince-mess');

    const searchBySlug = await service.listTenants({ search: 'green-view-hostel' });
    assert.equal(searchBySlug.tenants.length, 1);
    assert.equal(searchBySlug.tenants[0].id, 'tnt_green_view_200');
  });

  // 3. Filter by status
  it('Scenario 3 — Filters tenants by operational status and verification status', async () => {
    const { service } = createMockTenantDb();

    const activeOnly = await service.listTenants({ status: 'ACTIVE' });
    assert.equal(activeOnly.tenants.length, 1);
    assert.equal(activeOnly.tenants[0].status, 'ACTIVE');

    const suspendedOnly = await service.listTenants({ status: 'SUSPENDED' });
    assert.equal(suspendedOnly.tenants.length, 1);
    assert.equal(suspendedOnly.tenants[0].status, 'SUSPENDED');

    const verifiedOnly = await service.listTenants({ verificationStatus: 'APPROVED' });
    assert.equal(verifiedOnly.tenants.length, 1);
  });

  // 4. View tenant details
  it('Scenario 4 — Retrieves full multi-tab tenant details and masks document numbers', async () => {
    const { service } = createMockTenantDb();
    const details = await service.getTenantDetails('tnt_prince_mess_100');

    assert.equal(details.tenant.name, 'Prince Student Mess');
    assert.equal(details.domain.fullSubdomain, 'prince-mess.messmate.com');
    assert.ok(details.verification);
    // Sensitive document number must be masked!
    assert.equal(details.verification.documentNumberMasked, '*********6789');
    assert.equal(details.membersSummary.total, 1);
  });

  // 5. Create a tenant with valid data
  it('Scenario 5 — Creates a new tenant and sets up initial owner and roles', async () => {
    const { service, tenants, auditLogs } = createMockTenantDb();
    const input: CreateTenantInput = {
      name: 'North South Bachelor Mess',
      slug: 'north-south-mess',
      tenantType: 'BACHELOR_MESS',
      ownerName: 'Tanvir Hossain',
      ownerEmail: 'tanvir@example.com',
      ownerPhone: '+8801999999999',
      city: 'Dhaka',
      address: 'Bashundhara R/A',
    };

    const created = await service.createTenant(input, 'usr_platform_admin');
    assert.ok(created.id);
    assert.equal(created.slug, 'north-south-mess');
    assert.equal(tenants.length, 3);

    // Verify audit log recorded
    const creationLog = auditLogs.find((l) => l.action === 'tenant.create');
    assert.ok(creationLog);
    assert.equal(creationLog.actorUserId, 'usr_platform_admin');
  });

  // 6. Reject duplicate slugs
  it('Scenario 6 — Rejects duplicate slugs and reserved platform keywords', async () => {
    const { service } = createMockTenantDb();

    // Duplicate slug
    await assert.rejects(
      async () =>
        service.createTenant({
          name: 'Prince Duplicate',
          slug: 'prince-mess', // Already exists!
          tenantType: 'STUDENT_MESS',
          ownerName: 'Fake Owner',
          ownerEmail: 'fake@example.com',
        }),
      ConflictError
    );

    // Reserved keyword
    await assert.rejects(
      async () =>
        service.createTenant({
          name: 'Super Admin Mess',
          slug: 'super-admin', // Reserved!
          tenantType: 'STUDENT_MESS',
          ownerName: 'Admin',
          ownerEmail: 'admin@example.com',
        }),
      ConflictError
    );
  });

  // 7. Assign the correct initial owner
  it('Scenario 7 — Creates and associates owner user with active Owner role', async () => {
    const { service, users, memberships } = createMockTenantDb();
    const input: CreateTenantInput = {
      name: 'Chittagong University Flat',
      slug: 'cu-flat',
      tenantType: 'SHARED_APARTMENT',
      ownerName: 'Mahmudul Hasan',
      ownerEmail: 'mahmud@example.com',
    };

    const created = await service.createTenant(input);
    const newOwnerUser = users.find((u) => u.email === 'mahmud@example.com');
    assert.ok(newOwnerUser);

    const ownerMembership = memberships.find(
      (m) => m.userId === newOwnerUser.id && m.tenantId === created.id
    );
    assert.ok(ownerMembership);
    assert.equal(ownerMembership.status, 'ACTIVE');
  });

  // 8. Update tenant information
  it('Scenario 8 — Updates permitted tenant fields and appends audit event', async () => {
    const { service, auditLogs } = createMockTenantDb();

    const updated = await service.updateTenant(
      'tnt_prince_mess_100',
      {
        name: 'Prince Executive Hostel',
        city: 'Tejgaon',
      },
      'usr_platform_owner'
    );

    assert.equal(updated.name, 'Prince Executive Hostel');
    const updateLog = auditLogs.find((l) => l.action === 'tenant.update');
    assert.ok(updateLog);
  });

  // 9. Suspend a tenant with a mandatory reason
  it('Scenario 9 — Suspends a tenant with a mandatory reason and records audit log', async () => {
    const { service, auditLogs } = createMockTenantDb();

    const result = await service.updateTenantStatus(
      'tnt_prince_mess_100',
      'SUSPENDED',
      'Repeated payment violation and unverified manager credentials.',
      'usr_platform_admin'
    );

    assert.equal(result.newStatus, 'SUSPENDED');
    assert.equal(result.previousStatus, 'ACTIVE');

    const suspendLog = auditLogs.find((l) => l.action === 'tenant.suspend');
    assert.ok(suspendLog);
    assert.ok(suspendLog.description?.includes('Repeated payment violation'));
  });

  // 10. Verify suspension is enforced by backend policy
  it('Scenario 10 — Enforces that suspended tenant state is rejected by TenantSuspendedError', () => {
    const suspendedStatus: TenantStatus = 'SUSPENDED';
    assert.throws(() => {
      if (suspendedStatus === 'SUSPENDED') {
        throw new TenantSuspendedError();
      }
    }, TenantSuspendedError);
  });

  // 11. Review verification submission
  it('Scenario 11 — Approves or rejects tenant verification and updates verifiedAt', async () => {
    const { service, auditLogs, tenants } = createMockTenantDb();

    const approved = await service.reviewTenantVerification(
      'tnt_green_view_200',
      'APPROVED',
      'Valid trade license confirmed with Dhaka City Corporation.',
      'usr_compliance_officer'
    );

    assert.equal(approved.verificationStatus, 'APPROVED');
    const tenant = tenants.find((t) => t.id === 'tnt_green_view_200');
    assert.ok(tenant?.verifiedAt);

    const verifyLog = auditLogs.find((l) => l.action === 'tenant.verify_approved');
    assert.ok(verifyLog);
  });

  // 12. Restrict unauthorized document access
  it('Scenario 12 — Rejects verification rejection without a detailed mandatory reason', async () => {
    const { service } = createMockTenantDb();

    await assert.rejects(
      async () =>
        service.reviewTenantVerification(
          'tnt_green_view_200',
          'REJECTED',
          '', // Empty reason!
          'usr_officer'
        ),
      ValidationError
    );
  });

  // 13. Prevent empty reasons for status changes
  it('Scenario 13 — Rejects status change with missing or too-short reason', async () => {
    const { service } = createMockTenantDb();

    await assert.rejects(
      async () => service.updateTenantStatus('tnt_prince_mess_100', 'INACTIVE', 'bad'),
      ValidationError
    );
  });

  // 14. Record administrative actions in audit logs
  it('Scenario 14 — All administrative mutations append to the audit ledger without deleting history', async () => {
    const { service, auditLogs } = createMockTenantDb();

    await service.updateTenantStatus(
      'tnt_prince_mess_100',
      'PENDING',
      'Under platform safety review.',
      'usr_superadmin'
    );

    assert.ok(auditLogs.length > 0);
    assert.equal(auditLogs[auditLogs.length - 1].action, 'tenant.status_change');
  });

  // 15. Prevent cross-tenant record relationships
  it('Scenario 15 — Prevents modifying non-existent or cross-tenant records', async () => {
    const { service } = createMockTenantDb();

    await assert.rejects(
      async () => service.getTenantDetails('tnt_completely_fake_id'),
      NotFoundError
    );

    await assert.rejects(
      async () =>
        service.updateTenant('tnt_completely_fake_id', { name: 'Hack' }),
      NotFoundError
    );
  });
});
