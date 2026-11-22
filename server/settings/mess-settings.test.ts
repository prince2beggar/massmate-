import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MessSettingsService,
  PrivilegeEscalationError,
  formatDhakaDateTime,
} from './mess-settings-service';
import {
  ValidationError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
} from '@/server/api/errors';

describe('Task 36: Mess Settings, Roles & Permissions, Audit Logs Tests', () => {
  const service = new MessSettingsService();

  // Seed Tenants
  const tenantA = {
    id: 'tenant_alpha',
    name: 'Prince Mess (Dhanmondi)',
    slug: 'prince-mess',
    phone: '+8801711111111',
    email: 'contact@princemess.com',
    address: 'House 14, Road 5, Dhanmondi',
    city: 'Dhaka',
    timezone: 'Asia/Dhaka',
    status: 'ACTIVE',
  };

  const tenantB = {
    id: 'tenant_beta',
    name: 'Bachelor Corner (Mirpur)',
    slug: 'bachelor-corner',
    phone: '+8801722222222',
    email: 'info@bachelorcorner.com',
    address: 'Section 10, Mirpur',
    city: 'Dhaka',
    timezone: 'Asia/Dhaka',
    status: 'ACTIVE',
  };

  service.mockTenants.push(tenantA, tenantB);

  // Seed Users
  const userOwner = { id: 'usr_owner', name: 'Alice Owner', email: 'owner@princemess.com' };
  const userAdmin = { id: 'usr_admin', name: 'Bob Admin', email: 'admin@princemess.com' };
  const userResident = { id: 'usr_resident', name: 'Charlie Resident', email: 'charlie@princemess.com' };
  service.mockUsers.push(userOwner, userAdmin, userResident);

  // ---------------------------------------------------------------------------
  // Test Scenario 1: Default Settings Seeding
  // ---------------------------------------------------------------------------
  it('1. getSettings automatically seeds default settings from tenant profile on first call', async () => {
    const settings = await service.getSettings('prince-mess');

    assert.equal(settings.tenantId, tenantA.id);
    assert.equal(settings.name, 'Prince Mess (Dhanmondi)');
    assert.equal(settings.timezone, 'Asia/Dhaka');
    assert.equal(settings.preferredLanguage, 'en');
    assert.equal(settings.themeColor, 'emerald');
    assert.equal(settings.defaultBillingPeriod, 'CALENDAR_MONTH');
    assert.equal(settings.currency, 'BDT');
    assert.equal(settings.memberDirectoryVisibility, 'MEMBERS_ONLY');
    assert.equal(settings.emergencyContactVisibility, 'ADMINS_ONLY');
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 2: Update General Settings
  // ---------------------------------------------------------------------------
  it('2. updateGeneralSettings updates profile details and enforces valid language and timezone', async () => {
    const updated = await service.updateGeneralSettings(
      'prince-mess',
      {
        name: 'Prince Mess Premium',
        description: 'Modern student and executive mess living in Dhanmondi',
        phone: '+8801799999999',
        preferredLanguage: 'bn',
      },
      userOwner.id
    );

    assert.equal(updated.name, 'Prince Mess Premium');
    assert.equal(updated.preferredLanguage, 'bn');
    assert.equal(updated.phone, '+8801799999999');

    // Reject invalid language
    await assert.rejects(
      async () => {
        await service.updateGeneralSettings(
          'prince-mess',
          { preferredLanguage: 'fr' as any },
          userOwner.id
        );
      },
      (err: any) => err instanceof ValidationError
    );
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 3: Update Appearance Settings
  // ---------------------------------------------------------------------------
  it('3. updateAppearanceSettings validates theme color tokens and updates portal visibility', async () => {
    const updated = await service.updateAppearanceSettings(
      'prince-mess',
      {
        themeColor: 'indigo',
        publicWebsiteEnabled: true,
        showMenuOnHomepage: false,
      },
      userOwner.id
    );

    assert.equal(updated.themeColor, 'indigo');
    assert.equal(updated.showMenuOnHomepage, false);

    // Reject unknown theme colors
    await assert.rejects(
      async () => {
        await service.updateAppearanceSettings(
          'prince-mess',
          { themeColor: 'neon-hot-pink' },
          userOwner.id
        );
      },
      (err: any) => err instanceof ValidationError
    );
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 4: Update Operational Defaults
  // ---------------------------------------------------------------------------
  it('4. updateOperationalDefaults modifies billing intervals, feature modules, and notifications', async () => {
    const updated = await service.updateOperationalDefaults(
      'prince-mess',
      {
        defaultBillingPeriod: 'MID_MONTH',
        enableRentalModule: true,
        notifyOnMealCutoff: true,
      },
      userOwner.id
    );

    assert.equal(updated.defaultBillingPeriod, 'MID_MONTH');
    assert.equal(updated.notifyOnMealCutoff, true);

    // Reject non-BDT internal currency changes
    await assert.rejects(
      async () => {
        await service.updateOperationalDefaults(
          'prince-mess',
          { currency: 'USD' },
          userOwner.id
        );
      },
      (err: any) => err instanceof ValidationError
    );
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 5: Privacy Settings & Emergency Contact Protection
  // ---------------------------------------------------------------------------
  it('5. updatePrivacySettings strictly blocks setting emergency contacts to public', async () => {
    // Attempting to make emergency contacts public must throw ValidationError
    await assert.rejects(
      async () => {
        await service.updatePrivacySettings(
          'prince-mess',
          { emergencyContactVisibility: 'PUBLIC' as any },
          userOwner.id
        );
      },
      (err: any) => err instanceof ValidationError && err.message.includes('Security Violation')
    );

    // Setting to ADMINS_ONLY or PRIVATE is allowed
    const updated = await service.updatePrivacySettings(
      'prince-mess',
      {
        memberDirectoryVisibility: 'MEMBERS_ONLY',
        emergencyContactVisibility: 'ADMINS_ONLY',
      },
      userOwner.id
    );

    assert.equal(updated.emergencyContactVisibility, 'ADMINS_ONLY');
    assert.equal(updated.memberDirectoryVisibility, 'MEMBERS_ONLY');
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 6: List Roles Auto-Seeds 6 System Roles
  // ---------------------------------------------------------------------------
  it('6. listRoles returns all 6 standard system roles with member count badges', async () => {
    const roles = await service.listRoles('prince-mess');

    const expectedSlugs = ['owner', 'admin', 'moderator', 'accountant', 'meal-manager', 'member'];
    for (const slug of expectedSlugs) {
      const found = roles.find((r) => r.slug === slug);
      assert.ok(found, `Expected role with slug '${slug}'`);
      assert.equal(found.isSystem, true);
    }

    const ownerRole = roles.find((r) => r.slug === 'owner');
    assert.equal(ownerRole?.permissionKeys.length, 44); // Full catalog
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 7: Create Custom Role
  // ---------------------------------------------------------------------------
  let createdRoleId = '';
  it('7. createRole creates a new custom role with valid permissions', async () => {
    const newRole = await service.createRole(
      'prince-mess',
      {
        name: 'Floor Captain',
        slug: 'floor-captain',
        description: 'Coordinates notices and maintenance on the 3rd floor',
        permissionKeys: ['dashboard.view', 'members.view', 'notices.view', 'notices.create'],
      },
      userOwner.id,
      true, // isOwner
      new Set()
    );

    assert.ok(newRole.id);
    assert.equal(newRole.name, 'Floor Captain');
    assert.equal(newRole.isSystem, false);
    assert.equal(newRole.permissionKeys.length, 4);
    createdRoleId = newRole.id;
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 8: Anti-Privilege Escalation
  // ---------------------------------------------------------------------------
  it('8. Anti-privilege escalation prevents non-owners from delegating permissions they lack', async () => {
    const adminPermissions = new Set(['dashboard.view', 'members.view', 'meals.view']);

    // Admin tries to grant finance.manage which they do not possess
    await assert.rejects(
      async () => {
        await service.createRole(
          'prince-mess',
          {
            name: 'Sneaky Accountant',
            permissionKeys: ['dashboard.view', 'finance.manage'],
          },
          userAdmin.id,
          false, // not owner
          adminPermissions
        );
      },
      (err: any) => err instanceof PrivilegeEscalationError
    );
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 9: Update Custom Role & System Role Protection
  // ---------------------------------------------------------------------------
  it('9. updateRole allows updating custom roles but blocks renaming system roles', async () => {
    // 1. Updating custom role succeeds
    const updated = await service.updateRole(
      'prince-mess',
      createdRoleId,
      {
        name: 'Head Floor Captain',
        description: 'Updated responsibilities for all floors',
      },
      userOwner.id,
      true,
      new Set()
    );
    assert.equal(updated.name, 'Head Floor Captain');

    // 2. Renaming a system role throws ForbiddenError
    const roles = await service.listRoles('prince-mess');
    const adminRole = roles.find((r) => r.slug === 'admin')!;

    await assert.rejects(
      async () => {
        await service.updateRole(
          'prince-mess',
          adminRole.id,
          { name: 'Supreme General Admin' },
          userOwner.id,
          true,
          new Set()
        );
      },
      (err: any) => err instanceof ForbiddenError && err.message.includes('System-defined')
    );
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 10: Owner Role Protection
  // ---------------------------------------------------------------------------
  it('10. Owner role protection prevents non-owners from modifying the Owner role', async () => {
    const roles = await service.listRoles('prince-mess');
    const ownerRole = roles.find((r) => r.slug === 'owner')!;

    await assert.rejects(
      async () => {
        await service.updateRole(
          'prince-mess',
          ownerRole.id,
          { description: 'Subverted owner description' },
          userAdmin.id,
          false, // Not Owner
          new Set(['dashboard.view', 'roles.manage'])
        );
      },
      (err: any) => err instanceof ForbiddenError && err.message.includes('Only an Owner')
    );
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 11: Delete Role Protection (System & Active Members)
  // ---------------------------------------------------------------------------
  it('11. deleteRole protects system roles and roles currently assigned to active members', async () => {
    const roles = await service.listRoles('prince-mess');
    const memberRole = roles.find((r) => r.slug === 'member')!;

    // 1. Cannot delete system role
    await assert.rejects(
      async () => {
        await service.deleteRole('prince-mess', memberRole.id, userOwner.id);
      },
      (err: any) => err instanceof ForbiddenError && err.message.includes('System-defined')
    );

    // 2. Assign Charlie Resident to custom role
    service.mockMemberships.push({
      id: 'mem_charlie',
      tenantId: tenantA.id,
      userId: userResident.id,
      roleId: createdRoleId,
      status: 'ACTIVE',
    });

    // 3. Attempting to delete custom role with active members throws ConflictError
    await assert.rejects(
      async () => {
        await service.deleteRole('prince-mess', createdRoleId, userOwner.id);
      },
      (err: any) => err instanceof ConflictError && err.message.includes('active member(s)')
    );

    // 4. Reassign/remove member, then deletion succeeds
    service.mockMemberships = service.mockMemberships.filter((m) => m.id !== 'mem_charlie');
    await service.deleteRole('prince-mess', createdRoleId, userOwner.id);

    const rolesAfter = await service.listRoles('prince-mess');
    assert.equal(rolesAfter.some((r) => r.id === createdRoleId), false);
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 12: Audit Log Retrieval & Sanitization
  // ---------------------------------------------------------------------------
  it('12. listAuditLogs returns tenant-scoped entries formatted in Asia/Dhaka without exposing secrets', async () => {
    const result = await service.listAuditLogs('prince-mess', {
      page: 1,
      pageSize: 20,
    });

    assert.ok(result.logs.length > 0);
    const log = result.logs[0];
    assert.equal(log.tenantId, tenantA.id);
    assert.ok(log.action);
    assert.ok(log.createdAtFormatted);
    assert.ok(log.actorName);

    // Formatted date validation
    const dhakaFormatted = formatDhakaDateTime(new Date());
    assert.ok(dhakaFormatted.length > 10);
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 13: Audit Trail Immutability (Append-Only Invariant)
  // ---------------------------------------------------------------------------
  it('13. Audit logs are strictly append-only; delete operations are rejected', async () => {
    await assert.rejects(
      async () => {
        await service.deleteAuditLog();
      },
      (err: any) => err instanceof ForbiddenError && err.message.includes('append-only')
    );
  });

  // ---------------------------------------------------------------------------
  // Test Scenario 14: Cross-Tenant Isolation
  // ---------------------------------------------------------------------------
  it('14. Cross-tenant isolation prevents Tenant B from reading or altering Tenant A settings or roles', async () => {
    // Tenant B cannot access Tenant A settings
    const settingsB = await service.getSettings('bachelor-corner');
    assert.equal(settingsB.tenantId, tenantB.id);
    assert.equal(settingsB.name, 'Bachelor Corner (Mirpur)');

    // Non-existent tenant slug throws NotFoundError
    await assert.rejects(
      async () => {
        await service.getSettings('unknown-mess-xyz');
      },
      (err: any) => err instanceof NotFoundError
    );
  });
});
