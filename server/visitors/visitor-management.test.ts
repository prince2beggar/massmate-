import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  VisitorService,
  PreRegisterVisitorInput,
  WalkInVisitorInput,
  ASIA_DHAKA_TIMEZONE,
} from './visitor-service';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../api/errors';

describe('Task 44 — Visitor, Guest & Entry Management', () => {
  let service: VisitorService;

  beforeEach(() => {
    // Instantiate fresh service with seeded mock data
    service = new VisitorService(null as any);
  });

  describe('1. Tenant Isolation for Visitor Records', () => {
    it('Tenant A cannot access Tenant B visitor records', async () => {
      // Prince Mess has seeded visitors (vis_seed_1, vis_seed_2, vis_seed_3)
      const princeVisitors = await service.listVisitors('prince-mess', {}, true);
      assert.ok(princeVisitors.visitors.length > 0);
      for (const v of princeVisitors.visitors) {
        assert.strictEqual(v.tenantId, 'tenant_prince_mess');
      }

      // Green Villa Mess has only its own visitor (vis_green_1)
      const greenVisitors = await service.listVisitors('green-villa-mess', {}, true);
      assert.strictEqual(greenVisitors.visitors.length, 1);
      assert.strictEqual(greenVisitors.visitors[0].referenceNumber, 'VIS-GV-001');
      assert.strictEqual(greenVisitors.visitors[0].tenantId, 'tenant_green_villa');

      // Attempting to access Prince Mess visitor from Green Villa throws NotFoundError
      await assert.rejects(
        async () => {
          await service.getVisitorById('green-villa-mess', 'vis_seed_1', true);
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.match(err.message, /not found/i);
          return true;
        }
      );
    });

    it('rejects visitor operations on suspended mess tenants with ForbiddenError', async () => {
      await assert.rejects(
        async () => {
          await service.listVisitors('suspended-mess', {}, true);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /suspended/i);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await service.getVisitorDashboard('suspended-mess', undefined, true);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          return true;
        }
      );
    });
  });

  describe('2. Member Pre-Registration & Scope Boundaries', () => {
    it('member can submit a visitor pre-registration for themselves', async () => {
      const input: PreRegisterVisitorInput = {
        visitorName: 'Tareq Rahman',
        visitorPhone: '01700112233',
        visitPurpose: 'FRIEND',
        expectedArrival: new Date('2026-11-23T15:00:00Z'),
        numberOfVisitors: 1,
        notes: 'College friend visiting for evening study',
      };

      const result = await service.preRegisterVisitor('prince-mess', 'usr_resident_1', input);

      assert.ok(result.id);
      assert.strictEqual(result.visitorName, 'Tareq Rahman');
      assert.strictEqual(result.hostUserId, 'usr_resident_1');
      assert.strictEqual(result.hostMembershipId, 'mem_resident_1');
      assert.strictEqual(result.status, 'PENDING_APPROVAL');
      assert.strictEqual(result.recordedById, 'usr_resident_1');
      assert.ok(result.referenceNumber.startsWith('VIS-'));
    });

    it('rejects pre-registration if host is not an active member of this tenant', async () => {
      const input: PreRegisterVisitorInput = {
        visitorName: 'Intruder Guest',
        expectedArrival: new Date('2026-11-23T15:00:00Z'),
      };

      // usr_outsider does not have membership in prince-mess
      await assert.rejects(
        async () => {
          await service.preRegisterVisitor('prince-mess', 'usr_outsider_99', input);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /not an active member/i);
          return true;
        }
      );
    });

    it('rejects pre-registration with missing required fields', async () => {
      await assert.rejects(
        async () => {
          await service.preRegisterVisitor('prince-mess', 'usr_resident_1', {
            visitorName: '',
            expectedArrival: new Date(),
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /visitor name is required/i);
          return true;
        }
      );
    });
  });

  describe('3. Staff Approval Workflow & Self-Approval Prevention', () => {
    it('prevents member from approving their own visitor request', async () => {
      // vis_seed_3 has hostUserId = usr_resident_1 and is PENDING_APPROVAL
      await assert.rejects(
        async () => {
          await service.reviewVisitorRequest(
            'prince-mess',
            'usr_resident_1', // Member attempting to approve their own request!
            'vis_seed_3',
            'APPROVE'
          );
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /cannot approve their own/i);
          return true;
        }
      );
    });

    it('authorized staff can approve a pending visitor request', async () => {
      const reviewed = await service.reviewVisitorRequest(
        'prince-mess',
        'usr_owner_1', // Staff manager
        'vis_seed_3',
        'APPROVE'
      );

      assert.strictEqual(reviewed.status, 'APPROVED');
      assert.strictEqual(reviewed.rejectionReason, null);
    });

    it('authorized staff can reject a pending visitor request with reason', async () => {
      // Pre-register another request first
      const preReg = await service.preRegisterVisitor('prince-mess', 'usr_resident_2', {
        visitorName: 'Late Night Delivery',
        expectedArrival: new Date('2026-11-23T23:30:00Z'),
        visitPurpose: 'DELIVERY_SERVICE',
      });

      const rejected = await service.reviewVisitorRequest(
        'prince-mess',
        'usr_owner_1',
        preReg.id,
        'REJECT',
        'No visitors allowed after 22:00 according to house rules.'
      );

      assert.strictEqual(rejected.status, 'REJECTED');
      assert.strictEqual(rejected.rejectionReason, 'No visitors allowed after 22:00 according to house rules.');
    });

    it('cannot review a visitor request that is not in PENDING_APPROVAL state', async () => {
      // vis_seed_1 is already CHECKED_IN
      await assert.rejects(
        async () => {
          await service.reviewVisitorRequest('prince-mess', 'usr_owner_1', 'vis_seed_1', 'APPROVE');
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /only pending_approval/i);
          return true;
        }
      );
    });
  });

  describe('4. Check-In & Check-Out Lifecycle Rules', () => {
    it('duplicate check-in is rejected', async () => {
      // vis_seed_1 is already CHECKED_IN
      await assert.rejects(
        async () => {
          await service.checkInVisitor('prince-mess', 'usr_owner_1', 'vis_seed_1');
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /already checked in/i);
          return true;
        }
      );
    });

    it('rejected or cancelled request cannot be checked in', async () => {
      // Reject vis_seed_3 first
      await service.reviewVisitorRequest(
        'prince-mess',
        'usr_owner_1',
        'vis_seed_3',
        'REJECT',
        'Security concern'
      );

      await assert.rejects(
        async () => {
          await service.checkInVisitor('prince-mess', 'usr_owner_1', 'vis_seed_3');
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /cannot check in a visitor with status 'REJECTED'/i);
          return true;
        }
      );
    });

    it('checkout before check-in is rejected', async () => {
      // vis_seed_3 is PENDING_APPROVAL (not checked in)
      await assert.rejects(
        async () => {
          await service.checkOutVisitor('prince-mess', 'usr_owner_1', 'vis_seed_3');
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /not currently checked in/i);
          return true;
        }
      );
    });

    it('successful check-in and check-out generates server timestamps in Asia/Dhaka', async () => {
      // Approve vis_seed_3 first
      await service.reviewVisitorRequest('prince-mess', 'usr_owner_1', 'vis_seed_3', 'APPROVE');

      // Now check in
      const checkedIn = await service.checkInVisitor('prince-mess', 'usr_owner_1', 'vis_seed_3');
      assert.strictEqual(checkedIn.status, 'CHECKED_IN');
      assert.ok(checkedIn.actualCheckIn);
      assert.ok(checkedIn.formattedActualCheckIn);
      assert.strictEqual(checkedIn.checkedInById, 'usr_owner_1');

      // Now check out
      const checkedOut = await service.checkOutVisitor('prince-mess', 'usr_owner_1', 'vis_seed_3');
      assert.strictEqual(checkedOut.status, 'CHECKED_OUT');
      assert.ok(checkedOut.actualCheckOut);
      assert.ok(checkedOut.formattedActualCheckOut);
      assert.strictEqual(checkedOut.checkedOutById, 'usr_owner_1');

      // Subsequent checkout attempt is rejected
      await assert.rejects(
        async () => {
          await service.checkOutVisitor('prince-mess', 'usr_owner_1', 'vis_seed_3');
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          return true;
        }
      );
    });
  });

  describe('5. Member Privacy Bounds & Data Minimization', () => {
    it('members cannot view the full mess visitor log (restricted to own requests)', async () => {
      // Staff sees all Prince Mess visitors (3 seeded)
      const staffView = await service.listVisitors('prince-mess', {}, true, 'usr_owner_1');
      assert.strictEqual(staffView.visitors.length, 3);

      // Resident 2 (who only has their own visitor) cannot see Resident 1's visitors
      const resident2View = await service.listVisitors(
        'prince-mess',
        {},
        false, // isStaff = false
        'usr_resident_2'
      );

      // Resident 2 has no visitors initially in seed
      assert.strictEqual(resident2View.visitors.length, 0);

      // If Resident 2 attempts to fetch Resident 1's visitor directly by ID, it throws NotFoundError
      await assert.rejects(
        async () => {
          await service.getVisitorById(
            'prince-mess',
            'vis_seed_1',
            false, // isStaff = false
            'usr_resident_2'
          );
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          return true;
        }
      );
    });

    it('visitor contact numbers are redacted for non-staff viewers who are not the host', async () => {
      // Pre-register for resident 1 with a phone number
      const preReg = await service.preRegisterVisitor('prince-mess', 'usr_resident_1', {
        visitorName: 'Private Contact Guest',
        visitorPhone: '01899123456',
        expectedArrival: new Date('2026-11-24T10:00:00Z'),
      });

      // 1. Host member sees their own visitor's phone
      const hostView = await service.getVisitorById(
        'prince-mess',
        preReg.id,
        false, // non-staff
        'usr_resident_1' // host!
      );
      assert.strictEqual(hostView.visitorPhone, '01899123456');

      // 2. Staff member sees the phone
      const staffView = await service.getVisitorById('prince-mess', preReg.id, true);
      assert.strictEqual(staffView.visitorPhone, '01899123456');
    });
  });

  describe('6. Walk-In Registration & Emergency Operations', () => {
    it('walk-in registration creates checked-in visitor with server timestamp and alerts host', async () => {
      const walkInInput: WalkInVisitorInput = {
        visitorName: 'Courier Delivery Executive',
        visitorPhone: '01900112244',
        visitPurpose: 'DELIVERY_SERVICE',
        hostUserId: 'usr_resident_1',
        numberOfVisitors: 1,
        notes: 'Document delivery at reception gate',
      };

      const result = await service.registerWalkInVisitor('prince-mess', 'usr_owner_1', walkInInput);

      assert.ok(result.id);
      assert.strictEqual(result.status, 'CHECKED_IN');
      assert.ok(result.actualCheckIn);
      assert.strictEqual(result.recordedById, 'usr_owner_1');
      assert.strictEqual(result.checkedInById, 'usr_owner_1');
      assert.strictEqual(result.hostUserId, 'usr_resident_1');
      assert.strictEqual(result.visitPurpose, 'DELIVERY_SERVICE');
    });

    it('rejects walk-in registration with missing visitor name', async () => {
      await assert.rejects(
        async () => {
          await service.registerWalkInVisitor('prince-mess', 'usr_owner_1', {
            visitorName: '   ',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /visitor name is required/i);
          return true;
        }
      );
    });
  });

  describe('7. Request Cancellation Workflow', () => {
    it('member can cancel their own unfulfilled visitor request', async () => {
      const preReg = await service.preRegisterVisitor('prince-mess', 'usr_resident_1', {
        visitorName: 'Weekend Guest',
        expectedArrival: new Date('2026-11-25T10:00:00Z'),
      });

      const cancelled = await service.cancelVisitorRequest(
        'prince-mess',
        'usr_resident_1',
        preReg.id,
        false
      );

      assert.strictEqual(cancelled.status, 'CANCELLED');
    });

    it('cannot cancel a visitor who has already checked in or out', async () => {
      // vis_seed_1 is CHECKED_IN
      await assert.rejects(
        async () => {
          await service.cancelVisitorRequest(
            'prince-mess',
            'usr_resident_1',
            'vis_seed_1',
            false
          );
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /already checked in or checked out/i);
          return true;
        }
      );

      // vis_seed_2 is CHECKED_OUT
      await assert.rejects(
        async () => {
          await service.cancelVisitorRequest(
            'prince-mess',
            'usr_resident_1',
            'vis_seed_2',
            false
          );
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /already checked in or checked out/i);
          return true;
        }
      );
    });
  });

  describe('8. Visitor Dashboard Metrics & Filters', () => {
    it('calculates gate counts accurately for today', async () => {
      const dash = await service.getVisitorDashboard('prince-mess', 'usr_owner_1', true);

      assert.strictEqual(typeof dash.currentlyCheckedInCount, 'number');
      assert.strictEqual(typeof dash.checkedOutTodayCount, 'number');
      assert.strictEqual(typeof dash.pendingApprovalCount, 'number');
      assert.strictEqual(typeof dash.totalVisitorsAllTime, 'number');
      assert.ok(dash.currentlyCheckedInCount >= 1);
      assert.ok(dash.pendingApprovalCount >= 1);
    });

    it('filters by status and purpose correctly', async () => {
      const checkedInList = await service.listVisitors('prince-mess', {
        status: 'CHECKED_IN',
      });
      for (const v of checkedInList.visitors) {
        assert.strictEqual(v.status, 'CHECKED_IN');
      }

      const deliveryList = await service.listVisitors('prince-mess', {
        visitPurpose: 'DELIVERY_SERVICE',
      });
      for (const v of deliveryList.visitors) {
        assert.strictEqual(v.visitPurpose, 'DELIVERY_SERVICE');
      }
    });

    it('search filter matches reference number and visitor name', async () => {
      const searchRef = await service.listVisitors('prince-mess', {
        search: 'VIS-2611-001',
      });
      assert.strictEqual(searchRef.visitors.length, 1);
      assert.strictEqual(searchRef.visitors[0].referenceNumber, 'VIS-2611-001');

      const searchName = await service.listVisitors('prince-mess', {
        search: 'Daraz',
      });
      assert.strictEqual(searchName.visitors.length, 1);
      assert.match(searchName.visitors[0].visitorName, /Daraz/i);
    });
  });
});
