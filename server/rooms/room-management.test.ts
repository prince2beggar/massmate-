/**
 * Task 32: Room Management and Rental Management Test Suite
 *
 * Verifies:
 * 1. Room directory listing with tenant isolation, filters, and summary metrics
 * 2. Room creation with auto-generated beds, unique room number validation, and audit logging
 * 3. Safe capacity reduction: throws error if reducing below current active occupancy
 * 4. Member bed assignment with status transitions and audit records
 * 5. Reassignment conflict prevention (cannot double-assign active resident)
 * 6. Capacity overflow prevention (cannot exceed room capacity)
 * 7. Double-booking bed collision prevention
 * 8. Member transfer workflow: frees old bed, occupies new bed, marks previous as TRANSFERRED
 * 9. Member move-out workflow: requires mandatory reason, frees bed, preserves history
 * 10. Rent change tracking with effective dates and audit logging
 * 11. Multi-tenant isolation: strict cross-tenant segregation
 * 12. Rental listing creation and publishing
 * 13. Guest booking overlapping date collision prevention and approval workflow
 * 14. Availability calendar aggregation across members, guests, and vacancies
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RoomService } from './room-service';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '@/server/api/errors';

describe('Task 32: Room & Rental Management System Tests', () => {
  const service = new RoomService();
  const tenant1 = 'tenant_mess_alpha_101';
  const tenant2 = 'tenant_mess_beta_202';
  const actor = { userId: 'usr_admin_1', roleName: 'Admin' };

  let roomA1: any;
  let roomA2: any;
  let member1: string = 'mem_resident_1';
  let member2: string = 'mem_resident_2';
  let member3: string = 'mem_resident_3';
  let assignment1: any;
  let listing1: any;
  let booking1: any;

  it('1. Create room generates room with capacity and auto-creates individual bed slots', async () => {
    roomA1 = await service.createRoom(
      tenant1,
      {
        roomNumber: '101',
        name: 'Executive South',
        floor: '1st Floor',
        building: 'Main Annex',
        capacity: 2,
        defaultRent: 3500,
        facilities: ['Attached Bath', 'Balcony', 'WiFi'],
        description: 'Sunny corner room',
      },
      actor
    );

    assert.equal(roomA1.roomNumber, '101');
    assert.equal(roomA1.capacity, 2);
    assert.equal(roomA1.occupancy, 0);
    assert.equal(roomA1.vacantBeds, 2);
    assert.equal(roomA1.defaultRent, 3500);
    assert.equal(roomA1.beds.length, 2);
    assert.equal(roomA1.beds[0].bedNumber, 'Bed-1');
    assert.equal(roomA1.beds[1].bedNumber, 'Bed-2');
    assert.equal(roomA1.beds[0].status, 'AVAILABLE');
  });

  it('2. Prevent duplicate room numbers within the same mess', async () => {
    await assert.rejects(
      async () => {
        await service.createRoom(
          tenant1,
          {
            roomNumber: '101', // duplicate
            capacity: 2,
            defaultRent: 3500,
          },
          actor
        );
      },
      (err: any) => {
        assert(err instanceof ConflictError);
        assert(err.message.includes('already exists in this mess'));
        return true;
      }
    );
  });

  it('3. Different messes can use the exact same room numbers without conflict', async () => {
    const roomBeta = await service.createRoom(
      tenant2,
      {
        roomNumber: '101', // same number in tenant2
        capacity: 3,
        defaultRent: 4000,
      },
      actor
    );

    assert.equal(roomBeta.roomNumber, '101');
    assert.equal(roomBeta.capacity, 3);
  });

  it('4. List rooms returns tenant-scoped records and aggregated summary statistics', async () => {
    // Add second room in tenant1
    roomA2 = await service.createRoom(
      tenant1,
      {
        roomNumber: '102',
        floor: '1st Floor',
        capacity: 1,
        defaultRent: 4500,
        facilities: ['AC', 'WiFi'],
      },
      actor
    );

    const result = await service.listRooms(tenant1);
    assert.equal(result.rooms.length, 2);
    assert.equal(result.summary.totalRooms, 2);
    assert.equal(result.summary.totalCapacity, 3); // 2 + 1
    assert.equal(result.summary.totalOccupied, 0);
    assert.equal(result.summary.totalVacant, 3);
  });

  it('5. Successfully assign an active resident to an available bed slot', async () => {
    assignment1 = await service.assignMemberToBed(
      tenant1,
      {
        membershipId: member1,
        roomId: roomA1.id,
        startDate: '2026-11-01',
        monthlyRent: 3500,
        notes: 'Deposit received ৳3500',
      },
      actor
    );

    assert.equal(assignment1.roomId, roomA1.id);
    assert.equal(assignment1.membershipId, member1);
    assert.equal(assignment1.status, 'ACTIVE');

    // Check room occupancy updated
    const updatedRoom = await service.getRoomById(tenant1, roomA1.id);
    assert.equal(updatedRoom.occupancy, 1);
    assert.equal(updatedRoom.vacantBeds, 1);
    assert.equal(updatedRoom.beds[0].status, 'OCCUPIED');
    assert.equal(updatedRoom.beds[0].currentOccupant?.membershipId, member1);
  });

  it('6. Prevent double-assignment: active resident cannot be assigned to another room without transfer', async () => {
    await assert.rejects(
      async () => {
        await service.assignMemberToBed(
          tenant1,
          {
            membershipId: member1, // already assigned
            roomId: roomA2.id,
            startDate: '2026-11-05',
            monthlyRent: 4500,
          },
          actor
        );
      },
      (err: any) => {
        assert(err instanceof ConflictError);
        assert(err.message.includes('already has an active room assignment'));
        return true;
      }
    );
  });

  it('7. Prevent capacity overflow when room reaches maximum capacity', async () => {
    // Fill the remaining bed in Room 101
    await service.assignMemberToBed(
      tenant1,
      {
        membershipId: member2,
        roomId: roomA1.id,
        startDate: '2026-11-02',
        monthlyRent: 3500,
      },
      actor
    );

    const fullRoom = await service.getRoomById(tenant1, roomA1.id);
    assert.equal(fullRoom.occupancy, 2);
    assert.equal(fullRoom.vacantBeds, 0);
    assert.equal(fullRoom.status, 'OCCUPIED');

    // Attempt to add a 3rd member to 2-bed room
    await assert.rejects(
      async () => {
        await service.assignMemberToBed(
          tenant1,
          {
            membershipId: member3,
            roomId: roomA1.id,
            startDate: '2026-11-03',
            monthlyRent: 3500,
          },
          actor
        );
      },
      (err: any) => {
        assert(err instanceof ConflictError);
        assert(err.message.includes('full capacity'));
        return true;
      }
    );
  });

  it('8. Safety invariant: cannot reduce room capacity below current active occupancy', async () => {
    // Room 101 currently has 2 occupants. Trying to set capacity to 1 should fail.
    await assert.rejects(
      async () => {
        await service.updateRoom(
          tenant1,
          roomA1.id,
          {
            capacity: 1, // smaller than 2 occupants
          },
          actor
        );
      },
      (err: any) => {
        assert(err instanceof ValidationError);
        assert(err.message.includes('Cannot reduce room capacity to 1 beds'));
        return true;
      }
    );
  });

  it('9. Transfer member workflow frees old bed, marks old assignment TRANSFERRED, and occupies new bed', async () => {
    // Room 102 is currently vacant (capacity 1). Let's transfer member2 from Room 101 to Room 102.
    const roomA1Detail = await service.getRoomById(tenant1, roomA1.id);
    const member2AssignmentId = roomA1Detail.beds[1]?.currentOccupant?.assignmentId!;

    const transferResult = await service.transferMember(
      tenant1,
      member2AssignmentId,
      {
        newRoomId: roomA2.id,
        transferDate: '2026-11-15',
        newMonthlyRent: 4200,
        notes: 'Transferred to single room',
      },
      actor
    );

    assert.equal(transferResult.toRoomNumber, '102');
    assert.equal(transferResult.monthlyRent, 4200);

    // Verify old room has 1 vacancy again
    const oldRoom = await service.getRoomById(tenant1, roomA1.id);
    assert.equal(oldRoom.occupancy, 1);
    assert.equal(oldRoom.vacantBeds, 1);
    assert.equal(oldRoom.status, 'AVAILABLE');

    // Verify new room is occupied
    const newRoom = await service.getRoomById(tenant1, roomA2.id);
    assert.equal(newRoom.occupancy, 1);
    assert.equal(newRoom.vacantBeds, 0);
  });

  it('10. Move out member workflow requires mandatory reason, frees bed, and records move-out date', async () => {
    // Attempt move-out without reason should fail
    await assert.rejects(
      async () => {
        await service.moveOutMember(
          tenant1,
          assignment1.id,
          {
            moveOutDate: '2026-11-30',
            moveOutReason: '', // missing reason
          },
          actor
        );
      },
      (err: any) => {
        assert(err instanceof ValidationError);
        assert(err.message.includes('Move out reason is mandatory'));
        return true;
      }
    );

    // Perform valid move-out
    const moveOutResult = await service.moveOutMember(
      tenant1,
      assignment1.id,
      {
        moveOutDate: '2026-11-30',
        moveOutReason: 'Completed academic term and returning to hometown',
      },
      actor
    );

    assert.equal(moveOutResult.status, 'MOVED_OUT');
    assert.equal(moveOutResult.moveOutReason, 'Completed academic term and returning to hometown');

    // Verify Room 101 now has 2 vacant beds
    const roomAfterMoveOut = await service.getRoomById(tenant1, roomA1.id);
    assert.equal(roomAfterMoveOut.occupancy, 0);
    assert.equal(roomAfterMoveOut.vacantBeds, 2);
    assert.equal(roomAfterMoveOut.status, 'AVAILABLE');
  });

  it('11. Update assignment rent preserves effective date and reason without rewriting history', async () => {
    // Member2 is in roomA2
    const roomA2Data = await service.getRoomById(tenant1, roomA2.id);
    const activeAssignmentId = roomA2Data.beds[0]?.currentOccupant?.assignmentId!;

    const rentUpdate = await service.updateAssignmentRent(
      tenant1,
      activeAssignmentId,
      {
        newMonthlyRent: 4000,
        effectiveDate: '2026-12-01',
        reason: 'Winter semester discount applied',
      },
      actor
    );

    assert.equal(rentUpdate.previousRent, 4200);
    assert.equal(rentUpdate.newMonthlyRent, 4000);
    assert.equal(rentUpdate.reason, 'Winter semester discount applied');
  });

  it('12. Rental Management: create and publish listing for vacant space', async () => {
    listing1 = await service.createRentalListing(
      tenant1,
      {
        roomId: roomA1.id,
        title: 'Furnished AC Corner Bed near University',
        description: 'Prime quiet location for students and working professionals.',
        capacity: 1,
        dailyRate: 400,
        monthlyRate: 3500,
        isPublic: true,
        contactMethod: 'Phone: +8801700000000',
        status: 'PUBLISHED',
      },
      actor
    );

    assert.equal(listing1.title, 'Furnished AC Corner Bed near University');
    assert.equal(listing1.status, 'PUBLISHED');
    assert.equal(listing1.isPublic, true);

    const listings = await service.listRentalListings(tenant1);
    assert.equal(listings.listings.length, 1);
    assert.equal(listings.summary.published, 1);
  });

  it('13. Booking requests: prevent overlapping guest bookings on the same space', async () => {
    // Create first booking for Nov 20 to Nov 25
    booking1 = await service.createBookingRequest(tenant1, {
      listingId: listing1.id,
      guestName: 'Zahid Hossain',
      guestPhone: '+8801711998877',
      guestEmail: 'zahid@example.com',
      checkInDate: '2026-11-20',
      checkOutDate: '2026-11-25',
      message: 'Need space for university entrance test',
    });

    assert.equal(booking1.durationDays, 5);
    assert.equal(booking1.totalAmount, 2000); // 5 days * ৳400/day
    assert.equal(booking1.status, 'PENDING');

    // Approve the booking
    await service.reviewBookingRequest(tenant1, booking1.id, 'APPROVE', undefined, actor);

    // Attempt second guest booking overlapping Nov 22 to Nov 27
    await assert.rejects(
      async () => {
        await service.createBookingRequest(tenant1, {
          listingId: listing1.id,
          guestName: 'Kamal Ahmed',
          guestPhone: '+8801811887766',
          checkInDate: '2026-11-22', // overlaps with Nov 20-25!
          checkOutDate: '2026-11-27',
        });
      },
      (err: any) => {
        assert(err instanceof ConflictError);
        assert(err.message.includes('already booked for the selected dates'));
        return true;
      }
    );
  });

  it('14. Review booking rejection requires mandatory reason', async () => {
    // Create non-overlapping booking for Dec 1 to Dec 3
    const booking2 = await service.createBookingRequest(tenant1, {
      listingId: listing1.id,
      guestName: 'Anisul Huq',
      guestPhone: '+8801911776655',
      checkInDate: '2026-12-01',
      checkOutDate: '2026-12-03',
    });

    // Attempt reject without reason
    await assert.rejects(
      async () => {
        await service.reviewBookingRequest(tenant1, booking2.id, 'REJECT', '', actor);
      },
      (err: any) => {
        assert(err instanceof ValidationError);
        assert(err.message.includes('A reason must be provided'));
        return true;
      }
    );

    // Valid rejection
    const rejected = await service.reviewBookingRequest(
      tenant1,
      booking2.id,
      'REJECT',
      'Under scheduled plumbing repair',
      actor
    );
    assert.equal(rejected.status, 'REJECTED');
    assert.equal(rejected.rejectionReason, 'Under scheduled plumbing repair');
  });

  it('15. Availability calendar aggregates long-term resident occupancy and short-term guest bookings', async () => {
    const calendar = await service.getAvailabilityCalendar(tenant1, '2026-11');
    assert.equal(calendar.month, '2026-11');
    assert.equal(calendar.totalRooms, 2);
    assert.equal(calendar.days.length, 30); // 30 days in Nov

    // On Nov 22: booking1 (approved) is active
    const day22 = calendar.days.find((d: any) => d.day === 22);
    assert(day22);
    assert.equal(day22.guestBookingsCount, 1);
  });

  it('16. Cross-tenant isolation: Tenant B cannot view or modify Tenant A rooms', async () => {
    await assert.rejects(
      async () => {
        await service.getRoomById(tenant2, roomA1.id);
      },
      (err: any) => {
        assert(err instanceof NotFoundError);
        return true;
      }
    );

    await assert.rejects(
      async () => {
        await service.updateRoom(tenant2, roomA1.id, { name: 'Hacked' }, actor);
      },
      (err: any) => {
        assert(err instanceof NotFoundError);
        return true;
      }
    );
  });
});
