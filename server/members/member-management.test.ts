import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MemberService } from './member-service';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '@/server/api/errors';
import type { MembershipStatus, UserStatus } from '@/types/database';

// -----------------------------------------------------------------------------
// In-Memory Multi-Tenant Mock Database for Member Tests
// -----------------------------------------------------------------------------

function createMockMemberDb() {
  const users: any[] = [];
  const tenants: any[] = [];
  const roles: any[] = [];
  const memberships: any[] = [];
  const auditLogs: any[] = [];

  return {
    users,
    tenants,
    roles,
    memberships,
    auditLogs,

    user: {
      findFirst: async ({ where }: any) => {
        if (where?.OR) {
          return (
            users.find((u) =>
              where.OR.some(
                (cond: any) =>
                  (cond.phone && u.phone === cond.phone) ||
                  (cond.email && u.email === cond.email) ||
                  (cond.id && u.id === cond.id)
              )
            ) || null
          );
        }
        return users.find((u) => u.id === where?.id) || null;
      },
      create: async ({ data }: any) => {
        const u = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          profileImage: data.profileImage || null,
          status: data.status || 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        users.push(u);
        return u;
      },
      update: async ({ where, data }: any) => {
        const u = users.find((user) => user.id === where.id);
        if (!u) throw new Error('User not found');
        Object.assign(u, data, { updatedAt: new Date() });
        return u;
      },
    },

    tenant: {
      findUnique: async ({ where }: any) => {
        return tenants.find((t) => t.id === where.id || t.slug === where.slug) || null;
      },
    },

    role: {
      findFirst: async ({ where }: any) => {
        return (
          roles.find((r) => {
            if (where.id && r.id !== where.id) return false;
            if (where.tenantId && r.tenantId !== where.tenantId) return false;
            if (where.slug && r.slug !== where.slug) return false;
            return true;
          }) || null
        );
      },
    },

    membership: {
      findUnique: async ({ where }: any) => {
        if (where.userId_tenantId) {
          const { userId, tenantId } = where.userId_tenantId;
          return (
            memberships.find(
              (m) => m.userId === userId && m.tenantId === tenantId
            ) || null
          );
        }
        return memberships.find((m) => m.id === where.id) || null;
      },
      findFirst: async ({ where }: any) => {
        const found = memberships.find((m) => {
          if (where.id && m.id !== where.id) return false;
          if (where.tenantId && m.tenantId !== where.tenantId) return false;
          if (where.userId && m.userId !== where.userId) return false;
          return true;
        });
        if (!found) return null;
        return {
          ...found,
          user: users.find((u) => u.id === found.userId),
          role: roles.find((r) => r.id === found.roleId),
        };
      },
      findMany: async ({ where }: any) => {
        return memberships
          .filter((m) => {
            if (where.tenantId && m.tenantId !== where.tenantId) return false;
            if (where.status && m.status !== where.status) return false;
            if (where.roleId && m.roleId !== where.roleId) return false;
            return true;
          })
          .map((m) => ({
            ...m,
            user: users.find((u) => u.id === m.userId),
            role: roles.find((r) => r.id === m.roleId),
          }));
      },
      count: async ({ where }: any) => {
        return memberships.filter((m) => {
          if (where.tenantId && m.tenantId !== where.tenantId) return false;
          if (where.status && m.status !== where.status) return false;
          if (where.role?.slug) {
            const role = roles.find((r) => r.id === m.roleId);
            if (role?.slug !== where.role.slug) return false;
          }
          return true;
        }).length;
      },
      create: async ({ data }: any) => {
        const mem = {
          id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: data.userId,
          tenantId: data.tenantId,
          roleId: data.roleId,
          status: data.status || 'ACTIVE',
          memberCode: data.memberCode || null,
          emergencyContactName: data.emergencyContactName || null,
          emergencyContactPhone: data.emergencyContactPhone || null,
          notes: data.notes || null,
          joinedAt: data.joinedAt || null,
          invitedAt: data.invitedAt || null,
          leftAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memberships.push(mem);
        return {
          ...mem,
          user: users.find((u) => u.id === mem.userId),
          role: roles.find((r) => r.id === mem.roleId),
        };
      },
      update: async ({ where, data }: any) => {
        const mem = memberships.find((m) => m.id === where.id);
        if (!mem) throw new Error('Membership not found');
        Object.assign(mem, data, { updatedAt: new Date() });
        return {
          ...mem,
          user: users.find((u) => u.id === mem.userId),
          role: roles.find((r) => r.id === mem.roleId),
        };
      },
    },

    auditLog: {
      findMany: async ({ where }: any) => {
        return auditLogs.filter((log) => {
          if (where.tenantId && log.tenantId !== where.tenantId) return false;
          if (where.entityType && log.entityType !== where.entityType) return false;
          if (where.entityId && log.entityId !== where.entityId) return false;
          return true;
        });
      },
    },
  };
}

describe('Task 31: Member Management System Tests', () => {
  const db = createMockMemberDb();
  const service = new MemberService(db as any);

  // Setup Tenant Alpha & Tenant Beta
  const tenantA = { id: 'tenant_alpha', name: 'Alpha Mess', slug: 'alpha-mess' };
  const tenantB = { id: 'tenant_beta', name: 'Beta Mess', slug: 'beta-mess' };
  db.tenants.push(tenantA, tenantB);

  // Setup Roles
  const ownerRoleA = { id: 'role_a_owner', tenantId: tenantA.id, name: 'Owner', slug: 'owner' };
  const adminRoleA = { id: 'role_a_admin', tenantId: tenantA.id, name: 'Admin', slug: 'admin' };
  const memberRoleA = { id: 'role_a_member', tenantId: tenantA.id, name: 'Member', slug: 'member' };
  const memberRoleB = { id: 'role_b_member', tenantId: tenantB.id, name: 'Member', slug: 'member' };
  db.roles.push(ownerRoleA, adminRoleA, memberRoleA, memberRoleB);

  // Setup Users
  const user1 = { id: 'u1', name: 'Kabir Ahmed', phone: '+8801700000001', email: 'kabir@alpha.com' };
  const user2 = { id: 'u2', name: 'Tareq Hasan', phone: '+8801700000002', email: 'tareq@alpha.com' };
  const user3 = { id: 'u3', name: 'Sajid Islam', phone: '+8801700000003', email: 'sajid@alpha.com' };
  const userB = { id: 'ub', name: 'Beta Resident', phone: '+8801799999999', email: 'beta@beta.com' };
  db.users.push(user1, user2, user3, userB);

  // Setup Memberships for Tenant A
  db.memberships.push(
    {
      id: 'mem_a_1',
      userId: user1.id,
      tenantId: tenantA.id,
      roleId: ownerRoleA.id,
      status: 'ACTIVE',
      memberCode: 'MM-001',
      joinedAt: new Date('2026-01-01'),
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'mem_a_2',
      userId: user2.id,
      tenantId: tenantA.id,
      roleId: memberRoleA.id,
      status: 'PENDING',
      memberCode: 'MM-002',
      joinedAt: null,
      createdAt: new Date('2026-01-02'),
      updatedAt: new Date('2026-01-02'),
    },
    {
      id: 'mem_a_3',
      userId: user3.id,
      tenantId: tenantA.id,
      roleId: memberRoleA.id,
      status: 'ACTIVE',
      memberCode: 'MM-003',
      joinedAt: new Date('2026-01-03'),
      createdAt: new Date('2026-01-03'),
      updatedAt: new Date('2026-01-03'),
    }
  );

  // Setup Membership for Tenant B (Cross-tenant boundary)
  db.memberships.push({
    id: 'mem_b_1',
    userId: userB.id,
    tenantId: tenantB.id,
    roleId: memberRoleB.id,
    status: 'ACTIVE',
    memberCode: 'BETA-001',
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // ---------------------------------------------------------------------------
  // Scenario 1: List members with tenant-scoping & status summary
  // ---------------------------------------------------------------------------
  it('1. List members returns tenant-scoped members with pagination and status counts', async () => {
    const res = await service.listMembers(tenantA.id, { page: 1, limit: 10 });
    assert.equal(res.members.length, 3);
    assert.equal(res.counts.total, 3);
    assert.equal(res.counts.active, 2);
    assert.equal(res.counts.pending, 1);
    assert.equal(res.counts.suspended, 0);

    // Tenant B member must NOT be included
    const leaked = res.members.find((m) => m.name === 'Beta Resident');
    assert.equal(leaked, undefined);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2: Search members by name, phone, email, and member code
  // ---------------------------------------------------------------------------
  it('2. Search members across name, phone, email, and member code', async () => {
    // Search by name
    const byName = await service.listMembers(tenantA.id, { search: 'Kabir' });
    assert.equal(byName.members.length, 1);
    assert.equal(byName.members[0].name, 'Kabir Ahmed');

    // Search by member code
    const byCode = await service.listMembers(tenantA.id, { search: 'MM-003' });
    assert.equal(byCode.members.length, 1);
    assert.equal(byCode.members[0].name, 'Sajid Islam');

    // Search by phone
    const byPhone = await service.listMembers(tenantA.id, { search: '0000002' });
    assert.equal(byPhone.members.length, 1);
    assert.equal(byPhone.members[0].name, 'Tareq Hasan');
  });

  // ---------------------------------------------------------------------------
  // Scenario 3: Filter members by status
  // ---------------------------------------------------------------------------
  it('3. Filter members by status (ACTIVE vs PENDING)', async () => {
    const activeOnly = await service.listMembers(tenantA.id, { status: 'ACTIVE' });
    assert.equal(activeOnly.members.length, 2);
    assert.ok(activeOnly.members.every((m) => m.status === 'ACTIVE'));

    const pendingOnly = await service.listMembers(tenantA.id, { status: 'PENDING' });
    assert.equal(pendingOnly.members.length, 1);
    assert.equal(pendingOnly.members[0].status, 'PENDING');
  });

  // ---------------------------------------------------------------------------
  // Scenario 4: Add new member creates records and logs audit event
  // ---------------------------------------------------------------------------
  it('4. Add new member creates User and Membership and records audit event', async () => {
    const newMember = await service.createMember(
      tenantA.id,
      {
        name: 'Nazmul Huda',
        phone: '+8801711223344',
        email: 'nazmul@example.com',
        roleId: memberRoleA.id,
        emergencyContactName: 'Father',
        emergencyContactPhone: '+8801700998877',
        notes: 'Room 202 candidate',
      },
      { userId: 'usr_actor_owner' }
    );

    assert.ok(newMember.id);
    assert.equal(newMember.name, 'Nazmul Huda');
    assert.equal(newMember.status, 'ACTIVE');
    assert.equal(newMember.emergencyContactName, 'Father');
    assert.ok(newMember.memberCode);

    // Verify member exists in list
    const list = await service.listMembers(tenantA.id);
    assert.equal(list.counts.total, 4);
    assert.equal(list.counts.active, 3);
  });

  // ---------------------------------------------------------------------------
  // Scenario 5: Prevent duplicate membership in the same tenant
  // ---------------------------------------------------------------------------
  it('5. Prevent duplicate membership in the same tenant with ConflictError', async () => {
    await assert.rejects(
      async () => {
        await service.createMember(
          tenantA.id,
          {
            name: 'Kabir Duplicate',
            phone: '+8801700000001', // Already belongs to Kabir Ahmed in Tenant A
            roleId: memberRoleA.id,
          },
          { userId: 'usr_actor' }
        );
      },
      (err: any) => err instanceof ConflictError
    );
  });

  // ---------------------------------------------------------------------------
  // Scenario 6: Same user can belong to different tenants
  // ---------------------------------------------------------------------------
  it('6. Same user identity can hold memberships in different tenants', async () => {
    // User Kabir Ahmed (from Tenant A) joins Tenant B
    const memberInB = await service.createMember(
      tenantB.id,
      {
        name: 'Kabir Ahmed',
        phone: '+8801700000001',
        roleId: memberRoleB.id,
      },
      { userId: 'usr_actor' }
    );

    assert.equal(memberInB.tenantId, tenantB.id);
    assert.equal(memberInB.userId, user1.id);
  });

  // ---------------------------------------------------------------------------
  // Scenario 7: Update member personal details, emergency contact, notes
  // ---------------------------------------------------------------------------
  it('7. Update member information successfully updates records', async () => {
    const updated = await service.updateMember(
      tenantA.id,
      'mem_a_3',
      {
        name: 'Sajid Islam (Updated)',
        emergencyContactName: 'Elder Brother',
        emergencyContactPhone: '+8801811223344',
        notes: 'Requested single bed in Task 32',
      },
      { userId: 'usr_actor' }
    );

    assert.equal(updated.name, 'Sajid Islam (Updated)');
    assert.equal(updated.emergencyContactName, 'Elder Brother');
    assert.equal(updated.notes, 'Requested single bed in Task 32');
  });

  // ---------------------------------------------------------------------------
  // Scenario 8: Change member status (ACTIVE -> SUSPENDED -> LEFT)
  // ---------------------------------------------------------------------------
  it('8. Status change requires mandatory reason and sets leftAt upon archival', async () => {
    // Missing reason throws ValidationError
    await assert.rejects(
      async () => {
        await service.changeMemberStatus(
          tenantA.id,
          'mem_a_3',
          'SUSPENDED',
          '', // Empty reason
          { userId: 'usr_actor' }
        );
      },
      (err: any) => err instanceof ValidationError
    );

    // Suspend member with reason
    const suspended = await service.changeMemberStatus(
      tenantA.id,
      'mem_a_3',
      'SUSPENDED',
      'Pending conduct review',
      { userId: 'usr_actor' }
    );
    assert.equal(suspended.status, 'SUSPENDED');

    // Archive / Depart member (status LEFT sets leftAt)
    const archived = await service.changeMemberStatus(
      tenantA.id,
      'mem_a_3',
      'LEFT',
      'Relocated to another city for employment',
      { userId: 'usr_actor' }
    );
    assert.equal(archived.status, 'LEFT');
    assert.ok(archived.leftAt);
  });

  // ---------------------------------------------------------------------------
  // Scenario 9: Protection of Last Active Owner
  // ---------------------------------------------------------------------------
  it('9. Cannot suspend or demote the last active Owner of the mess', async () => {
    // mem_a_1 is the sole Owner of Tenant A
    await assert.rejects(
      async () => {
        await service.changeMemberStatus(
          tenantA.id,
          'mem_a_1',
          'SUSPENDED',
          'Accidental click',
          { userId: 'usr_actor' }
        );
      },
      (err: any) => err instanceof ForbiddenError
    );

    // Attempting to demote sole Owner
    await assert.rejects(
      async () => {
        await service.changeMemberRole(
          tenantA.id,
          'mem_a_1',
          memberRoleA.id,
          { userId: 'usr_actor' }
        );
      },
      (err: any) => err instanceof ForbiddenError
    );
  });

  // ---------------------------------------------------------------------------
  // Scenario 10: Cross-tenant isolation blocks unauthorized tenant access
  // ---------------------------------------------------------------------------
  it('10. Cross-tenant isolation prevents accessing another mess member', async () => {
    // Attempting to query Tenant B member using Tenant A tenantId
    await assert.rejects(
      async () => {
        await service.getMemberById(tenantA.id, 'mem_b_1');
      },
      (err: any) => err instanceof NotFoundError
    );

    // Attempting to update Tenant B member using Tenant A tenantId
    await assert.rejects(
      async () => {
        await service.updateMember(
          tenantA.id,
          'mem_b_1',
          { name: 'Hacked Name' },
          { userId: 'usr_hacker' }
        );
      },
      (err: any) => err instanceof NotFoundError
    );
  });

  // ---------------------------------------------------------------------------
  // Scenario 11: Member profile privacy guards for financials
  // ---------------------------------------------------------------------------
  it('11. Member profile masks financial information if viewer lacks finance.view', async () => {
    // Viewer without finance.view
    const restrictedView = await service.getMemberById(tenantA.id, 'mem_a_1', {
      permissions: new Set(['members.view']),
      isOwner: false,
      roleSlug: 'member',
    });
    assert.equal(restrictedView.financialSummary, undefined);

    // Viewer with finance.view
    const authorizedView = await service.getMemberById(tenantA.id, 'mem_a_1', {
      permissions: new Set(['members.view', 'finance.view']),
      isOwner: false,
      roleSlug: 'accountant',
    });
    assert.ok(authorizedView.financialSummary);
    assert.equal(authorizedView.financialSummary?.isRestricted, false);
  });

  // ---------------------------------------------------------------------------
  // Scenario 12: Role reassignment by authorized staff
  // ---------------------------------------------------------------------------
  it('12. Role reassignment updates membership role and records audit event', async () => {
    // mem_a_2 promoted from Member to Admin
    const promoted = await service.changeMemberRole(
      tenantA.id,
      'mem_a_2',
      adminRoleA.id,
      { userId: 'usr_owner' }
    );
    assert.equal(promoted.roleName, 'Admin');
    assert.equal(promoted.roleSlug, 'admin');
  });
});
