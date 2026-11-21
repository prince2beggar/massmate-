import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PlatformAuthService,
  PlatformAuthDbClient,
} from './platform-auth';
import {
  PlatformUnauthenticatedError,
  PlatformAccessDeniedError,
  PlatformForbiddenError,
  PlatformUserInactiveError,
} from './errors';
import {
  PLATFORM_ROLE_PERMISSIONS,
  getPlatformRolePermissions,
  isPlatformRole,
} from './platform-roles';
import { PlatformOverviewService } from './platform-overview-service';
import type { PlatformRole, UserStatus } from '@/types/database';

describe('Task 24: Platform Authorization & Super Admin Governance Tests', () => {
  // Mock DB factory
  function createMockDb(userRecord: any): PlatformAuthDbClient {
    return {
      user: {
        findUnique: async () => userRecord,
      } as any,
    };
  }

  it('Scenario 1 — Rejects unauthenticated requests with PlatformUnauthenticatedError', async () => {
    const service = new PlatformAuthService(createMockDb(null));
    await assert.rejects(
      async () => service.resolvePlatformContext(null),
      PlatformUnauthenticatedError
    );
    await assert.rejects(
      async () => service.resolvePlatformContext('   '),
      PlatformUnauthenticatedError
    );
  });

  it('Scenario 2 — Rejects non-existent user identity', async () => {
    const service = new PlatformAuthService(createMockDb(null));
    await assert.rejects(
      async () => service.resolvePlatformContext('usr_non_existent'),
      PlatformUnauthenticatedError
    );
  });

  it('Scenario 3 — Rejects inactive or suspended platform users', async () => {
    const suspendedUser = {
      id: 'usr_suspended_admin',
      name: 'Suspended Admin',
      email: 'admin@messmate.bd',
      phone: '+8801700000000',
      status: 'SUSPENDED' as UserStatus,
      platformRole: 'PLATFORM_ADMIN' as PlatformRole,
    };
    const service = new PlatformAuthService(createMockDb(suspendedUser));
    await assert.rejects(
      async () => service.resolvePlatformContext('usr_suspended_admin'),
      PlatformUserInactiveError
    );
  });

  it('Scenario 4 — CRITICAL: Normal Mess Owner (platformRole = null) is STRICTLY DENIED platform access', async () => {
    const messOwner = {
      id: 'usr_mess_owner_1',
      name: 'Prince Mess Owner',
      email: 'owner@princemess.bd',
      phone: '+8801811111111',
      status: 'ACTIVE' as UserStatus,
      platformRole: null, // Normal tenant user!
    };
    const service = new PlatformAuthService(createMockDb(messOwner));
    await assert.rejects(
      async () => service.resolvePlatformContext('usr_mess_owner_1'),
      PlatformAccessDeniedError
    );
  });

  it('Scenario 5 — CRITICAL: Tenant Admin (platformRole = null) cannot access Super Admin', async () => {
    const tenantAdmin = {
      id: 'usr_tenant_admin_2',
      name: 'Tenant Admin',
      email: 'admin@greenview.bd',
      phone: '+8801822222222',
      status: 'ACTIVE' as UserStatus,
      platformRole: null,
    };
    const service = new PlatformAuthService(createMockDb(tenantAdmin));
    await assert.rejects(
      async () => service.resolvePlatformContext('usr_tenant_admin_2'),
      PlatformAccessDeniedError
    );
  });

  it('Scenario 6 — Authorized PLATFORM_OWNER resolves successfully with complete capabilities', async () => {
    const platformOwner = {
      id: 'usr_platform_owner_100',
      name: 'MessMate Platform Owner',
      email: 'owner@messmate.com',
      phone: '+8801711111111',
      status: 'ACTIVE' as UserStatus,
      platformRole: 'PLATFORM_OWNER' as PlatformRole,
    };
    const service = new PlatformAuthService(createMockDb(platformOwner));
    const context = await service.resolvePlatformContext('usr_platform_owner_100');

    assert.equal(context.userId, 'usr_platform_owner_100');
    assert.equal(context.platformRole, 'PLATFORM_OWNER');
    assert.ok(context.permissions.has('tenants.view'));
    assert.ok(context.permissions.has('tenants.manage'));
    assert.ok(context.permissions.has('users.manage'));
    assert.ok(context.permissions.has('revenue.view'));
    assert.ok(context.permissions.has('settings.manage'));
    assert.equal(context.permissions.size, PLATFORM_ROLE_PERMISSIONS.PLATFORM_OWNER.length);
  });

  it('Scenario 7 — SUPPORT_STAFF role has support permissions but lacks finance and settings management', async () => {
    const supportUser = {
      id: 'usr_support_agent_200',
      name: 'Support Agent',
      email: 'support@messmate.com',
      phone: '+8801722222222',
      status: 'ACTIVE' as UserStatus,
      platformRole: 'SUPPORT_STAFF' as PlatformRole,
    };
    const service = new PlatformAuthService(createMockDb(supportUser));
    const context = await service.resolvePlatformContext('usr_support_agent_200');

    assert.ok(context.permissions.has('support.view'));
    assert.ok(context.permissions.has('support.manage'));
    assert.ok(context.permissions.has('tenants.view'));

    // Strictly forbidden:
    assert.equal(context.permissions.has('revenue.view'), false);
    assert.equal(context.permissions.has('settings.manage'), false);
    assert.equal(context.permissions.has('subscriptions.manage'), false);

    assert.throws(
      () => service.requirePlatformPermission(context, 'revenue.view'),
      PlatformForbiddenError
    );
  });

  it('Scenario 8 — FINANCE_STAFF role has revenue and billing access but lacks support and settings', async () => {
    const financeUser = {
      id: 'usr_finance_mgr_300',
      name: 'Finance Manager',
      email: 'finance@messmate.com',
      phone: '+8801733333333',
      status: 'ACTIVE' as UserStatus,
      platformRole: 'FINANCE_STAFF' as PlatformRole,
    };
    const service = new PlatformAuthService(createMockDb(financeUser));
    const context = await service.resolvePlatformContext('usr_finance_mgr_300');

    assert.ok(context.permissions.has('revenue.view'));
    assert.ok(context.permissions.has('subscriptions.view'));

    // Forbidden:
    assert.equal(context.permissions.has('support.manage'), false);
    assert.equal(context.permissions.has('settings.manage'), false);
  });

  it('Scenario 9 — DateRange resolution correctly calculates date bounds', () => {
    const overviewService = new PlatformOverviewService({} as any);

    const range7d = overviewService.resolveDateRange('7d');
    assert.equal(range7d.preset, '7d');
    assert.ok(range7d.startDate.getTime() < range7d.endDate.getTime());
    const diffDays7d = Math.round((range7d.endDate.getTime() - range7d.startDate.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays7d, 7);

    const range30d = overviewService.resolveDateRange('30d');
    assert.equal(range30d.preset, '30d');
    const diffDays30d = Math.round((range30d.endDate.getTime() - range30d.startDate.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays30d, 30);
  });

  it('Scenario 10 — Overview service safely returns zeroed metrics and unconfigured status when database is disconnected', async () => {
    const overviewService = new PlatformOverviewService({} as any);
    const data = await overviewService.getOverviewData('30d');

    assert.equal(data.range, '30d');
    assert.equal(typeof data.metrics.tenants.total, 'number');
    assert.equal(data.metrics.subscriptions.isLive, false);
    assert.equal(data.metrics.subscriptions.moduleStatus, 'UNAVAILABLE_PHASE3_PENDING');
    assert.equal(data.metrics.revenue.isLive, false);
    assert.equal(data.charts.monthlyRevenue.hasData, false);
    assert.ok(data.charts.monthlyRevenue.message.length > 0);
  });
});
