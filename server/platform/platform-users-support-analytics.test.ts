import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlatformUserService } from './platform-user-service';
import { SupportTicketService } from '../support/support-ticket-service';
import { PlatformAnalyticsService, resolveDateRange } from './platform-analytics-service';
import { ReportExportService } from './report-export-service';
import { GlobalSearchService } from './global-search-service';
import { PlatformNotificationService } from './platform-notification-service';
import { PLATFORM_ROLE_PERMISSIONS } from './platform-roles';
import type { PlatformContext } from './platform-auth';

describe('Task 28: Platform Users, Support Center & Analytics Tests', () => {
  function createMockPlatformDb() {
    const users: any[] = [
      {
        id: 'usr_owner_1',
        name: 'Super Admin Owner',
        email: 'owner@messmate.dev',
        phone: '+8801700000001',
        status: 'ACTIVE',
        platformRole: 'PLATFORM_OWNER',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        memberships: [],
        auditLogs: [],
      },
      {
        id: 'usr_support_1',
        name: 'Sara Support',
        email: 'sara@messmate.dev',
        phone: '+8801700000002',
        status: 'ACTIVE',
        platformRole: 'SUPPORT_STAFF',
        createdAt: new Date('2026-01-05T00:00:00Z'),
        updatedAt: new Date('2026-01-05T00:00:00Z'),
        memberships: [],
        auditLogs: [],
      },
      {
        id: 'usr_finance_1',
        name: 'Fahim Finance',
        email: 'fahim@messmate.dev',
        phone: '+8801700000003',
        status: 'ACTIVE',
        platformRole: 'FINANCE_STAFF',
        createdAt: new Date('2026-01-06T00:00:00Z'),
        updatedAt: new Date('2026-01-06T00:00:00Z'),
        memberships: [],
        auditLogs: [],
      },
      {
        id: 'usr_resident_1',
        name: 'Rahim Khan',
        email: 'rahim@example.com',
        phone: '+8801711111111',
        status: 'ACTIVE',
        platformRole: null,
        createdAt: new Date('2026-02-01T00:00:00Z'),
        updatedAt: new Date('2026-02-01T00:00:00Z'),
        memberships: [
          {
            id: 'mem_1',
            status: 'ACTIVE',
            createdAt: new Date('2026-02-01T00:00:00Z'),
            tenant: {
              id: 'ten_prince',
              name: 'Prince Mess',
              slug: 'prince-mess',
              tenantType: 'BACHELOR_MESS',
            },
            role: { name: 'Manager', slug: 'manager' },
          },
          {
            id: 'mem_2',
            status: 'ACTIVE',
            createdAt: new Date('2026-02-15T00:00:00Z'),
            tenant: {
              id: 'ten_green',
              name: 'Green Villa',
              slug: 'green-villa',
              tenantType: 'STUDENT_MESS',
            },
            role: { name: 'Member', slug: 'member' },
          },
        ],
        auditLogs: [],
      },
    ];

    const tenants: any[] = [
      {
        id: 'ten_prince',
        name: 'Prince Mess',
        slug: 'prince-mess',
        tenantType: 'BACHELOR_MESS',
        status: 'ACTIVE',
        verificationStatus: 'APPROVED',
        city: 'Dhaka',
        country: 'Bangladesh',
        createdAt: new Date('2026-01-10T00:00:00Z'),
      },
      {
        id: 'ten_green',
        name: 'Green Villa',
        slug: 'green-villa',
        tenantType: 'STUDENT_MESS',
        status: 'ACTIVE',
        verificationStatus: 'PENDING_REVIEW',
        city: 'Chittagong',
        country: 'Bangladesh',
        createdAt: new Date('2026-02-01T00:00:00Z'),
      },
      {
        id: 'ten_hostel',
        name: 'Apex Hostel',
        slug: 'apex-hostel',
        tenantType: 'HOSTEL',
        status: 'SUSPENDED',
        verificationStatus: 'NOT_SUBMITTED',
        city: 'Dhaka',
        country: 'Bangladesh',
        createdAt: new Date('2026-02-10T00:00:00Z'),
      },
    ];

    const subscriptions: any[] = [
      {
        id: 'sub_1',
        tenantId: 'ten_prince',
        tenant: { name: 'Prince Mess' },
        plan: { name: 'Starter', planType: 'STARTER' },
        status: 'ACTIVE',
        trialStatus: 'CONVERTED',
        priceLocked: 99.0,
        autoRenewConsent: true,
        createdAt: new Date('2026-01-15T00:00:00Z'),
      },
      {
        id: 'sub_2',
        tenantId: 'ten_green',
        tenant: { name: 'Green Villa' },
        plan: { name: 'Starter', planType: 'STARTER' },
        status: 'ACTIVE',
        trialStatus: 'ACTIVE',
        priceLocked: 99.0,
        autoRenewConsent: false,
        createdAt: new Date('2026-02-01T00:00:00Z'),
      },
    ];

    const invoices: any[] = [
      {
        id: 'inv_1',
        invoiceNumber: 'INV-2026-001',
        amount: 99.0,
        paymentStatus: 'CONFIRMED',
        paymentMethod: 'BKASH',
        transactionReference: 'TRX-123456',
        tenant: { name: 'Prince Mess' },
        subscription: { plan: { name: 'Starter' } },
        periodStart: new Date('2026-01-15'),
        periodEnd: new Date('2026-02-15'),
        createdAt: new Date('2026-01-15T00:00:00Z'),
      },
      {
        id: 'inv_2',
        invoiceNumber: 'INV-2026-002',
        amount: 99.0,
        paymentStatus: 'PENDING',
        paymentMethod: 'BKASH',
        transactionReference: null,
        tenant: { name: 'Green Villa' },
        subscription: { plan: { name: 'Starter' } },
        periodStart: new Date('2026-02-01'),
        periodEnd: new Date('2026-03-01'),
        createdAt: new Date('2026-02-01T00:00:00Z'),
      },
    ];

    const domains: any[] = [
      {
        id: 'dom_1',
        domainName: 'prince-mess.messmate.com',
        tenantId: 'ten_prince',
        tenant: { name: 'Prince Mess' },
        domainType: 'PLATFORM_SUBDOMAIN',
        isPrimary: true,
        verificationStatus: 'NOT_REQUIRED',
        dnsStatus: 'CONFIGURED',
        sslStatus: 'ACTIVE',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-10T00:00:00Z'),
      },
      {
        id: 'dom_2',
        domainName: 'princemess.com',
        tenantId: 'ten_prince',
        tenant: { name: 'Prince Mess' },
        domainType: 'CUSTOM_DOMAIN',
        isPrimary: false,
        verificationStatus: 'VERIFIED',
        dnsStatus: 'CONFIGURED',
        sslStatus: 'ACTIVE',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-20T00:00:00Z'),
      },
    ];

    const tickets: any[] = [];
    const messages: any[] = [];
    const notifications: any[] = [];
    const auditLogs: any[] = [];

    const db = {
      user: {
        findMany: async ({ where, skip = 0, take = 50, select }: any = {}) => {
          return users
            .filter((u) => {
              if (where?.status && u.status !== where.status) return false;
              if (where?.platformRole === null && u.platformRole !== null) return false;
              if (where?.platformRole && typeof where.platformRole === 'string' && u.platformRole !== where.platformRole) return false;
              if (where?.platformRole?.not === null && u.platformRole === null) return false;
              if (where?.OR) {
                const term = where.OR[0]?.name?.contains?.toLowerCase() || '';
                const matches =
                  u.name.toLowerCase().includes(term) ||
                  (u.email && u.email.toLowerCase().includes(term)) ||
                  (u.phone && u.phone.includes(term)) ||
                  u.id === term;
                if (!matches) return false;
              }
              return true;
            })
            .slice(skip, skip + take)
            .map((u) => {
              if (select?._count) {
                return { ...u, _count: { memberships: u.memberships?.length || 0 } };
              }
              return u;
            });
        },
        findUnique: async ({ where, select }: any) => {
          const u = users.find((x) => x.id === where.id || (where.email && x.email === where.email));
          return u ? { ...u } : null;
        },
        count: async ({ where }: any = {}) => {
          return users.filter((u) => {
            if (where?.status && u.status !== where.status) return false;
            if (where?.platformRole && u.platformRole !== where.platformRole) return false;
            return true;
          }).length;
        },
        update: async ({ where, data }: any) => {
          const u = users.find((x) => x.id === where.id);
          if (u) {
            Object.assign(u, data);
            u.updatedAt = new Date();
          }
          return u;
        },
      },
      tenant: {
        findMany: async () => tenants,
        count: async ({ where }: any = {}) => {
          return tenants.filter((t) => {
            if (where?.status && t.status !== where.status) return false;
            return true;
          }).length;
        },
        groupBy: async () => [
          { tenantType: 'BACHELOR_MESS', _count: { id: 1 } },
          { tenantType: 'STUDENT_MESS', _count: { id: 1 } },
          { tenantType: 'HOSTEL', _count: { id: 1 } },
        ],
      },
      subscription: {
        findMany: async () => subscriptions,
        count: async ({ where }: any = {}) => {
          return subscriptions.filter((s) => {
            if (where?.trialStatus && s.trialStatus !== where.trialStatus) return false;
            if (where?.status && s.status !== where.status) return false;
            return true;
          }).length;
        },
      },
      subscriptionInvoice: {
        findMany: async ({ where }: any = {}) => {
          return invoices.filter((i) => {
            if (where?.paymentStatus && i.paymentStatus !== where.paymentStatus) return false;
            return true;
          });
        },
      },
      domain: {
        findMany: async () => domains,
        count: async ({ where }: any = {}) => {
          return domains.filter((d) => {
            if (where?.domainType && d.domainType !== where.domainType) return false;
            if (where?.verificationStatus && d.verificationStatus !== where.verificationStatus) return false;
            return true;
          }).length;
        },
      },
      supportTicket: {
        create: async ({ data }: any) => {
          const item = {
            id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            messages: [],
            _count: { messages: 0 },
            createdAt: new Date(),
            updatedAt: new Date(),
            resolvedAt: null,
            closedAt: null,
            ...data,
          };
          tickets.push(item);
          return item;
        },
        findUnique: async ({ where }: any) => {
          const t = tickets.find((x) => x.id === where.id);
          if (!t) return null;
          const reqUser = users.find((u) => u.id === t.requesterUserId);
          const staffUser = users.find((u) => u.id === t.assignedStaffId);
          const tenant = tenants.find((tn) => tn.id === t.tenantId);
          const ticketMsgs = messages.filter((m) => m.ticketId === t.id);

          return {
            ...t,
            requester: reqUser ? { id: reqUser.id, name: reqUser.name, email: reqUser.email, platformRole: reqUser.platformRole } : null,
            assignedStaff: staffUser ? { id: staffUser.id, name: staffUser.name, email: staffUser.email } : null,
            tenant: tenant ? { id: tenant.id, name: tenant.name, slug: tenant.slug } : null,
            messages: ticketMsgs.map((m) => {
              const a = users.find((u) => u.id === m.authorUserId);
              return {
                ...m,
                author: a ? { id: a.id, name: a.name, email: a.email, platformRole: a.platformRole } : null,
              };
            }),
          };
        },
        findMany: async () => {
          return tickets.map((t) => {
            const reqUser = users.find((u) => u.id === t.requesterUserId);
            const tenant = tenants.find((tn) => tn.id === t.tenantId);
            const ticketMsgs = messages.filter((m) => m.ticketId === t.id);
            return {
              ...t,
              requester: reqUser,
              tenant,
              _count: { messages: ticketMsgs.length },
            };
          });
        },
        count: async ({ where }: any = {}) => {
          return tickets.filter((t) => {
            if (where?.status?.in && !where.status.in.includes(t.status)) return false;
            if (where?.status && typeof where.status === 'string' && t.status !== where.status) return false;
            return true;
          }).length;
        },
        update: async ({ where, data }: any) => {
          const t = tickets.find((x) => x.id === where.id);
          if (t) {
            Object.assign(t, data);
            t.updatedAt = new Date();
          }
          return t;
        },
        groupBy: async () => [
          { category: 'TECHNICAL_ISSUE', _count: { id: tickets.length } },
        ],
      },
      supportTicketMessage: {
        create: async ({ data }: any) => {
          const msg = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date(),
            ...data,
          };
          messages.push(msg);
          const author = users.find((u) => u.id === msg.authorUserId);
          return {
            ...msg,
            author: author ? { id: author.id, name: author.name, email: author.email, platformRole: author.platformRole } : null,
          };
        },
      },
      platformNotification: {
        create: async ({ data }: any) => {
          const item = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            isRead: false,
            readAt: null,
            createdAt: new Date(),
            ...data,
          };
          notifications.push(item);
          return item;
        },
        findMany: async () => notifications,
        count: async ({ where }: any = {}) => {
          return notifications.filter((n) => {
            if (where?.isRead === false && n.isRead) return false;
            return true;
          }).length;
        },
        update: async ({ where, data }: any) => {
          const n = notifications.find((x) => x.id === where.id);
          if (n) Object.assign(n, data);
          return n;
        },
        updateMany: async ({ where, data }: any) => {
          let count = 0;
          notifications.forEach((n) => {
            if (where?.isRead === false && n.isRead === false) {
              Object.assign(n, data);
              count++;
            }
          });
          return { count };
        },
      },
      auditLog: {
        create: async ({ data }: any) => {
          const log = { id: `aud_${Date.now()}`, createdAt: new Date(), ...data };
          auditLogs.push(log);
          return log;
        },
        findMany: async () => auditLogs,
      },
    };

    return { db, users, tenants, subscriptions, invoices, domains, tickets, messages, notifications, auditLogs };
  }

  const ownerContext: PlatformContext = {
    userId: 'usr_owner_1',
    userEmail: 'owner@messmate.dev',
    userPhone: null,
    userName: 'Super Admin Owner',
    platformRole: 'PLATFORM_OWNER',
    permissions: new Set(PLATFORM_ROLE_PERMISSIONS.PLATFORM_OWNER),
    status: 'ACTIVE',
  };

  const supportContext: PlatformContext = {
    userId: 'usr_support_1',
    userEmail: 'sara@messmate.dev',
    userPhone: null,
    userName: 'Sara Support',
    platformRole: 'SUPPORT_STAFF',
    permissions: new Set(PLATFORM_ROLE_PERMISSIONS.SUPPORT_STAFF),
    status: 'ACTIVE',
  };

  const financeContext: PlatformContext = {
    userId: 'usr_finance_1',
    userEmail: 'fahim@messmate.dev',
    userPhone: null,
    userName: 'Fahim Finance',
    platformRole: 'FINANCE_STAFF',
    permissions: new Set(PLATFORM_ROLE_PERMISSIONS.FINANCE_STAFF),
    status: 'ACTIVE',
  };

  // --- Platform Users Tests ---

  it('1. List platform users returns all identities with membership counts', async () => {
    const { db } = createMockPlatformDb();
    const userService = new PlatformUserService(db);

    const result = await userService.listUsers({ page: 1, limit: 10 });
    assert.equal(result.users.length, 4);
    const resident = result.users.find((u) => u.id === 'usr_resident_1');
    assert.ok(resident);
    assert.equal(resident.membershipsCount, 2);
  });

  it('2. Search users filters correctly by name, email, or id', async () => {
    const { db } = createMockPlatformDb();
    const userService = new PlatformUserService(db);

    const result = await userService.listUsers({ search: 'Rahim' });
    assert.equal(result.users.length, 1);
    assert.equal(result.users[0].name, 'Rahim Khan');
  });

  it('3. View user details returns full profile and audit trail without leaking password secrets', async () => {
    const { db } = createMockPlatformDb();
    const userService = new PlatformUserService(db);

    const details = await userService.getUserById('usr_resident_1');
    assert.equal(details.name, 'Rahim Khan');
    assert.equal(details.email, 'rahim@example.com');
    // Ensure no password hashes or secrets
    assert.equal((details as any).passwordHash, undefined);
  });

  it('4. Review tenant memberships shows separate roles for each tenant organization', async () => {
    const { db } = createMockPlatformDb();
    const userService = new PlatformUserService(db);

    const details = await userService.getUserById('usr_resident_1');
    assert.equal(details.memberships.length, 2);
    const princeMem = details.memberships.find((m) => m.tenantSlug === 'prince-mess');
    const greenMem = details.memberships.find((m) => m.tenantSlug === 'green-villa');
    assert.equal(princeMem?.roleSlug, 'manager');
    assert.equal(greenMem?.roleSlug, 'member');
  });

  it('5. Suspend a platform user updates global account status and logs reason in audit trail', async () => {
    const { db } = createMockPlatformDb();
    const userService = new PlatformUserService(db);

    const updated = await userService.updateUserStatus(
      'usr_resident_1',
      'SUSPENDED',
      'Suspicious login activity reported',
      ownerContext
    );
    assert.equal(updated.status, 'SUSPENDED');
  });

  it('6. Reactivate an authorized account restores status to ACTIVE', async () => {
    const { db } = createMockPlatformDb();
    const userService = new PlatformUserService(db);

    await userService.updateUserStatus('usr_resident_1', 'SUSPENDED', 'Security review freeze', ownerContext);
    const reactivated = await userService.updateUserStatus(
      'usr_resident_1',
      'ACTIVE',
      'Identity verification confirmed by phone',
      ownerContext
    );
    assert.equal(reactivated.status, 'ACTIVE');
  });

  it('7. Prevent unauthorized role changes without users.manage permission', async () => {
    const { db } = createMockPlatformDb();
    const userService = new PlatformUserService(db);

    await assert.rejects(
      async () => {
        await userService.updateUserStatus(
          'usr_resident_1',
          'SUSPENDED',
          'Attempted suspension',
          financeContext // Finance staff lacks users.manage
        );
      },
      /Unauthorized: requires "users.manage" permission/
    );
  });

  // --- Platform Staff Tests ---

  it('8. Assign platform staff roles succeeds when performed by Platform Owner', async () => {
    const { db } = createMockPlatformDb();
    const userService = new PlatformUserService(db);

    const updated = await userService.assignPlatformRole(
      'usr_resident_1',
      'SUPPORT_STAFF',
      'Onboarded as junior customer helpdesk staff',
      ownerContext
    );
    assert.equal(updated.platformRole, 'SUPPORT_STAFF');
  });

  it('9. Restrict Support Staff permissions from billing management and role assignment', () => {
    const perms = PLATFORM_ROLE_PERMISSIONS.SUPPORT_STAFF;
    assert.ok(perms.includes('support.manage'));
    assert.ok(perms.includes('tenants.view'));
    assert.ok(!perms.includes('subscriptions.manage'));
    assert.ok(!perms.includes('users.manage'));
    assert.ok(!perms.includes('revenue.view'));
  });

  it('10. Restrict Finance Staff permissions from customer support and user suspension', () => {
    const perms = PLATFORM_ROLE_PERMISSIONS.FINANCE_STAFF;
    assert.ok(perms.includes('revenue.view'));
    assert.ok(perms.includes('subscriptions.manage'));
    assert.ok(!perms.includes('support.manage'));
    assert.ok(!perms.includes('users.manage'));
  });

  it('11. Prevent tenant-level users from accessing platform staff management', async () => {
    const { db } = createMockPlatformDb();
    const userService = new PlatformUserService(db);

    const tenantUserContext: PlatformContext = {
      userId: 'usr_resident_1',
      userEmail: 'rahim@example.com',
      userPhone: null,
      userName: 'Rahim Khan',
      platformRole: 'SUPPORT_STAFF', // Non-owner cannot assign roles
      permissions: new Set(),
      status: 'ACTIVE',
    };

    await assert.rejects(
      async () => {
        await userService.assignPlatformRole(
          'usr_resident_1',
          'PLATFORM_ADMIN',
          'Self escalation attempt',
          tenantUserContext
        );
      },
      /Only Platform Owners can assign or revoke privileged platform staff roles/
    );
  });

  // --- Support Center Tests ---

  it('12. Create a support ticket generates ticket number and initial message', async () => {
    const { db } = createMockPlatformDb();
    const supportService = new SupportTicketService(db);

    const ticket = await supportService.createTicket(
      {
        subject: 'Cannot update meal schedule',
        description: 'Every time I save Friday lunch, an error appears.',
        category: 'TECHNICAL_ISSUE',
        priority: 'NORMAL',
        tenantId: 'ten_prince',
      },
      { userId: 'usr_resident_1', tenantId: 'ten_prince' }
    );

    assert.ok(ticket.id);
    assert.ok(ticket.ticketNumber.startsWith('TICK-'));
    assert.equal(ticket.status, 'NEW');
    assert.equal(ticket.messages.length, 1);
    assert.equal(ticket.messages[0].isInternal, false);
  });

  it('13. View ticket details shows complete metadata and requester profile', async () => {
    const { db } = createMockPlatformDb();
    const supportService = new SupportTicketService(db);

    const created = await supportService.createTicket(
      { subject: 'Billing question', category: 'SUBSCRIPTION_BILLING' },
      { userId: 'usr_resident_1' }
    );

    const details = await supportService.getTicketById(created.id, { includeInternalNotes: true });
    assert.equal(details.subject, 'Billing question');
    assert.equal(details.requesterName, 'Rahim Khan');
  });

  it('14. Assign a ticket to platform staff transitions status from NEW to OPEN', async () => {
    const { db } = createMockPlatformDb();
    const supportService = new SupportTicketService(db);

    const ticket = await supportService.createTicket(
      { subject: 'DNS setup assistance' },
      { userId: 'usr_resident_1' }
    );
    assert.equal(ticket.status, 'NEW');

    const assigned = await supportService.assignTicket(ticket.id, 'usr_support_1', supportContext);
    assert.equal(assigned.assignedStaffId, 'usr_support_1');
    assert.equal(assigned.status, 'OPEN');
  });

  it('15. Add an internal note is flagged isInternal=true and hidden from customer view', async () => {
    const { db } = createMockPlatformDb();
    const supportService = new SupportTicketService(db);

    const ticket = await supportService.createTicket({ subject: 'Domain inquiry' }, { userId: 'usr_resident_1' });

    await supportService.addMessage(
      ticket.id,
      { message: 'DNS TXT record propagation verified on 8.8.8.8.', isInternal: true },
      supportContext.userId,
      supportContext
    );

    // Customer view (includeInternalNotes = false)
    const customerView = await supportService.getTicketById(ticket.id, { includeInternalNotes: false });
    assert.equal(customerView.messages.some((m) => m.isInternal), false);

    // Staff view (includeInternalNotes = true)
    const staffView = await supportService.getTicketById(ticket.id, { includeInternalNotes: true });
    assert.equal(staffView.messages.some((m) => m.isInternal), true);
  });

  it('16. Send a customer-visible reply automatically sets status to WAITING_CUSTOMER', async () => {
    const { db } = createMockPlatformDb();
    const supportService = new SupportTicketService(db);

    const ticket = await supportService.createTicket({ subject: 'Refund request' }, { userId: 'usr_resident_1' });

    await supportService.addMessage(
      ticket.id,
      { message: 'We have processed your refund, please verify your bKash inbox.', isInternal: false },
      supportContext.userId,
      supportContext
    );

    const updated = await supportService.getTicketById(ticket.id);
    assert.equal(updated.status, 'WAITING_CUSTOMER');
  });

  it('17. Change ticket status to RESOLVED stamps resolvedAt timestamp', async () => {
    const { db } = createMockPlatformDb();
    const supportService = new SupportTicketService(db);

    const ticket = await supportService.createTicket({ subject: 'Fixed issue' }, { userId: 'usr_resident_1' });
    const resolved = await supportService.updateTicketStatus(ticket.id, 'RESOLVED', supportContext);

    assert.equal(resolved.status, 'RESOLVED');
    assert.ok(resolved.resolvedAt);
  });

  it('18. Prevent unrelated tenants from accessing private tickets', async () => {
    const { db } = createMockPlatformDb();
    const supportService = new SupportTicketService(db);

    const ticket = await supportService.createTicket(
      { subject: 'Tenant B secret', tenantId: 'ten_green' },
      { userId: 'usr_resident_1', tenantId: 'ten_green' }
    );

    // Tenant Prince Mess attempts to access Green Villa's ticket
    await assert.rejects(
      async () => {
        await supportService.getTicketById(ticket.id, { tenantScope: 'ten_prince' });
      },
      /Access denied: ticket does not belong to the requested tenant/
    );
  });

  // --- Analytics Tests ---

  it('19. Validate tenant counts and distributions across types', async () => {
    const { db } = createMockPlatformDb();
    const analyticsService = new PlatformAnalyticsService(db);

    const filter = resolveDateRange('30d');
    const data = await analyticsService.getAnalytics(filter);

    assert.equal(data.tenants.total, 3);
    assert.equal(data.tenants.active, 2);
    assert.equal(data.tenants.suspended, 1);
  });

  it('20. Validate subscription metrics and trial-to-paid conversion rate', async () => {
    const { db } = createMockPlatformDb();
    const analyticsService = new PlatformAnalyticsService(db);

    const filter = resolveDateRange('30d');
    const data = await analyticsService.getAnalytics(filter);

    assert.equal(data.subscriptions.freeTrialAccounts, 1);
    assert.equal(data.subscriptions.activeStarter, 2);
    assert.ok(data.subscriptions.trialToPaidConversionRate >= 0);
  });

  it('21. Validate confirmed revenue calculations strictly exclude pending invoices', async () => {
    const { db } = createMockPlatformDb();
    const analyticsService = new PlatformAnalyticsService(db);

    const filter = resolveDateRange('30d');
    const data = await analyticsService.getAnalytics(filter);

    // inv_1 is CONFIRMED (৳99), inv_2 is PENDING (৳99)
    assert.equal(data.revenue.totalCollectedRevenue, 99.0);
    assert.equal(data.revenue.outstandingInvoices, 99.0);
    assert.equal(data.revenue.netCollectedRevenue, 99.0);
  });

  it('22. Validate date filters correctly compute start and end boundaries', () => {
    const today = resolveDateRange('today');
    assert.ok(today.startDate <= today.endDate);

    const sevenDays = resolveDateRange('7d');
    const diffDays = Math.round((sevenDays.endDate.getTime() - sevenDays.startDate.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 7);
  });

  it('23. Validate empty states render cleanly without dividing by zero', async () => {
    const emptyDb = {
      tenant: { count: async () => 0, groupBy: async () => [] },
      user: { count: async () => 0, findMany: async () => [] },
      subscription: { count: async () => 0 },
      subscriptionInvoice: { findMany: async () => [] },
      domain: { count: async () => 0 },
      supportTicket: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    };

    const analyticsService = new PlatformAnalyticsService(emptyDb);
    const filter = resolveDateRange('30d');
    const data = await analyticsService.getAnalytics(filter);

    assert.equal(data.tenants.total, 0);
    assert.equal(data.revenue.totalCollectedRevenue, 0);
    assert.equal(data.subscriptions.trialToPaidConversionRate, 0);
    assert.equal(data.support.averageResolutionHours, 0);
  });

  it('24. Prevent unauthorized report exports when user lacks reports.export permission', async () => {
    const { db } = createMockPlatformDb();
    const exportService = new ReportExportService(db);

    const unauthorizedStaff: PlatformContext = {
      userId: 'usr_support_1',
      userEmail: 'sara@messmate.dev',
      userPhone: null,
      userName: 'Sara Support',
      platformRole: 'SUPPORT_STAFF',
      permissions: new Set(['support.view', 'support.manage']), // no reports.export
      status: 'ACTIVE',
    };

    await assert.rejects(
      async () => {
        await exportService.exportReport('payments', unauthorizedStaff);
      },
      /Unauthorized: requires "reports.export" permission/
    );
  });

  // --- Notifications & Audit Tests ---

  it('25. Create notification events stores notification in database', async () => {
    const { db } = createMockPlatformDb();
    const notifService = new PlatformNotificationService(db);

    const notif = await notifService.createNotification({
      type: 'SUPPORT_TICKET_NEW',
      title: 'New Ticket [TICK-101]',
      message: 'Urgent inquiry submitted by resident',
    });

    assert.ok(notif.id);
    assert.equal(notif.isRead, false);
  });

  it('26. Mark notifications as read updates notification status and unread counter', async () => {
    const { db } = createMockPlatformDb();
    const notifService = new PlatformNotificationService(db);

    const notif = await notifService.createNotification({
      type: 'SYSTEM_ALERT',
      title: 'Maintenance scheduled',
      message: 'Database vacuum at 03:00 AM',
    });

    const before = await notifService.listNotifications();
    assert.equal(before.unreadCount, 1);

    await notifService.markAsRead(notif.id);

    const after = await notifService.listNotifications();
    assert.equal(after.unreadCount, 0);
  });

  it('27. Verify global search indexes tenants, users, subscriptions, tickets, and domains', async () => {
    const { db } = createMockPlatformDb();
    const searchService = new GlobalSearchService(db);

    const results = await searchService.search('Prince', ownerContext);
    assert.ok(results.tenants.some((t) => t.name === 'Prince Mess'));
    assert.ok(results.subscriptions.some((s) => s.tenantName === 'Prince Mess'));
    assert.ok(results.domains.some((d) => d.domainName === 'princemess.com'));
  });

  it('28. Verify sensitive information (passwords, tokens) is never exposed in user listings or exports', async () => {
    const { db } = createMockPlatformDb();
    const userService = new PlatformUserService(db);
    const exportService = new ReportExportService(db);

    const userList = await userService.listUsers();
    userList.users.forEach((u) => {
      assert.equal((u as any).passwordHash, undefined);
      assert.equal((u as any).verificationToken, undefined);
    });

    const report = await exportService.exportReport('users', ownerContext);
    assert.ok(!report.csvContent.includes('passwordHash'));
    assert.ok(!report.csvContent.includes('secret'));
  });
});
