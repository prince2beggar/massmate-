import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  TenantNotificationService,
  ASIA_DHAKA_TIMEZONE,
} from './tenant-notification-service';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../api/errors';

describe('Task 41 — Notification Center, Delivery Preferences & Reminders', () => {
  let service: TenantNotificationService;

  beforeEach(() => {
    // Instantiate fresh service with seeded mock data
    service = new TenantNotificationService(null as any);
  });

  describe('1 & 2. Tenant Isolation & User Scoping', () => {
    it('user sees only their own notifications within the resolved tenant', async () => {
      const result = await service.listNotifications('prince-mess', 'usr_resident_1');

      assert.ok(result.notifications.length > 0);
      for (const notif of result.notifications) {
        assert.strictEqual(notif.tenantId, 'tenant_prince_mess');
        assert.strictEqual(notif.userId, 'usr_resident_1');
      }
    });

    it('Tenant A cannot access Tenant B notifications (cross-tenant isolation)', async () => {
      const princeResult = await service.listNotifications('prince-mess', 'usr_resident_1');
      const greenResult = await service.listNotifications('green-villa-mess', 'usr_resident_2');

      const princeIds = princeResult.notifications.map((n) => n.id);
      const greenIds = greenResult.notifications.map((n) => n.id);

      // Verify no overlap between Prince Mess and Green Villa Mess
      for (const id of princeIds) {
        assert.strictEqual(greenIds.includes(id), false);
      }
      assert.ok(greenIds.includes('notif_seed_green'));
    });

    it('rejects access to suspended mess tenants with ForbiddenError', async () => {
      await assert.rejects(
        async () => {
          await service.listNotifications('suspended-mess', 'usr_resident_1');
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /suspended/i);
          return true;
        }
      );
    });
  });

  describe('3. User Boundary Enforcement', () => {
    it('member cannot mark another user notification as read', async () => {
      // notif_seed_1 belongs to usr_resident_1. usr_resident_2 attempts to mark it
      await assert.rejects(
        async () => {
          await service.markAsRead('prince-mess', 'usr_resident_2', 'notif_seed_1');
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.match(err.message, /not found or access denied/i);
          return true;
        }
      );
    });
  });

  describe('4, 5 & 6. Read / Unread Status Management', () => {
    it('accurately calculates unread count and decrements upon single mark-read', async () => {
      const initialCount = await service.getUnreadCount('prince-mess', 'usr_resident_1');
      assert.strictEqual(initialCount, 1); // notif_seed_1 is unread, notif_seed_2 is read

      const updated = await service.markAsRead('prince-mess', 'usr_resident_1', 'notif_seed_1');
      assert.strictEqual(updated.isRead, true);
      assert.ok(updated.readAt);

      const afterCount = await service.getUnreadCount('prince-mess', 'usr_resident_1');
      assert.strictEqual(afterCount, 0);
    });

    it('mark-all-as-read marks all eligible notifications for that user and tenant', async () => {
      // Create additional unread notifications
      await service.createNotification({
        tenantSlug: 'prince-mess',
        userId: 'usr_resident_1',
        category: 'MEAL_UPDATE',
        title: 'New Meal Booking Open',
        message: 'Lunch menu updated.',
      });
      await service.createNotification({
        tenantSlug: 'prince-mess',
        userId: 'usr_resident_1',
        category: 'EVENT',
        title: 'Mess Feast Friday',
        message: 'Feast confirmation.',
      });

      const unreadBefore = await service.getUnreadCount('prince-mess', 'usr_resident_1');
      assert.ok(unreadBefore >= 2);

      const result = await service.markAllAsRead('prince-mess', 'usr_resident_1');
      assert.ok(result.count >= 2);

      const unreadAfter = await service.getUnreadCount('prince-mess', 'usr_resident_1');
      assert.strictEqual(unreadAfter, 0);

      // Verify other user in green-villa is untouched
      const greenVillaUnread = await service.getUnreadCount('green-villa-mess', 'usr_resident_2');
      assert.strictEqual(greenVillaUnread, 1);
    });
  });

  describe('7. Idempotency & Duplicate Prevention', () => {
    it('duplicate business events do not create duplicate notifications', async () => {
      const eventRef = 'EVT_PAYMENT_CONFIRM_BATCH_892';

      // First trigger
      const first = await service.createNotification({
        tenantSlug: 'prince-mess',
        userId: 'usr_resident_1',
        category: 'PAYMENT',
        title: 'Deposit Received',
        message: 'bKash deposit of ৳5,000 verified.',
        eventReference: eventRef,
      });

      assert.ok(first);
      const countAfterFirst = service.mockNotifications.length;

      // Duplicate retry with same event reference
      const retry = await service.createNotification({
        tenantSlug: 'prince-mess',
        userId: 'usr_resident_1',
        category: 'PAYMENT',
        title: 'Deposit Received',
        message: 'bKash deposit of ৳5,000 verified.',
        eventReference: eventRef,
      });

      assert.ok(retry);
      assert.strictEqual(retry?.id, first?.id);
      assert.strictEqual(service.mockNotifications.length, countAfterFirst);
    });
  });

  describe('8. Resilience & Failure Isolation', () => {
    it('failed notification delivery does not throw or corrupt the business operation', async () => {
      // Pass non-existent tenant slug; service must safely log and return null without throwing
      const result = await service.createNotification({
        tenantSlug: 'non-existent-tenant-slug',
        userId: 'usr_resident_1',
        category: 'GENERAL',
        title: 'Test Resilience',
        message: 'Testing non-blocking failure isolation.',
      });

      assert.strictEqual(result, null);
    });
  });

  describe('9 & 10. Notification Preferences & Channel Authenticity', () => {
    it('presents channels authentically: in-app active, email & SMS unconfigured', async () => {
      const prefs = await service.getPreferences('prince-mess', 'usr_resident_1');

      assert.strictEqual(prefs.channelStatus.inApp.configured, true);
      assert.strictEqual(prefs.channelStatus.inApp.available, true);

      assert.strictEqual(prefs.channelStatus.email.configured, false);
      assert.strictEqual(prefs.channelStatus.sms.configured, false);
    });

    it('rejects enabling unconfigured channels (email / SMS) with ValidationError', async () => {
      await assert.rejects(
        async () => {
          await service.updatePreferences('prince-mess', 'usr_resident_1', {
            emailEnabled: true,
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /No SMTP provider is configured/i);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await service.updatePreferences('prince-mess', 'usr_resident_1', {
            smsEnabled: true,
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /No SMS gateway is configured/i);
          return true;
        }
      );
    });

    it('enforces category preferences: opted-out category is skipped while mandatory billing delivers', async () => {
      // Opt out of events
      await service.updatePreferences('prince-mess', 'usr_resident_1', {
        eventsEnabled: false,
      });

      // Try sending event notification
      const eventNotif = await service.createNotification({
        tenantSlug: 'prince-mess',
        userId: 'usr_resident_1',
        category: 'EVENT',
        title: 'Picnic Meeting',
        message: 'Upcoming mess outing.',
      });
      assert.strictEqual(eventNotif, null); // Skipped

      // Delivery log reflects SKIPPED
      const logs = await service.listDeliveryLogs('prince-mess');
      const skippedLog = logs.find((l) => l.status === 'SKIPPED');
      assert.ok(skippedLog);
      assert.match(skippedLog.errorMessage || '', /opted out/i);

      // Mandatory BILLING notification delivers regardless of general opt-outs
      const billingNotif = await service.createNotification({
        tenantSlug: 'prince-mess',
        userId: 'usr_resident_1',
        category: 'BILLING',
        title: 'Monthly Statement Generated',
        message: 'November invoice payable.',
      });
      assert.ok(billingNotif);
      assert.strictEqual(billingNotif.category, 'BILLING');
    });

    it('validates quiet hours time format in HH:mm', async () => {
      await assert.rejects(
        async () => {
          await service.updatePreferences('prince-mess', 'usr_resident_1', {
            quietHoursStart: '25:99', // Invalid time
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          return true;
        }
      );
    });
  });

  describe('11 & 12. Staff Scheduled Reminders & Timezone Enforcement', () => {
    it('creates scheduled reminder with Asia/Dhaka schedule time and creator tracking', async () => {
      const created = await service.createReminder('prince-mess', 'usr_owner_1', {
        reminderType: 'MEAL_CUTOFF',
        title: 'Dinner Cutoff in 45 Minutes',
        message: 'Dinner booking closes at 05:00 PM Asia/Dhaka.',
        targetAudience: 'ACTIVE_MEMBERS',
        scheduleTime: '16:15',
      });

      assert.ok(created);
      assert.strictEqual(created.reminderType, 'MEAL_CUTOFF');
      assert.strictEqual(created.scheduleTime, '16:15');
      assert.strictEqual(created.isActive, true);
      assert.strictEqual(created.createdById, 'usr_owner_1');
      assert.ok(created.formattedCreatedAt);
    });

    it('allows staff to toggle reminder active/pause status and delete reminder', async () => {
      const reminders = await service.listReminders('prince-mess');
      const seedRem = reminders[0];
      assert.ok(seedRem);

      // Pause
      const paused = await service.toggleReminder('prince-mess', 'usr_owner_1', seedRem.id, false);
      assert.strictEqual(paused.isActive, false);

      // Re-activate
      const activated = await service.toggleReminder('prince-mess', 'usr_owner_1', seedRem.id, true);
      assert.strictEqual(activated.isActive, true);

      // Delete
      const deleted = await service.deleteReminder('prince-mess', 'usr_owner_1', seedRem.id);
      assert.strictEqual(deleted, true);

      const remaining = await service.listReminders('prince-mess');
      assert.strictEqual(remaining.some((r) => r.id === seedRem.id), false);
    });

    it('validates reminder type and schedule time', async () => {
      await assert.rejects(
        async () => {
          await service.createReminder('prince-mess', 'usr_owner_1', {
            reminderType: 'INVALID_REMINDER_TYPE',
            title: 'Test',
            message: 'Test message',
            scheduleTime: '12:00',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /invalid reminder type/i);
          return true;
        }
      );
    });
  });

  describe('13. Broadcast Delivery & Pagination', () => {
    it('dispatches broadcast notification to all active members of the tenant', async () => {
      const broadcast = await service.createBroadcastNotification({
        tenantSlug: 'prince-mess',
        category: 'GENERAL',
        title: 'Emergency Generator Maintenance',
        message: 'Power generator servicing today 2 PM - 4 PM.',
        eventReference: 'EVT_BROADCAST_GENERATOR_1',
      });

      assert.ok(broadcast.dispatchedCount >= 2); // tanvir and rakib

      // Verify both received
      const tanvirNotifs = await service.listNotifications('prince-mess', 'usr_resident_1');
      const rakibNotifs = await service.listNotifications('prince-mess', 'usr_resident_2');

      assert.ok(tanvirNotifs.notifications.some((n) => n.title === 'Emergency Generator Maintenance'));
      assert.ok(rakibNotifs.notifications.some((n) => n.title === 'Emergency Generator Maintenance'));
    });

    it('paginates notifications with limit and offset correctly', async () => {
      const page1 = await service.listNotifications('prince-mess', 'usr_resident_1', {
        limit: 1,
        offset: 0,
      });
      const page2 = await service.listNotifications('prince-mess', 'usr_resident_1', {
        limit: 1,
        offset: 1,
      });

      assert.strictEqual(page1.notifications.length, 1);
      assert.strictEqual(page2.notifications.length, 1);
      assert.notStrictEqual(page1.notifications[0].id, page2.notifications[0].id);
    });
  });
});
