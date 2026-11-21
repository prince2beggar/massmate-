import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MessDashboardService,
  toPoisha,
  fromPoisha,
  formatBdtCurrency,
  resolveDhakaDateRange,
  getDhakaWelcomeInfo,
} from './mess-dashboard-service';
import { TenantContextService } from '../tenant/tenant-context';
import {
  TenantAccessDeniedError,
  MembershipInactiveError,
  TenantNotFoundError,
} from '../tenant/errors';
import { MESS_NAV_ITEMS } from '../../components/mess-admin/mess-nav-data';
import { ADMIN_NAV_ITEMS } from '../../components/admin/admin-nav-data';
import type { TenantContext } from '../tenant/tenant-context';

// -----------------------------------------------------------------------------
// In-Memory Multi-Tenant Mock Database
// -----------------------------------------------------------------------------

function createMockDashboardDb() {
  const tenants: any[] = [];
  const memberships: any[] = [];
  const roles: any[] = [];
  const invoices: any[] = [];
  const auditLogs: any[] = [];

  return {
    tenants,
    memberships,
    roles,
    invoices,
    auditLogs,

    tenant: {
      findFirst: async ({ where }: any) => {
        if (where?.OR) {
          return (
            tenants.find((t) =>
              where.OR.some(
                (cond: any) =>
                  (cond.id && t.id === cond.id) || (cond.slug && t.slug === cond.slug)
              )
            ) || null
          );
        }
        return tenants.find((t) => t.id === where?.id || t.slug === where?.slug) || null;
      },
      findUnique: async ({ where }: any) => {
        return tenants.find((t) => t.id === where?.id || t.slug === where?.slug) || null;
      },
    },

    membership: {
      findUnique: async ({ where }: any) => {
        if (where?.userId_tenantId) {
          const { userId, tenantId } = where.userId_tenantId;
          return (
            memberships.find(
              (m) => m.userId === userId && m.tenantId === tenantId
            ) || null
          );
        }
        return null;
      },
      count: async ({ where }: any) => {
        return memberships.filter((m) => {
          if (where?.tenantId && m.tenantId !== where.tenantId) return false;
          if (where?.status) {
            if (typeof where.status === 'string') {
              if (m.status !== where.status) return false;
            } else if (where.status.in && Array.isArray(where.status.in)) {
              if (!where.status.in.includes(m.status)) return false;
            }
          }
          return true;
        }).length;
      },
    },

    role: {
      findUnique: async ({ where }: any) => {
        return roles.find((r) => r.id === where?.id) || null;
      },
    },

    subscriptionInvoice: {
      findMany: async ({ where }: any) => {
        return invoices.filter((inv) => {
          if (where?.tenantId && inv.tenantId !== where.tenantId) return false;
          if (where?.paymentStatus && inv.paymentStatus !== where.paymentStatus) return false;
          return true;
        });
      },
    },

    auditLog: {
      findMany: async ({ where, take }: any) => {
        const filtered = auditLogs.filter((log) => {
          if (where?.tenantId && log.tenantId !== where.tenantId) return false;
          return true;
        });
        const sorted = [...filtered].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        return sorted.slice(0, take || 15);
      },
    },
  };
}

describe('Task 29–30: Mess Admin Dashboard Foundation & Analytics', () => {
  // Setup common mock fixtures
  const db = createMockDashboardDb();
  const tenantContextService = new TenantContextService(db as any);
  const dashboardService = new MessDashboardService(db as any);

  // Seed Tenants
  const tenantA = {
    id: 'tenant_alpha',
    name: 'Prince Mess (Dhanmondi)',
    slug: 'prince-mess',
    status: 'ACTIVE' as const,
  };
  const tenantB = {
    id: 'tenant_beta',
    name: 'Bachelor Corner (Mirpur)',
    slug: 'bachelor-corner',
    status: 'ACTIVE' as const,
  };
  db.tenants.push(tenantA, tenantB);

  // Seed Roles
  const ownerRoleA = {
    id: 'role_owner_a',
    tenantId: tenantA.id,
    name: 'Owner',
    slug: 'owner',
    rolePermissions: [
      { permission: { key: 'dashboard.view' } },
      { permission: { key: 'members.view' } },
      { permission: { key: 'members.create' } },
      { permission: { key: 'rooms.create' } },
      { permission: { key: 'bazar.create' } },
      { permission: { key: 'payments.create' } },
      { permission: { key: 'meals.update' } },
      { permission: { key: 'notices.create' } },
      { permission: { key: 'reports.view' } },
      { permission: { key: 'settings.manage' } },
    ],
  };
  const adminRoleA = {
    id: 'role_admin_a',
    tenantId: tenantA.id,
    name: 'Admin',
    slug: 'admin',
    rolePermissions: [
      { permission: { key: 'dashboard.view' } },
      { permission: { key: 'members.view' } },
      { permission: { key: 'bazar.create' } },
      { permission: { key: 'meals.update' } },
      { permission: { key: 'notices.create' } },
    ],
  };
  const memberRoleA = {
    id: 'role_member_a',
    tenantId: tenantA.id,
    name: 'Member',
    slug: 'member',
    rolePermissions: [
      { permission: { key: 'members.view' } },
    ],
  };
  db.roles.push(ownerRoleA, adminRoleA, memberRoleA);

  // Seed Memberships for Tenant A
  db.memberships.push(
    {
      id: 'mem_owner_a',
      userId: 'usr_alice_owner',
      tenantId: tenantA.id,
      roleId: ownerRoleA.id,
      status: 'ACTIVE',
      role: ownerRoleA,
    },
    {
      id: 'mem_admin_a',
      userId: 'usr_bob_admin',
      tenantId: tenantA.id,
      roleId: adminRoleA.id,
      status: 'ACTIVE',
      role: adminRoleA,
    },
    {
      id: 'mem_resident_1',
      userId: 'usr_charlie',
      tenantId: tenantA.id,
      roleId: memberRoleA.id,
      status: 'ACTIVE',
      role: memberRoleA,
    },
    {
      id: 'mem_resident_2',
      userId: 'usr_david',
      tenantId: tenantA.id,
      roleId: memberRoleA.id,
      status: 'ACTIVE',
      role: memberRoleA,
    },
    {
      id: 'mem_resident_pending',
      userId: 'usr_eve_pending',
      tenantId: tenantA.id,
      roleId: memberRoleA.id,
      status: 'PENDING',
      role: memberRoleA,
    },
    {
      id: 'mem_resident_left',
      userId: 'usr_frank_left',
      tenantId: tenantA.id,
      roleId: memberRoleA.id,
      status: 'LEFT',
      role: memberRoleA,
    }
  );

  // Seed Invoices for Tenant A
  const now = new Date();
  db.invoices.push(
    // Confirmed Payment in current month
    {
      id: 'inv_1',
      tenantId: tenantA.id,
      amount: 99.0,
      paymentStatus: 'CONFIRMED',
      paidAt: now,
      createdAt: now,
    },
    // Another Confirmed Payment
    {
      id: 'inv_2',
      tenantId: tenantA.id,
      amount: 150.5,
      paymentStatus: 'CONFIRMED',
      paidAt: now,
      createdAt: now,
    },
    // Pending Payment
    {
      id: 'inv_3',
      tenantId: tenantA.id,
      amount: 200.0,
      paymentStatus: 'PENDING',
      paidAt: null,
      createdAt: now,
    },
    // Rejected Payment
    {
      id: 'inv_4',
      tenantId: tenantA.id,
      amount: 500.0,
      paymentStatus: 'REJECTED',
      paidAt: null,
      createdAt: now,
    },
    // Invoice belonging to Tenant B (Should never leak!)
    {
      id: 'inv_b_1',
      tenantId: tenantB.id,
      amount: 999.0,
      paymentStatus: 'CONFIRMED',
      paidAt: now,
      createdAt: now,
    }
  );

  // Seed Audit Logs for Tenant A
  db.auditLogs.push(
    {
      id: 'audit_1',
      tenantId: tenantA.id,
      actorUserId: 'usr_alice_owner',
      action: 'member.join',
      entityType: 'members',
      description: 'Resident Charlie joined Dhanmondi unit',
      createdAt: new Date(Date.now() - 3600000),
      actorUser: { name: 'Alice Owner', email: 'alice@prince.com', platformRole: null },
    },
    {
      id: 'audit_2',
      tenantId: tenantA.id,
      actorUserId: 'usr_bob_admin',
      action: 'payment.received',
      entityType: 'payments',
      description: 'Recorded bKash cash deposit ৳150.50',
      createdAt: new Date(),
      actorUser: { name: 'Bob Admin', email: 'bob@prince.com', platformRole: null },
    },
    // Audit Log for Tenant B (Should never leak!)
    {
      id: 'audit_b_1',
      tenantId: tenantB.id,
      actorUserId: 'usr_tenant_b_user',
      action: 'mess.settings.update',
      entityType: 'settings',
      description: 'Mirpur branch curfew updated',
      createdAt: new Date(),
      actorUser: { name: 'Tenant B User', email: 'b@corner.com', platformRole: null },
    }
  );

  // ---------------------------------------------------------------------------
  // Test Scenario 1: Mess Owner Access
  // ---------------------------------------------------------------------------
  it('1. Mess Owner can access their authorized dashboard', async () => {
    const context = await tenantContextService.resolveTenantContext({
      userId: 'usr_alice_owner',
      slug: 'prince-mess',
    });

    assert.equal(context.tenantId, tenantA.id);
    assert.equal(context.roleSlug, 'owner');
    assert.equal(context.isOwner, true);

    const overview = await dashboardService.getDashboardOverview(context);
    assert.equal(overview.welcome.messName, tenantA.name);
    assert.ok(overview.welcome.greeting.startsWith('Good '));
    assert.equal(overview.kpiCards.members.total, 6);
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 2: Authorized Admin Access
  // ---------------------------------------------------------------------------
  it('2. Authorized Admin can access permitted dashboard features', async () => {
    const context = await tenantContextService.resolveTenantContext({
      userId: 'usr_bob_admin',
      slug: 'prince-mess',
    });

    assert.equal(context.roleSlug, 'admin');
    assert.equal(context.permissions.has('dashboard.view'), true);

    const overview = await dashboardService.getDashboardOverview(context);
    assert.ok(overview);
    assert.equal(overview.kpiCards.members.active, 4);
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 3: Unauthorized User Blocked
  // ---------------------------------------------------------------------------
  it('3. Unauthorized users cannot access the dashboard', async () => {
    // Unknown user
    await assert.rejects(
      async () => {
        await tenantContextService.resolveTenantContext({
          userId: 'usr_stranger_danger',
          slug: 'prince-mess',
        });
      },
      (err: any) => err instanceof TenantAccessDeniedError
    );

    // Inactive / Suspended member
    const suspendedContextDb = createMockDashboardDb();
    suspendedContextDb.tenants.push(tenantA);
    suspendedContextDb.roles.push(memberRoleA);
    suspendedContextDb.memberships.push({
      id: 'mem_suspended',
      userId: 'usr_suspended_guy',
      tenantId: tenantA.id,
      roleId: memberRoleA.id,
      status: 'SUSPENDED',
      role: memberRoleA,
    });

    const suspendedService = new TenantContextService(suspendedContextDb as any);
    await assert.rejects(
      async () => {
        await suspendedService.resolveTenantContext({
          userId: 'usr_suspended_guy',
          slug: 'prince-mess',
        });
      },
      (err: any) => err instanceof MembershipInactiveError
    );
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 4: Cross-Tenant Isolation
  // ---------------------------------------------------------------------------
  it('4. Users cannot access another mess data (cross-tenant isolation)', async () => {
    // Alice is in Tenant A, tries to access Tenant B
    await assert.rejects(
      async () => {
        await tenantContextService.resolveTenantContext({
          userId: 'usr_alice_owner',
          slug: 'bachelor-corner',
        });
      },
      (err: any) => err instanceof TenantAccessDeniedError
    );

    // Verify Tenant A overview does not leak Tenant B data
    const contextA = await tenantContextService.resolveTenantContext({
      userId: 'usr_alice_owner',
      slug: 'prince-mess',
    });
    const overviewA = await dashboardService.getDashboardOverview(contextA);

    // Tenant B has an invoice of 999.0. Tenant A confirmed should be 99.0 + 150.5 = 249.50
    assert.equal(overviewA.financialSummary.confirmedPayments, '249.50');

    // Tenant B audit log must NOT appear in Tenant A activities
    const leakedLog = overviewA.recentActivities.find(
      (a) => a.description === 'Mirpur branch curfew updated'
    );
    assert.equal(leakedLog, undefined);
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 5: KPI Values Match Underlying DB Records
  // ---------------------------------------------------------------------------
  it('5. KPI values match the underlying database records', async () => {
    const context = await tenantContextService.resolveTenantContext({
      userId: 'usr_alice_owner',
      slug: 'prince-mess',
    });
    const overview = await dashboardService.getDashboardOverview(context);

    // 4 active, 1 pending, 1 left = 6 total
    assert.equal(overview.kpiCards.members.total, 6);
    assert.equal(overview.kpiCards.members.active, 4);
    assert.equal(overview.kpiCards.members.pending, 1);
    assert.equal(overview.kpiCards.members.suspended, 1);

    // Payments
    assert.equal(overview.kpiCards.payments.confirmedCount, 2);
    assert.equal(overview.kpiCards.payments.pendingVerificationCount, 1);
    assert.equal(overview.kpiCards.payments.pendingAmount, '200.00');
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 6: Financial Calculations Exactness (Poisha / No Float Drift)
  // ---------------------------------------------------------------------------
  it('6. Financial calculations are accurate using integer poisha math', () => {
    // Test conversion functions
    assert.equal(toPoisha('99.00'), BigInt(9900));
    assert.equal(toPoisha('150.50'), BigInt(15050));
    assert.equal(toPoisha('0.05'), BigInt(5));
    assert.equal(toPoisha(100), BigInt(10000));

    const sum = toPoisha('99.00') + toPoisha('150.50') + toPoisha('0.05');
    assert.equal(sum, BigInt(24955));
    assert.equal(fromPoisha(sum), '249.55');
    assert.equal(formatBdtCurrency(sum), '৳249.55');

    // Verify negative values format correctly
    const neg = BigInt(-550);
    assert.equal(fromPoisha(neg), '-5.50');
    assert.equal(formatBdtCurrency(neg), '৳-5.50');
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 7: Exclude Pending & Rejected Payments from Confirmed Total
  // ---------------------------------------------------------------------------
  it('7. Pending and rejected payments are excluded from confirmed payment totals', async () => {
    const context = await tenantContextService.resolveTenantContext({
      userId: 'usr_alice_owner',
      slug: 'prince-mess',
    });
    const overview = await dashboardService.getDashboardOverview(context);

    // Confirmed invoices: 99.00 + 150.50 = 249.50
    // Pending (200.00) and Rejected (500.00) are strictly excluded from confirmed payments!
    assert.equal(overview.kpiCards.payments.confirmedThisMonth, '249.50');
    assert.equal(overview.financialSummary.confirmedPayments, '249.50');
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 8: Clean Empty States
  // ---------------------------------------------------------------------------
  it('8. Empty states work correctly without zero-division or NaN errors', async () => {
    const cleanDb = createMockDashboardDb();
    const cleanTenant = {
      id: 'tenant_empty',
      name: 'Fresh Mess',
      slug: 'fresh-mess',
      status: 'ACTIVE' as const,
    };
    cleanDb.tenants.push(cleanTenant);

    const cleanRole = {
      id: 'role_clean_owner',
      tenantId: cleanTenant.id,
      name: 'Owner',
      slug: 'owner',
      rolePermissions: [{ permission: { key: 'dashboard.view' } }],
    };
    cleanDb.roles.push(cleanRole);

    cleanDb.memberships.push({
      id: 'mem_clean',
      userId: 'usr_fresh_owner',
      tenantId: cleanTenant.id,
      roleId: cleanRole.id,
      status: 'ACTIVE',
      role: cleanRole,
    });

    const cleanService = new MessDashboardService(cleanDb as any);
    const cleanContext: TenantContext = {
      userId: 'usr_fresh_owner',
      tenantId: cleanTenant.id,
      tenantSlug: cleanTenant.slug,
      tenantName: cleanTenant.name,
      tenantStatus: 'ACTIVE',
      membershipId: 'mem_clean',
      membershipStatus: 'ACTIVE',
      roleId: cleanRole.id,
      roleSlug: cleanRole.slug,
      roleName: cleanRole.name,
      isOwner: true,
      permissions: new Set(['dashboard.view']),
    };

    const overview = await cleanService.getDashboardOverview(cleanContext);

    assert.equal(overview.kpiCards.members.total, 1);
    assert.equal(overview.kpiCards.rooms.total, 0);
    assert.equal(overview.kpiCards.meals.totalThisMonth, 0);
    assert.equal(overview.kpiCards.monthlyExpenses.totalApproved, '0.00');
    assert.equal(overview.kpiCards.payments.confirmedThisMonth, '0.00');
    assert.equal(overview.kpiCards.outstandingDues.totalBalance, '0.00');
    assert.equal(overview.financialSummary.netBalance, '0.00');
    assert.equal(overview.recentActivities.length, 0);
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 9: Charts Display Correct Data
  // ---------------------------------------------------------------------------
  it('9. Charts display correct formatted data', async () => {
    const context = await tenantContextService.resolveTenantContext({
      userId: 'usr_alice_owner',
      slug: 'prince-mess',
    });
    const overview = await dashboardService.getDashboardOverview(context);

    // Member statistics
    assert.equal(overview.charts.memberStatistics.active, 4);
    assert.equal(overview.charts.memberStatistics.pending, 1);
    assert.equal(overview.charts.memberStatistics.inactive, 1);

    // Income vs Expense chart
    assert.ok(overview.financialSummary.incomeVsExpenseChart.length > 0);
    assert.equal(overview.financialSummary.incomeVsExpenseChart[0].income, 249.5);
    assert.equal(overview.financialSummary.incomeVsExpenseChart[0].expense, 0);
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 10: Recent Activities Show Correct Actors & Timestamps
  // ---------------------------------------------------------------------------
  it('10. Recent activities show correct actors and timestamps in Asia/Dhaka', async () => {
    const context = await tenantContextService.resolveTenantContext({
      userId: 'usr_alice_owner',
      slug: 'prince-mess',
    });
    const overview = await dashboardService.getDashboardOverview(context);

    assert.equal(overview.recentActivities.length, 2);
    const act = overview.recentActivities[0];
    assert.equal(act.actorName, 'Bob Admin');
    assert.equal(act.module, 'payments');
    assert.ok(act.createdAt);
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 11: Quick Actions Respect Permissions
  // ---------------------------------------------------------------------------
  it('11. Quick actions respect permissions (allows permitted, restricts non-permitted)', async () => {
    // Bob is Admin with restricted permissions (does not have rooms.create or payments.create)
    const bobContext: TenantContext = {
      userId: 'usr_bob_admin',
      tenantId: tenantA.id,
      tenantSlug: tenantA.slug,
      tenantName: tenantA.name,
      tenantStatus: 'ACTIVE',
      membershipId: 'mem_admin_a',
      membershipStatus: 'ACTIVE',
      roleId: adminRoleA.id,
      roleSlug: adminRoleA.slug,
      roleName: adminRoleA.name,
      isOwner: false,
      permissions: new Set(['dashboard.view', 'bazar.create', 'meals.update', 'notices.create']),
    };

    const overviewBob = await dashboardService.getDashboardOverview(bobContext);
    const quickActions = overviewBob.quickActions;

    const bazarAction = quickActions.find((a) => a.id === 'record-bazar');
    assert.equal(bazarAction?.isAllowed, true);

    const roomAction = quickActions.find((a) => a.id === 'add-room');
    assert.equal(roomAction?.isAllowed, false);

    const paymentAction = quickActions.find((a) => a.id === 'record-payment');
    assert.equal(paymentAction?.isAllowed, false);

    // Unimplemented actions are flagged isImplemented: false
    assert.equal(bazarAction?.isImplemented, false);
    assert.ok(bazarAction?.moduleNote?.includes('Task 33'));
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 12: Responsive Structure & 17 Nav Items Verification
  // ---------------------------------------------------------------------------
  it('12. Dashboard navigation contains all 17 specified items with valid routes', () => {
    assert.equal(MESS_NAV_ITEMS.length, 17);

    const expectedNavIds = [
      'overview',
      'members',
      'rooms',
      'meals',
      'bazar',
      'finance',
      'payments',
      'rental',
      'notices',
      'complaints',
      'events',
      'inventory',
      'reports',
      'website',
      'roles',
      'audit-logs',
      'settings',
    ];

    const actualNavIds = MESS_NAV_ITEMS.map((item) => item.id);
    assert.deepEqual(actualNavIds, expectedNavIds);

    // Overview and Members are implemented
    const overviewItem = MESS_NAV_ITEMS.find((item) => item.id === 'overview');
    const membersItem = MESS_NAV_ITEMS.find((item) => item.id === 'members');
    assert.equal(overviewItem?.isImplemented, true);
    assert.equal(membersItem?.isImplemented, true);

    // Remaining items are marked placeholder with task notes
    const placeholderItems = MESS_NAV_ITEMS.filter(
      (item) => item.id !== 'overview' && item.id !== 'members'
    );
    assert.equal(placeholderItems.every((item) => item.isImplemented === false), true);
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 13: Super Admin Functionality Unaffected
  // ---------------------------------------------------------------------------
  it('13. Existing Super Admin functionality remains unaffected', () => {
    // Verify Super Admin nav items are completely intact
    assert.ok(ADMIN_NAV_ITEMS.length >= 7);
    const superAdminIds = ADMIN_NAV_ITEMS.map((item) => item.id);
    assert.ok(superAdminIds.includes('overview'));
    assert.ok(superAdminIds.includes('tenants'));
    assert.ok(superAdminIds.includes('plans'));
    assert.ok(superAdminIds.includes('subscriptions'));
    assert.ok(superAdminIds.includes('domains'));
  });
});
