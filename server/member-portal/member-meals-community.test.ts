import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  MemberPortalService,
  getTodayDhakaDateString,
  getCurrentDhakaMonthString,
} from './member-portal-service';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../api/errors';
import { getNextDayString } from '../meals/meal-utils';

describe('Task 39 — Meal Center, Notices, Events & Complaints', () => {
  let service: MemberPortalService;

  beforeEach(() => {
    // Instantiate fresh service with seeded mock data
    service = new MemberPortalService(null as any);
  });

  describe('My Meals Overview & Calendar (getMemberMealOverview)', () => {
    it('retrieves accurate dining overview, menus, today counts, and calendar grid', async () => {
      const todayDate = getTodayDhakaDateString();
      const currentMonth = getCurrentDhakaMonthString();

      const overview = await service.getMemberMealOverview('usr_resident_1', 'prince-mess', currentMonth);

      assert.ok(overview);
      assert.strictEqual(overview.todayDate, todayDate);
      assert.strictEqual(overview.monthString, currentMonth);
      assert.strictEqual(overview.todayStatus, 'ACTIVE');
      assert.strictEqual(overview.todayCounts.breakfast, 1);
      assert.strictEqual(overview.todayCounts.lunch, 1);
      assert.strictEqual(overview.todayCounts.dinner, 1);
      assert.ok(overview.todayMenu);
      assert.match(overview.todayMenu.lunch || '', /Rui Fish Curry/);

      // Calendar verification
      assert.ok(Array.isArray(overview.calendar));
      assert.ok(overview.calendar.length >= 28);
      const todayInCal = overview.calendar.find((c) => c.dateString === todayDate);
      assert.ok(todayInCal);
      assert.strictEqual(todayInCal.isToday, true);
      assert.strictEqual(todayInCal.breakfast, 1);
      assert.strictEqual(todayInCal.lunch, 1);
      assert.strictEqual(todayInCal.dinner, 1);
    });

    it('scopes meal records strictly to the member and never reveals other residents bookings', async () => {
      const currentMonth = getCurrentDhakaMonthString();

      const resident1Meals = await service.getMemberMealOverview('usr_resident_1', 'prince-mess', currentMonth);
      const resident2Meals = await service.getMemberMealOverview('usr_resident_2', 'prince-mess', currentMonth);

      assert.ok(resident1Meals);
      assert.ok(resident2Meals);

      // Verify privacy: calendar does not leak other members' names or booking lists
      resident1Meals.calendar.forEach((day) => {
        assert.strictEqual((day as any).otherMembers, undefined);
        assert.strictEqual((day as any).roommateBookings, undefined);
      });
    });

    it('displays meal system mode and uses backend calculated rate without frontend formulas', async () => {
      const overview = await service.getMemberMealOverview('usr_resident_1', 'prince-mess');

      assert.ok(overview.mealSystem);
      assert.ok(overview.mealSystemDescription);
      assert.ok(overview.monthSummary.estimatedMealRateFormatted);
      assert.ok(overview.cutoffs.defaultCutoff);
      assert.match(overview.cutoffs.cutoffExplanation, /Asia\/Dhaka/);
    });
  });

  describe('Meal-Off Requests & Server-Side Cutoff Enforcement', () => {
    it('successfully submits eligible future meal-off request', async () => {
      const todayDate = getTodayDhakaDateString();
      // Use date 5 days in the future to ensure it is comfortably before any cutoff
      const d = new Date(todayDate + 'T12:00:00Z');
      d.setDate(d.getDate() + 5);
      const futureStart = d.toISOString().split('T')[0];
      d.setDate(d.getDate() + 2);
      const futureEnd = d.toISOString().split('T')[0];

      const req = await service.submitMemberMealOffRequest('usr_resident_1', 'prince-mess', {
        startDate: futureStart,
        endDate: futureEnd,
        mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
        reason: 'Attending family program in Comilla',
      });

      assert.ok(req);
      assert.strictEqual(req.startDate, futureStart);
      assert.strictEqual(req.endDate, futureEnd);
      assert.strictEqual(req.reason, 'Attending family program in Comilla');
      assert.strictEqual(req.status, 'PENDING');
    });

    it('strictly rejects meal-off submission for dates in the past', async () => {
      await assert.rejects(
        async () => {
          await service.submitMemberMealOffRequest('usr_resident_1', 'prince-mess', {
            startDate: '2025-01-01',
            endDate: '2025-01-02',
            reason: 'Attempting retroactive meal-off for last year',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /deadline .* has passed/);
          return true;
        }
      );
    });

    it('rejects duplicate or overlapping meal-off requests for the same period', async () => {
      const todayDate = getTodayDhakaDateString();
      const d = new Date(todayDate + 'T12:00:00Z');
      d.setDate(d.getDate() + 10);
      const start = d.toISOString().split('T')[0];
      d.setDate(d.getDate() + 3);
      const end = d.toISOString().split('T')[0];

      // First submission
      await service.submitMemberMealOffRequest('usr_resident_1', 'prince-mess', {
        startDate: start,
        endDate: end,
        reason: 'Weekend trip',
      });

      // Overlapping second submission
      await assert.rejects(
        async () => {
          await service.submitMemberMealOffRequest('usr_resident_1', 'prince-mess', {
            startDate: start,
            endDate: end,
            reason: 'Duplicate request test',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /already have a pending or approved meal-off request/);
          return true;
        }
      );
    });

    it('allows a member to cancel their own pending meal-off request', async () => {
      const todayDate = getTodayDhakaDateString();
      const d = new Date(todayDate + 'T12:00:00Z');
      d.setDate(d.getDate() + 15);
      const start = d.toISOString().split('T')[0];

      const req = await service.submitMemberMealOffRequest('usr_resident_1', 'prince-mess', {
        startDate: start,
        endDate: start,
        reason: 'Cancelling test',
      });

      await service.cancelMemberMealOffRequest('usr_resident_1', 'prince-mess', req.id);

      // Confirm status updated to CANCELLED
      const cancelled = service.mockMealOffRequests.find((r) => r.id === req.id);
      assert.strictEqual(cancelled?.status, 'CANCELLED');
    });
  });

  describe('Notices Board (listMemberNotices)', () => {
    it('returns published notices visible to the resident and filters out drafts', async () => {
      const notices = await service.listMemberNotices('usr_resident_1', 'prince-mess');

      assert.ok(Array.isArray(notices));
      assert.strictEqual(notices.length, 2);
      assert.ok(notices.some((n) => n.title.includes('Welcome to the New Resident Portal')));

      // Ensure no draft notice leaked
      notices.forEach((n) => {
        assert.notStrictEqual((n as any).status, 'DRAFT');
      });
    });

    it('filters notices by category when requested', async () => {
      const maintenanceNotices = await service.listMemberNotices('usr_resident_1', 'prince-mess', 'MAINTENANCE');

      assert.strictEqual(maintenanceNotices.length, 1);
      assert.strictEqual(maintenanceNotices[0].category, 'MAINTENANCE');
      assert.match(maintenanceNotices[0].title, /Water Supply Maintenance/);
    });

    it('isolates notices to the tenant and excludes other messes notices', async () => {
      // Prince mess notices should not appear in green-villa-mess
      const gvNotices = await service.listMemberNotices('usr_resident_2', 'green-villa-mess').catch(() => []);
      assert.strictEqual(gvNotices.length, 0);
    });
  });

  describe('Community Events & RSVPs (listMemberEvents & rsvpMemberEvent)', () => {
    it('lists published events with attendee count and personal RSVP status', async () => {
      const events = await service.listMemberEvents('usr_resident_1', 'prince-mess');

      assert.ok(Array.isArray(events));
      assert.strictEqual(events.length, 2);

      const feast = events.find((e) => e.id === 'evt_friday_feast');
      assert.ok(feast);
      assert.match(feast.title, /Monthly Grand Feast/);
      assert.strictEqual(feast.myRsvpStatus, 'ATTENDING');
      assert.strictEqual(feast.totalAttendingCount, 1);
      assert.strictEqual(feast.isRsvpOpen, true);
    });

    it('protects co-resident privacy: never reveals attendee names on the event DTO', async () => {
      const events = await service.listMemberEvents('usr_resident_1', 'prince-mess');

      events.forEach((evt) => {
        assert.strictEqual((evt as any).attendees, undefined);
        assert.strictEqual((evt as any).rsvpList, undefined);
        assert.strictEqual(typeof evt.totalAttendingCount, 'number');
      });
    });

    it('allows a resident to update their RSVP and prevents duplicate RSVP entries', async () => {
      const updatedEvent = await service.rsvpMemberEvent(
        'usr_resident_1',
        'prince-mess',
        'evt_friday_feast',
        { status: 'MAYBE', notes: 'Might be delayed due to class' }
      );

      assert.ok(updatedEvent);
      assert.strictEqual(updatedEvent.myRsvpStatus, 'MAYBE');

      // Verify that no duplicate RSVP record was created
      const rsvps = service.mockEventRsvps.filter(
        (r) => r.eventId === 'evt_friday_feast' && r.membershipId === 'mem_res_1'
      );
      assert.strictEqual(rsvps.length, 1);
    });

    it('rejects RSVP submission if the event deadline has passed', async () => {
      // Modify event to have an expired deadline
      const event = service.mockEvents.find((e) => e.id === 'evt_cleaning_drive');
      if (event) {
        event.rsvpDeadline = new Date('2025-01-01T00:00:00Z');
      }

      await assert.rejects(
        async () => {
          await service.rsvpMemberEvent('usr_resident_1', 'prince-mess', 'evt_cleaning_drive', {
            status: 'ATTENDING',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /RSVP deadline for this event has passed/);
          return true;
        }
      );
    });
  });

  describe('Complaints & Grievances Center (listMemberComplaints & createMemberComplaint)', () => {
    it('lists only the authenticated members complaints with anti-IDOR isolation', async () => {
      const complaints = await service.listMemberComplaints('usr_resident_1', 'prince-mess');

      assert.ok(Array.isArray(complaints));
      assert.strictEqual(complaints.length, 1);
      assert.strictEqual(complaints[0].referenceNumber, 'CMP-2611-001');
      assert.strictEqual(complaints[0].category, 'MAINTENANCE');
      assert.strictEqual(complaints[0].status, 'IN_PROGRESS');
      assert.ok(complaints[0].adminResponse);
    });

    it('prevents member from viewing another members complaints', async () => {
      // usr_resident_2 has no complaints
      const complaints2 = await service.listMemberComplaints('usr_resident_2', 'prince-mess');
      assert.strictEqual(complaints2.length, 0);
    });

    it('submits a new complaint ticket with validation and generates reference number', async () => {
      const newCmp = await service.createMemberComplaint('usr_resident_1', 'prince-mess', {
        category: 'CLEANING',
        title: 'Dining hall table sanitation issue',
        description: 'The dining tables on the west side were not sanitized after lunch today.',
      });

      assert.ok(newCmp);
      assert.ok(newCmp.referenceNumber.startsWith('CMP-'));
      assert.strictEqual(newCmp.category, 'CLEANING');
      assert.strictEqual(newCmp.status, 'SUBMITTED');
      assert.strictEqual(newCmp.adminResponse, null);

      // Verify that it is returned in member's complaint list
      const list = await service.listMemberComplaints('usr_resident_1', 'prince-mess');
      assert.strictEqual(list.length, 2);
      assert.ok(list.some((c) => c.referenceNumber === newCmp.referenceNumber));
    });

    it('rejects complaints with insufficient title or description length', async () => {
      await assert.rejects(
        async () => {
          await service.createMemberComplaint('usr_resident_1', 'prince-mess', {
            category: 'OTHER',
            title: 'Hi',
            description: 'Bad',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          return true;
        }
      );
    });
  });
});
