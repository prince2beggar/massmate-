import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  MemberPortalService,
  normalizeBdPhone,
  toPoisha,
  formatBdtCurrency,
} from './member-portal-service';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../api/errors';

describe('Task 38 — My Profile, Room Information & Personal Requests', () => {
  let service: MemberPortalService;

  beforeEach(() => {
    // Instantiate fresh service with seeded mock data
    service = new MemberPortalService(null as any);
  });

  describe('Bangladeshi Phone Normalization & Validation', () => {
    it('normalizes valid 11-digit Bangladeshi mobile numbers', () => {
      assert.strictEqual(normalizeBdPhone('01712345678'), '01712345678');
      assert.strictEqual(normalizeBdPhone('+8801812345678'), '01812345678');
      assert.strictEqual(normalizeBdPhone('8801912345678'), '01912345678');
      assert.strictEqual(normalizeBdPhone('01300-112233'), '01300112233');
      assert.strictEqual(normalizeBdPhone('(015) 12345678'), '01512345678');
    });

    it('returns null for null, undefined, or empty phone input', () => {
      assert.strictEqual(normalizeBdPhone(null), null);
      assert.strictEqual(normalizeBdPhone(undefined), null);
      assert.strictEqual(normalizeBdPhone('   '), null);
    });

    it('throws ValidationError for invalid Bangladeshi mobile numbers', () => {
      assert.throws(() => normalizeBdPhone('12345'), ValidationError);
      assert.throws(() => normalizeBdPhone('01212345678'), ValidationError); // 012 is invalid BD operator
      assert.throws(() => normalizeBdPhone('0171234567899'), ValidationError); // Too long
      assert.throws(() => normalizeBdPhone('0171234abcd'), ValidationError); // Contains letters
    });
  });

  describe('My Profile Management (getMemberProfile & updateMemberProfile)', () => {
    it('retrieves member profile without exposing password hashes or private ledger records', async () => {
      const profile = await service.getMemberProfile('usr_resident_1', 'prince-mess');

      assert.ok(profile);
      assert.strictEqual(profile.userId, 'usr_resident_1');
      assert.strictEqual(profile.name, 'Tanvir Ahmed');
      assert.strictEqual(profile.phone, '01711000001');
      assert.strictEqual(profile.emergencyContactName, 'Kamal Ahmed');
      assert.strictEqual(profile.emergencyContactPhone, '01811000001');
      assert.strictEqual(profile.memberCode, 'PR-101');
      assert.strictEqual(profile.status, 'ACTIVE');
      assert.strictEqual(profile.tenantName, 'Prince Mess');

      // Security assertions: no password hashes or sensitive keys leaked
      assert.strictEqual((profile as any).passwordHash, undefined);
      assert.strictEqual((profile as any).password, undefined);
      assert.strictEqual((profile as any).internalNotes, undefined);
    });

    it('updates permitted self-service fields (phone, emergency contacts, avatar)', async () => {
      const result = await service.updateMemberProfile('usr_resident_1', 'prince-mess', {
        phone: '01822334455',
        emergencyContactName: 'Fatema Begum',
        emergencyContactPhone: '01999887766',
        avatar: 'https://example.com/avatar.jpg',
      });

      assert.ok(result.profile);
      assert.strictEqual(result.profile.phone, '01822334455');
      assert.strictEqual(result.profile.emergencyContactName, 'Fatema Begum');
      assert.strictEqual(result.profile.emergencyContactPhone, '01999887766');
      assert.strictEqual(result.profile.avatar, 'https://example.com/avatar.jpg');
      assert.strictEqual(result.requestedNameChange, false);
      assert.match(result.message, /Profile updated successfully/);
    });

    it('enforces anti-mass-assignment protection against status, roles, balances, and tenancy', async () => {
      const originalProfile = await service.getMemberProfile('usr_resident_1', 'prince-mess');

      // Malicious payload attempting privilege escalation and balance zeroing
      await service.updateMemberProfile('usr_resident_1', 'prince-mess', {
        phone: '01711000001',
        role: 'SUPER_ADMIN',
        roleId: 'role_admin',
        status: 'SUSPENDED',
        balancePoisha: '0',
        tenantId: 'tenant_other',
        membershipId: 'mem_other',
      });

      const updatedProfile = await service.getMemberProfile('usr_resident_1', 'prince-mess');
      assert.strictEqual(updatedProfile.roleName, originalProfile.roleName);
      assert.strictEqual(updatedProfile.status, 'ACTIVE');
      assert.strictEqual(updatedProfile.membershipId, originalProfile.membershipId);
    });

    it('creates an approval MemberRequest instead of directly changing authoritative name', async () => {
      const initialProfile = await service.getMemberProfile('usr_resident_1', 'prince-mess');
      assert.strictEqual(initialProfile.name, 'Tanvir Ahmed');

      const result = await service.updateMemberProfile('usr_resident_1', 'prince-mess', {
        name: 'Tanvir Ahmed Choudhury',
        phone: '01711000001',
      });

      // Name must NOT be changed directly on the profile
      assert.strictEqual(result.profile.name, 'Tanvir Ahmed');
      assert.strictEqual(result.requestedNameChange, true);
      assert.match(result.message, /name change request was submitted to Mess Admin/);

      // Verify that a pending MemberRequest was created
      const requests = await service.listMemberRequests('usr_resident_1', 'prince-mess', {
        requestType: 'PROFILE_UPDATE',
      });

      const nameReq = requests.find((r) => r.requestType === 'PROFILE_UPDATE');
      assert.ok(nameReq);
      assert.strictEqual(nameReq.status, 'PENDING');
      assert.match(nameReq.description, /Tanvir Ahmed Choudhury/);
      assert.strictEqual(nameReq.metadata?.requestedName, 'Tanvir Ahmed Choudhury');
    });
  });

  describe('My Room Information (getMemberRoomDetails)', () => {
    it('retrieves active room details, bed assignment, agreed rent, and room facilities', async () => {
      const roomDetails = await service.getMemberRoomDetails('usr_resident_1', 'prince-mess');

      assert.strictEqual(roomDetails.hasAssignment, true);
      assert.ok(roomDetails.currentAssignment);
      assert.strictEqual(roomDetails.currentAssignment.roomNumber, '204');
      assert.strictEqual(roomDetails.currentAssignment.bedNumber, 'Bed A (Window)');
      assert.strictEqual(roomDetails.currentAssignment.capacity, 2);
      assert.strictEqual(roomDetails.currentAssignment.formattedRent, '৳4,500.00');
      assert.ok(roomDetails.currentAssignment.facilities.includes('WiFi'));
      assert.strictEqual(roomDetails.currentAssignment.status, 'ACTIVE');
    });

    it('protects resident privacy by displaying occupancy counts without leaking names of roommates', async () => {
      const roomDetails = await service.getMemberRoomDetails('usr_resident_1', 'prince-mess');

      assert.ok(roomDetails.currentAssignment);
      // Strictly numeric occupancy count
      assert.strictEqual(typeof roomDetails.currentAssignment.currentOccupantsCount, 'number');
      assert.strictEqual(roomDetails.currentAssignment.currentOccupantsCount, 1);

      // No roommates array or personal identity fields on the DTO
      assert.strictEqual((roomDetails.currentAssignment as any).occupants, undefined);
      assert.strictEqual((roomDetails.currentAssignment as any).roommates, undefined);
    });

    it('returns empty assignment state for unassigned member', async () => {
      const roomDetails = await service.getMemberRoomDetails('usr_resident_2', 'prince-mess');

      assert.strictEqual(roomDetails.hasAssignment, false);
      assert.strictEqual(roomDetails.currentAssignment, null);
    });

    it('displays past room assignment history', async () => {
      const roomDetails = await service.getMemberRoomDetails('usr_resident_1', 'prince-mess');

      assert.ok(roomDetails.assignmentHistory);
      assert.strictEqual(roomDetails.assignmentHistory.length, 1);
      const prev = roomDetails.assignmentHistory[0];
      assert.strictEqual(prev.roomNumber, '101');
      assert.strictEqual(prev.status, 'TRANSFERRED');
      assert.strictEqual(prev.moveOutReason, 'Transferred to 204 for exams');
      assert.strictEqual(prev.formattedRent, '৳4,000.00');
    });

    it('lists available rooms with vacancies for potential transfer', async () => {
      const roomDetails = await service.getMemberRoomDetails('usr_resident_1', 'prince-mess');

      assert.ok(roomDetails.availableRooms);
      const room205 = roomDetails.availableRooms.find((r) => r.roomNumber === '205');
      assert.ok(room205);
      assert.strictEqual(room205.capacity, 2);
      assert.strictEqual(room205.availableBedsCount, 2);
      assert.strictEqual(room205.formattedDefaultRent, '৳4,800.00');
    });
  });

  describe('Personal Requests Center (list, create, cancel, and review)', () => {
    it('creates a ROOM_CHANGE request with status PENDING without immediately altering active room', async () => {
      const newReq = await service.createMemberRequest('usr_resident_1', 'prince-mess', {
        requestType: 'ROOM_CHANGE',
        requestedRoomId: 'room_205',
        preferredDate: '2026-12-01',
        title: 'Transfer to 205 for Quiet Studies',
        description: 'Room 205 has air cooler and quiet corner for final examinations.',
      });

      assert.ok(newReq);
      assert.strictEqual(newReq.status, 'PENDING');
      assert.strictEqual(newReq.requestType, 'ROOM_CHANGE');
      assert.strictEqual(newReq.requestedRoomId, 'room_205');
      assert.strictEqual(newReq.requestedRoomNumber, '205');
      assert.strictEqual(newReq.adminResponse, null);

      // Verify that member is still in room 204! (No instant change)
      const roomDetails = await service.getMemberRoomDetails('usr_resident_1', 'prince-mess');
      assert.strictEqual(roomDetails.currentAssignment?.roomNumber, '204');
    });

    it('rejects creating request with description shorter than 5 characters', async () => {
      await assert.rejects(
        async () => {
          await service.createMemberRequest('usr_resident_1', 'prince-mess', {
            requestType: 'MAINTENANCE',
            description: 'Fan',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /at least 5 characters/);
          return true;
        }
      );
    });

    it('allows member to cancel their own PENDING request', async () => {
      const req = await service.createMemberRequest('usr_resident_1', 'prince-mess', {
        requestType: 'MAINTENANCE',
        description: 'Bathroom door latch is loose and needs fixing.',
      });

      assert.strictEqual(req.status, 'PENDING');

      const cancelled = await service.cancelMemberRequest('usr_resident_1', 'prince-mess', req.id);
      assert.strictEqual(cancelled.status, 'CANCELLED');
    });

    it('prevents member from cancelling a request that has already been APPROVED or REJECTED', async () => {
      // req_seed_1 is seeded as APPROVED
      await assert.rejects(
        async () => {
          await service.cancelMemberRequest('usr_resident_1', 'prince-mess', 'req_seed_1');
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /Cannot cancel a request that has already been approved/);
          return true;
        }
      );
    });

    it('enforces IDOR protection: cannot view or cancel requests from another user or mess', async () => {
      // Create request for resident 1
      const req = await service.createMemberRequest('usr_resident_1', 'prince-mess', {
        requestType: 'GENERAL_QUERY',
        description: 'Question about meal guest policies for Friday.',
      });

      // Resident 2 attempts to cancel Resident 1's request
      await assert.rejects(
        async () => {
          await service.cancelMemberRequest('usr_resident_2', 'prince-mess', req.id);
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.match(err.message, /Request not found or access denied/);
          return true;
        }
      );
    });

    it('admin review approving ROOM_CHANGE executes atomic room transfer transaction', async () => {
      // Resident 1 creates transfer request to room 205
      const req = await service.createMemberRequest('usr_resident_1', 'prince-mess', {
        requestType: 'ROOM_CHANGE',
        requestedRoomId: 'room_205',
        description: 'Approved transfer test to room 205.',
      });

      // Admin approves request
      const reviewed = await service.reviewMemberRequest(
        'usr_admin_1',
        'prince-mess',
        req.id,
        'APPROVED',
        'Transfer approved and bed allocated.'
      );

      assert.strictEqual(reviewed.status, 'APPROVED');
      assert.strictEqual(reviewed.adminResponse, 'Transfer approved and bed allocated.');

      // Member's active room assignment should now be updated to room 205!
      const updatedRoom = await service.getMemberRoomDetails('usr_resident_1', 'prince-mess');
      assert.strictEqual(updatedRoom.hasAssignment, true);
      assert.strictEqual(updatedRoom.currentAssignment?.roomNumber, '205');
      assert.strictEqual(updatedRoom.currentAssignment?.formattedRent, '৳4,800.00');

      // Previous assignment to 204 should now be in assignment history
      assert.ok(updatedRoom.assignmentHistory.some((h) => h.roomNumber === '204'));
    });
  });
});
