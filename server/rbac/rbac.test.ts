import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  AuthorizationService,
  RoleManagementService,
  PERMISSION_CATALOG,
  SYSTEM_ROLE_TEMPLATES,
  getSystemRoleTemplate,
  isValidPermissionKey,
  ForbiddenError,
  InactiveMembershipError,
  PrivilegeEscalationError,
  OwnerProtectionError,
  CrossTenantError,
  TenantAccessDeniedError,
} from './index';

// -----------------------------------------------------------------------------
// In-Memory Test Fixtures & Mock Database
// -----------------------------------------------------------------------------

interface MockPermission {
  id: string;
  key: string;
  name: string;
  module: string;
  description: string;
}

interface MockRolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: MockPermission;
}

interface MockRole {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  rolePermissions: MockRolePermission[];
}

interface MockMembership {
  id: string;
  userId: string;
  tenantId: string;
  roleId: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LEFT';
  role: MockRole;
}

function createMockDatabase() {
  const permissions: MockPermission[] = PERMISSION_CATALOG.map((p, idx) => ({
    id: `perm_${idx + 1}`,
    key: p.key,
    name: p.name,
    module: p.module,
    description: p.description,
  }));

  const permByKey = new Map<string, MockPermission>(
    permissions.map((p) => [p.key, p])
  );

  const roles: MockRole[] = [];
  const memberships: MockMembership[] = [];

  function helperAddRole(tenantId: string, slug: string, name: string, isSystem = true): MockRole {
    const template = getSystemRoleTemplate(slug as any);
    const roleId = `role_${tenantId}_${slug}`;

    const rolePerms: MockRolePermission[] = (template?.permissionKeys || []).map((pKey, idx) => {
      const p = permByKey.get(pKey);
      return {
        id: `rp_${roleId}_${idx}`,
        roleId,
        permissionId: p ? p.id : `p_unknown_${idx}`,
        permission: p || {
          id: `p_unknown_${idx}`,
          key: pKey,
          name: pKey,
          module: 'custom',
          description: '',
        },
      };
    });

    const newRole: MockRole = {
      id: roleId,
      tenantId,
      name,
      slug,
      description: template?.description || null,
      isSystem,
      status: 'ACTIVE',
      rolePermissions: rolePerms,
    };

    roles.push(newRole);
    return newRole;
  }

  function helperAddMembership(
    id: string,
    userId: string,
    tenantId: string,
    role: MockRole,
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LEFT' = 'ACTIVE'
  ): MockMembership {
    const mem: MockMembership = {
      id,
      userId,
      tenantId,
      roleId: role.id,
      status,
      role,
    };
    memberships.push(mem);
    return mem;
  }

  const dbClient = {
    permissions,
    roles,
    memberships,
    helperAddRole,
    helperAddMembership,

    membership: {
      findUnique: async ({ where }: any) => {
        if (where.userId_tenantId) {
          const { userId, tenantId } = where.userId_tenantId;
          return memberships.find((m) => m.userId === userId && m.tenantId === tenantId) || null;
        }
        if (where.id) {
          return memberships.find((m) => m.id === where.id) || null;
        }
        return null;
      },
      count: async ({ where }: any) => {
        return memberships.filter((m) => {
          if (where.tenantId && m.tenantId !== where.tenantId) return false;
          if (where.status && m.status !== where.status) return false;
          if (where.role?.slug && m.role.slug !== where.role.slug) return false;
          return true;
        }).length;
      },
      update: async ({ where, data }: any) => {
        const idx = memberships.findIndex((m) => m.id === where.id);
        if (idx === -1) throw new Error('Membership not found');
        if (data.roleId) {
          memberships[idx].roleId = data.roleId;
          const r = roles.find((role) => role.id === data.roleId);
          if (r) memberships[idx].role = r;
        }
        return memberships[idx];
      },
    },

    role: {
      findUnique: async ({ where }: any) => {
        return roles.find((r) => r.id === where.id) || null;
      },
      findFirst: async ({ where }: any) => {
        return (
          roles.find((r) => {
            if (where.tenantId && r.tenantId !== where.tenantId) return false;
            if (where.OR) {
              return where.OR.some(
                (cond: any) =>
                  (cond.name && r.name === cond.name) || (cond.slug && r.slug === cond.slug)
              );
            }
            return true;
          }) || null
        );
      },
      create: async ({ data }: any) => {
        const roleId = `role_custom_${Date.now()}_${Math.random()}`;
        const rolePerms: MockRolePermission[] = (data.rolePermissions?.create || []).map(
          (item: any, idx: number) => {
            const p = permissions.find((perm) => perm.id === item.permissionId);
            return {
              id: `rp_${roleId}_${idx}`,
              roleId,
              permissionId: item.permissionId,
              permission: p!,
            };
          }
        );

        const newRole: MockRole = {
          id: roleId,
          tenantId: data.tenantId,
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          isSystem: data.isSystem ?? false,
          status: 'ACTIVE',
          rolePermissions: rolePerms,
        };
        roles.push(newRole);
        return newRole;
      },
      update: async ({ where, data }: any) => {
        const idx = roles.findIndex((r) => r.id === where.id);
        if (idx === -1) throw new Error('Role not found');
        if (data.name) roles[idx].name = data.name;
        if (data.description !== undefined) roles[idx].description = data.description;
        return roles[idx];
      },
    },

    permission: {
      findMany: async ({ where }: any) => {
        if (where?.key?.in) {
          const keys = new Set(where.key.in);
          return permissions.filter((p) => keys.has(p.key));
        }
        return permissions;
      },
    },

    rolePermission: {},
  };

  return dbClient;
}

// -----------------------------------------------------------------------------
// Test Suite: 10 Core Security & RBAC Scenarios
// -----------------------------------------------------------------------------

describe('Task 21: RBAC System & Authorization Service', () => {
  let db: ReturnType<typeof createMockDatabase>;
  let authService: AuthorizationService;
  let roleMgmtService: RoleManagementService;

  const TENANT_A = 'tenant_prince_mess';
  const TENANT_B = 'tenant_green_view';

  beforeEach(() => {
    db = createMockDatabase();
    authService = new AuthorizationService(db as any);
    roleMgmtService = new RoleManagementService(db as any, authService);
  });

  it('Permission Catalog covers all 44 granular capabilities across 10 modules', () => {
    assert.equal(PERMISSION_CATALOG.length, 44);
    assert.ok(isValidPermissionKey('dashboard.view'));
    assert.ok(isValidPermissionKey('members.manage_status'));
    assert.ok(isValidPermissionKey('rooms.manage_allocation'));
    assert.ok(isValidPermissionKey('meals.manage_settings'));
    assert.ok(isValidPermissionKey('bazar.verify'));
    assert.ok(isValidPermissionKey('finance.manage_bills'));
    assert.ok(isValidPermissionKey('payments.confirm'));
    assert.ok(isValidPermissionKey('events.manage'));
    assert.ok(isValidPermissionKey('reports.export'));
    assert.ok(isValidPermissionKey('settings.manage'));
    assert.ok(!isValidPermissionKey('untrusted.client_injection'));
  });

  it('Scenario 1 — Owner can access authorized tenant management actions', async () => {
    const ownerRole = db.helperAddRole(TENANT_A, 'owner', 'Owner', true);
    db.helperAddMembership('mem_01', 'usr_owner_1', TENANT_A, ownerRole, 'ACTIVE');

    const canManageSettings = await authService.hasPermission(
      'usr_owner_1',
      TENANT_A,
      'settings.manage'
    );
    const canManageRoles = await authService.hasPermission(
      'usr_owner_1',
      TENANT_A,
      'roles.manage'
    );
    const canManageFinance = await authService.hasPermission(
      'usr_owner_1',
      TENANT_A,
      'finance.manage'
    );

    assert.equal(canManageSettings, true, 'Owner must have settings.manage');
    assert.equal(canManageRoles, true, 'Owner must have roles.manage');
    assert.equal(canManageFinance, true, 'Owner must have finance.manage');

    // Verification context
    const access = await authService.resolveTenantAccess('usr_owner_1', TENANT_A);
    assert.equal(access.isOwner, true);
    assert.equal(access.roleSlug, 'owner');
    assert.equal(access.permissions.size, 44);
  });

  it('Scenario 2 — Accountant cannot manage tenant ownership or mess settings', async () => {
    const accountantRole = db.helperAddRole(TENANT_A, 'accountant', 'Accountant', true);
    db.helperAddMembership('mem_02', 'usr_accountant_1', TENANT_A, accountantRole, 'ACTIVE');

    const canViewFinance = await authService.hasPermission(
      'usr_accountant_1',
      TENANT_A,
      'finance.view'
    );
    const canManageBills = await authService.hasPermission(
      'usr_accountant_1',
      TENANT_A,
      'finance.manage_bills'
    );
    const canManageSettings = await authService.hasPermission(
      'usr_accountant_1',
      TENANT_A,
      'settings.manage'
    );
    const canManageRoles = await authService.hasPermission(
      'usr_accountant_1',
      TENANT_A,
      'roles.manage'
    );

    assert.equal(canViewFinance, true, 'Accountant can view finances');
    assert.equal(canManageBills, true, 'Accountant can manage bills');
    assert.equal(canManageSettings, false, 'Accountant CANNOT manage mess settings');
    assert.equal(canManageRoles, false, 'Accountant CANNOT manage roles');

    await assert.rejects(
      authService.requirePermission('usr_accountant_1', TENANT_A, 'settings.manage'),
      ForbiddenError
    );
  });

  it('Scenario 3 — Meal Manager can manage meals when granted permission, but not finance', async () => {
    const mealManagerRole = db.helperAddRole(TENANT_A, 'meal-manager', 'Meal Manager', true);
    db.helperAddMembership('mem_03', 'usr_mealmgr_1', TENANT_A, mealManagerRole, 'ACTIVE');

    const canManageMealSettings = await authService.hasPermission(
      'usr_mealmgr_1',
      TENANT_A,
      'meals.manage_settings'
    );
    const canCreateMeal = await authService.hasPermission(
      'usr_mealmgr_1',
      TENANT_A,
      'meals.create'
    );
    const canManageFinance = await authService.hasPermission(
      'usr_mealmgr_1',
      TENANT_A,
      'finance.manage'
    );

    assert.equal(canManageMealSettings, true, 'Meal manager can manage meal settings');
    assert.equal(canCreateMeal, true, 'Meal manager can create meals');
    assert.equal(canManageFinance, false, 'Meal manager CANNOT manage finances');
  });

  it('Scenario 4 — Member cannot access private financial management or another member’s ledger', async () => {
    const memberRole = db.helperAddRole(TENANT_A, 'member', 'Member', true);
    db.helperAddMembership('mem_04', 'usr_member_1', TENANT_A, memberRole, 'ACTIVE');

    const canViewDashboard = await authService.hasPermission(
      'usr_member_1',
      TENANT_A,
      'dashboard.view'
    );
    const canManageFinance = await authService.hasPermission(
      'usr_member_1',
      TENANT_A,
      'finance.manage'
    );
    const canConfirmPayments = await authService.hasPermission(
      'usr_member_1',
      TENANT_A,
      'payments.confirm'
    );
    const canDeleteMembers = await authService.hasPermission(
      'usr_member_1',
      TENANT_A,
      'members.delete'
    );

    assert.equal(canViewDashboard, true, 'Member can view basic dashboard');
    assert.equal(canManageFinance, false, 'Member CANNOT manage finances');
    assert.equal(canConfirmPayments, false, 'Member CANNOT confirm payments');
    assert.equal(canDeleteMembers, false, 'Member CANNOT delete members');
  });

  it('Scenario 5 — User A’s role in Tenant A does NOT change their role in Tenant B', async () => {
    // User Asad is Owner in Tenant A (Prince Mess)
    const ownerRoleA = db.helperAddRole(TENANT_A, 'owner', 'Owner', true);
    db.helperAddMembership('mem_asad_A', 'usr_asad', TENANT_A, ownerRoleA, 'ACTIVE');

    // User Asad is standard Member in Tenant B (Green View Hostel)
    const memberRoleB = db.helperAddRole(TENANT_B, 'member', 'Member', true);
    db.helperAddMembership('mem_asad_B', 'usr_asad', TENANT_B, memberRoleB, 'ACTIVE');

    // Test in Tenant A
    const canManageSettingsInA = await authService.hasPermission(
      'usr_asad',
      TENANT_A,
      'settings.manage'
    );
    // Test in Tenant B
    const canManageSettingsInB = await authService.hasPermission(
      'usr_asad',
      TENANT_B,
      'settings.manage'
    );

    assert.equal(canManageSettingsInA, true, 'Asad is Owner in Tenant A');
    assert.equal(canManageSettingsInB, false, 'Asad is only Member in Tenant B');

    const accessA = await authService.resolveTenantAccess('usr_asad', TENANT_A);
    const accessB = await authService.resolveTenantAccess('usr_asad', TENANT_B);

    assert.equal(accessA.roleSlug, 'owner');
    assert.equal(accessB.roleSlug, 'member');
  });

  it('Scenario 6 — Inactive membership (PENDING, SUSPENDED, LEFT) cannot access tenant resources', async () => {
    const memberRole = db.helperAddRole(TENANT_A, 'member', 'Member', true);

    db.helperAddMembership('mem_pend', 'usr_pending', TENANT_A, memberRole, 'PENDING');
    db.helperAddMembership('mem_susp', 'usr_suspended', TENANT_A, memberRole, 'SUSPENDED');
    db.helperAddMembership('mem_left', 'usr_left', TENANT_A, memberRole, 'LEFT');

    // hasPermission returns false
    assert.equal(
      await authService.hasPermission('usr_pending', TENANT_A, 'dashboard.view'),
      false
    );
    assert.equal(
      await authService.hasPermission('usr_suspended', TENANT_A, 'dashboard.view'),
      false
    );
    assert.equal(
      await authService.hasPermission('usr_left', TENANT_A, 'dashboard.view'),
      false
    );

    // requirePermission throws InactiveMembershipError
    await assert.rejects(
      authService.requirePermission('usr_suspended', TENANT_A, 'dashboard.view'),
      InactiveMembershipError
    );
  });

  it('Scenario 7 — Privilege Escalation: Non-owner cannot grant permissions they do not possess', async () => {
    // Admin in Tenant A (granted roles.manage, but lacks settings.manage)
    const adminRole = db.helperAddRole(TENANT_A, 'admin', 'Admin', true);
    const rolesManagePerm = db.permissions.find((p) => p.key === 'roles.manage')!;
    adminRole.rolePermissions.push({
      id: 'rp_admin_roles_manage',
      roleId: adminRole.id,
      permissionId: rolesManagePerm.id,
      permission: rolesManagePerm,
    });
    db.helperAddMembership('mem_admin', 'usr_admin_1', TENANT_A, adminRole, 'ACTIVE');

    // Admin attempts to create a custom super-role with 'settings.manage'
    await assert.rejects(
      roleMgmtService.createTenantRole('usr_admin_1', TENANT_A, {
        name: 'Super Admin',
        slug: 'super-admin',
        permissionKeys: ['dashboard.view', 'settings.manage'],
      }),
      PrivilegeEscalationError
    );
  });

  it('Scenario 8 — Cross-Tenant Guard: Cannot manage roles or assign roles from an unrelated tenant', async () => {
    // Owner in Tenant A
    const ownerRoleA = db.helperAddRole(TENANT_A, 'owner', 'Owner', true);
    db.helperAddMembership('mem_owner_A', 'usr_owner_A', TENANT_A, ownerRoleA, 'ACTIVE');

    // Role in Tenant B
    const memberRoleB = db.helperAddRole(TENANT_B, 'member', 'Member', true);
    const membershipB = db.helperAddMembership(
      'mem_target_B',
      'usr_target',
      TENANT_B,
      memberRoleB,
      'ACTIVE'
    );

    // Owner A attempts to change membership in Tenant B using Tenant A authority
    await assert.rejects(
      roleMgmtService.assignRoleToMembership(
        'usr_owner_A',
        TENANT_A, // Request specifies Tenant A
        membershipB.id, // But target membership is from Tenant B
        ownerRoleA.id
      ),
      CrossTenantError
    );
  });

  it('Scenario 9 — Missing permission results in access denial and clean error output', async () => {
    const memberRole = db.helperAddRole(TENANT_A, 'member', 'Member', true);
    db.helperAddMembership('mem_09', 'usr_member_9', TENANT_A, memberRole, 'ACTIVE');

    await assert.rejects(
      authService.requirePermission('usr_member_9', TENANT_A, 'meals.manage_settings'),
      (err: any) => {
        assert.ok(err instanceof ForbiddenError);
        assert.equal(err.statusCode, 403);
        assert.ok(err.message.includes("meals.manage_settings"));
        // Confirm no internal SQL or database credentials in message
        assert.ok(!err.message.includes('password'));
        assert.ok(!err.message.includes('postgres://'));
        return true;
      }
    );
  });

  it('Scenario 10 — Last Authorized Owner Protection: Cannot remove or demote the sole Owner', async () => {
    // Single Owner in Tenant A
    const ownerRole = db.helperAddRole(TENANT_A, 'owner', 'Owner', true);
    const adminRole = db.helperAddRole(TENANT_A, 'admin', 'Admin', true);

    const soleOwnerMembership = db.helperAddMembership(
      'mem_sole_owner',
      'usr_sole_owner',
      TENANT_A,
      ownerRole,
      'ACTIVE'
    );

    // Sole owner attempts to demote themselves to Admin
    await assert.rejects(
      roleMgmtService.assignRoleToMembership(
        'usr_sole_owner',
        TENANT_A,
        soleOwnerMembership.id,
        adminRole.id
      ),
      OwnerProtectionError
    );

    // Now add a SECOND owner
    const secondOwner = db.helperAddMembership(
      'mem_second_owner',
      'usr_second_owner',
      TENANT_A,
      ownerRole,
      'ACTIVE'
    );

    // Now demoting the first owner succeeds because active owner count > 1
    const result = await roleMgmtService.assignRoleToMembership(
      'usr_second_owner',
      TENANT_A,
      soleOwnerMembership.id,
      adminRole.id
    );

    assert.equal(result.roleId, adminRole.id);
  });
});
