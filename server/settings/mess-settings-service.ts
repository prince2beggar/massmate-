if (typeof window !== 'undefined') {
  throw new Error('MessSettingsService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { auditService } from '@/server/audit/audit-service';
import { sanitizeLogData } from '@/server/logging/logger';
import {
  PERMISSION_CATALOG,
  isValidPermissionKey,
  type PermissionKey,
} from '@/server/rbac/permissions';
import {
  SYSTEM_ROLE_TEMPLATES,
  type SystemRoleSlug,
} from '@/server/rbac/role-templates';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from '@/server/api/errors';

export interface MessSettingsDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  timezone: string;
  preferredLanguage: string; // 'en' | 'bn'
  themeColor: string;
  publicWebsiteEnabled: boolean;
  showMenuOnHomepage: boolean;
  customTagline: string | null;
  defaultBillingPeriod: string;
  currency: string;
  enableRentalModule: boolean;
  enableMealModule: boolean;
  enableBazarModule: boolean;
  notifyOnNewExpense: boolean;
  notifyOnPaymentReceived: boolean;
  notifyOnMealCutoff: boolean;
  memberDirectoryVisibility: string; // 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE'
  contactVisibility: string; // 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE'
  rentalVisibility: string; // 'PUBLIC' | 'PRIVATE'
  emergencyContactVisibility: string; // 'ADMINS_ONLY' | 'PRIVATE'
  updatedAt: string;
}

export interface UpdateGeneralSettingsInput {
  name?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  timezone?: string;
  preferredLanguage?: 'en' | 'bn';
}

export interface UpdateAppearanceSettingsInput {
  themeColor?: string;
  publicWebsiteEnabled?: boolean;
  showMenuOnHomepage?: boolean;
  customTagline?: string;
}

export interface UpdateOperationalDefaultsInput {
  defaultBillingPeriod?: string;
  currency?: string;
  enableRentalModule?: boolean;
  enableMealModule?: boolean;
  enableBazarModule?: boolean;
  notifyOnNewExpense?: boolean;
  notifyOnPaymentReceived?: boolean;
  notifyOnMealCutoff?: boolean;
}

export interface UpdatePrivacySettingsInput {
  memberDirectoryVisibility?: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
  contactVisibility?: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
  rentalVisibility?: 'PUBLIC' | 'PRIVATE';
  emergencyContactVisibility?: 'ADMINS_ONLY' | 'PRIVATE';
}

export interface RoleDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  status: string;
  memberCount: number;
  permissionKeys: string[];
  createdAt: string;
}

export interface CreateRoleInput {
  name: string;
  slug?: string;
  description?: string;
  permissionKeys: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionKeys?: string[];
}

export interface AuditLogDto {
  id: string;
  tenantId: string | null;
  actorUserId: string | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
  createdAtFormatted: string; // Asia/Dhaka formatted string
}

export interface AuditLogQueryOptions {
  module?: string;
  action?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export class PrivilegeEscalationError extends ForbiddenError {
  constructor(message = 'Cannot grant permissions that you do not personally possess') {
    super(message);
    this.name = 'PrivilegeEscalationError';
  }
}

export class OwnerProtectionError extends ForbiddenError {
  constructor(message = 'Cannot remove or demote the sole active Owner of this mess') {
    super(message);
    this.name = 'OwnerProtectionError';
  }
}

export function formatDhakaDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);
}

export class MessSettingsService {
  private readonly db: PrismaClient;

  // In-memory mock storage for testing & offline resilience
  public mockTenants: any[] = [];
  public mockSettings: any[] = [];
  public mockRoles: any[] = [];
  public mockRolePermissions: any[] = [];
  public mockMemberships: any[] = [];
  public mockUsers: any[] = [];
  public mockAuditLogs: any[] = [];

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || (defaultPrisma as any);
  }

  private isDbAvailable(): boolean {
    return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');
  }

  // ---------------------------------------------------------------------------
  // 1. MESS SETTINGS MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Retrieves mess settings, automatically seeding defaults if not yet initialized.
   */
  async getSettings(tenantSlug: string): Promise<MessSettingsDto> {
    if (!tenantSlug) throw new ValidationError('Tenant slug is required');

    if (!this.isDbAvailable()) {
      let tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
      if (!tenant) {
        throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);
      }

      let setting = this.mockSettings.find((s) => s.tenantId === tenant.id);
      if (!setting) {
        setting = {
          id: `setting_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          tenantId: tenant.id,
          preferredLanguage: 'en',
          contactPhone: tenant.phone || null,
          contactEmail: tenant.email || null,
          address: tenant.address || null,
          city: tenant.city || null,
          timezone: tenant.timezone || 'Asia/Dhaka',
          themeColor: 'emerald',
          publicWebsiteEnabled: true,
          showMenuOnHomepage: true,
          customTagline: tenant.description || null,
          defaultBillingPeriod: 'CALENDAR_MONTH',
          currency: 'BDT',
          enableRentalModule: true,
          enableMealModule: true,
          enableBazarModule: true,
          notifyOnNewExpense: true,
          notifyOnPaymentReceived: true,
          notifyOnMealCutoff: true,
          memberDirectoryVisibility: 'MEMBERS_ONLY',
          contactVisibility: 'PUBLIC',
          rentalVisibility: 'PUBLIC',
          emergencyContactVisibility: 'ADMINS_ONLY',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.mockSettings.push(setting);
      }

      return this.mapSettingsDto(tenant, setting);
    }

    const tenant = await this.db.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { messSetting: true },
    });

    if (!tenant) {
      throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);
    }

    let setting = tenant.messSetting;
    if (!setting) {
      setting = await this.db.messSetting.create({
        data: {
          tenantId: tenant.id,
          preferredLanguage: 'en',
          contactPhone: tenant.phone,
          contactEmail: tenant.email,
          address: tenant.address,
          city: tenant.city,
          timezone: tenant.timezone || 'Asia/Dhaka',
          themeColor: 'emerald',
          publicWebsiteEnabled: true,
          showMenuOnHomepage: true,
          customTagline: tenant.description,
          defaultBillingPeriod: 'CALENDAR_MONTH',
          currency: 'BDT',
          enableRentalModule: true,
          enableMealModule: true,
          enableBazarModule: true,
          notifyOnNewExpense: true,
          notifyOnPaymentReceived: true,
          notifyOnMealCutoff: true,
          memberDirectoryVisibility: 'MEMBERS_ONLY',
          contactVisibility: 'PUBLIC',
          rentalVisibility: 'PUBLIC',
          emergencyContactVisibility: 'ADMINS_ONLY',
        },
      });
    }

    return this.mapSettingsDto(tenant, setting);
  }

  /**
   * Updates General mess information (Name, Description, Phone, Email, Address, Timezone, Language).
   */
  async updateGeneralSettings(
    tenantSlug: string,
    input: UpdateGeneralSettingsInput,
    actorUserId: string
  ): Promise<MessSettingsDto> {
    if (input.preferredLanguage && !['en', 'bn'].includes(input.preferredLanguage)) {
      throw new ValidationError('Preferred language must be either English (en) or Bangla (bn)');
    }

    if (input.timezone && input.timezone !== 'Asia/Dhaka') {
      // In Task 36, Asia/Dhaka is the platform-standard business timezone
      throw new ValidationError('Timezone must be set to Asia/Dhaka');
    }

    const current = await this.getSettings(tenantSlug);
    const beforeData = {
      name: current.name,
      description: current.description,
      phone: current.phone,
      email: current.email,
      address: current.address,
      city: current.city,
      timezone: current.timezone,
      preferredLanguage: current.preferredLanguage,
    };

    if (!this.isDbAvailable()) {
      const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
      const setting = this.mockSettings.find((s) => s.tenantId === tenant.id);

      if (input.name !== undefined) tenant.name = input.name.trim();
      if (input.description !== undefined) tenant.description = input.description.trim() || null;
      if (input.logo !== undefined) tenant.logo = input.logo.trim() || null;
      if (input.coverImage !== undefined) tenant.coverImage = input.coverImage.trim() || null;
      if (input.phone !== undefined) tenant.phone = input.phone.trim() || null;
      if (input.email !== undefined) tenant.email = input.email.trim() || null;
      if (input.address !== undefined) tenant.address = input.address.trim() || null;
      if (input.city !== undefined) tenant.city = input.city.trim() || null;

      if (input.phone !== undefined) setting.contactPhone = input.phone.trim() || null;
      if (input.email !== undefined) setting.contactEmail = input.email.trim() || null;
      if (input.address !== undefined) setting.address = input.address.trim() || null;
      if (input.city !== undefined) setting.city = input.city.trim() || null;
      if (input.timezone !== undefined) setting.timezone = input.timezone;
      if (input.preferredLanguage !== undefined) setting.preferredLanguage = input.preferredLanguage;
      setting.updatedAt = new Date();

      this.recordMockAudit({
        tenantId: tenant.id,
        actorUserId,
        action: 'settings.update_general',
        entityType: 'mess_settings',
        entityId: setting.id,
        description: `Updated general settings for mess "${tenant.name}"`,
        beforeData,
        afterData: {
          name: tenant.name,
          phone: setting.contactPhone,
          email: setting.contactEmail,
          address: setting.address,
          preferredLanguage: setting.preferredLanguage,
        },
      });

      return this.mapSettingsDto(tenant, setting);
    }

    const tenant = await this.db.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

    const updatedTenant = await this.db.tenant.update({
      where: { id: tenant.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
        ...(input.logo !== undefined ? { logo: input.logo.trim() || null } : {}),
        ...(input.coverImage !== undefined ? { coverImage: input.coverImage.trim() || null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone.trim() || null } : {}),
        ...(input.email !== undefined ? { email: input.email.trim() || null } : {}),
        ...(input.address !== undefined ? { address: input.address.trim() || null } : {}),
        ...(input.city !== undefined ? { city: input.city.trim() || null } : {}),
      },
    });

    const updatedSetting = await this.db.messSetting.update({
      where: { tenantId: tenant.id },
      data: {
        ...(input.phone !== undefined ? { contactPhone: input.phone.trim() || null } : {}),
        ...(input.email !== undefined ? { contactEmail: input.email.trim() || null } : {}),
        ...(input.address !== undefined ? { address: input.address.trim() || null } : {}),
        ...(input.city !== undefined ? { city: input.city.trim() || null } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        ...(input.preferredLanguage !== undefined ? { preferredLanguage: input.preferredLanguage } : {}),
      },
    });

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'settings.update_general',
      entityType: 'mess_settings',
      entityId: updatedSetting.id,
      description: `Updated general settings for mess "${updatedTenant.name}"`,
      beforeData,
      afterData: {
        name: updatedTenant.name,
        phone: updatedSetting.contactPhone,
        email: updatedSetting.contactEmail,
        preferredLanguage: updatedSetting.preferredLanguage,
      },
    });

    return this.mapSettingsDto(updatedTenant, updatedSetting);
  }

  /**
   * Updates Appearance and Branding settings (Theme color, Website visibility, Homepage menus).
   */
  async updateAppearanceSettings(
    tenantSlug: string,
    input: UpdateAppearanceSettingsInput,
    actorUserId: string
  ): Promise<MessSettingsDto> {
    const validColors = ['emerald', 'blue', 'indigo', 'teal', 'purple', 'amber', 'rose'];
    if (input.themeColor && !validColors.includes(input.themeColor)) {
      throw new ValidationError(`Invalid theme color. Allowed: ${validColors.join(', ')}`);
    }

    const current = await this.getSettings(tenantSlug);
    const beforeData = {
      themeColor: current.themeColor,
      publicWebsiteEnabled: current.publicWebsiteEnabled,
      showMenuOnHomepage: current.showMenuOnHomepage,
      customTagline: current.customTagline,
    };

    if (!this.isDbAvailable()) {
      const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
      const setting = this.mockSettings.find((s) => s.tenantId === tenant.id);

      if (input.themeColor !== undefined) setting.themeColor = input.themeColor;
      if (input.publicWebsiteEnabled !== undefined) setting.publicWebsiteEnabled = Boolean(input.publicWebsiteEnabled);
      if (input.showMenuOnHomepage !== undefined) setting.showMenuOnHomepage = Boolean(input.showMenuOnHomepage);
      if (input.customTagline !== undefined) setting.customTagline = input.customTagline.trim() || null;
      setting.updatedAt = new Date();

      this.recordMockAudit({
        tenantId: tenant.id,
        actorUserId,
        action: 'settings.update_appearance',
        entityType: 'mess_settings',
        entityId: setting.id,
        description: `Updated appearance and branding preferences for mess "${tenant.name}"`,
        beforeData,
        afterData: {
          themeColor: setting.themeColor,
          publicWebsiteEnabled: setting.publicWebsiteEnabled,
        },
      });

      return this.mapSettingsDto(tenant, setting);
    }

    const tenant = await this.db.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

    const updatedSetting = await this.db.messSetting.update({
      where: { tenantId: tenant.id },
      data: {
        ...(input.themeColor !== undefined ? { themeColor: input.themeColor } : {}),
        ...(input.publicWebsiteEnabled !== undefined ? { publicWebsiteEnabled: Boolean(input.publicWebsiteEnabled) } : {}),
        ...(input.showMenuOnHomepage !== undefined ? { showMenuOnHomepage: Boolean(input.showMenuOnHomepage) } : {}),
        ...(input.customTagline !== undefined ? { customTagline: input.customTagline.trim() || null } : {}),
      },
    });

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'settings.update_appearance',
      entityType: 'mess_settings',
      entityId: updatedSetting.id,
      description: `Updated appearance and branding preferences for mess "${tenant.name}"`,
      beforeData,
      afterData: {
        themeColor: updatedSetting.themeColor,
        publicWebsiteEnabled: updatedSetting.publicWebsiteEnabled,
      },
    });

    return this.mapSettingsDto(tenant, updatedSetting);
  }

  /**
   * Updates Operational Defaults (Billing period, Currency, Module toggles, Notifications).
   */
  async updateOperationalDefaults(
    tenantSlug: string,
    input: UpdateOperationalDefaultsInput,
    actorUserId: string
  ): Promise<MessSettingsDto> {
    if (input.currency && input.currency.toUpperCase() !== 'BDT') {
      throw new ValidationError('MessMate internal operational currency must be BDT');
    }

    const current = await this.getSettings(tenantSlug);
    const beforeData = {
      defaultBillingPeriod: current.defaultBillingPeriod,
      currency: current.currency,
      enableRentalModule: current.enableRentalModule,
      enableMealModule: current.enableMealModule,
      enableBazarModule: current.enableBazarModule,
      notifyOnNewExpense: current.notifyOnNewExpense,
      notifyOnPaymentReceived: current.notifyOnPaymentReceived,
      notifyOnMealCutoff: current.notifyOnMealCutoff,
    };

    if (!this.isDbAvailable()) {
      const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
      const setting = this.mockSettings.find((s) => s.tenantId === tenant.id);

      if (input.defaultBillingPeriod !== undefined) setting.defaultBillingPeriod = input.defaultBillingPeriod;
      if (input.enableRentalModule !== undefined) setting.enableRentalModule = Boolean(input.enableRentalModule);
      if (input.enableMealModule !== undefined) setting.enableMealModule = Boolean(input.enableMealModule);
      if (input.enableBazarModule !== undefined) setting.enableBazarModule = Boolean(input.enableBazarModule);
      if (input.notifyOnNewExpense !== undefined) setting.notifyOnNewExpense = Boolean(input.notifyOnNewExpense);
      if (input.notifyOnPaymentReceived !== undefined) setting.notifyOnPaymentReceived = Boolean(input.notifyOnPaymentReceived);
      if (input.notifyOnMealCutoff !== undefined) setting.notifyOnMealCutoff = Boolean(input.notifyOnMealCutoff);
      setting.updatedAt = new Date();

      this.recordMockAudit({
        tenantId: tenant.id,
        actorUserId,
        action: 'settings.update_operational',
        entityType: 'mess_settings',
        entityId: setting.id,
        description: `Updated operational defaults and module preferences for mess "${tenant.name}"`,
        beforeData,
        afterData: {
          defaultBillingPeriod: setting.defaultBillingPeriod,
          enableRentalModule: setting.enableRentalModule,
        },
      });

      return this.mapSettingsDto(tenant, setting);
    }

    const tenant = await this.db.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

    const updatedSetting = await this.db.messSetting.update({
      where: { tenantId: tenant.id },
      data: {
        ...(input.defaultBillingPeriod !== undefined ? { defaultBillingPeriod: input.defaultBillingPeriod } : {}),
        ...(input.enableRentalModule !== undefined ? { enableRentalModule: Boolean(input.enableRentalModule) } : {}),
        ...(input.enableMealModule !== undefined ? { enableMealModule: Boolean(input.enableMealModule) } : {}),
        ...(input.enableBazarModule !== undefined ? { enableBazarModule: Boolean(input.enableBazarModule) } : {}),
        ...(input.notifyOnNewExpense !== undefined ? { notifyOnNewExpense: Boolean(input.notifyOnNewExpense) } : {}),
        ...(input.notifyOnPaymentReceived !== undefined ? { notifyOnPaymentReceived: Boolean(input.notifyOnPaymentReceived) } : {}),
        ...(input.notifyOnMealCutoff !== undefined ? { notifyOnMealCutoff: Boolean(input.notifyOnMealCutoff) } : {}),
      },
    });

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'settings.update_operational',
      entityType: 'mess_settings',
      entityId: updatedSetting.id,
      description: `Updated operational defaults and module preferences for mess "${tenant.name}"`,
      beforeData,
      afterData: {
        defaultBillingPeriod: updatedSetting.defaultBillingPeriod,
        enableRentalModule: updatedSetting.enableRentalModule,
      },
    });

    return this.mapSettingsDto(tenant, updatedSetting);
  }

  /**
   * Updates Privacy & Visibility settings with strict safety guards.
   * INVARIANT: Emergency contacts must never be publicly exposed (only ADMINS_ONLY or PRIVATE).
   */
  async updatePrivacySettings(
    tenantSlug: string,
    input: UpdatePrivacySettingsInput,
    actorUserId: string
  ): Promise<MessSettingsDto> {
    if (input.emergencyContactVisibility && input.emergencyContactVisibility === ('PUBLIC' as any)) {
      throw new ValidationError(
        'Security Violation: Emergency contact details cannot be made public. Allowed: ADMINS_ONLY or PRIVATE.'
      );
    }

    if (
      input.memberDirectoryVisibility &&
      !['PUBLIC', 'MEMBERS_ONLY', 'PRIVATE'].includes(input.memberDirectoryVisibility)
    ) {
      throw new ValidationError('Invalid member directory visibility option');
    }

    const current = await this.getSettings(tenantSlug);
    const beforeData = {
      memberDirectoryVisibility: current.memberDirectoryVisibility,
      contactVisibility: current.contactVisibility,
      rentalVisibility: current.rentalVisibility,
      emergencyContactVisibility: current.emergencyContactVisibility,
    };

    if (!this.isDbAvailable()) {
      const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
      const setting = this.mockSettings.find((s) => s.tenantId === tenant.id);

      if (input.memberDirectoryVisibility !== undefined) {
        setting.memberDirectoryVisibility = input.memberDirectoryVisibility;
      }
      if (input.contactVisibility !== undefined) {
        setting.contactVisibility = input.contactVisibility;
      }
      if (input.rentalVisibility !== undefined) {
        setting.rentalVisibility = input.rentalVisibility;
      }
      if (input.emergencyContactVisibility !== undefined) {
        setting.emergencyContactVisibility = input.emergencyContactVisibility;
      }
      setting.updatedAt = new Date();

      this.recordMockAudit({
        tenantId: tenant.id,
        actorUserId,
        action: 'settings.update_privacy',
        entityType: 'mess_settings',
        entityId: setting.id,
        description: `Updated privacy and data visibility rules for mess "${tenant.name}"`,
        beforeData,
        afterData: {
          memberDirectoryVisibility: setting.memberDirectoryVisibility,
          emergencyContactVisibility: setting.emergencyContactVisibility,
        },
      });

      return this.mapSettingsDto(tenant, setting);
    }

    const tenant = await this.db.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

    const updatedSetting = await this.db.messSetting.update({
      where: { tenantId: tenant.id },
      data: {
        ...(input.memberDirectoryVisibility !== undefined
          ? { memberDirectoryVisibility: input.memberDirectoryVisibility }
          : {}),
        ...(input.contactVisibility !== undefined
          ? { contactVisibility: input.contactVisibility }
          : {}),
        ...(input.rentalVisibility !== undefined
          ? { rentalVisibility: input.rentalVisibility }
          : {}),
        ...(input.emergencyContactVisibility !== undefined
          ? { emergencyContactVisibility: input.emergencyContactVisibility }
          : {}),
      },
    });

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'settings.update_privacy',
      entityType: 'mess_settings',
      entityId: updatedSetting.id,
      description: `Updated privacy and data visibility rules for mess "${tenant.name}"`,
      beforeData,
      afterData: {
        memberDirectoryVisibility: updatedSetting.memberDirectoryVisibility,
        emergencyContactVisibility: updatedSetting.emergencyContactVisibility,
      },
    });

    return this.mapSettingsDto(tenant, updatedSetting);
  }

  // ---------------------------------------------------------------------------
  // 2. ROLES & PERMISSIONS MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Lists all roles for the tenant, ensuring the 6 system roles exist.
   */
  async listRoles(tenantSlug: string): Promise<RoleDto[]> {
    if (!this.isDbAvailable()) {
      const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
      if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

      // Seed system roles for this tenant if not present
      this.ensureMockSystemRoles(tenant.id);

      const roles = this.mockRoles.filter((r) => r.tenantId === tenant.id);
      return roles.map((r) => {
        const memberCount = this.mockMemberships.filter(
          (m) => m.tenantId === tenant.id && m.roleId === r.id && m.status === 'ACTIVE'
        ).length;
        const permissionKeys = (r.rolePermissions || []).map((rp: any) => rp.permissionKey || rp);
        return {
          id: r.id,
          tenantId: r.tenantId,
          name: r.name,
          slug: r.slug,
          description: r.description || null,
          isSystem: Boolean(r.isSystem),
          status: r.status || 'ACTIVE',
          memberCount,
          permissionKeys,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        };
      });
    }

    const tenant = await this.db.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

    // Ensure system roles exist for this tenant
    await this.ensureDbSystemRoles(tenant.id);

    const roles = await this.db.role.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: { select: { memberships: { where: { status: 'ACTIVE' } } } },
        rolePermissions: { include: { permission: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return roles.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      status: r.status,
      memberCount: r._count.memberships,
      permissionKeys: r.rolePermissions.map((rp) => rp.permission.key),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Creates a custom tenant role with permission validation and anti-privilege escalation.
   */
  async createRole(
    tenantSlug: string,
    input: CreateRoleInput,
    actorUserId: string,
    actorIsOwner: boolean,
    actorPermissions: Set<string>
  ): Promise<RoleDto> {
    const name = input.name?.trim();
    if (!name) throw new ValidationError('Role name is required');

    const slug = (input.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
    if (!slug) throw new ValidationError('Role slug is required');

    // 1. Validate permissions against catalog
    for (const key of input.permissionKeys) {
      if (!isValidPermissionKey(key)) {
        throw new ValidationError(`Invalid or unregistered permission key: '${key}'`);
      }
    }

    // 2. Anti-Privilege Escalation: Non-owners cannot delegate permissions they do not hold
    if (!actorIsOwner) {
      for (const key of input.permissionKeys) {
        if (!actorPermissions.has(key)) {
          throw new PrivilegeEscalationError(
            `Cannot delegate permission '${key}' because you do not hold it.`
          );
        }
      }
    }

    if (!this.isDbAvailable()) {
      const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
      if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

      // Check unique name or slug
      const duplicate = this.mockRoles.find(
        (r) => r.tenantId === tenant.id && (r.name.toLowerCase() === name.toLowerCase() || r.slug === slug)
      );
      if (duplicate) {
        throw new ConflictError(`A role with name "${name}" or slug "${slug}" already exists in this mess.`);
      }

      const roleId = `role_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newRole = {
        id: roleId,
        tenantId: tenant.id,
        name,
        slug,
        description: input.description?.trim() || null,
        isSystem: false,
        status: 'ACTIVE',
        rolePermissions: input.permissionKeys.map((k) => ({ permissionKey: k })),
        createdAt: new Date(),
      };
      this.mockRoles.push(newRole);

      this.recordMockAudit({
        tenantId: tenant.id,
        actorUserId,
        action: 'roles.create',
        entityType: 'role',
        entityId: roleId,
        description: `Created custom role "${name}" with ${input.permissionKeys.length} permissions`,
        afterData: { name, slug, permissionKeys: input.permissionKeys },
      });

      return {
        id: roleId,
        tenantId: tenant.id,
        name,
        slug,
        description: newRole.description,
        isSystem: false,
        status: 'ACTIVE',
        memberCount: 0,
        permissionKeys: input.permissionKeys,
        createdAt: newRole.createdAt.toISOString(),
      };
    }

    const tenant = await this.db.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

    const existing = await this.db.role.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [{ name }, { slug }],
      },
    });
    if (existing) {
      throw new ConflictError(`A role with name "${name}" or slug "${slug}" already exists in this mess.`);
    }

    const dbPermissions = await this.db.permission.findMany({
      where: { key: { in: input.permissionKeys } },
    });

    const createdRole = await this.db.role.create({
      data: {
        tenantId: tenant.id,
        name,
        slug,
        description: input.description?.trim() || null,
        isSystem: false,
        status: 'ACTIVE',
        rolePermissions: {
          create: dbPermissions.map((p) => ({ permissionId: p.id })),
        },
      },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'roles.create',
      entityType: 'role',
      entityId: createdRole.id,
      description: `Created custom role "${name}" with ${input.permissionKeys.length} permissions`,
      afterData: { name, slug, permissionKeys: input.permissionKeys },
    });

    return {
      id: createdRole.id,
      tenantId: createdRole.tenantId,
      name: createdRole.name,
      slug: createdRole.slug,
      description: createdRole.description,
      isSystem: false,
      status: createdRole.status,
      memberCount: 0,
      permissionKeys: createdRole.rolePermissions.map((rp) => rp.permission.key),
      createdAt: createdRole.createdAt.toISOString(),
    };
  }

  /**
   * Updates an existing role (name, description, permissions) with system role protection and anti-privilege escalation.
   */
  async updateRole(
    tenantSlug: string,
    roleId: string,
    input: UpdateRoleInput,
    actorUserId: string,
    actorIsOwner: boolean,
    actorPermissions: Set<string>
  ): Promise<RoleDto> {
    if (!this.isDbAvailable()) {
      const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
      if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

      const role = this.mockRoles.find((r) => r.id === roleId && r.tenantId === tenant.id);
      if (!role) throw new NotFoundError('Target role was not found in this mess');

      // System role name protection
      if (role.isSystem && input.name && input.name.trim() !== role.name) {
        throw new ForbiddenError('System-defined role names cannot be renamed.');
      }

      // Owner role protection: non-owners cannot modify Owner role
      if (role.slug === 'owner' && !actorIsOwner) {
        throw new ForbiddenError('Only an Owner can modify the Owner role.');
      }

      // Anti-Privilege Escalation for permission modifications
      if (input.permissionKeys && !actorIsOwner) {
        for (const key of input.permissionKeys) {
          if (!isValidPermissionKey(key)) {
            throw new ValidationError(`Invalid permission key: '${key}'`);
          }
          if (!actorPermissions.has(key)) {
            throw new PrivilegeEscalationError(
              `Cannot delegate permission '${key}' because you do not hold it.`
            );
          }
        }
      }

      const beforeData = {
        name: role.name,
        description: role.description,
        permissionKeys: (role.rolePermissions || []).map((rp: any) => rp.permissionKey || rp),
      };

      if (input.name !== undefined) role.name = input.name.trim();
      if (input.description !== undefined) role.description = input.description.trim() || null;
      if (input.permissionKeys !== undefined) {
        role.rolePermissions = input.permissionKeys.map((k) => ({ permissionKey: k }));
      }

      this.recordMockAudit({
        tenantId: tenant.id,
        actorUserId,
        action: 'roles.update',
        entityType: 'role',
        entityId: role.id,
        description: `Updated role "${role.name}"`,
        beforeData,
        afterData: { name: role.name, permissionKeys: input.permissionKeys },
      });

      const memberCount = this.mockMemberships.filter(
        (m) => m.tenantId === tenant.id && m.roleId === role.id && m.status === 'ACTIVE'
      ).length;

      return {
        id: role.id,
        tenantId: role.tenantId,
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: Boolean(role.isSystem),
        status: role.status || 'ACTIVE',
        memberCount,
        permissionKeys: (role.rolePermissions || []).map((rp: any) => rp.permissionKey || rp),
        createdAt: role.createdAt ? new Date(role.createdAt).toISOString() : new Date().toISOString(),
      };
    }

    const tenant = await this.db.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

    const role = await this.db.role.findFirst({
      where: { id: roleId, tenantId: tenant.id },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundError('Target role was not found in this mess');

    if (role.isSystem && input.name && input.name.trim() !== role.name) {
      throw new ForbiddenError('System-defined role names cannot be renamed.');
    }

    if (role.slug === 'owner' && !actorIsOwner) {
      throw new ForbiddenError('Only an Owner can modify the Owner role.');
    }

    if (input.permissionKeys) {
      for (const key of input.permissionKeys) {
        if (!isValidPermissionKey(key)) {
          throw new ValidationError(`Invalid permission key: '${key}'`);
        }
      }
      if (!actorIsOwner) {
        for (const key of input.permissionKeys) {
          if (!actorPermissions.has(key)) {
            throw new PrivilegeEscalationError(
              `Cannot delegate permission '${key}' because you do not hold it.`
            );
          }
        }
      }
    }

    const beforeData = {
      name: role.name,
      description: role.description,
      permissionKeys: role.rolePermissions.map((rp) => rp.permission.key),
    };

    let updatedPermissionsCreate: any = undefined;
    if (input.permissionKeys) {
      const dbPerms = await this.db.permission.findMany({
        where: { key: { in: input.permissionKeys } },
      });
      updatedPermissionsCreate = dbPerms.map((p) => ({ permissionId: p.id }));
    }

    const updatedRole = await this.db.role.update({
      where: { id: role.id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
        ...(updatedPermissionsCreate
          ? {
              rolePermissions: {
                deleteMany: {},
                create: updatedPermissionsCreate,
              },
            }
          : {}),
      },
      include: {
        _count: { select: { memberships: { where: { status: 'ACTIVE' } } } },
        rolePermissions: { include: { permission: true } },
      },
    });

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'roles.update',
      entityType: 'role',
      entityId: updatedRole.id,
      description: `Updated role "${updatedRole.name}"`,
      beforeData,
      afterData: { name: updatedRole.name, permissionKeys: input.permissionKeys },
    });

    return {
      id: updatedRole.id,
      tenantId: updatedRole.tenantId,
      name: updatedRole.name,
      slug: updatedRole.slug,
      description: updatedRole.description,
      isSystem: updatedRole.isSystem,
      status: updatedRole.status,
      memberCount: updatedRole._count.memberships,
      permissionKeys: updatedRole.rolePermissions.map((rp) => rp.permission.key),
      createdAt: updatedRole.createdAt.toISOString(),
    };
  }

  /**
   * Deletes a custom tenant role. Rejects deletion if system role or if members are assigned.
   */
  async deleteRole(tenantSlug: string, roleId: string, actorUserId: string): Promise<void> {
    if (!this.isDbAvailable()) {
      const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
      if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

      const roleIndex = this.mockRoles.findIndex((r) => r.id === roleId && r.tenantId === tenant.id);
      if (roleIndex === -1) throw new NotFoundError('Target role was not found in this mess');

      const role = this.mockRoles[roleIndex];
      if (role.isSystem) {
        throw new ForbiddenError('System-defined default roles cannot be deleted.');
      }

      const assignedMembers = this.mockMemberships.filter(
        (m) => m.tenantId === tenant.id && m.roleId === role.id && m.status === 'ACTIVE'
      );
      if (assignedMembers.length > 0) {
        throw new ConflictError(
          `Cannot delete role "${role.name}" because it is currently assigned to ${assignedMembers.length} active member(s). Reassign them first.`
        );
      }

      this.mockRoles.splice(roleIndex, 1);

      this.recordMockAudit({
        tenantId: tenant.id,
        actorUserId,
        action: 'roles.delete',
        entityType: 'role',
        entityId: roleId,
        description: `Deleted custom role "${role.name}"`,
        beforeData: { name: role.name, slug: role.slug },
      });

      return;
    }

    const tenant = await this.db.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

    const role = await this.db.role.findFirst({
      where: { id: roleId, tenantId: tenant.id },
      include: {
        _count: { select: { memberships: { where: { status: 'ACTIVE' } } } },
      },
    });
    if (!role) throw new NotFoundError('Target role was not found in this mess');

    if (role.isSystem) {
      throw new ForbiddenError('System-defined default roles cannot be deleted.');
    }

    if (role._count.memberships > 0) {
      throw new ConflictError(
        `Cannot delete role "${role.name}" because it is currently assigned to ${role._count.memberships} active member(s). Reassign them first.`
      );
    }

    await this.db.role.delete({ where: { id: role.id } });

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'roles.delete',
      entityType: 'role',
      entityId: role.id,
      description: `Deleted custom role "${role.name}"`,
      beforeData: { name: role.name, slug: role.slug },
    });
  }

  // ---------------------------------------------------------------------------
  // 3. AUDIT LOG VIEWER (APPEND-ONLY, IMMUTABLE)
  // ---------------------------------------------------------------------------

  /**
   * Queries audit logs strictly scoped to the tenant with redaction and Asia/Dhaka formatting.
   * INVARIANT: Ordinary admins/moderators cannot delete or alter audit logs.
   */
  async listAuditLogs(
    tenantSlug: string,
    options: AuditLogQueryOptions = {}
  ): Promise<{ logs: AuditLogDto[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 25));
    const skip = (page - 1) * pageSize;

    if (!this.isDbAvailable()) {
      const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
      if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

      let filtered = this.mockAuditLogs.filter((log) => log.tenantId === tenant.id);

      if (options.module) {
        filtered = filtered.filter(
          (l) => (l.entityType || '').toLowerCase() === options.module!.toLowerCase()
        );
      }
      if (options.action) {
        filtered = filtered.filter(
          (l) => (l.action || '').toLowerCase().includes(options.action!.toLowerCase())
        );
      }
      if (options.search) {
        const query = options.search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            (l.description || '').toLowerCase().includes(query) ||
            (l.action || '').toLowerCase().includes(query) ||
            (l.entityType || '').toLowerCase().includes(query)
        );
      }
      if (options.startDate) {
        const start = new Date(options.startDate);
        filtered = filtered.filter((l) => new Date(l.createdAt) >= start);
      }
      if (options.endDate) {
        const end = new Date(options.endDate);
        filtered = filtered.filter((l) => new Date(l.createdAt) <= end);
      }

      // Sort newest first
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + pageSize);

      const logs: AuditLogDto[] = paginated.map((l) => {
        const actorUser = this.mockUsers.find((u) => u.id === l.actorUserId);
        const actorMembership = this.mockMemberships.find(
          (m) => m.userId === l.actorUserId && m.tenantId === tenant.id
        );
        const role = actorMembership
          ? this.mockRoles.find((r) => r.id === actorMembership.roleId)
          : null;

        return {
          id: l.id,
          tenantId: l.tenantId,
          actorUserId: l.actorUserId,
          actorName: actorUser?.name || 'System / Admin',
          actorEmail: actorUser?.email || 'admin@messmate.com',
          actorRole: role?.name || 'Admin',
          action: l.action,
          entityType: l.entityType,
          entityId: l.entityId || null,
          description: l.description || null,
          beforeData: sanitizeLogData(l.beforeData),
          afterData: sanitizeLogData(l.afterData),
          createdAt: new Date(l.createdAt).toISOString(),
          createdAtFormatted: formatDhakaDateTime(l.createdAt),
        };
      });

      return { logs, total, page, pageSize };
    }

    const tenant = await this.db.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundError(`Mess with slug '${tenantSlug}' not found`);

    const where: any = {
      tenantId: tenant.id,
      ...(options.module ? { entityType: options.module } : {}),
      ...(options.action ? { action: { contains: options.action, mode: 'insensitive' } } : {}),
      ...(options.search
        ? {
            OR: [
              { description: { contains: options.search, mode: 'insensitive' } },
              { action: { contains: options.search, mode: 'insensitive' } },
              { entityType: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(options.startDate || options.endDate
        ? {
            createdAt: {
              ...(options.startDate ? { gte: new Date(options.startDate) } : {}),
              ...(options.endDate ? { lte: new Date(options.endDate) } : {}),
            },
          }
        : {}),
    };

    const [total, dbLogs] = await Promise.all([
      this.db.auditLog.count({ where }),
      this.db.auditLog.findMany({
        where,
        include: {
          actorUser: {
            include: {
              memberships: {
                where: { tenantId: tenant.id },
                include: { role: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const logs: AuditLogDto[] = dbLogs.map((l) => {
      const membership = l.actorUser?.memberships?.[0];
      const roleName = membership?.role?.name || 'Admin';

      return {
        id: l.id,
        tenantId: l.tenantId,
        actorUserId: l.actorUserId,
        actorName: l.actorUser?.name || 'System / Admin',
        actorEmail: l.actorUser?.email || 'admin@messmate.com',
        actorRole: roleName,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        description: l.description,
        beforeData: sanitizeLogData(l.beforeData),
        afterData: sanitizeLogData(l.afterData),
        createdAt: l.createdAt.toISOString(),
        createdAtFormatted: formatDhakaDateTime(l.createdAt),
      };
    });

    return { logs, total, page, pageSize };
  }

  /**
   * INVARIANT: Audit logs are strictly append-only.
   * Attempting to delete an audit log is explicitly blocked.
   */
  async deleteAuditLog(): Promise<void> {
    throw new ForbiddenError('Audit logs are strictly append-only and cannot be altered or deleted.');
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS & SYSTEM SEEDING
  // ---------------------------------------------------------------------------

  private mapSettingsDto(tenant: any, setting: any): MessSettingsDto {
    return {
      id: setting.id,
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description || null,
      logo: tenant.logo || null,
      coverImage: tenant.coverImage || null,
      phone: tenant.phone || setting.contactPhone || null,
      email: tenant.email || setting.contactEmail || null,
      address: tenant.address || setting.address || null,
      city: tenant.city || setting.city || null,
      timezone: setting.timezone || 'Asia/Dhaka',
      preferredLanguage: setting.preferredLanguage || 'en',
      themeColor: setting.themeColor || 'emerald',
      publicWebsiteEnabled: setting.publicWebsiteEnabled !== false,
      showMenuOnHomepage: setting.showMenuOnHomepage !== false,
      customTagline: setting.customTagline || tenant.description || null,
      defaultBillingPeriod: setting.defaultBillingPeriod || 'CALENDAR_MONTH',
      currency: setting.currency || 'BDT',
      enableRentalModule: setting.enableRentalModule !== false,
      enableMealModule: setting.enableMealModule !== false,
      enableBazarModule: setting.enableBazarModule !== false,
      notifyOnNewExpense: setting.notifyOnNewExpense !== false,
      notifyOnPaymentReceived: setting.notifyOnPaymentReceived !== false,
      notifyOnMealCutoff: setting.notifyOnMealCutoff !== false,
      memberDirectoryVisibility: setting.memberDirectoryVisibility || 'MEMBERS_ONLY',
      contactVisibility: setting.contactVisibility || 'PUBLIC',
      rentalVisibility: setting.rentalVisibility || 'PUBLIC',
      emergencyContactVisibility: setting.emergencyContactVisibility || 'ADMINS_ONLY',
      updatedAt: setting.updatedAt ? new Date(setting.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  private ensureMockSystemRoles(tenantId: string) {
    for (const template of SYSTEM_ROLE_TEMPLATES) {
      const exists = this.mockRoles.some((r) => r.tenantId === tenantId && r.slug === template.slug);
      if (!exists) {
        this.mockRoles.push({
          id: `role_${template.slug}_${tenantId}`,
          tenantId,
          name: template.name,
          slug: template.slug,
          description: template.description,
          isSystem: true,
          status: 'ACTIVE',
          rolePermissions: template.permissionKeys.map((k) => ({ permissionKey: k })),
          createdAt: new Date(),
        });
      }
    }
  }

  private async ensureDbSystemRoles(tenantId: string) {
    const existingRoles = await this.db.role.findMany({
      where: { tenantId },
      select: { slug: true },
    });
    const existingSlugs = new Set(existingRoles.map((r) => r.slug));

    for (const template of SYSTEM_ROLE_TEMPLATES) {
      if (!existingSlugs.has(template.slug)) {
        const dbPermissions = await this.db.permission.findMany({
          where: { key: { in: template.permissionKeys } },
        });

        await this.db.role.create({
          data: {
            tenantId,
            name: template.name,
            slug: template.slug,
            description: template.description,
            isSystem: true,
            status: 'ACTIVE',
            rolePermissions: {
              create: dbPermissions.map((p) => ({ permissionId: p.id })),
            },
          },
        });
      }
    }
  }

  private recordMockAudit(input: any) {
    this.mockAuditLogs.push({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      beforeData: input.beforeData,
      afterData: input.afterData,
      createdAt: new Date(),
    });
  }
}

export const messSettingsService = new MessSettingsService();
