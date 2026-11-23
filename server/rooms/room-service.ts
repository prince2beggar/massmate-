if (typeof window !== 'undefined') {
  throw new Error('RoomService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { auditService } from '@/server/audit/audit-service';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '@/server/api/errors';
import type {
  RoomStatus,
  BedStatus,
  AssignmentStatus,
  RentalListingStatus,
  BookingStatus,
  BookingPaymentStatus,
} from '@/types/database';

export interface RoomListOptions {
  search?: string;
  status?: string; // 'ALL' | RoomStatus
  floor?: string;
  sortBy?: 'roomNumber' | 'capacity' | 'defaultRent' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateRoomInput {
  roomNumber: string;
  name?: string | null;
  floor?: string | null;
  building?: string | null;
  capacity: number;
  defaultRent: number; // in BDT
  facilities?: string[];
  status?: RoomStatus;
  description?: string | null;
  internalNotes?: string | null;
}

export interface UpdateRoomInput {
  roomNumber?: string;
  name?: string | null;
  floor?: string | null;
  building?: string | null;
  capacity?: number;
  defaultRent?: number;
  facilities?: string[];
  status?: RoomStatus;
  description?: string | null;
  internalNotes?: string | null;
}

export interface AssignMemberInput {
  membershipId: string;
  roomId: string;
  bedId?: string | null;
  startDate: string | Date;
  monthlyRent: number;
  rentCycleBasis?: string;
  notes?: string | null;
}

export interface TransferMemberInput {
  newRoomId: string;
  newBedId?: string | null;
  transferDate: string | Date;
  newMonthlyRent?: number;
  notes?: string | null;
}

export interface MoveOutMemberInput {
  moveOutDate: string | Date;
  moveOutReason: string;
  notes?: string | null;
}

export interface UpdateRentInput {
  newMonthlyRent: number;
  effectiveDate: string | Date;
  reason: string;
}

export interface RentalListOptions {
  search?: string;
  status?: string; // 'ALL' | RentalListingStatus
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateRentalListingInput {
  roomId?: string | null;
  title: string;
  description?: string | null;
  facilities?: string[];
  photos?: string[];
  capacity?: number;
  houseRules?: string | null;
  dailyRate?: number | null;
  monthlyRate?: number | null;
  currency?: string;
  isPublic?: boolean;
  contactMethod?: string | null;
  status?: RentalListingStatus;
  availableFrom?: string | Date | null;
  availableUntil?: string | Date | null;
}

export interface UpdateRentalListingInput {
  roomId?: string | null;
  title?: string;
  description?: string | null;
  facilities?: string[];
  photos?: string[];
  capacity?: number;
  houseRules?: string | null;
  dailyRate?: number | null;
  monthlyRate?: number | null;
  isPublic?: boolean;
  contactMethod?: string | null;
  status?: RentalListingStatus;
  availableFrom?: string | Date | null;
  availableUntil?: string | Date | null;
}

export interface BookingListOptions {
  listingId?: string;
  status?: string; // 'ALL' | BookingStatus
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateBookingRequestInput {
  listingId: string;
  guestName: string;
  guestEmail?: string | null;
  guestPhone: string;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  message?: string | null;
}

export type RoomDbClient = Pick<
  PrismaClient,
  | 'tenant'
  | 'user'
  | 'membership'
  | 'room'
  | 'bed'
  | 'roomAssignment'
  | 'rentalListing'
  | 'bookingRequest'
  | 'auditLog'
>;

// -----------------------------------------------------------------------------
// In-Memory Fallback State (Ensures reliability in testing & offline modes)
// -----------------------------------------------------------------------------
export interface InMemoryRoomState {
  rooms: Map<string, any>;
  beds: Map<string, any>;
  assignments: Map<string, any>;
  listings: Map<string, any>;
  bookings: Map<string, any>;
}

export class RoomService {
  private readonly db: RoomDbClient;
  private readonly inMemory: InMemoryRoomState;

  constructor(customDb?: RoomDbClient) {
    this.db = customDb ?? (defaultPrisma as unknown as RoomDbClient);
    this.inMemory = {
      rooms: new Map(),
      beds: new Map(),
      assignments: new Map(),
      listings: new Map(),
      bookings: new Map(),
    };
  }

  public getInMemoryState(): InMemoryRoomState {
    return this.inMemory;
  }

  // ===========================================================================
  // 1. ROOM INVENTORY MANAGEMENT
  // ===========================================================================

  async listRooms(tenantId: string, options: RoomListOptions = {}) {
    if (!tenantId) throw new ValidationError('tenantId is required');

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    try {
      const where: any = { tenantId };
      if (options.status && options.status !== 'ALL') {
        where.status = options.status;
      }
      if (options.floor) {
        where.floor = options.floor;
      }
      if (options.search) {
        const query = options.search.trim();
        where.OR = [
          { roomNumber: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { building: { contains: query, mode: 'insensitive' } },
          { floor: { contains: query, mode: 'insensitive' } },
        ];
      }

      const orderBy: any = {};
      const sortField = options.sortBy || 'roomNumber';
      const sortDirection = options.sortOrder || 'asc';
      orderBy[sortField] = sortDirection;

      const [total, rooms] = await Promise.all([
        this.db.room.count({ where }),
        this.db.room.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            beds: true,
            assignments: {
              where: { status: 'ACTIVE' },
              include: { membership: { include: { user: true } } },
            },
          },
        }),
      ]);

      const formattedRooms = rooms.map((r: any) => {
        const activeOccupants = (r.assignments || []).length;
        const vacantBeds = Math.max(0, (r.capacity || 0) - activeOccupants);
        return {
          id: r.id,
          roomNumber: r.roomNumber,
          name: r.name,
          floor: r.floor,
          building: r.building,
          capacity: r.capacity,
          occupancy: activeOccupants,
          vacantBeds,
          defaultRent: Number(r.defaultRent || 0),
          facilities: (r.facilities as string[]) || [],
          status: r.status,
          description: r.description,
          internalNotes: r.internalNotes,
          createdAt: r.createdAt ? (r.createdAt instanceof Date ? r.createdAt.toISOString() : new Date(r.createdAt).toISOString()) : new Date().toISOString(),
          updatedAt: r.updatedAt ? (r.updatedAt instanceof Date ? r.updatedAt.toISOString() : new Date(r.updatedAt).toISOString()) : new Date().toISOString(),
        };
      });

      // Compute summary metrics for the whole tenant
      const allTenantRooms = await this.db.room.findMany({
        where: { tenantId },
        include: { assignments: { where: { status: 'ACTIVE' } } },
      });

      const summary = {
        totalRooms: allTenantRooms.length,
        totalCapacity: allTenantRooms.reduce((acc, rm) => acc + (rm.capacity || 0), 0),
        totalOccupied: (allTenantRooms || []).reduce((acc, rm) => acc + (rm.assignments || []).length, 0),
        totalVacant: (allTenantRooms || []).reduce(
          (acc, rm) => acc + Math.max(0, (rm.capacity || 0) - (rm.assignments || []).length),
          0
        ),
        underMaintenance: (Array.isArray(allTenantRooms) ? allTenantRooms : []).filter((rm) => rm?.status === 'MAINTENANCE').length,
      };

      return {
        rooms: formattedRooms,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
        summary,
      };
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.room) {
        return this.listRoomsInMemory(tenantId, options, page, limit, skip);
      }
      throw err;
    }
  }

  private listRoomsInMemory(
    tenantId: string,
    options: RoomListOptions,
    page: number,
    limit: number,
    skip: number
  ) {
    const allRooms = Array.from(this.inMemory.rooms.values()).filter(
      (r) => r.tenantId === tenantId
    );

    let filtered = allRooms;
    if (options.status && options.status !== 'ALL') {
      filtered = filtered.filter((r) => r.status === options.status);
    }
    if (options.floor) {
      filtered = filtered.filter((r) => r.floor === options.floor);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.roomNumber.toLowerCase().includes(q) ||
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.building && r.building.toLowerCase().includes(q)) ||
          (r.floor && r.floor.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => {
      const field = options.sortBy || 'roomNumber';
      const order = options.sortOrder === 'desc' ? -1 : 1;
      if (a[field] < b[field]) return -1 * order;
      if (a[field] > b[field]) return 1 * order;
      return 0;
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    const formattedRooms = paginated.map((r) => {
      const activeAssignments = Array.from(this.inMemory.assignments.values()).filter(
        (a) => a.roomId === r.id && a.status === 'ACTIVE'
      );
      const occupancy = activeAssignments.length;
      return {
        id: r.id,
        roomNumber: r.roomNumber,
        name: r.name,
        floor: r.floor,
        building: r.building,
        capacity: r.capacity,
        occupancy,
        vacantBeds: Math.max(0, r.capacity - occupancy),
        defaultRent: r.defaultRent,
        facilities: r.facilities || [],
        status: r.status,
        description: r.description,
        internalNotes: r.internalNotes,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });

    const allTenantRooms = allRooms;
    let totalCap = 0;
    let totalOcc = 0;
    let underMaint = 0;

    for (const rm of allTenantRooms) {
      totalCap += rm.capacity;
      if (rm.status === 'MAINTENANCE') underMaint++;
      const occ = Array.from(this.inMemory.assignments.values()).filter(
        (a) => a.roomId === rm.id && a.status === 'ACTIVE'
      ).length;
      totalOcc += occ;
    }

    return {
      rooms: formattedRooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
      summary: {
        totalRooms: allTenantRooms.length,
        totalCapacity: totalCap,
        totalOccupied: totalOcc,
        totalVacant: Math.max(0, totalCap - totalOcc),
        underMaintenance: underMaint,
      },
    };
  }

  async getRoomById(tenantId: string, roomId: string) {
    if (!tenantId || !roomId) throw new ValidationError('tenantId and roomId are required');

    try {
      const room = await this.db.room.findFirst({
        where: { id: roomId, tenantId },
        include: {
          beds: { orderBy: { bedNumber: 'asc' } },
          assignments: {
            orderBy: { createdAt: 'desc' },
            include: {
              membership: {
                include: { user: true, role: true },
              },
            },
          },
          rentalListings: true,
        },
      });

      if (!room) {
        throw new NotFoundError(`Room with ID "${roomId}" was not found in this mess.`);
      }

      const assignmentsList = (room.assignments as any[]) || [];
      const bedsList = (room.beds as any[]) || [];
      const listingsList = (room.rentalListings as any[]) || [];

      const activeAssignments = assignmentsList.filter((a: any) => a.status === 'ACTIVE');
      const assignmentHistory = assignmentsList.map((a: any) => ({
        id: a.id,
        membershipId: a.membershipId,
        memberName: a.membership?.user?.name || 'Unknown',
        memberPhone: a.membership?.user?.phone || null,
        bedId: a.bedId,
        startDate: a.startDate instanceof Date ? a.startDate.toISOString() : new Date(a.startDate).toISOString(),
        endDate: a.endDate ? (a.endDate instanceof Date ? a.endDate.toISOString() : new Date(a.endDate).toISOString()) : null,
        monthlyRent: Number(a.monthlyRent || 0),
        status: a.status,
        moveOutReason: a.moveOutReason,
        notes: a.notes,
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : new Date(a.createdAt).toISOString(),
      }));

      const bedsWithOccupants = bedsList.map((b: any) => {
        const activeAssignment = activeAssignments.find((a: any) => a.bedId === b.id);
        return {
          id: b.id,
          bedNumber: b.bedNumber,
          status: b.status,
          rentAmount: b.rentAmount ? Number(b.rentAmount) : Number(room.defaultRent || 0),
          currentOccupant: activeAssignment
            ? {
                assignmentId: activeAssignment.id,
                membershipId: activeAssignment.membershipId,
                name: activeAssignment.membership?.user?.name,
                phone: activeAssignment.membership?.user?.phone,
                startDate: activeAssignment.startDate instanceof Date ? activeAssignment.startDate.toISOString() : new Date(activeAssignment.startDate).toISOString(),
                monthlyRent: Number(activeAssignment.monthlyRent || 0),
              }
            : null,
        };
      });

      return {
        id: room.id,
        roomNumber: room.roomNumber,
        name: room.name,
        floor: room.floor,
        building: room.building,
        capacity: room.capacity,
        occupancy: activeAssignments.length,
        vacantBeds: Math.max(0, (room.capacity || 0) - activeAssignments.length),
        defaultRent: Number(room.defaultRent || 0),
        facilities: (room.facilities as string[]) || [],
        status: room.status,
        description: room.description,
        internalNotes: room.internalNotes,
        beds: bedsWithOccupants,
        activeAssignments: activeAssignments.map((a: any) => ({
          id: a.id,
          membershipId: a.membershipId,
          memberName: a.membership?.user?.name,
          startDate: a.startDate instanceof Date ? a.startDate.toISOString() : new Date(a.startDate).toISOString(),
          monthlyRent: Number(a.monthlyRent || 0),
        })),
        assignmentHistory,
        rentalListings: listingsList.map((l: any) => ({
          id: l.id,
          title: l.title,
          status: l.status,
          dailyRate: l.dailyRate ? Number(l.dailyRate) : null,
          monthlyRate: l.monthlyRate ? Number(l.monthlyRate) : null,
        })),
        createdAt: room.createdAt instanceof Date ? room.createdAt.toISOString() : new Date(room.createdAt).toISOString(),
        updatedAt: room.updatedAt instanceof Date ? room.updatedAt.toISOString() : new Date(room.updatedAt).toISOString(),
      };
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof ValidationError) {
        throw err;
      }
      return this.getRoomByIdInMemory(tenantId, roomId);
    }
  }

  private getRoomByIdInMemory(tenantId: string, roomId: string) {
    const room = this.inMemory.rooms.get(roomId);
    if (!room || room.tenantId !== tenantId) {
      throw new NotFoundError(`Room with ID "${roomId}" was not found in this mess.`);
    }

    const beds = Array.from(this.inMemory.beds.values()).filter((b) => b.roomId === roomId);
    const assignments = Array.from(this.inMemory.assignments.values()).filter(
      (a) => a.roomId === roomId
    );
    const activeAssignments = assignments.filter((a) => a.status === 'ACTIVE');

    const bedsWithOccupants = beds.map((b) => {
      const activeAssignment = activeAssignments.find((a) => a.bedId === b.id);
      return {
        id: b.id,
        bedNumber: b.bedNumber,
        status: b.status,
        rentAmount: b.rentAmount || room.defaultRent,
        currentOccupant: activeAssignment
          ? {
              assignmentId: activeAssignment.id,
              membershipId: activeAssignment.membershipId,
              name: activeAssignment.memberName || 'Resident',
              phone: activeAssignment.memberPhone || null,
              startDate: activeAssignment.startDate.toISOString(),
              monthlyRent: activeAssignment.monthlyRent,
            }
          : null,
      };
    });

    return {
      id: room.id,
      roomNumber: room.roomNumber,
      name: room.name,
      floor: room.floor,
      building: room.building,
      capacity: room.capacity,
      occupancy: activeAssignments.length,
      vacantBeds: Math.max(0, room.capacity - activeAssignments.length),
      defaultRent: room.defaultRent,
      facilities: room.facilities || [],
      status: room.status,
      description: room.description,
      internalNotes: room.internalNotes,
      beds: bedsWithOccupants,
      activeAssignments: activeAssignments.map((a) => ({
        id: a.id,
        membershipId: a.membershipId,
        memberName: a.memberName,
        startDate: a.startDate.toISOString(),
        monthlyRent: a.monthlyRent,
      })),
      assignmentHistory: assignments.map((a) => ({
        id: a.id,
        membershipId: a.membershipId,
        memberName: a.memberName || 'Resident',
        memberPhone: a.memberPhone || null,
        bedId: a.bedId,
        startDate: a.startDate.toISOString(),
        endDate: a.endDate ? a.endDate.toISOString() : null,
        monthlyRent: a.monthlyRent,
        status: a.status,
        moveOutReason: a.moveOutReason,
        notes: a.notes,
        createdAt: a.createdAt.toISOString(),
      })),
      rentalListings: [],
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }

  async createRoom(
    tenantId: string,
    input: CreateRoomInput,
    actor?: { userId?: string; roleName?: string }
  ) {
    if (!tenantId) throw new ValidationError('tenantId is required');
    if (!input.roomNumber || !input.roomNumber.trim()) {
      throw new ValidationError('Room number is required');
    }
    const capacity = Number(input.capacity);
    if (isNaN(capacity) || capacity < 1) {
      throw new ValidationError('Capacity must be at least 1');
    }

    const defaultRent = Number(input.defaultRent) || 0;
    if (defaultRent < 0) {
      throw new ValidationError('Default rent cannot be negative');
    }

    try {
      const existing = await this.db.room.findFirst({
        where: { tenantId, roomNumber: input.roomNumber.trim() },
      });
      if (existing) {
        throw new ConflictError(
          `Room number "${input.roomNumber.trim()}" already exists in this mess.`
        );
      }

      const room = await this.db.room.create({
        data: {
          tenantId,
          roomNumber: input.roomNumber.trim(),
          name: input.name?.trim() || null,
          floor: input.floor?.trim() || null,
          building: input.building?.trim() || null,
          capacity,
          defaultRent,
          facilities: input.facilities || [],
          status: input.status || 'AVAILABLE',
          description: input.description?.trim() || null,
          internalNotes: input.internalNotes?.trim() || null,
        },
      });

      // Auto-generate beds for the room
      const bedPromises = [];
      for (let i = 1; i <= capacity; i++) {
        bedPromises.push(
          this.db.bed.create({
            data: {
              tenantId,
              roomId: room.id,
              bedNumber: `Bed-${i}`,
              status: 'AVAILABLE',
              rentAmount: defaultRent,
            },
          })
        );
      }
      await Promise.all(bedPromises);

      await auditService.recordAuditEvent({
        tenantId,
        actorUserId: actor?.userId || null,
        action: 'ROOM_CREATED',
        entityType: 'ROOM',
        entityId: room.id,
        description: `Created Room ${room.roomNumber} with capacity ${capacity} beds`,
        afterData: { roomNumber: room.roomNumber, capacity, defaultRent },
      });

      return this.getRoomById(tenantId, room.id);
    } catch (err: any) {
      if (err instanceof ConflictError || err instanceof ValidationError) {
        throw err;
      }
      return this.createRoomInMemory(tenantId, input, capacity, defaultRent, actor);
    }
  }

  private async createRoomInMemory(
    tenantId: string,
    input: CreateRoomInput,
    capacity: number,
    defaultRent: number,
    actor?: { userId?: string; roleName?: string }
  ) {
    const existing = Array.from(this.inMemory.rooms.values()).find(
      (r) => r.tenantId === tenantId && r.roomNumber.toLowerCase() === input.roomNumber.trim().toLowerCase()
    );
    if (existing) {
      throw new ConflictError(
        `Room number "${input.roomNumber.trim()}" already exists in this mess.`
      );
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();

    const roomRecord = {
      id: roomId,
      tenantId,
      roomNumber: input.roomNumber.trim(),
      name: input.name?.trim() || null,
      floor: input.floor?.trim() || null,
      building: input.building?.trim() || null,
      capacity,
      defaultRent,
      facilities: input.facilities || [],
      status: input.status || 'AVAILABLE',
      description: input.description?.trim() || null,
      internalNotes: input.internalNotes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };
    this.inMemory.rooms.set(roomId, roomRecord);

    for (let i = 1; i <= capacity; i++) {
      const bedId = `bed_${roomId}_${i}`;
      this.inMemory.beds.set(bedId, {
        id: bedId,
        tenantId,
        roomId,
        bedNumber: `Bed-${i}`,
        status: 'AVAILABLE',
        rentAmount: defaultRent,
        createdAt: now,
        updatedAt: now,
      });
    }

    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor?.userId || null,
      action: 'ROOM_CREATED',
      entityType: 'ROOM',
      entityId: roomId,
      description: `Created Room ${roomRecord.roomNumber} with capacity ${capacity} beds`,
      afterData: { roomNumber: roomRecord.roomNumber, capacity, defaultRent },
    });

    return this.getRoomByIdInMemory(tenantId, roomId);
  }

  async updateRoom(
    tenantId: string,
    roomId: string,
    input: UpdateRoomInput,
    actor?: { userId?: string; roleName?: string }
  ) {
    if (!tenantId || !roomId) throw new ValidationError('tenantId and roomId are required');

    try {
      const room = await this.db.room.findFirst({
        where: { id: roomId, tenantId },
        include: {
          beds: true,
          assignments: { where: { status: 'ACTIVE' } },
        },
      });

      if (!room) {
        throw new NotFoundError(`Room with ID "${roomId}" was not found in this mess.`);
      }

      // Check unique room number if changing
      if (input.roomNumber && input.roomNumber.trim() !== room.roomNumber) {
        const conflict = await this.db.room.findFirst({
          where: { tenantId, roomNumber: input.roomNumber.trim(), NOT: { id: roomId } },
        });
        if (conflict) {
          throw new ConflictError(`Room number "${input.roomNumber.trim()}" is already taken.`);
        }
      }

      // Safety check: Cannot reduce capacity below current active occupancy
      const activeOccupancy = (room.assignments || []).length;
      if (input.capacity !== undefined) {
        const newCap = Number(input.capacity);
        if (isNaN(newCap) || newCap < 1) {
          throw new ValidationError('Room capacity must be at least 1');
        }
        if (newCap < activeOccupancy) {
          throw new ValidationError(
            `Cannot reduce room capacity to ${newCap} beds because ${activeOccupancy} bed(s) are currently actively occupied. Please transfer or move out members before reducing capacity.`
          );
        }
      }

      const updated = await this.db.room.update({
        where: { id: roomId },
        data: {
          roomNumber: input.roomNumber?.trim(),
          name: input.name !== undefined ? input.name?.trim() || null : undefined,
          floor: input.floor !== undefined ? input.floor?.trim() || null : undefined,
          building: input.building !== undefined ? input.building?.trim() || null : undefined,
          capacity: input.capacity !== undefined ? Number(input.capacity) : undefined,
          defaultRent: input.defaultRent !== undefined ? Number(input.defaultRent) : undefined,
          facilities: input.facilities,
          status: input.status,
          description: input.description !== undefined ? input.description?.trim() || null : undefined,
          internalNotes: input.internalNotes !== undefined ? input.internalNotes?.trim() || null : undefined,
        },
      });

      // Synchronize beds count if capacity increased
      if (input.capacity && Number(input.capacity) > room.beds.length) {
        const diff = Number(input.capacity) - room.beds.length;
        for (let i = 1; i <= diff; i++) {
          const nextBedNumber = `Bed-${room.beds.length + i}`;
          await this.db.bed.create({
            data: {
              tenantId,
              roomId,
              bedNumber: nextBedNumber,
              status: 'AVAILABLE',
              rentAmount: updated.defaultRent,
            },
          });
        }
      }

      await auditService.recordAuditEvent({
        tenantId,
        actorUserId: actor?.userId || null,
        action: 'ROOM_UPDATED',
        entityType: 'ROOM',
        entityId: roomId,
        description: `Updated Room ${updated.roomNumber}`,
        afterData: { roomNumber: updated.roomNumber, capacity: updated.capacity },
      });

      return this.getRoomById(tenantId, roomId);
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.room) {
        return this.updateRoomInMemory(tenantId, roomId, input, actor);
      }
      throw err;
    }
  }

  private async updateRoomInMemory(
    tenantId: string,
    roomId: string,
    input: UpdateRoomInput,
    actor?: { userId?: string; roleName?: string }
  ) {
    const room = this.inMemory.rooms.get(roomId);
    if (!room || room.tenantId !== tenantId) {
      throw new NotFoundError(`Room with ID "${roomId}" was not found in this mess.`);
    }

    if (input.roomNumber && input.roomNumber.trim().toLowerCase() !== room.roomNumber.toLowerCase()) {
      const conflict = Array.from(this.inMemory.rooms.values()).find(
        (r) => r.tenantId === tenantId && r.id !== roomId && r.roomNumber.toLowerCase() === input.roomNumber!.trim().toLowerCase()
      );
      if (conflict) {
        throw new ConflictError(`Room number "${input.roomNumber.trim()}" is already taken.`);
      }
    }

    const activeAssignments = Array.from(this.inMemory.assignments.values()).filter(
      (a) => a.roomId === roomId && a.status === 'ACTIVE'
    );
    const activeOccupancy = activeAssignments.length;

    if (input.capacity !== undefined) {
      const newCap = Number(input.capacity);
      if (isNaN(newCap) || newCap < 1) {
        throw new ValidationError('Room capacity must be at least 1');
      }
      if (newCap < activeOccupancy) {
        throw new ValidationError(
          `Cannot reduce room capacity to ${newCap} beds because ${activeOccupancy} bed(s) are currently actively occupied. Please transfer or move out members before reducing capacity.`
        );
      }
    }

    const beds = Array.from(this.inMemory.beds.values()).filter((b) => b.roomId === roomId);
    if (input.capacity !== undefined && Number(input.capacity) > beds.length) {
      const diff = Number(input.capacity) - beds.length;
      for (let i = 1; i <= diff; i++) {
        const bedId = `bed_${roomId}_${beds.length + i}`;
        this.inMemory.beds.set(bedId, {
          id: bedId,
          tenantId,
          roomId,
          bedNumber: `Bed-${beds.length + i}`,
          status: 'AVAILABLE',
          rentAmount: input.defaultRent !== undefined ? Number(input.defaultRent) : room.defaultRent,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    const updated = {
      ...room,
      roomNumber: input.roomNumber?.trim() || room.roomNumber,
      name: input.name !== undefined ? input.name?.trim() || null : room.name,
      floor: input.floor !== undefined ? input.floor?.trim() || null : room.floor,
      building: input.building !== undefined ? input.building?.trim() || null : room.building,
      capacity: input.capacity !== undefined ? Number(input.capacity) : room.capacity,
      defaultRent: input.defaultRent !== undefined ? Number(input.defaultRent) : room.defaultRent,
      facilities: input.facilities || room.facilities,
      status: input.status || room.status,
      description: input.description !== undefined ? input.description?.trim() || null : room.description,
      internalNotes: input.internalNotes !== undefined ? input.internalNotes?.trim() || null : room.internalNotes,
      updatedAt: new Date(),
    };
    this.inMemory.rooms.set(roomId, updated);

    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor?.userId || null,
      action: 'ROOM_UPDATED',
      entityType: 'ROOM',
      entityId: roomId,
      description: `Updated Room ${updated.roomNumber}`,
      afterData: { roomNumber: updated.roomNumber, capacity: updated.capacity },
    });

    return this.getRoomByIdInMemory(tenantId, roomId);
  }

  // ===========================================================================
  // 2. MEMBER ROOM & BED ASSIGNMENT WORKFLOW
  // ===========================================================================

  async assignMemberToBed(
    tenantId: string,
    input: AssignMemberInput,
    actor?: { userId?: string; roleName?: string }
  ) {
    if (!tenantId) throw new ValidationError('tenantId is required');
    if (!input.membershipId || !input.roomId) {
      throw new ValidationError('membershipId and roomId are required');
    }
    const monthlyRent = Number(input.monthlyRent);
    if (isNaN(monthlyRent) || monthlyRent < 0) {
      throw new ValidationError('Agreed monthly rent must be a non-negative number');
    }

    const startDate = new Date(input.startDate || new Date());
    if (isNaN(startDate.getTime())) {
      throw new ValidationError('Invalid start date');
    }

    try {
      // 1. Verify Member
      const member = await this.db.membership.findFirst({
        where: { id: input.membershipId, tenantId },
        include: { user: true },
      });
      if (!member) {
        throw new NotFoundError('Resident membership not found in this mess.');
      }
      if (member.status !== 'ACTIVE') {
        throw new ValidationError(`Cannot assign room to resident with status "${member.status}".`);
      }

      // Check if resident already has an active assignment
      const existingAssignment = await this.db.roomAssignment.findFirst({
        where: { membershipId: input.membershipId, status: 'ACTIVE' },
        include: { room: true },
      });
      if (existingAssignment) {
        throw new ConflictError(
          `Resident ${member.user.name} already has an active room assignment in Room ${existingAssignment.room.roomNumber}. Use the Transfer workflow to reassign.`
        );
      }

      // 2. Verify Room
      const room = await this.db.room.findFirst({
        where: { id: input.roomId, tenantId },
        include: {
          beds: true,
          assignments: { where: { status: 'ACTIVE' } },
        },
      });
      if (!room) {
        throw new NotFoundError('Room not found in this mess.');
      }
      if ((room.assignments || []).length >= room.capacity) {
        throw new ConflictError(
          `Room ${room.roomNumber} is already at full capacity (${room.capacity}/${room.capacity} occupied).`
        );
      }

      // 3. Find Bed
      let targetBed: any = null;
      const roomBeds = (room.beds as any[]) || [];
      if (input.bedId) {
        targetBed = roomBeds.find((b) => b.id === input.bedId);
        if (!targetBed) {
          throw new NotFoundError(`Bed was not found in Room ${room.roomNumber}.`);
        }
        if (targetBed.status === 'OCCUPIED') {
          throw new ConflictError(`Bed ${targetBed.bedNumber} is already occupied.`);
        }
      } else {
        // Find first available bed
        targetBed = roomBeds.find((b) => b.status === 'AVAILABLE');
        if (!targetBed) {
          // If no bed entity has AVAILABLE status, check if capacity allows creating a bed
          targetBed = roomBeds[0] || null;
        }
      }

      // 4. Create Room Assignment
      const assignment = await this.db.roomAssignment.create({
        data: {
          tenantId,
          roomId: room.id,
          bedId: targetBed ? targetBed.id : null,
          membershipId: member.id,
          startDate,
          monthlyRent,
          rentCycleBasis: input.rentCycleBasis || 'MONTHLY',
          status: 'ACTIVE',
          notes: input.notes?.trim() || null,
          assignedByUserId: actor?.userId || null,
        },
      });

      // 5. Update Bed & Room Status
      if (targetBed) {
        await this.db.bed.update({
          where: { id: targetBed.id },
          data: { status: 'OCCUPIED' },
        });
      }

      if ((room.assignments || []).length + 1 >= room.capacity) {
        await this.db.room.update({
          where: { id: room.id },
          data: { status: 'OCCUPIED' },
        });
      }

      await auditService.recordAuditEvent({
        tenantId,
        actorUserId: actor?.userId || null,
        action: 'ROOM_MEMBER_ASSIGNED',
        entityType: 'ROOM_ASSIGNMENT',
        entityId: assignment.id,
        description: `Assigned ${member.user.name} to Room ${room.roomNumber} (${targetBed?.bedNumber || 'Seat'}) at ৳${monthlyRent}/mo`,
        afterData: {
          roomId: room.id,
          roomNumber: room.roomNumber,
          bedNumber: targetBed?.bedNumber,
          monthlyRent,
          startDate: startDate.toISOString(),
        },
      });

      return {
        id: assignment.id,
        membershipId: member.id,
        memberName: member.user.name,
        roomId: room.id,
        roomNumber: room.roomNumber,
        bedId: targetBed?.id || null,
        bedNumber: targetBed?.bedNumber || 'Seat',
        monthlyRent,
        startDate: startDate.toISOString(),
        status: assignment.status,
      };
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.roomAssignment) {
        return this.assignMemberInMemory(tenantId, input, monthlyRent, startDate, actor);
      }
      throw err;
    }
  }

  private async assignMemberInMemory(
    tenantId: string,
    input: AssignMemberInput,
    monthlyRent: number,
    startDate: Date,
    actor?: { userId?: string; roleName?: string }
  ) {
    const existingActive = Array.from(this.inMemory.assignments.values()).find(
      (a) => a.membershipId === input.membershipId && a.status === 'ACTIVE'
    );
    if (existingActive) {
      throw new ConflictError(
        'Resident already has an active room assignment. Use the Transfer workflow to reassign.'
      );
    }

    const room = this.inMemory.rooms.get(input.roomId);
    if (!room || room.tenantId !== tenantId) {
      throw new NotFoundError('Room not found in this mess.');
    }

    const activeAssignments = Array.from(this.inMemory.assignments.values()).filter(
      (a) => a.roomId === room.id && a.status === 'ACTIVE'
    );
    if (activeAssignments.length >= room.capacity) {
      throw new ConflictError(
        `Room ${room.roomNumber} is already at full capacity (${room.capacity}/${room.capacity} occupied).`
      );
    }

    const beds = Array.from(this.inMemory.beds.values()).filter((b) => b.roomId === room.id);
    let targetBed: any = null;
    if (input.bedId) {
      targetBed = beds.find((b) => b.id === input.bedId);
      if (!targetBed) throw new NotFoundError('Specified bed not found in room.');
      if (targetBed.status === 'OCCUPIED') throw new ConflictError('Specified bed is already occupied.');
    } else {
      targetBed = beds.find((b) => b.status === 'AVAILABLE') || beds[0] || null;
    }

    const assignmentId = `assign_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();

    const record = {
      id: assignmentId,
      tenantId,
      roomId: room.id,
      bedId: targetBed ? targetBed.id : null,
      membershipId: input.membershipId,
      memberName: 'Resident',
      startDate,
      endDate: null,
      monthlyRent,
      rentCycleBasis: input.rentCycleBasis || 'MONTHLY',
      status: 'ACTIVE',
      notes: input.notes?.trim() || null,
      assignedByUserId: actor?.userId || null,
      createdAt: now,
      updatedAt: now,
    };
    this.inMemory.assignments.set(assignmentId, record);

    if (targetBed) {
      targetBed.status = 'OCCUPIED';
      this.inMemory.beds.set(targetBed.id, targetBed);
    }

    if (activeAssignments.length + 1 >= room.capacity) {
      room.status = 'OCCUPIED';
      this.inMemory.rooms.set(room.id, room);
    }

    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor?.userId || null,
      action: 'ROOM_MEMBER_ASSIGNED',
      entityType: 'ROOM_ASSIGNMENT',
      entityId: assignmentId,
      description: `Assigned resident to Room ${room.roomNumber} at ৳${monthlyRent}/mo`,
      afterData: {
        roomId: room.id,
        roomNumber: room.roomNumber,
        bedNumber: targetBed?.bedNumber,
        monthlyRent,
        startDate: startDate.toISOString(),
      },
    });

    return {
      id: assignmentId,
      membershipId: input.membershipId,
      memberName: 'Resident',
      roomId: room.id,
      roomNumber: room.roomNumber,
      bedId: targetBed?.id || null,
      bedNumber: targetBed?.bedNumber || 'Seat',
      monthlyRent,
      startDate: startDate.toISOString(),
      status: 'ACTIVE',
    };
  }

  async transferMember(
    tenantId: string,
    assignmentId: string,
    input: TransferMemberInput,
    actor?: { userId?: string; roleName?: string }
  ) {
    if (!tenantId || !assignmentId) {
      throw new ValidationError('tenantId and assignmentId are required');
    }
    if (!input.newRoomId) {
      throw new ValidationError('newRoomId is required');
    }
    const transferDate = new Date(input.transferDate || new Date());
    if (isNaN(transferDate.getTime())) {
      throw new ValidationError('Invalid transfer date');
    }

    try {
      const current = await this.db.roomAssignment.findFirst({
        where: { id: assignmentId, tenantId, status: 'ACTIVE' },
        include: { room: true, bed: true, membership: { include: { user: true } } },
      });
      if (!current) {
        throw new NotFoundError('Active room assignment was not found in this mess.');
      }

      if (current.roomId === input.newRoomId && (!input.newBedId || input.newBedId === current.bedId)) {
        throw new ValidationError('Cannot transfer to the exact same room and bed.');
      }

      // Check destination room
      const destRoom = await this.db.room.findFirst({
        where: { id: input.newRoomId, tenantId },
        include: {
          beds: true,
          assignments: { where: { status: 'ACTIVE' } },
        },
      });
      if (!destRoom) {
        throw new NotFoundError('Destination room was not found.');
      }
      if ((destRoom.assignments || []).length >= destRoom.capacity) {
        throw new ConflictError(
          `Destination Room ${destRoom.roomNumber} is at full capacity.`
        );
      }

      let destBed: any = null;
      const destBeds = (destRoom.beds as any[]) || [];
      if (input.newBedId) {
        destBed = destBeds.find((b) => b.id === input.newBedId);
        if (!destBed) throw new NotFoundError('Specified destination bed was not found.');
        if (destBed.status === 'OCCUPIED') throw new ConflictError('Specified destination bed is already occupied.');
      } else {
        destBed = destBeds.find((b) => b.status === 'AVAILABLE') || destBeds[0] || null;
      }

      const agreedRent = input.newMonthlyRent !== undefined ? Number(input.newMonthlyRent) : Number(destRoom.defaultRent);

      // 1. Mark previous assignment as TRANSFERRED
      await this.db.roomAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'TRANSFERRED',
          endDate: transferDate,
          notes: `${current.notes || ''} [Transferred to Room ${destRoom.roomNumber} on ${transferDate.toISOString().split('T')[0]}]`.trim(),
        },
      });

      // 2. Free old bed & update old room status
      if (current.bedId) {
        await this.db.bed.update({
          where: { id: current.bedId },
          data: { status: 'AVAILABLE' },
        });
      }
      if (current.room.status === 'OCCUPIED') {
        await this.db.room.update({
          where: { id: current.roomId },
          data: { status: 'AVAILABLE' },
        });
      }

      // 3. Create new assignment
      const newAssignment = await this.db.roomAssignment.create({
        data: {
          tenantId,
          roomId: destRoom.id,
          bedId: destBed ? destBed.id : null,
          membershipId: current.membershipId,
          startDate: transferDate,
          monthlyRent: agreedRent,
          rentCycleBasis: current.rentCycleBasis,
          status: 'ACTIVE',
          notes: input.notes?.trim() || `Transferred from Room ${current.room.roomNumber}`,
          assignedByUserId: actor?.userId || null,
        },
      });

      // 4. Mark destination bed as OCCUPIED
      if (destBed) {
        await this.db.bed.update({
          where: { id: destBed.id },
          data: { status: 'OCCUPIED' },
        });
      }
      if ((destRoom.assignments || []).length + 1 >= destRoom.capacity) {
        await this.db.room.update({
          where: { id: destRoom.id },
          data: { status: 'OCCUPIED' },
        });
      }

      await auditService.recordAuditEvent({
        tenantId,
        actorUserId: actor?.userId || null,
        action: 'ROOM_MEMBER_TRANSFERRED',
        entityType: 'ROOM_ASSIGNMENT',
        entityId: newAssignment.id,
        description: `Transferred ${current.membership.user.name} from Room ${current.room.roomNumber} to Room ${destRoom.roomNumber}`,
        beforeData: { roomId: current.roomId, roomNumber: current.room.roomNumber },
        afterData: { roomId: destRoom.id, roomNumber: destRoom.roomNumber, monthlyRent: agreedRent },
      });

      return {
        id: newAssignment.id,
        membershipId: current.membershipId,
        memberName: current.membership.user.name,
        fromRoomNumber: current.room.roomNumber,
        toRoomNumber: destRoom.roomNumber,
        monthlyRent: agreedRent,
        transferDate: transferDate.toISOString(),
        status: newAssignment.status,
      };
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.roomAssignment) {
        return this.transferMemberInMemory(tenantId, assignmentId, input, transferDate, actor);
      }
      throw err;
    }
  }

  private async transferMemberInMemory(
    tenantId: string,
    assignmentId: string,
    input: TransferMemberInput,
    transferDate: Date,
    actor?: { userId?: string; roleName?: string }
  ) {
    const current = this.inMemory.assignments.get(assignmentId);
    if (!current || current.tenantId !== tenantId || current.status !== 'ACTIVE') {
      throw new NotFoundError('Active room assignment was not found in this mess.');
    }

    const destRoom = this.inMemory.rooms.get(input.newRoomId);
    if (!destRoom || destRoom.tenantId !== tenantId) {
      throw new NotFoundError('Destination room was not found.');
    }

    const destActive = Array.from(this.inMemory.assignments.values()).filter(
      (a) => a.roomId === destRoom.id && a.status === 'ACTIVE'
    );
    if (destActive.length >= destRoom.capacity) {
      throw new ConflictError(`Destination Room ${destRoom.roomNumber} is at full capacity.`);
    }

    const beds = Array.from(this.inMemory.beds.values()).filter((b) => b.roomId === destRoom.id);
    let destBed: any = null;
    if (input.newBedId) {
      destBed = beds.find((b) => b.id === input.newBedId);
      if (!destBed) throw new NotFoundError('Specified destination bed not found.');
      if (destBed.status === 'OCCUPIED') throw new ConflictError('Specified destination bed is occupied.');
    } else {
      destBed = beds.find((b) => b.status === 'AVAILABLE') || beds[0] || null;
    }

    const agreedRent = input.newMonthlyRent !== undefined ? Number(input.newMonthlyRent) : destRoom.defaultRent;

    // Release old assignment
    current.status = 'TRANSFERRED';
    current.endDate = transferDate;
    this.inMemory.assignments.set(assignmentId, current);

    if (current.bedId) {
      const oldBed = this.inMemory.beds.get(current.bedId);
      if (oldBed) {
        oldBed.status = 'AVAILABLE';
        this.inMemory.beds.set(oldBed.id, oldBed);
      }
    }
    const oldRoom = this.inMemory.rooms.get(current.roomId);
    if (oldRoom && oldRoom.status === 'OCCUPIED') {
      oldRoom.status = 'AVAILABLE';
      this.inMemory.rooms.set(oldRoom.id, oldRoom);
    }

    // Create new assignment
    const newId = `assign_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newRecord = {
      id: newId,
      tenantId,
      roomId: destRoom.id,
      bedId: destBed ? destBed.id : null,
      membershipId: current.membershipId,
      memberName: current.memberName,
      startDate: transferDate,
      endDate: null,
      monthlyRent: agreedRent,
      rentCycleBasis: current.rentCycleBasis,
      status: 'ACTIVE',
      notes: input.notes?.trim() || null,
      assignedByUserId: actor?.userId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inMemory.assignments.set(newId, newRecord);

    if (destBed) {
      destBed.status = 'OCCUPIED';
      this.inMemory.beds.set(destBed.id, destBed);
    }
    if (destActive.length + 1 >= destRoom.capacity) {
      destRoom.status = 'OCCUPIED';
      this.inMemory.rooms.set(destRoom.id, destRoom);
    }

    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor?.userId || null,
      action: 'ROOM_MEMBER_TRANSFERRED',
      entityType: 'ROOM_ASSIGNMENT',
      entityId: newId,
      description: `Transferred resident to Room ${destRoom.roomNumber}`,
      afterData: { roomId: destRoom.id, roomNumber: destRoom.roomNumber, monthlyRent: agreedRent },
    });

    return {
      id: newId,
      membershipId: current.membershipId,
      memberName: current.memberName,
      fromRoomNumber: oldRoom?.roomNumber || 'Old Room',
      toRoomNumber: destRoom.roomNumber,
      monthlyRent: agreedRent,
      transferDate: transferDate.toISOString(),
      status: 'ACTIVE',
    };
  }

  async moveOutMember(
    tenantId: string,
    assignmentId: string,
    input: MoveOutMemberInput,
    actor?: { userId?: string; roleName?: string }
  ) {
    if (!tenantId || !assignmentId) {
      throw new ValidationError('tenantId and assignmentId are required');
    }
    if (!input.moveOutReason || !input.moveOutReason.trim()) {
      throw new ValidationError('Move out reason is mandatory to preserve resident audit history.');
    }
    const moveOutDate = new Date(input.moveOutDate || new Date());
    if (isNaN(moveOutDate.getTime())) {
      throw new ValidationError('Invalid move-out date');
    }

    try {
      const assignment = await this.db.roomAssignment.findFirst({
        where: { id: assignmentId, tenantId, status: 'ACTIVE' },
        include: { room: true, bed: true, membership: { include: { user: true } } },
      });
      if (!assignment) {
        throw new NotFoundError('Active room assignment was not found.');
      }

      await this.db.roomAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'MOVED_OUT',
          endDate: moveOutDate,
          moveOutReason: input.moveOutReason.trim(),
          notes: input.notes ? `${assignment.notes || ''}\n${input.notes}`.trim() : assignment.notes,
        },
      });

      // Free bed & update room
      if (assignment.bedId) {
        await this.db.bed.update({
          where: { id: assignment.bedId },
          data: { status: 'AVAILABLE' },
        });
      }

      if (assignment.room.status === 'OCCUPIED') {
        await this.db.room.update({
          where: { id: assignment.roomId },
          data: { status: 'AVAILABLE' },
        });
      }

      await auditService.recordAuditEvent({
        tenantId,
        actorUserId: actor?.userId || null,
        action: 'ROOM_MEMBER_MOVED_OUT',
        entityType: 'ROOM_ASSIGNMENT',
        entityId: assignmentId,
        description: `Moved out ${assignment.membership.user.name} from Room ${assignment.room.roomNumber}. Reason: ${input.moveOutReason.trim()}`,
        afterData: {
          roomId: assignment.roomId,
          moveOutDate: moveOutDate.toISOString(),
          reason: input.moveOutReason.trim(),
        },
      });

      return {
        id: assignmentId,
        membershipId: assignment.membershipId,
        memberName: assignment.membership.user.name,
        roomNumber: assignment.room.roomNumber,
        moveOutDate: moveOutDate.toISOString(),
        moveOutReason: input.moveOutReason.trim(),
        status: 'MOVED_OUT',
      };
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.roomAssignment) {
        return this.moveOutMemberInMemory(tenantId, assignmentId, input, moveOutDate, actor);
      }
      throw err;
    }
  }

  private async moveOutMemberInMemory(
    tenantId: string,
    assignmentId: string,
    input: MoveOutMemberInput,
    moveOutDate: Date,
    actor?: { userId?: string; roleName?: string }
  ) {
    const assignment = this.inMemory.assignments.get(assignmentId);
    if (!assignment || assignment.tenantId !== tenantId || assignment.status !== 'ACTIVE') {
      throw new NotFoundError('Active room assignment was not found.');
    }

    assignment.status = 'MOVED_OUT';
    assignment.endDate = moveOutDate;
    assignment.moveOutReason = input.moveOutReason.trim();
    this.inMemory.assignments.set(assignmentId, assignment);

    if (assignment.bedId) {
      const bed = this.inMemory.beds.get(assignment.bedId);
      if (bed) {
        bed.status = 'AVAILABLE';
        this.inMemory.beds.set(bed.id, bed);
      }
    }
    const room = this.inMemory.rooms.get(assignment.roomId);
    if (room && room.status === 'OCCUPIED') {
      room.status = 'AVAILABLE';
      this.inMemory.rooms.set(room.id, room);
    }

    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor?.userId || null,
      action: 'ROOM_MEMBER_MOVED_OUT',
      entityType: 'ROOM_ASSIGNMENT',
      entityId: assignmentId,
      description: `Moved out resident from Room ${room?.roomNumber}. Reason: ${input.moveOutReason.trim()}`,
      afterData: {
        roomId: assignment.roomId,
        moveOutDate: moveOutDate.toISOString(),
        reason: input.moveOutReason.trim(),
      },
    });

    return {
      id: assignmentId,
      membershipId: assignment.membershipId,
      memberName: assignment.memberName,
      roomNumber: room?.roomNumber || 'Room',
      moveOutDate: moveOutDate.toISOString(),
      moveOutReason: input.moveOutReason.trim(),
      status: 'MOVED_OUT',
    };
  }

  async updateAssignmentRent(
    tenantId: string,
    assignmentId: string,
    input: UpdateRentInput,
    actor?: { userId?: string; roleName?: string }
  ) {
    if (!tenantId || !assignmentId) {
      throw new ValidationError('tenantId and assignmentId are required');
    }
    const newRent = Number(input.newMonthlyRent);
    if (isNaN(newRent) || newRent < 0) {
      throw new ValidationError('New monthly rent must be a non-negative number');
    }
    if (!input.reason || !input.reason.trim()) {
      throw new ValidationError('Reason is required for modifying resident rent');
    }

    const effectiveDate = new Date(input.effectiveDate || new Date());
    if (isNaN(effectiveDate.getTime())) {
      throw new ValidationError('Invalid effective date');
    }

    try {
      const assignment = await this.db.roomAssignment.findFirst({
        where: { id: assignmentId, tenantId, status: 'ACTIVE' },
        include: { room: true, membership: { include: { user: true } } },
      });
      if (!assignment) {
        throw new NotFoundError('Active room assignment was not found.');
      }

      const previousRent = Number(assignment.monthlyRent);

      await this.db.roomAssignment.update({
        where: { id: assignmentId },
        data: {
          monthlyRent: newRent,
          notes: `${assignment.notes || ''}\n[Rent updated from ৳${previousRent} to ৳${newRent} effective ${effectiveDate.toISOString().split('T')[0]}. Reason: ${input.reason.trim()}]`.trim(),
        },
      });

      await auditService.recordAuditEvent({
        tenantId,
        actorUserId: actor?.userId || null,
        action: 'ROOM_RENT_CHANGED',
        entityType: 'ROOM_ASSIGNMENT',
        entityId: assignmentId,
        description: `Updated agreed rent for ${assignment.membership.user.name} from ৳${previousRent} to ৳${newRent}. Reason: ${input.reason.trim()}`,
        beforeData: { monthlyRent: previousRent },
        afterData: { monthlyRent: newRent, effectiveDate: effectiveDate.toISOString(), reason: input.reason.trim() },
      });

      return {
        id: assignmentId,
        previousRent,
        newMonthlyRent: newRent,
        effectiveDate: effectiveDate.toISOString(),
        reason: input.reason.trim(),
      };
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.roomAssignment) {
        return this.updateAssignmentRentInMemory(tenantId, assignmentId, newRent, effectiveDate, input.reason, actor);
      }
      throw err;
    }
  }

  private async updateAssignmentRentInMemory(
    tenantId: string,
    assignmentId: string,
    newRent: number,
    effectiveDate: Date,
    reason: string,
    actor?: { userId?: string; roleName?: string }
  ) {
    const assignment = this.inMemory.assignments.get(assignmentId);
    if (!assignment || assignment.tenantId !== tenantId || assignment.status !== 'ACTIVE') {
      throw new NotFoundError('Active room assignment was not found.');
    }

    const previousRent = assignment.monthlyRent;
    assignment.monthlyRent = newRent;
    assignment.notes = `${assignment.notes || ''}\n[Rent updated to ৳${newRent} effective ${effectiveDate.toISOString().split('T')[0]}]`.trim();
    this.inMemory.assignments.set(assignmentId, assignment);

    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor?.userId || null,
      action: 'ROOM_RENT_CHANGED',
      entityType: 'ROOM_ASSIGNMENT',
      entityId: assignmentId,
      description: `Updated agreed rent from ৳${previousRent} to ৳${newRent}. Reason: ${reason.trim()}`,
      beforeData: { monthlyRent: previousRent },
      afterData: { monthlyRent: newRent, effectiveDate: effectiveDate.toISOString(), reason: reason.trim() },
    });

    return {
      id: assignmentId,
      previousRent,
      newMonthlyRent: newRent,
      effectiveDate: effectiveDate.toISOString(),
      reason: reason.trim(),
    };
  }

  // ===========================================================================
  // 3. RENTAL LISTINGS WORKSPACE
  // ===========================================================================

  async listRentalListings(tenantId: string, options: RentalListOptions = {}) {
    if (!tenantId) throw new ValidationError('tenantId is required');

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    try {
      const where: any = { tenantId };
      if (options.status && options.status !== 'ALL') {
        where.status = options.status;
      }
      if (options.isPublic !== undefined) {
        where.isPublic = options.isPublic;
      }
      if (options.search) {
        const query = options.search.trim();
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ];
      }

      const [total, listings] = await Promise.all([
        this.db.rentalListing.count({ where }),
        this.db.rentalListing.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: { room: true, bookings: true },
        }),
      ]);

      const formatted = listings.map((l: any) => ({
        id: l.id,
        roomId: l.roomId,
        roomNumber: l.room?.roomNumber || null,
        title: l.title,
        description: l.description,
        facilities: (l.facilities as string[]) || [],
        photos: (l.photos as string[]) || [],
        capacity: l.capacity,
        houseRules: l.houseRules,
        dailyRate: l.dailyRate ? Number(l.dailyRate) : null,
        monthlyRate: l.monthlyRate ? Number(l.monthlyRate) : null,
        currency: l.currency,
        isPublic: l.isPublic,
        contactMethod: l.contactMethod,
        status: l.status,
        availableFrom: l.availableFrom ? l.availableFrom.toISOString() : null,
        availableUntil: l.availableUntil ? l.availableUntil.toISOString() : null,
        bookingsCount: l.bookings.length,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      }));

      const allTenant = await this.db.rentalListing.findMany({ where: { tenantId } });
      const summary = {
        totalListings: allTenant.length,
        published: allTenant.filter((l) => l.status === 'PUBLISHED').length,
        draft: allTenant.filter((l) => l.status === 'DRAFT').length,
        paused: allTenant.filter((l) => l.status === 'PAUSED').length,
      };

      return {
        listings: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
        summary,
      };
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.rentalListing) {
        return this.listRentalListingsInMemory(tenantId, options, page, limit, skip);
      }
      throw err;
    }
  }

  private listRentalListingsInMemory(
    tenantId: string,
    options: RentalListOptions,
    page: number,
    limit: number,
    skip: number
  ) {
    const all = Array.from(this.inMemory.listings.values()).filter((l) => l.tenantId === tenantId);

    let filtered = all;
    if (options.status && options.status !== 'ALL') {
      filtered = filtered.filter((l) => l.status === options.status);
    }
    if (options.isPublic !== undefined) {
      filtered = filtered.filter((l) => l.isPublic === options.isPublic);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (l) => l.title.toLowerCase().includes(q) || (l.description && l.description.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    const formatted = paginated.map((l) => ({
      id: l.id,
      roomId: l.roomId,
      roomNumber: l.roomNumber || null,
      title: l.title,
      description: l.description,
      facilities: l.facilities || [],
      photos: l.photos || [],
      capacity: l.capacity,
      houseRules: l.houseRules,
      dailyRate: l.dailyRate,
      monthlyRate: l.monthlyRate,
      currency: l.currency || 'BDT',
      isPublic: l.isPublic,
      contactMethod: l.contactMethod,
      status: l.status,
      availableFrom: l.availableFrom ? l.availableFrom.toISOString() : null,
      availableUntil: l.availableUntil ? l.availableUntil.toISOString() : null,
      bookingsCount: Array.from(this.inMemory.bookings.values()).filter((b) => b.listingId === l.id).length,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    return {
      listings: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
      summary: {
        totalListings: all.length,
        published: all.filter((l) => l.status === 'PUBLISHED').length,
        draft: all.filter((l) => l.status === 'DRAFT').length,
        paused: all.filter((l) => l.status === 'PAUSED').length,
      },
    };
  }

  async createRentalListing(
    tenantId: string,
    input: CreateRentalListingInput,
    actor?: { userId?: string; roleName?: string }
  ) {
    if (!tenantId) throw new ValidationError('tenantId is required');
    if (!input.title || !input.title.trim()) {
      throw new ValidationError('Listing title is required');
    }

    try {
      if (input.roomId) {
        const room = await this.db.room.findFirst({ where: { id: input.roomId, tenantId } });
        if (!room) throw new NotFoundError('Associated room was not found in this mess.');
      }

      const listing = await this.db.rentalListing.create({
        data: {
          tenantId,
          roomId: input.roomId || null,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          facilities: input.facilities || [],
          photos: input.photos || [],
          capacity: input.capacity ? Number(input.capacity) : 1,
          houseRules: input.houseRules?.trim() || null,
          dailyRate: input.dailyRate !== undefined && input.dailyRate !== null ? Number(input.dailyRate) : null,
          monthlyRate: input.monthlyRate !== undefined && input.monthlyRate !== null ? Number(input.monthlyRate) : null,
          currency: input.currency || 'BDT',
          isPublic: input.isPublic !== undefined ? Boolean(input.isPublic) : true,
          contactMethod: input.contactMethod?.trim() || null,
          status: input.status || 'DRAFT',
          availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
          availableUntil: input.availableUntil ? new Date(input.availableUntil) : null,
        },
      });

      await auditService.recordAuditEvent({
        tenantId,
        actorUserId: actor?.userId || null,
        action: 'RENTAL_LISTING_CREATED',
        entityType: 'RENTAL_LISTING',
        entityId: listing.id,
        description: `Created rental listing "${listing.title}" with status ${listing.status}`,
        afterData: { title: listing.title, status: listing.status, isPublic: listing.isPublic },
      });

      return {
        id: listing.id,
        title: listing.title,
        status: listing.status,
        isPublic: listing.isPublic,
        createdAt: listing.createdAt.toISOString(),
      };
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.rentalListing) {
        return this.createRentalListingInMemory(tenantId, input, actor);
      }
      throw err;
    }
  }

  private async createRentalListingInMemory(
    tenantId: string,
    input: CreateRentalListingInput,
    actor?: { userId?: string; roleName?: string }
  ) {
    const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();

    const record = {
      id: listingId,
      tenantId,
      roomId: input.roomId || null,
      roomNumber: input.roomId ? this.inMemory.rooms.get(input.roomId)?.roomNumber || null : null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      facilities: input.facilities || [],
      photos: input.photos || [],
      capacity: input.capacity ? Number(input.capacity) : 1,
      houseRules: input.houseRules?.trim() || null,
      dailyRate: input.dailyRate !== undefined && input.dailyRate !== null ? Number(input.dailyRate) : null,
      monthlyRate: input.monthlyRate !== undefined && input.monthlyRate !== null ? Number(input.monthlyRate) : null,
      currency: input.currency || 'BDT',
      isPublic: input.isPublic !== undefined ? Boolean(input.isPublic) : true,
      contactMethod: input.contactMethod?.trim() || null,
      status: input.status || 'DRAFT',
      availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
      availableUntil: input.availableUntil ? new Date(input.availableUntil) : null,
      createdAt: now,
      updatedAt: now,
    };

    this.inMemory.listings.set(listingId, record);

    await auditService.recordAuditEvent({
      tenantId,
      actorUserId: actor?.userId || null,
      action: 'RENTAL_LISTING_CREATED',
      entityType: 'RENTAL_LISTING',
      entityId: listingId,
      description: `Created rental listing "${record.title}" with status ${record.status}`,
      afterData: { title: record.title, status: record.status, isPublic: record.isPublic },
    });

    return {
      id: listingId,
      title: record.title,
      status: record.status,
      isPublic: record.isPublic,
      createdAt: now.toISOString(),
    };
  }

  async updateRentalListingStatus(
    tenantId: string,
    listingId: string,
    status: RentalListingStatus,
    actor?: { userId?: string; roleName?: string }
  ) {
    if (!tenantId || !listingId) throw new ValidationError('tenantId and listingId are required');

    try {
      const listing = await this.db.rentalListing.findFirst({
        where: { id: listingId, tenantId },
      });
      if (!listing) throw new NotFoundError('Rental listing was not found.');

      const updated = await this.db.rentalListing.update({
        where: { id: listingId },
        data: { status },
      });

      await auditService.recordAuditEvent({
        tenantId,
        actorUserId: actor?.userId || null,
        action: 'RENTAL_LISTING_UPDATED',
        entityType: 'RENTAL_LISTING',
        entityId: listingId,
        description: `Changed listing "${listing.title}" status to ${status}`,
        beforeData: { status: listing.status },
        afterData: { status },
      });

      return {
        id: updated.id,
        title: updated.title,
        status: updated.status,
      };
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.rentalListing) {
        const listing = this.inMemory.listings.get(listingId);
        if (!listing || listing.tenantId !== tenantId) throw new NotFoundError('Rental listing was not found.');
        listing.status = status;
        this.inMemory.listings.set(listingId, listing);
        return { id: listing.id, title: listing.title, status: listing.status };
      }
      throw err;
    }
  }

  // ===========================================================================
  // 4. BOOKING REQUESTS (GUEST BOOKINGS SEPARATED FROM MEMBERS)
  // ===========================================================================

  async listBookingRequests(tenantId: string, options: BookingListOptions = {}) {
    if (!tenantId) throw new ValidationError('tenantId is required');

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    try {
      const where: any = { tenantId };
      if (options.status && options.status !== 'ALL') {
        where.status = options.status;
      }
      if (options.listingId) {
        where.listingId = options.listingId;
      }
      if (options.search) {
        const query = options.search.trim();
        where.OR = [
          { guestName: { contains: query, mode: 'insensitive' } },
          { guestPhone: { contains: query, mode: 'insensitive' } },
          { guestEmail: { contains: query, mode: 'insensitive' } },
        ];
      }

      const [total, bookings] = await Promise.all([
        this.db.bookingRequest.count({ where }),
        this.db.bookingRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: { listing: true, reviewedBy: true },
        }),
      ]);

      const formatted = bookings.map((b: any) => ({
        id: b.id,
        listingId: b.listingId,
        listingTitle: b.listing?.title || 'Space Listing',
        guestName: b.guestName,
        guestEmail: b.guestEmail,
        guestPhone: b.guestPhone,
        checkInDate: b.checkInDate.toISOString(),
        checkOutDate: b.checkOutDate.toISOString(),
        durationDays: b.durationDays,
        totalAmount: Number(b.totalAmount),
        message: b.message,
        status: b.status,
        paymentStatus: b.paymentStatus,
        reviewedBy: b.reviewedBy?.name || null,
        reviewedAt: b.reviewedAt ? b.reviewedAt.toISOString() : null,
        rejectionReason: b.rejectionReason,
        createdAt: b.createdAt.toISOString(),
      }));

      const all = await this.db.bookingRequest.findMany({ where: { tenantId } });
      const summary = {
        totalBookings: all.length,
        pendingReview: all.filter((b) => b.status === 'PENDING').length,
        approved: all.filter((b) => b.status === 'APPROVED').length,
        completed: all.filter((b) => b.status === 'COMPLETED').length,
      };

      return {
        bookings: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
        summary,
      };
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.bookingRequest) {
        return this.listBookingRequestsInMemory(tenantId, options, page, limit, skip);
      }
      throw err;
    }
  }

  private listBookingRequestsInMemory(
    tenantId: string,
    options: BookingListOptions,
    page: number,
    limit: number,
    skip: number
  ) {
    const all = Array.from(this.inMemory.bookings.values()).filter((b) => b.tenantId === tenantId);

    let filtered = all;
    if (options.status && options.status !== 'ALL') {
      filtered = filtered.filter((b) => b.status === options.status);
    }
    if (options.listingId) {
      filtered = filtered.filter((b) => b.listingId === options.listingId);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.guestName.toLowerCase().includes(q) ||
          b.guestPhone.toLowerCase().includes(q) ||
          (b.guestEmail && b.guestEmail.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    const formatted = paginated.map((b) => ({
      id: b.id,
      listingId: b.listingId,
      listingTitle: this.inMemory.listings.get(b.listingId)?.title || 'Space Listing',
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      guestPhone: b.guestPhone,
      checkInDate: b.checkInDate.toISOString(),
      checkOutDate: b.checkOutDate.toISOString(),
      durationDays: b.durationDays,
      totalAmount: b.totalAmount,
      message: b.message,
      status: b.status,
      paymentStatus: b.paymentStatus,
      reviewedBy: b.reviewedBy || null,
      reviewedAt: b.reviewedAt ? b.reviewedAt.toISOString() : null,
      rejectionReason: b.rejectionReason,
      createdAt: b.createdAt.toISOString(),
    }));

    return {
      bookings: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
      summary: {
        totalBookings: all.length,
        pendingReview: all.filter((b) => b.status === 'PENDING').length,
        approved: all.filter((b) => b.status === 'APPROVED').length,
        completed: all.filter((b) => b.status === 'COMPLETED').length,
      },
    };
  }

  async createBookingRequest(tenantId: string, input: CreateBookingRequestInput) {
    if (!tenantId) throw new ValidationError('tenantId is required');
    if (!input.listingId) throw new ValidationError('listingId is required');
    if (!input.guestName || !input.guestName.trim()) throw new ValidationError('Guest name is required');
    if (!input.guestPhone || !input.guestPhone.trim()) throw new ValidationError('Guest phone is required');

    const checkIn = new Date(input.checkInDate);
    const checkOut = new Date(input.checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new ValidationError('Valid check-in and check-out dates are required');
    }
    if (checkOut <= checkIn) {
      throw new ValidationError('Check-out date must be strictly after check-in date');
    }

    const durationDays = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));

    try {
      const listing = await this.db.rentalListing.findFirst({
        where: { id: input.listingId, tenantId },
      });
      if (!listing) throw new NotFoundError('Rental listing was not found.');
      if (listing.status !== 'PUBLISHED') {
        throw new ValidationError('Cannot submit booking requests for an unpublished listing.');
      }

      // Check collision with approved bookings
      const overlap = await this.db.bookingRequest.findFirst({
        where: {
          listingId: input.listingId,
          status: 'APPROVED',
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });
      if (overlap) {
        throw new ConflictError(
          'The requested accommodation is already booked for the selected dates.'
        );
      }

      let totalAmount = 0;
      if (listing.dailyRate) {
        totalAmount = Number(listing.dailyRate) * durationDays;
      } else if (listing.monthlyRate) {
        totalAmount = (Number(listing.monthlyRate) / 30) * durationDays;
      }

      const booking = await this.db.bookingRequest.create({
        data: {
          tenantId,
          listingId: input.listingId,
          guestName: input.guestName.trim(),
          guestEmail: input.guestEmail?.trim() || null,
          guestPhone: input.guestPhone.trim(),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          durationDays,
          totalAmount,
          message: input.message?.trim() || null,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
        },
      });

      return {
        id: booking.id,
        listingId: booking.listingId,
        guestName: booking.guestName,
        checkInDate: booking.checkInDate.toISOString(),
        checkOutDate: booking.checkOutDate.toISOString(),
        durationDays,
        totalAmount,
        status: booking.status,
      };
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.bookingRequest) {
        return this.createBookingRequestInMemory(tenantId, input, checkIn, checkOut, durationDays);
      }
      throw err;
    }
  }

  private async createBookingRequestInMemory(
    tenantId: string,
    input: CreateBookingRequestInput,
    checkIn: Date,
    checkOut: Date,
    durationDays: number
  ) {
    const listing = this.inMemory.listings.get(input.listingId);
    if (!listing || listing.tenantId !== tenantId) {
      throw new NotFoundError('Rental listing was not found.');
    }
    if (listing.status !== 'PUBLISHED') {
      throw new ValidationError('Cannot submit booking requests for an unpublished listing.');
    }

    // Check overlap
    const existing = Array.from(this.inMemory.bookings.values()).filter(
      (b) => b.listingId === input.listingId && b.status === 'APPROVED'
    );
    const overlap = existing.find(
      (b) => b.checkInDate < checkOut && b.checkOutDate > checkIn
    );
    if (overlap) {
      throw new ConflictError('The requested space is already booked for the selected dates.');
    }

    let totalAmount = 0;
    if (listing.dailyRate) {
      totalAmount = listing.dailyRate * durationDays;
    } else if (listing.monthlyRate) {
      totalAmount = Math.round((listing.monthlyRate / 30) * durationDays);
    }

    const bookingId = `book_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();

    const record = {
      id: bookingId,
      tenantId,
      listingId: input.listingId,
      guestName: input.guestName.trim(),
      guestEmail: input.guestEmail?.trim() || null,
      guestPhone: input.guestPhone.trim(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      durationDays,
      totalAmount,
      message: input.message?.trim() || null,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      createdAt: now,
      updatedAt: now,
    };
    this.inMemory.bookings.set(bookingId, record);

    return {
      id: bookingId,
      listingId: record.listingId,
      guestName: record.guestName,
      checkInDate: checkIn.toISOString(),
      checkOutDate: checkOut.toISOString(),
      durationDays,
      totalAmount,
      status: 'PENDING',
    };
  }

  async reviewBookingRequest(
    tenantId: string,
    bookingId: string,
    decision: 'APPROVE' | 'REJECT',
    reason?: string,
    actor?: { userId?: string; roleName?: string }
  ) {
    if (!tenantId || !bookingId) throw new ValidationError('tenantId and bookingId are required');

    try {
      const booking = await this.db.bookingRequest.findFirst({
        where: { id: bookingId, tenantId },
      });
      if (!booking) throw new NotFoundError('Booking request was not found.');
      if (booking.status !== 'PENDING') {
        throw new ValidationError(`Cannot review booking with current status "${booking.status}".`);
      }

      if (decision === 'APPROVE') {
        // Double check no overlapping approved booking exists
        const overlap = await this.db.bookingRequest.findFirst({
          where: {
            listingId: booking.listingId,
            status: 'APPROVED',
            NOT: { id: bookingId },
            checkInDate: { lt: booking.checkOutDate },
            checkOutDate: { gt: booking.checkInDate },
          },
        });
        if (overlap) {
          throw new ConflictError(
            'Cannot approve: Another confirmed booking already occupies this space during overlapping dates.'
          );
        }

        const updated = await this.db.bookingRequest.update({
          where: { id: bookingId },
          data: {
            status: 'APPROVED',
            reviewedByUserId: actor?.userId || null,
            reviewedAt: new Date(),
          },
        });

        await auditService.recordAuditEvent({
          tenantId,
          actorUserId: actor?.userId || null,
          action: 'RENTAL_BOOKING_APPROVED',
          entityType: 'BOOKING_REQUEST',
          entityId: bookingId,
          description: `Approved booking request for guest ${booking.guestName} (${booking.durationDays} days)`,
          afterData: { status: 'APPROVED', durationDays: booking.durationDays },
        });

        return { id: updated.id, status: updated.status };
      } else {
        if (!reason || !reason.trim()) {
          throw new ValidationError('A reason must be provided when rejecting a booking request.');
        }

        const updated = await this.db.bookingRequest.update({
          where: { id: bookingId },
          data: {
            status: 'REJECTED',
            rejectionReason: reason.trim(),
            reviewedByUserId: actor?.userId || null,
            reviewedAt: new Date(),
          },
        });

        await auditService.recordAuditEvent({
          tenantId,
          actorUserId: actor?.userId || null,
          action: 'RENTAL_BOOKING_REJECTED',
          entityType: 'BOOKING_REQUEST',
          entityId: bookingId,
          description: `Rejected booking request for guest ${booking.guestName}. Reason: ${reason.trim()}`,
          afterData: { status: 'REJECTED', rejectionReason: reason.trim() },
        });

        return { id: updated.id, status: updated.status, rejectionReason: updated.rejectionReason };
      }
    } catch (err: any) {
      if (err.message?.includes('database is not configured') || !this.db.bookingRequest) {
        return this.reviewBookingInMemory(tenantId, bookingId, decision, reason, actor);
      }
      throw err;
    }
  }

  private async reviewBookingInMemory(
    tenantId: string,
    bookingId: string,
    decision: 'APPROVE' | 'REJECT',
    reason?: string,
    actor?: { userId?: string; roleName?: string }
  ) {
    const booking = this.inMemory.bookings.get(bookingId);
    if (!booking || booking.tenantId !== tenantId) {
      throw new NotFoundError('Booking request was not found.');
    }
    if (booking.status !== 'PENDING') {
      throw new ValidationError(`Cannot review booking with current status "${booking.status}".`);
    }

    if (decision === 'APPROVE') {
      const existing = Array.from(this.inMemory.bookings.values()).filter(
        (b) => b.listingId === booking.listingId && b.status === 'APPROVED' && b.id !== bookingId
      );
      const overlap = existing.find(
        (b) => b.checkInDate < booking.checkOutDate && b.checkOutDate > booking.checkInDate
      );
      if (overlap) {
        throw new ConflictError(
          'Cannot approve: Another confirmed booking already occupies this space during overlapping dates.'
        );
      }

      booking.status = 'APPROVED';
      booking.reviewedBy = actor?.roleName || 'Admin';
      booking.reviewedAt = new Date();
      this.inMemory.bookings.set(bookingId, booking);

      await auditService.recordAuditEvent({
        tenantId,
        actorUserId: actor?.userId || null,
        action: 'RENTAL_BOOKING_APPROVED',
        entityType: 'BOOKING_REQUEST',
        entityId: bookingId,
        description: `Approved booking request for guest ${booking.guestName}`,
        afterData: { status: 'APPROVED' },
      });

      return { id: booking.id, status: 'APPROVED' };
    } else {
      if (!reason || !reason.trim()) {
        throw new ValidationError('A reason must be provided when rejecting a booking request.');
      }
      booking.status = 'REJECTED';
      booking.rejectionReason = reason.trim();
      booking.reviewedBy = actor?.roleName || 'Admin';
      booking.reviewedAt = new Date();
      this.inMemory.bookings.set(bookingId, booking);

      await auditService.recordAuditEvent({
        tenantId,
        actorUserId: actor?.userId || null,
        action: 'RENTAL_BOOKING_REJECTED',
        entityType: 'BOOKING_REQUEST',
        entityId: bookingId,
        description: `Rejected booking request. Reason: ${reason.trim()}`,
        afterData: { status: 'REJECTED', rejectionReason: reason.trim() },
      });

      return { id: booking.id, status: 'REJECTED', rejectionReason: reason.trim() };
    }
  }

  // ===========================================================================
  // 5. AVAILABILITY CALENDAR AGGREGATOR
  // ===========================================================================

  async getAvailabilityCalendar(tenantId: string, monthStr?: string) {
    if (!tenantId) throw new ValidationError('tenantId is required');

    // Default to current year-month in Asia/Dhaka
    const now = new Date();
    const targetMonth = monthStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [year, month] = targetMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    const roomsData = await this.listRooms(tenantId, { limit: 100 });
    const listingsData = await this.listRentalListings(tenantId, { limit: 100 });
    const bookingsData = await this.listBookingRequests(tenantId, { limit: 100 });

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayDate = new Date(`${dateStr}T12:00:00Z`);

      const bookingsList = Array.isArray(bookingsData?.bookings) ? bookingsData.bookings : [];

      // Count active guest bookings on this day
      const approvedBookingsOnDay = bookingsList.filter((b: any) => {
        if (b.status !== 'APPROVED') return false;
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        return dayDate >= checkIn && dayDate < checkOut;
      });

      const pendingBookingsOnDay = bookingsList.filter((b: any) => {
        if (b.status !== 'PENDING') return false;
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        return dayDate >= checkIn && dayDate < checkOut;
      });

      days.push({
        day,
        date: dateStr,
        totalCapacity: roomsData.summary.totalCapacity,
        occupiedBeds: roomsData.summary.totalOccupied,
        vacantBeds: Math.max(0, roomsData.summary.totalCapacity - roomsData.summary.totalOccupied - approvedBookingsOnDay.length),
        guestBookingsCount: approvedBookingsOnDay.length,
        pendingBookingsCount: pendingBookingsOnDay.length,
        hasMaintenance: roomsData.summary.underMaintenance > 0,
      });
    }

    return {
      month: targetMonth,
      totalRooms: roomsData.summary.totalRooms,
      totalCapacity: roomsData.summary.totalCapacity,
      activeMembersOccupying: roomsData.summary.totalOccupied,
      days,
    };
  }
}

export const roomService = new RoomService();
