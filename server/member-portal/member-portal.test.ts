import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  MemberPortalService,
  toPoisha,
  fromPoisha,
  formatBdtCurrency,
  getTodayDhakaDateString,
} from './member-portal-service';
import { withMemberAuth, type MemberContext } from '../api/with-member-auth';
import {
  UnauthenticatedError,
  NotFoundError,
  ForbiddenError,
} from '../api/errors';

describe('Task 37 — Member Portal Foundation, Access Control & Dashboard', () => {
  let service: MemberPortalService;

  beforeEach(() => {
    // Instantiate fresh service with seeded mock data
    service = new MemberPortalService(null as any);
  });

  describe('Currency & Poisha Conversion Utilities', () => {
    it('converts Taka to integer Poisha safely without float drift', () => {
      assert.strictEqual(toPoisha(100), BigInt(10000));
      assert.strictEqual(toPoisha('100.50'), BigInt(10050));
      assert.strictEqual(toPoisha(0), BigInt(0));
      assert.strictEqual(toPoisha(-50), BigInt(-5000));
    });

    it('converts integer Poisha back to numeric Taka', () => {
      assert.strictEqual(fromPoisha(BigInt(10000)), 100);
      assert.strictEqual(fromPoisha(BigInt(10050)), 100.5);
      assert.strictEqual(fromPoisha(BigInt(0)), 0);
    });

    it('formats BDT currency with symbol', () => {
      assert.strictEqual(formatBdtCurrency(BigInt(550000)), '৳5,500.00');
      assert.strictEqual(formatBdtCurrency(BigInt(0)), '৳0.00');
    });
  });

  describe('Server-Side Access Control (resolveMemberContext)', () => {
    it('resolves MemberContext for an active resident member', async () => {
      const context = await service.resolveMemberContext('usr_resident_1', 'prince-mess');

      assert.ok(context);
      assert.strictEqual(context.userId, 'usr_resident_1');
      assert.strictEqual(context.userName, 'Tanvir Ahmed');
      assert.strictEqual(context.tenantSlug, 'prince-mess');
      assert.strictEqual(context.membershipStatus, 'ACTIVE');
      assert.strictEqual(context.roleSlug, 'member');
    });

    it('throws NotFoundError if the requested tenant does not exist', async () => {
      await assert.rejects(
        async () => {
          await service.resolveMemberContext('usr_resident_1', 'non-existent-mess');
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.strictEqual(err.statusCode, 404);
          assert.match(err.message, /Mess with slug 'non-existent-mess' not found/);
          return true;
        }
      );
    });

    it('throws ForbiddenError if user has no membership in the target mess (IDOR protection)', async () => {
      await assert.rejects(
        async () => {
          // usr_resident_1 only belongs to prince-mess, not green-villa-mess
          await service.resolveMemberContext('usr_resident_1', 'green-villa-mess');
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /not have a resident membership/);
          return true;
        }
      );
    });

    it('throws ForbiddenError if member status is INACTIVE or SUSPENDED', async () => {
      await assert.rejects(
        async () => {
          await service.resolveMemberContext('usr_suspended_user', 'prince-mess');
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /membership in this mess is suspended/);
          return true;
        }
      );
    });
  });

  describe('Member Dashboard Data Aggregation', () => {
    it('aggregates complete dashboard data for active member with room and meals', async () => {
      const dashboard = await service.getMemberDashboard('usr_resident_1', 'prince-mess');

      // 1. Member profile
      assert.strictEqual(dashboard.member.id, 'mem_res_1');
      assert.strictEqual(dashboard.member.name, 'Tanvir Ahmed');
      assert.strictEqual(dashboard.member.status, 'ACTIVE');

      // 2. Room assignment card
      assert.ok(dashboard.overviewCards.room);
      assert.strictEqual(dashboard.overviewCards.room.isAssigned, true);
      assert.strictEqual(dashboard.overviewCards.room.roomNumber, '204');
      assert.strictEqual(dashboard.overviewCards.room.bedLabel, 'Bed A (Window)');
      assert.strictEqual(dashboard.overviewCards.room.rentPoisha, '450000');
      assert.strictEqual(dashboard.overviewCards.room.monthlyRentFormatted, '৳4,500.00');

      // 3. Today dining & menu
      assert.ok(dashboard.overviewCards.meals);
      assert.strictEqual(dashboard.overviewCards.meals.todayStatus, 'ACTIVE');
      assert.strictEqual(dashboard.overviewCards.meals.todayCounts.breakfast, true);
      assert.strictEqual(dashboard.overviewCards.meals.todayCounts.lunch, true);
      assert.strictEqual(dashboard.overviewCards.meals.todayCounts.dinner, true);
      assert.strictEqual(dashboard.mealSnapshot.todayMenu.breakfast, 'Dim Porota, Daal, Tea');
      assert.strictEqual(dashboard.mealSnapshot.todayMenu.lunch, 'Bhaat, Rui Fish Curry, Shaak');
      assert.strictEqual(dashboard.mealSnapshot.todayMenu.dinner, 'Bhaat, Chicken Bhuna, Daal');

      // 4. Financial statement & KPIs
      assert.ok(dashboard.overviewCards.account);
      assert.strictEqual(dashboard.overviewCards.account.currentDuePoisha, '325000');
      assert.strictEqual(dashboard.overviewCards.account.currentDueFormatted, '৳3,250.00');
      assert.strictEqual(dashboard.overviewCards.account.totalBilledPoisha, '825000');
      assert.strictEqual(dashboard.monthlyAccountSnapshot.confirmedPaymentsFormatted, '৳5,000.00');

      // 5. Last confirmed payment
      assert.ok(dashboard.overviewCards.account.lastConfirmedPayment);
      assert.strictEqual(dashboard.overviewCards.account.lastConfirmedPayment?.amountPoisha, '500000');
      assert.strictEqual(dashboard.overviewCards.account.lastConfirmedPayment?.amountFormatted, '৳5,000.00');
      assert.strictEqual(dashboard.overviewCards.account.lastConfirmedPayment?.method, 'BKASH');

      // 6. Notices
      assert.ok(Array.isArray(dashboard.notices));
      assert.ok(dashboard.notices.length > 0);
      const pinnedNotice = dashboard.notices.find((n) => n.isPinned);
      assert.ok(pinnedNotice);
      assert.strictEqual(pinnedNotice?.title, 'Welcome to the New Resident Portal');

      // 7. Recent activities
      assert.ok(Array.isArray(dashboard.recentActivities));
      assert.ok(dashboard.recentActivities.length > 0);
    });

    it('returns isAssigned: false for member with no assigned bed (empty state)', async () => {
      const dashboard = await service.getMemberDashboard('usr_resident_2', 'prince-mess');

      assert.strictEqual(dashboard.member.id, 'mem_res_2');
      assert.strictEqual(dashboard.overviewCards.room.isAssigned, false);
      assert.strictEqual(dashboard.overviewCards.room.roomNumber, null);
      assert.strictEqual(dashboard.overviewCards.room.monthlyRentFormatted, null);
    });

    it('correctly reflects active meal-off status if requested for today', async () => {
      const today = service.getTodayDhakaDateString();
      // Add an approved meal-off request for usr_resident_2 for today
      service.mockMealOffRequests.push({
        id: 'mo_test_today',
        tenantId: 'tenant_prince_mess',
        membershipId: 'mem_res_2',
        startDate: today,
        endDate: today,
        status: 'APPROVED',
        reason: 'Office tour',
      });

      const dashboard = await service.getMemberDashboard('usr_resident_2', 'prince-mess');

      assert.strictEqual(dashboard.overviewCards.meals.todayStatus, 'OFF');
      assert.strictEqual(dashboard.overviewCards.meals.todayCounts.breakfast, false);
      assert.strictEqual(dashboard.mealSnapshot.recentMealOffStatus, 'Meal Off Active');
    });

    it('isolates notices to tenant and excludes other tenants notices', async () => {
      // Add a notice belonging to another tenant
      service.mockNotices.push({
        id: 'ntc_other',
        tenantId: 'tenant_other_mess',
        title: 'Secret Notice Other Mess',
        content: 'Confidential info',
        category: 'FINANCE',
        priority: 'HIGH',
        isPinned: false,
        status: 'PUBLISHED',
        createdAt: new Date(),
        expiresAt: null,
      });

      const dashboard = await service.getMemberDashboard('usr_resident_1', 'prince-mess');
      const otherNotice = dashboard.notices.find((n) => n.id === 'ntc_other');
      assert.strictEqual(otherNotice, undefined);
    });
  });

  describe('withMemberAuth API Higher-Order Wrapper', () => {
    it('rejects unauthenticated requests without x-user-id with 401', async () => {
      const handler = withMemberAuth(async (_req, { memberContext }) => {
        return new Response(JSON.stringify({ ok: true, memberContext }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }) as any;
      });

      const fakeReq = new Request('https://messmate.test/api/v1/portal/prince-mess/dashboard', {
        headers: {}, // No x-user-id
      });

      const res = await handler(fakeReq, { params: Promise.resolve({ tenantSlug: 'prince-mess' }) });
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.match(json.message, /Authentication required/);
    });

    it('rejects cross-tenant access with 403', async () => {
      const handler = withMemberAuth(async (_req, { memberContext }) => {
        return new Response(JSON.stringify({ ok: true, memberContext }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }) as any;
      });

      const fakeReq = new Request('https://messmate.test/api/v1/portal/green-villa-mess/dashboard', {
        headers: { 'x-user-id': 'usr_resident_1' }, // belongs to prince-mess, not green-villa-mess
      });

      const res = await handler(fakeReq, { params: Promise.resolve({ tenantSlug: 'green-villa-mess' }) });
      assert.strictEqual(res.status, 403);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.match(json.message, /not have a resident membership/);
    });

    it('passes authorized memberContext to handler and returns 200', async () => {
      let capturedContext: MemberContext | null = null;
      const handler = withMemberAuth(async (_req, { memberContext }) => {
        capturedContext = memberContext;
        return new Response(JSON.stringify({ success: true, memberName: memberContext.userName }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }) as any;
      });

      const fakeReq = new Request('https://messmate.test/api/v1/portal/prince-mess/dashboard', {
        headers: { 'x-user-id': 'usr_resident_1' },
      });

      const res = await handler(fakeReq, { params: Promise.resolve({ tenantSlug: 'prince-mess' }) });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.memberName, 'Tanvir Ahmed');
      assert.ok(capturedContext);
      assert.strictEqual((capturedContext as any).tenantSlug, 'prince-mess');
    });
  });
});
