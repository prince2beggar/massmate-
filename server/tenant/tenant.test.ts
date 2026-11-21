import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  TenantContextService,
  TenantScopedDb,
  extractTenantSlugFromHost,
  resolveTenantIdentifier,
  RESERVED_PLATFORM_SUBDOMAINS,
  RLS_POLICY_SQL,
  RLS_ISOLATED_TABLES,
  UnauthenticatedError,
  TenantNotFoundError,
  TenantAccessDeniedError,
  MembershipInactiveError,
  TenantSuspendedError,
  TenantInactiveError,
  PermissionDeniedError,
  CrossTenantViolationError,
} from './index';
import {
  PERMISSION_CATALOG,
  getSystemRoleTemplate,
} from '../rbac';

// -----------------------------------------------------------------------------
// In-Memory Test Fixtures & Mock Database
// -----------------------------------------------------------------------------

interface MockTenant {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'INACTIVE';
}

interface MockRole {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  rolePermissions: Array<{ permission: { key: string } }>;
}

interface MockMembership {
  id: string;
  userId: string;
  tenantId: string;
  roleId: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LEFT';
  role: MockRole;
}

function createMockTenantDatabase() {
  const tenants: MockTenant[] = [];
  const roles: MockRole[] = [];
  const memberships: MockMembership[] = [];

  function addTenant(id: string, name: string, slug: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'INACTIVE' = 'ACTIVE'): MockTenant {
    const t: MockTenant = { id, name, slug, status };
    tenants.push(t);
    return t;
  }

  function addRole(tenantId: string, slug: string, name: string): MockRole {
    const tmpl = getSystemRoleTemplate(slug as any);
    const roleId = `role_${tenantId}_${slug}`;
    const role: MockRole = {
      id: roleId,
      tenantId,
      name,
      slug,
      rolePermissions: (tmpl?.permissionKeys || []).map((k) => ({
        permission: { key: k },
      })),
    };
    roles.push(role);
    return role;
  }

  function addMembership(
    id: string,
    userId: string,
    tenantId: string,
    role: MockRole,
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LEFT' = 'ACTIVE'
  ): MockMembership {
    const m: MockMembership = { id, userId, tenantId, roleId: role.id, status, role };
    memberships.push(m);
    return m;
  }

  const dbClient = {
    tenants,
    roles,
    memberships,
    addTenant,
    addRole,
    addMembership,

    tenant: {
      findFirst: async ({ where }: any) => {
        if (where.OR) {
          return (
            tenants.find((t) =>
              where.OR.some(
                (cond: any) =>
                  (cond.id && t.id === cond.id) || (cond.slug && t.slug === cond.slug)
              )
            ) || null
          );
        }
        return null;
      },
    },

    membership: {
      findUnique: async ({ where }: any) => {
        if (where.userId_tenantId) {
          const { userId, tenantId } = where.userId_tenantId;
          return memberships.find((m) => m.userId === userId && m.tenantId === tenantId) || null;
        }
        return null;
      },
      findFirst: async ({ where }: any) => {
        return (
          memberships.find((m) => {
            if (where.id && m.id !== where.id) return false;
            if (where.tenantId && m.tenantId !== where.tenantId) return false;
            return true;
          }) || null
        );
      },
      findMany: async ({ where }: any) => {
        return memberships.filter((m) => {
          if (where.tenantId && m.tenantId !== where.tenantId) return false;
          if (where.status && m.status !== where.status) return false;
          return true;
        });
      },
      count: async ({ where }: any) => {
        return memberships.filter((m) => {
          if (where.tenantId && m.tenantId !== where.tenantId) return false;
          if (where.status && m.status !== where.status) return false;
          return true;
        }).length;
      },
    },

    role: {
      findFirst: async ({ where }: any) => {
        return (
          roles.find((r) => {
            if (where.id && r.id !== where.id) return false;
            if (where.tenantId && r.tenantId !== where.tenantId) return false;
            return true;
          }) || null
        );
      },
      findMany: async ({ where }: any) => {
        return roles.filter((r) => r.tenantId === where.tenantId);
      },
    },

    permission: {},
    rolePermission: {},
  };

  return dbClient;
}

// -----------------------------------------------------------------------------
// Test Suite: Multi-Tenant Context & Data Isolation
// -----------------------------------------------------------------------------

describe('Task 22: Multi-Tenant Context & Data Isolation', () => {
  let db: ReturnType<typeof createMockTenantDatabase>;
  let contextService: TenantContextService;

  const TENANT_A_ID = 'tnt_prince_mess_101';
  const TENANT_B_ID = 'tnt_green_view_202';
  const TENANT_SUSP_ID = 'tnt_suspended_303';

  beforeEach(() => {
    db = createMockTenantDatabase();
    contextService = new TenantContextService(db as any);

    // Setup Tenant A (Prince Mess)
    db.addTenant(TENANT_A_ID, 'Prince Mess', 'prince-mess', 'ACTIVE');
    const ownerRoleA = db.addRole(TENANT_A_ID, 'owner', 'Owner');
    const adminRoleA = db.addRole(TENANT_A_ID, 'admin', 'Admin');
    const memberRoleA = db.addRole(TENANT_A_ID, 'member', 'Member');

    // Setup Tenant B (Green View Hostel)
    db.addTenant(TENANT_B_ID, 'Green View Hostel', 'green-view', 'ACTIVE');
    const memberRoleB = db.addRole(TENANT_B_ID, 'member', 'Member');

    // Setup Suspended Tenant
    db.addTenant(TENANT_SUSP_ID, 'Suspended Mess', 'suspended-mess', 'SUSPENDED');
    const ownerRoleSusp = db.addRole(TENANT_SUSP_ID, 'owner', 'Owner');
    db.addMembership('mem_susp_owner', 'usr_susp_owner', TENANT_SUSP_ID, ownerRoleSusp, 'ACTIVE');

    // User 1 (Asad): Owner in Tenant A, Member in Tenant B
    db.addMembership('mem_asad_A', 'usr_asad', TENANT_A_ID, ownerRoleA, 'ACTIVE');
    db.addMembership('mem_asad_B', 'usr_asad', TENANT_B_ID, memberRoleB, 'ACTIVE');

    // User 2 (Rahim): Member in Tenant A only
    db.addMembership('mem_rahim_A', 'usr_rahim', TENANT_A_ID, memberRoleA, 'ACTIVE');
  });

  // ---------------------------------------------------------------------------
  // Routing & Hostname Resolution Tests
  // ---------------------------------------------------------------------------
  it('12. Hostname resolution extracts subdomains and protects reserved domains', () => {
    assert.equal(extractTenantSlugFromHost('prince-mess.messmate.com'), 'prince-mess');
    assert.equal(extractTenantSlugFromHost('green-view.messmate.com'), 'green-view');
    assert.equal(extractTenantSlugFromHost('prince-mess.localhost:3000'), 'prince-mess');

    // Platform reserved subdomains must return null
    assert.equal(extractTenantSlugFromHost('app.messmate.com'), null);
    assert.equal(extractTenantSlugFromHost('admin.messmate.com'), null);
    assert.equal(extractTenantSlugFromHost('api.messmate.com'), null);
    assert.equal(extractTenantSlugFromHost('messmate.com'), null);
    assert.equal(extractTenantSlugFromHost('localhost:3000'), null);
    assert.equal(extractTenantSlugFromHost('192.168.1.1'), null);

    // resolveTenantIdentifier priority
    assert.equal(
      resolveTenantIdentifier({ slug: 'custom-slug', hostname: 'prince-mess.messmate.com' }),
      'custom-slug',
      'Explicit slug param takes precedence over host'
    );
    assert.equal(
      resolveTenantIdentifier({ headers: { 'x-tenant-slug': 'header-slug' } }),
      'header-slug',
      'Header slug resolves cleanly'
    );
  });

  // ---------------------------------------------------------------------------
  // 1. Valid Tenant Access
  // ---------------------------------------------------------------------------
  it('1. Valid tenant access establishes complete verified TenantContext', async () => {
    const ctx = await contextService.resolveTenantContext({
      userId: 'usr_asad',
      slug: 'prince-mess',
    });

    assert.equal(ctx.userId, 'usr_asad');
    assert.equal(ctx.tenantId, TENANT_A_ID);
    assert.equal(ctx.tenantSlug, 'prince-mess');
    assert.equal(ctx.tenantName, 'Prince Mess');
    assert.equal(ctx.tenantStatus, 'ACTIVE');
    assert.equal(ctx.membershipStatus, 'ACTIVE');
    assert.equal(ctx.roleSlug, 'owner');
    assert.equal(ctx.isOwner, true);
    assert.ok(ctx.permissions.has('settings.manage'));
    assert.ok(ctx.permissions.has('finance.manage'));
  });

  // ---------------------------------------------------------------------------
  // 2 & 12. Invalid Tenant Access / Missing Identifier
  // ---------------------------------------------------------------------------
  it('2. Invalid or unauthenticated tenant access is rejected', async () => {
    // Missing user ID
    await assert.rejects(
      contextService.resolveTenantContext({ userId: null, slug: 'prince-mess' }),
      UnauthenticatedError
    );

    // Non-existent tenant slug
    await assert.rejects(
      contextService.resolveTenantContext({ userId: 'usr_asad', slug: 'non-existent-mess' }),
      TenantNotFoundError
    );
  });

  // ---------------------------------------------------------------------------
  // 3 & Scenario A. Missing Membership / User Not a Member of Tenant B
  // ---------------------------------------------------------------------------
  it('3 & Scenario A: User A (not a member of Tenant B) cannot access Tenant B resources', async () => {
    // User Rahim is ONLY in Tenant A, NOT in Tenant B
    await assert.rejects(
      contextService.resolveTenantContext({
        userId: 'usr_rahim',
        tenantId: TENANT_B_ID,
      }),
      TenantAccessDeniedError
    );
  });

  // ---------------------------------------------------------------------------
  // 4. Inactive Membership (PENDING, SUSPENDED, LEFT)
  // ---------------------------------------------------------------------------
  it('4. Inactive membership states (PENDING, SUSPENDED, LEFT) are denied access', async () => {
    const memberRole = db.roles.find((r) => r.tenantId === TENANT_A_ID && r.slug === 'member')!;

    db.addMembership('mem_p1', 'usr_pend', TENANT_A_ID, memberRole, 'PENDING');
    db.addMembership('mem_s1', 'usr_susp', TENANT_A_ID, memberRole, 'SUSPENDED');
    db.addMembership('mem_l1', 'usr_left', TENANT_A_ID, memberRole, 'LEFT');

    await assert.rejects(
      contextService.resolveTenantContext({ userId: 'usr_pend', tenantId: TENANT_A_ID }),
      MembershipInactiveError
    );
    await assert.rejects(
      contextService.resolveTenantContext({ userId: 'usr_susp', tenantId: TENANT_A_ID }),
      MembershipInactiveError
    );
    await assert.rejects(
      contextService.resolveTenantContext({ userId: 'usr_left', tenantId: TENANT_A_ID }),
      MembershipInactiveError
    );
  });

  // ---------------------------------------------------------------------------
  // 5 & Scenario E. Suspended Tenant
  // ---------------------------------------------------------------------------
  it('5 & Scenario E: Suspended tenant access is rejected with TENANT_SUSPENDED', async () => {
    await assert.rejects(
      contextService.resolveTenantContext({
        userId: 'usr_susp_owner',
        tenantId: TENANT_SUSP_ID,
      }),
      TenantSuspendedError
    );
  });

  // ---------------------------------------------------------------------------
  // 6 & Scenario D. Cross-Tenant Record Access via TenantScopedDb
  // ---------------------------------------------------------------------------
  it('6 & Scenario D: TenantScopedDb isolates queries to authorized tenantId only', async () => {
    const scopedDbA = new TenantScopedDb(TENANT_A_ID, db as any);
    const scopedDbB = new TenantScopedDb(TENANT_B_ID, db as any);

    // List memberships in Tenant A
    const membersA = await scopedDbA.memberships.findMany();
    const membersB = await scopedDbB.memberships.findMany();

    // Verify memberships in Tenant A do not bleed into Tenant B
    assert.ok(membersA.every((m) => m.tenantId === TENANT_A_ID));
    assert.ok(membersB.every((m) => m.tenantId === TENANT_B_ID));
    assert.notEqual(membersA.length, membersB.length);

    // Attempting to look up a Tenant B role through Tenant A's scoped DB returns null
    const roleB = db.roles.find((r) => r.tenantId === TENANT_B_ID)!;
    const lookupFromA = await scopedDbA.roles.findUnique(roleB.id);
    assert.equal(lookupFromA, null, 'Tenant A DB must NOT find a Tenant B role');
  });

  // ---------------------------------------------------------------------------
  // 7. Cross-Tenant Relationship Reference Prevention
  // ---------------------------------------------------------------------------
  it('7. Cross-tenant relationship attempts are blocked with CrossTenantViolationError', async () => {
    const scopedDbA = new TenantScopedDb(TENANT_A_ID, db as any);
    const roleB = db.roles.find((r) => r.tenantId === TENANT_B_ID)!;

    // Tenant A attempts to reference a Tenant B role
    await assert.rejects(
      scopedDbA.ensureBelongsToTenant('roles', roleB.id),
      CrossTenantViolationError
    );
  });

  // ---------------------------------------------------------------------------
  // 8 & Scenario B. Different Roles in Different Tenants
  // ---------------------------------------------------------------------------
  it('8 & Scenario B: Same User holds independent roles and permissions in each tenant', async () => {
    const ctxA = await contextService.resolveTenantContext({
      userId: 'usr_asad',
      slug: 'prince-mess',
    });
    const ctxB = await contextService.resolveTenantContext({
      userId: 'usr_asad',
      slug: 'green-view',
    });

    assert.equal(ctxA.roleSlug, 'owner');
    assert.equal(ctxB.roleSlug, 'member');

    // Owner has settings.manage in Tenant A
    assert.ok(ctxA.permissions.has('settings.manage'));
    // Standard Member does NOT have settings.manage in Tenant B
    assert.ok(!ctxB.permissions.has('settings.manage'));

    // requireTenantPermission succeeds in Tenant A, fails in Tenant B
    await contextService.requireTenantPermission(ctxA, 'settings.manage');
    await assert.rejects(
      contextService.requireTenantPermission(ctxB, 'settings.manage'),
      PermissionDeniedError
    );
  });

  // ---------------------------------------------------------------------------
  // 9 & Scenario C. Unauthorized Tenant ID Manipulation
  // ---------------------------------------------------------------------------
  it('9 & Scenario C: Client sending arbitrary tenant ID is rejected unless user is active member', async () => {
    // User Rahim is ONLY in Tenant A. Client attempts to pass Tenant B's ID.
    await assert.rejects(
      contextService.resolveTenantContext({
        userId: 'usr_rahim',
        tenantId: TENANT_B_ID,
      }),
      TenantAccessDeniedError
    );
  });

  // ---------------------------------------------------------------------------
  // 10 & 11 & Scenario F. PostgreSQL RLS Policies & Transaction-Scoped Isolation
  // ---------------------------------------------------------------------------
  it('10 & 11 & Scenario F: PostgreSQL RLS policies enforce transaction-scoped isolation', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'prisma/migrations/20261121010000_enable_tenant_rls/migration.sql'
    );

    assert.ok(fs.existsSync(migrationPath), 'RLS migration SQL must exist');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Verifies RLS is enabled and forced on roles and memberships
    assert.ok(sql.includes('ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY'));
    assert.ok(sql.includes('ALTER TABLE "roles" FORCE ROW LEVEL SECURITY'));
    assert.ok(sql.includes('ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY'));
    assert.ok(sql.includes('ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY'));

    // 2. Verifies policy uses transaction-local session setting app.current_tenant_id
    assert.ok(sql.includes('current_setting(\'app.current_tenant_id\', true)'));

    // 3. Verifies RLS table catalog definition
    assert.deepEqual(RLS_ISOLATED_TABLES, ['roles', 'memberships']);
  });
});
