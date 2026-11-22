if (typeof window !== 'undefined') {
  throw new Error('TenantNotificationService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { inspectDatabaseConfig } from '@/server/db/config';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '@/server/api/errors';
import { formatDhakaDateTime } from '@/server/settings/mess-settings-service';

export const ASIA_DHAKA_TIMEZONE = 'Asia/Dhaka';

export type NotificationCategory =
  | 'GENERAL'
  | 'MEAL_UPDATE'
  | 'MEAL_REQUEST'
  | 'PAYMENT'
  | 'BILLING'
  | 'COMPLAINT'
  | 'ROOM_REQUEST'
  | 'EVENT'
  | 'VISITOR'
  | 'MAINTENANCE'
  | 'INVENTORY'
  | 'POLL';

export interface TenantNotificationDto {
  id: string;
  tenantId: string;
  userId: string;
  membershipId: string | null;
  category: NotificationCategory | string;
  title: string;
  message: string;
  link: string | null;
  eventReference: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  formattedCreatedAt: string;
  metadata?: any;
}

export interface NotificationPreferenceDto {
  id: string;
  tenantId: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  mealsEnabled: boolean;
  billingEnabled: boolean;
  complaintsEnabled: boolean;
  eventsEnabled: boolean;
  noticesEnabled: boolean;
  remindersEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  channelStatus: {
    inApp: { available: boolean; configured: boolean; message: string };
    email: { available: boolean; configured: boolean; message: string };
    sms: { available: boolean; configured: boolean; message: string };
  };
}

export interface ScheduledReminderDto {
  id: string;
  tenantId: string;
  reminderType: string;
  title: string;
  message: string;
  targetAudience: string;
  scheduleTime: string; // HH:mm in Asia/Dhaka
  isActive: boolean;
  createdById: string | null;
  creatorName?: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  formattedCreatedAt: string;
}

export interface NotificationDeliveryLogDto {
  id: string;
  tenantId: string;
  notificationId: string | null;
  channel: string; // IN_APP, EMAIL, SMS
  recipient: string;
  status: string; // DELIVERED, FAILED, SKIPPED, PENDING
  errorMessage: string | null;
  attemptCount: number;
  createdAt: string;
  formattedCreatedAt: string;
}

export interface CreateNotificationInput {
  tenantSlug: string;
  userId: string;
  membershipId?: string | null;
  category: NotificationCategory;
  title: string;
  message: string;
  link?: string | null;
  eventReference?: string | null;
  metadata?: any;
  bypassPreferences?: boolean;
}

export interface CreateBroadcastNotificationInput {
  tenantSlug: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link?: string | null;
  eventReference?: string | null;
  targetAudience?: 'ALL_MEMBERS' | 'ACTIVE_MEMBERS';
}

export interface UpdatePreferencesInput {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  mealsEnabled?: boolean;
  billingEnabled?: boolean;
  complaintsEnabled?: boolean;
  eventsEnabled?: boolean;
  noticesEnabled?: boolean;
  remindersEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface CreateReminderInput {
  reminderType: string;
  title: string;
  message: string;
  targetAudience?: string;
  scheduleTime?: string; // HH:mm
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class TenantNotificationService {
  private readonly db: PrismaClient;

  // In-memory mock storage for testing & offline resilience
  public mockTenants: any[] = [];
  public mockUsers: any[] = [];
  public mockMemberships: any[] = [];
  public mockNotifications: any[] = [];
  public mockPreferences: any[] = [];
  public mockReminders: any[] = [];
  public mockDeliveryLogs: any[] = [];

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || (defaultPrisma as any);
    this.seedMockData();
  }

  public seedMockData() {
    this.mockTenants = [
      {
        id: 'tenant_prince_mess',
        slug: 'prince-mess',
        name: 'Prince Mess',
        status: 'ACTIVE',
      },
      {
        id: 'tenant_green_villa',
        slug: 'green-villa-mess',
        name: 'Green Villa Mess',
        status: 'ACTIVE',
      },
      {
        id: 'tenant_suspended_mess',
        slug: 'suspended-mess',
        name: 'Suspended Mess',
        status: 'SUSPENDED',
      },
    ];

    this.mockUsers = [
      {
        id: 'usr_resident_1',
        name: 'Tanvir Ahmed',
        email: 'tanvir@messmate.dev',
      },
      {
        id: 'usr_resident_2',
        name: 'Rakib Hasan',
        email: 'rakib@messmate.dev',
      },
      {
        id: 'usr_owner_1',
        name: 'Prince Mess Manager',
        email: 'manager@prince-mess.dev',
      },
    ];

    this.mockMemberships = [
      {
        id: 'mem_tanvir_prince',
        userId: 'usr_resident_1',
        tenantId: 'tenant_prince_mess',
        status: 'ACTIVE',
      },
      {
        id: 'mem_rakib_prince',
        userId: 'usr_resident_2',
        tenantId: 'tenant_prince_mess',
        status: 'ACTIVE',
      },
      {
        id: 'mem_tanvir_green',
        userId: 'usr_resident_1',
        tenantId: 'tenant_green_villa',
        status: 'ACTIVE',
      },
    ];

    this.mockNotifications = [
      {
        id: 'notif_seed_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_1',
        membershipId: 'mem_tanvir_prince',
        category: 'GENERAL',
        title: 'Welcome to Prince Mess In-App Notifications',
        message: 'Stay updated with meal cutoffs, billing, and important mess announcements in real time.',
        link: '/portal/prince-mess',
        eventReference: 'EVT_SEED_WELCOME_1',
        isRead: false,
        readAt: null,
        createdAt: new Date('2026-11-20T08:00:00Z'),
        updatedAt: new Date('2026-11-20T08:00:00Z'),
      },
      {
        id: 'notif_seed_2',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_1',
        membershipId: 'mem_tanvir_prince',
        category: 'MEAL_UPDATE',
        title: 'Dinner Menu Updated',
        message: 'Special dinner feast scheduled with chicken biryani and firni for Friday night.',
        link: '/portal/prince-mess/meals',
        eventReference: 'EVT_SEED_MEAL_1',
        isRead: true,
        readAt: new Date('2026-11-21T10:00:00Z'),
        createdAt: new Date('2026-11-21T09:30:00Z'),
        updatedAt: new Date('2026-11-21T10:00:00Z'),
      },
      {
        id: 'notif_seed_green',
        tenantId: 'tenant_green_villa',
        userId: 'usr_resident_2',
        membershipId: null,
        category: 'PAYMENT',
        title: 'Green Villa Notice',
        message: 'Private alert for Green Villa resident.',
        link: '/portal/green-villa-mess',
        eventReference: 'EVT_SEED_GREEN_1',
        isRead: false,
        readAt: null,
        createdAt: new Date('2026-11-21T11:00:00Z'),
        updatedAt: new Date('2026-11-21T11:00:00Z'),
      },
    ];

    this.mockPreferences = [
      {
        id: 'pref_seed_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_1',
        inAppEnabled: true,
        emailEnabled: false,
        smsEnabled: false,
        mealsEnabled: true,
        billingEnabled: true,
        complaintsEnabled: true,
        eventsEnabled: true,
        noticesEnabled: true,
        remindersEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        createdAt: new Date('2026-11-20T00:00:00Z'),
        updatedAt: new Date('2026-11-20T00:00:00Z'),
      },
    ];

    this.mockReminders = [
      {
        id: 'rem_seed_1',
        tenantId: 'tenant_prince_mess',
        reminderType: 'MEAL_CUTOFF',
        title: 'Daily Lunch Cutoff Reminder',
        message: 'Lunch selection cutoff closes at 09:30 AM Asia/Dhaka daily. Please update your status.',
        targetAudience: 'ACTIVE_MEMBERS',
        scheduleTime: '09:00',
        isActive: true,
        createdById: 'usr_owner_1',
        creatorName: 'Prince Mess Manager',
        lastRunAt: null,
        nextRunAt: null,
        createdAt: new Date('2026-11-20T00:00:00Z'),
        updatedAt: new Date('2026-11-20T00:00:00Z'),
      },
    ];

    this.mockDeliveryLogs = [
      {
        id: 'log_seed_1',
        tenantId: 'tenant_prince_mess',
        notificationId: 'notif_seed_1',
        channel: 'IN_APP',
        recipient: 'usr_resident_1',
        status: 'DELIVERED',
        errorMessage: null,
        attemptCount: 1,
        createdAt: new Date('2026-11-20T08:00:00Z'),
      },
    ];
  }

  private isDbConfigured(): boolean {
    return inspectDatabaseConfig().configured;
  }

  private async resolveTenant(tenantSlug: string): Promise<any> {
    if (this.isDbConfigured()) {
      const tenant = await this.db.tenant.findUnique({
        where: { slug: tenantSlug },
      });
      if (!tenant) {
        throw new NotFoundError(`Mess tenant '${tenantSlug}' not found.`);
      }
      if (tenant.status === 'SUSPENDED') {
        throw new ForbiddenError(`Mess tenant '${tenantSlug}' is suspended.`);
      }
      return tenant;
    }

    const mock = this.mockTenants.find((t) => t.slug === tenantSlug);
    if (!mock) {
      throw new NotFoundError(`Mess tenant '${tenantSlug}' not found.`);
    }
    if (mock.status === 'SUSPENDED') {
      throw new ForbiddenError(`Mess tenant '${tenantSlug}' is suspended.`);
    }
    return mock;
  }

  /**
   * Lists notifications belonging strictly to the authenticated user and resolved tenant.
   */
  async listNotifications(
    tenantSlug: string,
    userId: string,
    options: {
      unreadOnly?: boolean;
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    notifications: TenantNotificationDto[];
    unreadCount: number;
    total: number;
  }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const limit = Math.min(Math.max(options.limit || 20, 1), 100);
    const offset = Math.max(options.offset || 0, 0);

    if (this.isDbConfigured()) {
      const where: any = {
        tenantId: tenant.id,
        userId,
      };

      if (options.unreadOnly) {
        where.isRead = false;
      }
      if (options.category && options.category !== 'ALL') {
        where.category = options.category;
      }

      const [unreadCount, total, items] = await Promise.all([
        this.db.tenantNotification.count({
          where: { tenantId: tenant.id, userId, isRead: false },
        }),
        this.db.tenantNotification.count({ where }),
        this.db.tenantNotification.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const notifications: TenantNotificationDto[] = items.map((n: any) => ({
        id: n.id,
        tenantId: n.tenantId,
        userId: n.userId,
        membershipId: n.membershipId,
        category: n.category as NotificationCategory,
        title: n.title,
        message: n.message,
        link: n.link,
        eventReference: n.eventReference,
        isRead: n.isRead,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(n.createdAt),
        metadata: n.metadata,
      }));

      return { notifications, unreadCount, total };
    }

    // In-memory fallback
    const userNotifs = this.mockNotifications
      .filter((n) => n.tenantId === tenant.id && n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const unreadCount = userNotifs.filter((n) => !n.isRead).length;

    let filtered = userNotifs;
    if (options.unreadOnly) {
      filtered = filtered.filter((n) => !n.isRead);
    }
    if (options.category && options.category !== 'ALL') {
      filtered = filtered.filter((n) => n.category === options.category);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    const notifications: TenantNotificationDto[] = paginated.map((n) => ({
      id: n.id,
      tenantId: n.tenantId,
      userId: n.userId,
      membershipId: n.membershipId,
      category: n.category as NotificationCategory,
      title: n.title,
      message: n.message,
      link: n.link,
      eventReference: n.eventReference,
      isRead: n.isRead,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(n.createdAt),
      metadata: n.metadata,
    }));

    return { notifications, unreadCount, total };
  }

  /**
   * Retrieves the unread notification count for an authenticated user.
   */
  async getUnreadCount(tenantSlug: string, userId: string): Promise<number> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      return this.db.tenantNotification.count({
        where: { tenantId: tenant.id, userId, isRead: false },
      });
    }

    return this.mockNotifications.filter(
      (n) => n.tenantId === tenant.id && n.userId === userId && !n.isRead
    ).length;
  }

  /**
   * Marks a single notification as read, enforcing strict ownership verification.
   */
  async markAsRead(
    tenantSlug: string,
    userId: string,
    notificationId: string
  ): Promise<TenantNotificationDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const notif = await this.db.tenantNotification.findFirst({
        where: { id: notificationId, tenantId: tenant.id, userId },
      });
      if (!notif) {
        throw new NotFoundError('Notification not found or access denied.');
      }

      const updated = await this.db.tenantNotification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      });

      return {
        id: updated.id,
        tenantId: updated.tenantId,
        userId: updated.userId,
        membershipId: updated.membershipId,
        category: updated.category as NotificationCategory,
        title: updated.title,
        message: updated.message,
        link: updated.link,
        eventReference: updated.eventReference,
        isRead: updated.isRead,
        readAt: updated.readAt ? updated.readAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(updated.createdAt),
        metadata: updated.metadata,
      };
    }

    // In-memory fallback
    const item = this.mockNotifications.find(
      (n) => n.id === notificationId && n.tenantId === tenant.id && n.userId === userId
    );
    if (!item) {
      throw new NotFoundError('Notification not found or access denied.');
    }

    item.isRead = true;
    item.readAt = new Date();
    item.updatedAt = new Date();

    return {
      id: item.id,
      tenantId: item.tenantId,
      userId: item.userId,
      membershipId: item.membershipId,
      category: item.category as NotificationCategory,
      title: item.title,
      message: item.message,
      link: item.link,
      eventReference: item.eventReference,
      isRead: item.isRead,
      readAt: item.readAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(item.createdAt),
      metadata: item.metadata,
    };
  }

  /**
   * Marks all eligible notifications as read for the authenticated user and tenant.
   */
  async markAllAsRead(
    tenantSlug: string,
    userId: string
  ): Promise<{ count: number }> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const result = await this.db.tenantNotification.updateMany({
        where: { tenantId: tenant.id, userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return { count: result.count };
    }

    // In-memory fallback
    let count = 0;
    const now = new Date();
    for (const n of this.mockNotifications) {
      if (n.tenantId === tenant.id && n.userId === userId && !n.isRead) {
        n.isRead = true;
        n.readAt = now;
        n.updatedAt = now;
        count++;
      }
    }
    return { count };
  }

  /**
   * Creates a notification with idempotency protection and user preference enforcement.
   * Resilient: failure in notification never throws or breaks the caller's business transaction.
   */
  async createNotification(
    input: CreateNotificationInput
  ): Promise<TenantNotificationDto | null> {
    try {
      const tenant = await this.resolveTenant(input.tenantSlug);

      // 1. Idempotency check: if eventReference supplied, prevent duplicates
      if (input.eventReference) {
        if (this.isDbConfigured()) {
          const existing = await this.db.tenantNotification.findFirst({
            where: {
              tenantId: tenant.id,
              userId: input.userId,
              eventReference: input.eventReference,
            },
          });
          if (existing) {
            return {
              id: existing.id,
              tenantId: existing.tenantId,
              userId: existing.userId,
              membershipId: existing.membershipId,
              category: existing.category as NotificationCategory,
              title: existing.title,
              message: existing.message,
              link: existing.link,
              eventReference: existing.eventReference,
              isRead: existing.isRead,
              readAt: existing.readAt ? existing.readAt.toISOString() : null,
              createdAt: existing.createdAt.toISOString(),
              formattedCreatedAt: formatDhakaDateTime(existing.createdAt),
              metadata: existing.metadata,
            };
          }
        } else {
          const existing = this.mockNotifications.find(
            (n) =>
              n.tenantId === tenant.id &&
              n.userId === input.userId &&
              n.eventReference === input.eventReference
          );
          if (existing) {
            return {
              id: existing.id,
              tenantId: existing.tenantId,
              userId: existing.userId,
              membershipId: existing.membershipId,
              category: existing.category as NotificationCategory,
              title: existing.title,
              message: existing.message,
              link: existing.link,
              eventReference: existing.eventReference,
              isRead: existing.isRead,
              readAt: existing.readAt ? existing.readAt.toISOString() : null,
              createdAt: existing.createdAt.toISOString(),
              formattedCreatedAt: formatDhakaDateTime(existing.createdAt),
              metadata: existing.metadata,
            };
          }
        }
      }

      // 2. Preferences Check
      const prefs = await this.getPreferences(input.tenantSlug, input.userId);
      const isMandatory =
        input.bypassPreferences ||
        input.category === 'BILLING' ||
        input.category === 'GENERAL';

      if (!isMandatory) {
        if (!prefs.inAppEnabled) {
          await this.recordDeliveryLog(
            tenant.id,
            null,
            'IN_APP',
            input.userId,
            'SKIPPED',
            'User has disabled in-app alerts'
          );
          return null;
        }

        // Category check
        const categoryMap: Record<string, boolean> = {
          MEAL_UPDATE: prefs.mealsEnabled,
          MEAL_REQUEST: prefs.mealsEnabled,
          PAYMENT: prefs.billingEnabled,
          BILLING: prefs.billingEnabled,
          COMPLAINT: prefs.complaintsEnabled,
          ROOM_REQUEST: prefs.noticesEnabled,
          EVENT: prefs.eventsEnabled,
          POLL: prefs.eventsEnabled,
        };

        if (categoryMap[input.category] === false) {
          await this.recordDeliveryLog(
            tenant.id,
            null,
            'IN_APP',
            input.userId,
            'SKIPPED',
            `User has opted out of ${input.category} category alerts`
          );
          return null;
        }
      }

      // 3. Create the notification
      const now = new Date();
      if (this.isDbConfigured()) {
        const created = await this.db.tenantNotification.create({
          data: {
            tenantId: tenant.id,
            userId: input.userId,
            membershipId: input.membershipId || null,
            category: input.category,
            title: input.title,
            message: input.message,
            link: input.link || null,
            eventReference: input.eventReference || null,
            metadata: input.metadata || null,
            isRead: false,
          },
        });

        await this.recordDeliveryLog(
          tenant.id,
          created.id,
          'IN_APP',
          input.userId,
          'DELIVERED',
          null
        );

        return {
          id: created.id,
          tenantId: created.tenantId,
          userId: created.userId,
          membershipId: created.membershipId,
          category: created.category as NotificationCategory,
          title: created.title,
          message: created.message,
          link: created.link,
          eventReference: created.eventReference,
          isRead: created.isRead,
          readAt: null,
          createdAt: created.createdAt.toISOString(),
          formattedCreatedAt: formatDhakaDateTime(created.createdAt),
          metadata: created.metadata,
        };
      }

      // In-memory fallback
      const newNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenantId: tenant.id,
        userId: input.userId,
        membershipId: input.membershipId || null,
        category: input.category,
        title: input.title,
        message: input.message,
        link: input.link || null,
        eventReference: input.eventReference || null,
        metadata: input.metadata || null,
        isRead: false,
        readAt: null,
        createdAt: now,
        updatedAt: now,
      };

      this.mockNotifications.unshift(newNotif);
      await this.recordDeliveryLog(
        tenant.id,
        newNotif.id,
        'IN_APP',
        input.userId,
        'DELIVERED',
        null
      );

      return {
        id: newNotif.id,
        tenantId: newNotif.tenantId,
        userId: newNotif.userId,
        membershipId: newNotif.membershipId,
        category: newNotif.category as NotificationCategory,
        title: newNotif.title,
        message: newNotif.message,
        link: newNotif.link,
        eventReference: newNotif.eventReference,
        isRead: false,
        readAt: null,
        createdAt: newNotif.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(newNotif.createdAt),
        metadata: newNotif.metadata,
      };
    } catch (err: any) {
      console.error('[TenantNotificationService] Error creating notification:', err?.message || err);
      // Non-blocking: never crash caller business logic
      return null;
    }
  }

  /**
   * Broadcasts a notification to all active members of the tenant.
   */
  async createBroadcastNotification(
    input: CreateBroadcastNotificationInput
  ): Promise<{ dispatchedCount: number }> {
    try {
      const tenant = await this.resolveTenant(input.tenantSlug);
      let recipientUserIds: string[] = [];

      if (this.isDbConfigured()) {
        const members = await this.db.membership.findMany({
          where: { tenantId: tenant.id, status: 'ACTIVE' },
          select: { userId: true },
        });
        recipientUserIds = members.map((m: any) => m.userId);
      } else {
        recipientUserIds = this.mockMemberships
          .filter((m) => m.tenantId === tenant.id && m.status === 'ACTIVE')
          .map((m) => m.userId);
      }

      // Deduplicate user IDs
      recipientUserIds = Array.from(new Set(recipientUserIds));

      let count = 0;
      for (const uid of recipientUserIds) {
        const evtRef = input.eventReference ? `${input.eventReference}_${uid}` : null;
        await this.createNotification({
          tenantSlug: input.tenantSlug,
          userId: uid,
          category: input.category,
          title: input.title,
          message: input.message,
          link: input.link,
          eventReference: evtRef,
        });
        count++;
      }

      return { dispatchedCount: count };
    } catch (err: any) {
      console.error('[TenantNotificationService] Broadcast error:', err?.message || err);
      return { dispatchedCount: 0 };
    }
  }

  /**
   * Gets user notification preferences with channel configuration status.
   */
  async getPreferences(
    tenantSlug: string,
    userId: string
  ): Promise<NotificationPreferenceDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    const channelStatus = {
      inApp: {
        available: true,
        configured: true,
        message: 'Active in-app notification center.',
      },
      email: {
        available: false,
        configured: false,
        message: 'External SMTP provider unconfigured in system settings.',
      },
      sms: {
        available: false,
        configured: false,
        message: 'External SMS gateway unconfigured in system settings.',
      },
    };

    if (this.isDbConfigured()) {
      let pref = await this.db.notificationPreference.findUnique({
        where: { tenantId_userId: { tenantId: tenant.id, userId } },
      });

      if (!pref) {
        pref = await this.db.notificationPreference.create({
          data: {
            tenantId: tenant.id,
            userId,
            inAppEnabled: true,
            emailEnabled: false,
            smsEnabled: false,
            mealsEnabled: true,
            billingEnabled: true,
            complaintsEnabled: true,
            eventsEnabled: true,
            noticesEnabled: true,
            remindersEnabled: true,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
          },
        });
      }

      return {
        id: pref.id,
        tenantId: pref.tenantId,
        userId: pref.userId,
        inAppEnabled: pref.inAppEnabled,
        emailEnabled: pref.emailEnabled,
        smsEnabled: pref.smsEnabled,
        mealsEnabled: pref.mealsEnabled,
        billingEnabled: pref.billingEnabled,
        complaintsEnabled: pref.complaintsEnabled,
        eventsEnabled: pref.eventsEnabled,
        noticesEnabled: pref.noticesEnabled,
        remindersEnabled: pref.remindersEnabled,
        quietHoursEnabled: pref.quietHoursEnabled,
        quietHoursStart: pref.quietHoursStart || '22:00',
        quietHoursEnd: pref.quietHoursEnd || '07:00',
        channelStatus,
      };
    }

    // In-memory fallback
    let mockPref = this.mockPreferences.find(
      (p) => p.tenantId === tenant.id && p.userId === userId
    );

    if (!mockPref) {
      mockPref = {
        id: `pref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenantId: tenant.id,
        userId,
        inAppEnabled: true,
        emailEnabled: false,
        smsEnabled: false,
        mealsEnabled: true,
        billingEnabled: true,
        complaintsEnabled: true,
        eventsEnabled: true,
        noticesEnabled: true,
        remindersEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.mockPreferences.push(mockPref);
    }

    return {
      id: mockPref.id,
      tenantId: mockPref.tenantId,
      userId: mockPref.userId,
      inAppEnabled: mockPref.inAppEnabled,
      emailEnabled: mockPref.emailEnabled,
      smsEnabled: mockPref.smsEnabled,
      mealsEnabled: mockPref.mealsEnabled,
      billingEnabled: mockPref.billingEnabled,
      complaintsEnabled: mockPref.complaintsEnabled,
      eventsEnabled: mockPref.eventsEnabled,
      noticesEnabled: mockPref.noticesEnabled,
      remindersEnabled: mockPref.remindersEnabled,
      quietHoursEnabled: mockPref.quietHoursEnabled,
      quietHoursStart: mockPref.quietHoursStart,
      quietHoursEnd: mockPref.quietHoursEnd,
      channelStatus,
    };
  }

  /**
   * Updates user notification preferences.
   */
  async updatePreferences(
    tenantSlug: string,
    userId: string,
    input: UpdatePreferencesInput
  ): Promise<NotificationPreferenceDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    // Validate quiet hours format
    if (input.quietHoursStart && !TIME_REGEX.test(input.quietHoursStart)) {
      throw new ValidationError('Quiet hours start time must be in HH:mm (24-hour) format.');
    }
    if (input.quietHoursEnd && !TIME_REGEX.test(input.quietHoursEnd)) {
      throw new ValidationError('Quiet hours end time must be in HH:mm (24-hour) format.');
    }

    // Enforce channel reality: cannot enable external email or sms if unconfigured
    if (input.emailEnabled === true) {
      throw new ValidationError('Cannot enable email notifications: No SMTP provider is configured.');
    }
    if (input.smsEnabled === true) {
      throw new ValidationError('Cannot enable SMS notifications: No SMS gateway is configured.');
    }

    const current = await this.getPreferences(tenantSlug, userId);

    const updateData = {
      inAppEnabled: input.inAppEnabled !== undefined ? input.inAppEnabled : current.inAppEnabled,
      emailEnabled: false,
      smsEnabled: false,
      mealsEnabled: input.mealsEnabled !== undefined ? input.mealsEnabled : current.mealsEnabled,
      billingEnabled: input.billingEnabled !== undefined ? input.billingEnabled : current.billingEnabled,
      complaintsEnabled: input.complaintsEnabled !== undefined ? input.complaintsEnabled : current.complaintsEnabled,
      eventsEnabled: input.eventsEnabled !== undefined ? input.eventsEnabled : current.eventsEnabled,
      noticesEnabled: input.noticesEnabled !== undefined ? input.noticesEnabled : current.noticesEnabled,
      remindersEnabled: input.remindersEnabled !== undefined ? input.remindersEnabled : current.remindersEnabled,
      quietHoursEnabled: input.quietHoursEnabled !== undefined ? input.quietHoursEnabled : current.quietHoursEnabled,
      quietHoursStart: input.quietHoursStart || current.quietHoursStart,
      quietHoursEnd: input.quietHoursEnd || current.quietHoursEnd,
    };

    if (this.isDbConfigured()) {
      const updated = await this.db.notificationPreference.upsert({
        where: { tenantId_userId: { tenantId: tenant.id, userId } },
        create: {
          tenantId: tenant.id,
          userId,
          ...updateData,
        },
        update: updateData,
      });

      return {
        id: updated.id,
        tenantId: updated.tenantId,
        userId: updated.userId,
        ...updateData,
        channelStatus: current.channelStatus,
      };
    }

    // In-memory fallback
    const idx = this.mockPreferences.findIndex(
      (p) => p.tenantId === tenant.id && p.userId === userId
    );
    if (idx !== -1) {
      this.mockPreferences[idx] = {
        ...this.mockPreferences[idx],
        ...updateData,
        updatedAt: new Date(),
      };
    }

    return {
      id: current.id,
      tenantId: tenant.id,
      userId,
      ...updateData,
      channelStatus: current.channelStatus,
    };
  }

  /**
   * Lists scheduled reminders for authorized mess staff.
   */
  async listReminders(tenantSlug: string): Promise<ScheduledReminderDto[]> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const reminders = await this.db.scheduledReminder.findMany({
        where: { tenantId: tenant.id },
        include: { creator: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });

      return reminders.map((r: any) => ({
        id: r.id,
        tenantId: r.tenantId,
        reminderType: r.reminderType,
        title: r.title,
        message: r.message,
        targetAudience: r.targetAudience,
        scheduleTime: r.scheduleTime,
        isActive: r.isActive,
        createdById: r.createdById,
        creatorName: r.creator?.name || null,
        lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
        nextRunAt: r.nextRunAt ? r.nextRunAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(r.createdAt),
      }));
    }

    return this.mockReminders
      .filter((r) => r.tenantId === tenant.id)
      .map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        reminderType: r.reminderType,
        title: r.title,
        message: r.message,
        targetAudience: r.targetAudience,
        scheduleTime: r.scheduleTime,
        isActive: r.isActive,
        createdById: r.createdById,
        creatorName: r.creatorName || null,
        lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
        nextRunAt: r.nextRunAt ? r.nextRunAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(r.createdAt),
      }));
  }

  /**
   * Creates a scheduled reminder configuration for authorized mess staff.
   */
  async createReminder(
    tenantSlug: string,
    userId: string,
    input: CreateReminderInput
  ): Promise<ScheduledReminderDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (!input.title || !input.title.trim()) {
      throw new ValidationError('Reminder title is required.');
    }
    if (!input.message || !input.message.trim()) {
      throw new ValidationError('Reminder message is required.');
    }
    const scheduleTime = input.scheduleTime || '09:00';
    if (!TIME_REGEX.test(scheduleTime)) {
      throw new ValidationError('Schedule time must be in HH:mm (Asia/Dhaka) format.');
    }

    const validTypes = [
      'UPCOMING_PAYMENT',
      'OUTSTANDING_BALANCE',
      'MEAL_CUTOFF',
      'EVENT_REMINDER',
      'POLL_CLOSING',
      'MAINTENANCE_DUE',
    ];
    if (!validTypes.includes(input.reminderType)) {
      throw new ValidationError(`Invalid reminder type. Supported types: ${validTypes.join(', ')}.`);
    }

    const targetAudience = input.targetAudience || 'ALL_MEMBERS';
    const now = new Date();

    if (this.isDbConfigured()) {
      const created = await this.db.scheduledReminder.create({
        data: {
          tenantId: tenant.id,
          reminderType: input.reminderType,
          title: input.title.trim(),
          message: input.message.trim(),
          targetAudience,
          scheduleTime,
          isActive: true,
          createdById: userId,
        },
        include: { creator: { select: { name: true } } },
      });

      return {
        id: created.id,
        tenantId: created.tenantId,
        reminderType: created.reminderType,
        title: created.title,
        message: created.message,
        targetAudience: created.targetAudience,
        scheduleTime: created.scheduleTime,
        isActive: created.isActive,
        createdById: created.createdById,
        creatorName: (created as any).creator?.name || null,
        lastRunAt: null,
        nextRunAt: null,
        createdAt: created.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(created.createdAt),
      };
    }

    // In-memory fallback
    const user = this.mockUsers.find((u) => u.id === userId);
    const newRem = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: tenant.id,
      reminderType: input.reminderType,
      title: input.title.trim(),
      message: input.message.trim(),
      targetAudience,
      scheduleTime,
      isActive: true,
      createdById: userId,
      creatorName: user ? user.name : 'Authorized Staff',
      lastRunAt: null,
      nextRunAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.mockReminders.unshift(newRem);

    return {
      id: newRem.id,
      tenantId: newRem.tenantId,
      reminderType: newRem.reminderType,
      title: newRem.title,
      message: newRem.message,
      targetAudience: newRem.targetAudience,
      scheduleTime: newRem.scheduleTime,
      isActive: newRem.isActive,
      createdById: newRem.createdById,
      creatorName: newRem.creatorName,
      lastRunAt: null,
      nextRunAt: null,
      createdAt: newRem.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(newRem.createdAt),
    };
  }

  /**
   * Toggles the active/paused status of a scheduled reminder.
   */
  async toggleReminder(
    tenantSlug: string,
    _userId: string,
    reminderId: string,
    isActive: boolean
  ): Promise<ScheduledReminderDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const reminder = await this.db.scheduledReminder.findFirst({
        where: { id: reminderId, tenantId: tenant.id },
      });
      if (!reminder) {
        throw new NotFoundError('Reminder not found.');
      }

      const updated = await this.db.scheduledReminder.update({
        where: { id: reminderId },
        data: { isActive },
        include: { creator: { select: { name: true } } },
      });

      return {
        id: updated.id,
        tenantId: updated.tenantId,
        reminderType: updated.reminderType,
        title: updated.title,
        message: updated.message,
        targetAudience: updated.targetAudience,
        scheduleTime: updated.scheduleTime,
        isActive: updated.isActive,
        createdById: updated.createdById,
        creatorName: (updated as any).creator?.name || null,
        lastRunAt: updated.lastRunAt ? updated.lastRunAt.toISOString() : null,
        nextRunAt: updated.nextRunAt ? updated.nextRunAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(updated.createdAt),
      };
    }

    // In-memory fallback
    const rem = this.mockReminders.find(
      (r) => r.id === reminderId && r.tenantId === tenant.id
    );
    if (!rem) {
      throw new NotFoundError('Reminder not found.');
    }

    rem.isActive = isActive;
    rem.updatedAt = new Date();

    return {
      id: rem.id,
      tenantId: rem.tenantId,
      reminderType: rem.reminderType,
      title: rem.title,
      message: rem.message,
      targetAudience: rem.targetAudience,
      scheduleTime: rem.scheduleTime,
      isActive: rem.isActive,
      createdById: rem.createdById,
      creatorName: rem.creatorName || null,
      lastRunAt: rem.lastRunAt ? rem.lastRunAt.toISOString() : null,
      nextRunAt: rem.nextRunAt ? rem.nextRunAt.toISOString() : null,
      createdAt: rem.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(rem.createdAt),
    };
  }

  /**
   * Deletes a scheduled reminder.
   */
  async deleteReminder(
    tenantSlug: string,
    _userId: string,
    reminderId: string
  ): Promise<boolean> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const reminder = await this.db.scheduledReminder.findFirst({
        where: { id: reminderId, tenantId: tenant.id },
      });
      if (!reminder) {
        throw new NotFoundError('Reminder not found.');
      }

      await this.db.scheduledReminder.delete({
        where: { id: reminderId },
      });
      return true;
    }

    const idx = this.mockReminders.findIndex(
      (r) => r.id === reminderId && r.tenantId === tenant.id
    );
    if (idx === -1) {
      throw new NotFoundError('Reminder not found.');
    }
    this.mockReminders.splice(idx, 1);
    return true;
  }

  /**
   * Lists delivery logs for auditing delivery attempts.
   */
  async listDeliveryLogs(
    tenantSlug: string,
    limit: number = 50
  ): Promise<NotificationDeliveryLogDto[]> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const logs = await this.db.notificationDeliveryLog.findMany({
        where: { tenantId: tenant.id },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return logs.map((l: any) => ({
        id: l.id,
        tenantId: l.tenantId,
        notificationId: l.notificationId,
        channel: l.channel,
        recipient: l.recipient,
        status: l.status,
        errorMessage: l.errorMessage,
        attemptCount: l.attemptCount,
        createdAt: l.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(l.createdAt),
      }));
    }

    return this.mockDeliveryLogs
      .filter((l) => l.tenantId === tenant.id)
      .slice(0, limit)
      .map((l) => ({
        id: l.id,
        tenantId: l.tenantId,
        notificationId: l.notificationId,
        channel: l.channel,
        recipient: l.recipient,
        status: l.status,
        errorMessage: l.errorMessage,
        attemptCount: l.attemptCount,
        createdAt: l.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(l.createdAt),
      }));
  }

  private async recordDeliveryLog(
    tenantId: string,
    notificationId: string | null,
    channel: string,
    recipient: string,
    status: string,
    errorMessage: string | null
  ) {
    try {
      if (this.isDbConfigured()) {
        await this.db.notificationDeliveryLog.create({
          data: {
            tenantId,
            notificationId,
            channel,
            recipient,
            status,
            errorMessage,
            attemptCount: 1,
          },
        });
      } else {
        this.mockDeliveryLogs.unshift({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tenantId,
          notificationId,
          channel,
          recipient,
          status,
          errorMessage,
          attemptCount: 1,
          createdAt: new Date(),
        });
      }
    } catch (err: any) {
      console.warn('[TenantNotificationService] Delivery log write warning:', err?.message || err);
    }
  }
}

export const tenantNotificationService = new TenantNotificationService();
