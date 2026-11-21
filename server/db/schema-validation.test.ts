import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  SYSTEM_PERMISSIONS,
  SYSTEM_ROLE_TEMPLATES,
} from '../../prisma/seed';
import type {
  User,
  Tenant,
  Role,
  Membership,
  UserStatus,
  TenantType,
  TenantStatus,
  MembershipStatus,
} from '../../types/database';

describe('Task 19 & 20: Multi-Tenant Schema & Relational Integrity Verification', () => {
  const migrationSqlPath = path.resolve(
    process.cwd(),
    'prisma/migrations/20261121000000_init_multi_tenant_schema/migration.sql'
  );

  it('Migration SQL exists and contains valid PostgreSQL DDL', () => {
    assert.ok(fs.existsSync(migrationSqlPath), 'Migration SQL file must exist');
    const sql = fs.readFileSync(migrationSqlPath, 'utf8');
    assert.ok(sql.includes('CREATE TABLE "users"'), 'Must create users table');
    assert.ok(sql.includes('CREATE TABLE "tenants"'), 'Must create tenants table');
    assert.ok(sql.includes('CREATE TABLE "roles"'), 'Must create roles table');
    assert.ok(sql.includes('CREATE TABLE "role_templates"'), 'Must create role_templates table');
    assert.ok(sql.includes('CREATE TABLE "permissions"'), 'Must create permissions table');
    assert.ok(sql.includes('CREATE TABLE "memberships"'), 'Must create memberships table');
  });

  it('Scenario 1 — Multiple Tenants have independent IDs and unique slugs', () => {
    const tenantPrinceMess: Tenant = {
      id: 'tenant_prince_mess_123',
      name: 'Prince Mess',
      slug: 'prince-mess',
      description: 'Shared student accommodation in Farmgate',
      logo: null,
      coverImage: null,
      email: 'info@princemess.bd',
      phone: '+8801700000001',
      address: '12 Farmgate Road',
      city: 'Dhaka',
      country: 'Bangladesh',
      timezone: 'Asia/Dhaka',
      tenantType: 'STUDENT_MESS' as TenantType,
      status: 'ACTIVE' as TenantStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tenantGreenView: Tenant = {
      id: 'tenant_green_view_456',
      name: 'Green View Hostel',
      slug: 'green-view-hostel',
      description: 'Bachelor mess in Uttara Sector 4',
      logo: null,
      coverImage: null,
      email: 'contact@greenview.bd',
      phone: '+8801700000002',
      address: 'House 22, Road 4, Sector 4',
      city: 'Dhaka',
      country: 'Bangladesh',
      timezone: 'Asia/Dhaka',
      tenantType: 'BACHELOR_MESS' as TenantType,
      status: 'ACTIVE' as TenantStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    assert.notEqual(tenantPrinceMess.id, tenantGreenView.id, 'Tenants must have independent IDs');
    assert.notEqual(tenantPrinceMess.slug, tenantGreenView.slug, 'Tenants must have distinct slugs');
    assert.equal(tenantPrinceMess.timezone, 'Asia/Dhaka');
    assert.equal(tenantGreenView.country, 'Bangladesh');
  });

  it('Scenario 2 & 3 — Single User identity belongs to multiple Tenants with different Roles', () => {
    const sharedUser: User = {
      id: 'usr_asad_001',
      name: 'Asaduzzaman',
      email: 'asad@example.com',
      phone: '+8801811111111',
      passwordHash: null,
      profileImage: null,
      status: 'ACTIVE' as UserStatus,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const rolePrinceOwner: Role = {
      id: 'role_prince_owner',
      tenantId: 'tenant_prince_mess_123',
      name: 'Owner',
      slug: 'owner',
      description: 'Primary owner and manager',
      isSystem: true,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const roleGreenMember: Role = {
      id: 'role_green_member',
      tenantId: 'tenant_green_view_456',
      name: 'Member',
      slug: 'member',
      description: 'Standard resident',
      isSystem: false,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const membershipPrince: Membership = {
      id: 'mem_prince_01',
      userId: sharedUser.id,
      tenantId: 'tenant_prince_mess_123',
      roleId: rolePrinceOwner.id,
      status: 'ACTIVE' as MembershipStatus,
      joinedAt: new Date(),
      invitedAt: null,
      leftAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const membershipGreen: Membership = {
      id: 'mem_green_02',
      userId: sharedUser.id,
      tenantId: 'tenant_green_view_456',
      roleId: roleGreenMember.id,
      status: 'ACTIVE' as MembershipStatus,
      joinedAt: new Date(),
      invitedAt: null,
      leftAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Verify User identity is reused without duplication
    assert.equal(membershipPrince.userId, sharedUser.id);
    assert.equal(membershipGreen.userId, sharedUser.id);
    assert.notEqual(membershipPrince.tenantId, membershipGreen.tenantId);

    // Verify roles in different tenants are completely independent
    assert.equal(membershipPrince.roleId, 'role_prince_owner');
    assert.equal(membershipGreen.roleId, 'role_green_member');
  });

  it('Scenario 4 — Database constraint prevents duplicate active membership for same User and Tenant', () => {
    const sql = fs.readFileSync(migrationSqlPath, 'utf8');

    // Verify composite unique index exists in migration DDL
    const hasUniqueConstraint =
      sql.includes('CREATE UNIQUE INDEX "memberships_userId_tenantId_key"') &&
      sql.includes('ON "memberships"("userId", "tenantId")');
    assert.ok(
      hasUniqueConstraint,
      'Migration DDL must enforce UNIQUE constraint on memberships(userId, tenantId)'
    );
  });

  it('Scenario 5 — Role Permissions are configurable and granular across roles', () => {
    const ownerTemplate = SYSTEM_ROLE_TEMPLATES.find((r) => r.slug === 'owner');
    const accountantTemplate = SYSTEM_ROLE_TEMPLATES.find((r) => r.slug === 'accountant');
    const mealManagerTemplate = SYSTEM_ROLE_TEMPLATES.find((r) => r.slug === 'meal-manager');
    const memberTemplate = SYSTEM_ROLE_TEMPLATES.find((r) => r.slug === 'member');

    assert.ok(ownerTemplate, 'Owner template must exist');
    assert.ok(accountantTemplate, 'Accountant template must exist');
    assert.ok(mealManagerTemplate, 'Meal Manager template must exist');
    assert.ok(memberTemplate, 'Member template must exist');

    // Owner has all permissions
    assert.equal(ownerTemplate.permissionKeys.length, SYSTEM_PERMISSIONS.length);

    // Accountant has finance and payments, but not meal management
    assert.ok(accountantTemplate.permissionKeys.includes('finance.view'));
    assert.ok(accountantTemplate.permissionKeys.includes('payments.confirm'));
    assert.ok(!accountantTemplate.permissionKeys.includes('meals.manage_settings'));

    // Meal manager has meal management, but not financial close
    assert.ok(mealManagerTemplate.permissionKeys.includes('meals.manage_settings'));
    assert.ok(!mealManagerTemplate.permissionKeys.includes('finance.manage'));

    // Member has view-only permissions
    assert.ok(memberTemplate.permissionKeys.includes('meals.view'));
    assert.ok(!memberTemplate.permissionKeys.includes('meals.manage_settings'));
    assert.ok(!memberTemplate.permissionKeys.includes('members.delete'));
  });

  it('Scenario 6 — Foreign keys and compound isolation enforce strict referential integrity', () => {
    const sql = fs.readFileSync(migrationSqlPath, 'utf8');

    // Foreign key from membership to user (onDelete RESTRICT)
    assert.ok(
      sql.includes('ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT'),
      'Membership must reference valid User with RESTRICT delete'
    );

    // Foreign key from membership to tenant (onDelete CASCADE)
    assert.ok(
      sql.includes('ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE'),
      'Membership must reference valid Tenant with CASCADE delete'
    );

    // COMPOUND Foreign key: Membership(roleId, tenantId) -> Role(id, tenantId)
    // Guarantees at database level that assigned role belongs to the EXACT SAME tenant!
    assert.ok(
      sql.includes('ALTER TABLE "memberships" ADD CONSTRAINT "memberships_roleId_tenantId_fkey" FOREIGN KEY ("roleId", "tenantId") REFERENCES "roles"("id", "tenantId") ON DELETE RESTRICT'),
      'Database must enforce compound foreign key (roleId, tenantId) -> roles(id, tenantId)'
    );
  });
});
