if (typeof window !== 'undefined') {
  throw new Error('VisitorService can only be executed in a server environment.');
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
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const ASIA_DHAKA_TIMEZONE = 'Asia/Dhaka';

export type VisitPurpose =
  | 'FAMILY_VISIT'
  | 'STUDY_ACADEMIC'
  | 'DELIVERY_SERVICE'
  | 'FRIEND'
  | 'OFFICIAL_WORK'
  | 'OTHER';

export type VisitorStatus =
  | 'EXPECTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'REJECTED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface VisitorDto {
  id: string;
  referenceNumber: string;
  tenantId: string;
  visitorName: string;
  visitorPhone: string | null; // Protected / redacted for non-staff
  visitPurpose: VisitPurpose | string;
  hostMembershipId: string | null;
  hostUserId: string | null;
  hostUserName?: string | null;
  hostRoomNumber?: string | null;
  expectedArrival: string | null;
  formattedExpectedArrival: string | null;
  expectedDeparture: string | null;
  formattedExpectedDeparture: string | null;
  actualCheckIn: string | null;
  formattedActualCheckIn: string | null;
  actualCheckOut: string | null;
  formattedActualCheckOut: string | null;
  numberOfVisitors: number;
  status: VisitorStatus | string;
  rejectionReason: string | null;
  notes: string | null;
  recordedById: string | null;
  recorderName?: string | null;
  checkedInById: string | null;
  checkedInStaffName?: string | null;
  checkedOutById: string | null;
  checkedOutStaffName?: string | null;
  createdAt: string;
  formattedCreatedAt: string;
  updatedAt: string;
}

export interface VisitorDashboardDto {
  expectedTodayCount: number;
  currentlyCheckedInCount: number;
  checkedOutTodayCount: number;
  pendingApprovalCount: number;
  totalVisitorsAllTime: number;
  recentVisitors: VisitorDto[];
  myExpectedVisitors: VisitorDto[];
}

export interface PreRegisterVisitorInput {
  visitorName: string;
  visitorPhone?: string | null;
  visitPurpose?: VisitPurpose | string;
  expectedArrival: string | Date;
  expectedDeparture?: string | Date | null;
  numberOfVisitors?: number;
  notes?: string | null;
}

export interface WalkInVisitorInput {
  visitorName: string;
  visitorPhone?: string | null;
  visitPurpose?: VisitPurpose | string;
  hostUserId?: string | null;
  numberOfVisitors?: number;
  notes?: string | null;
}

export class VisitorService {
  private readonly db: PrismaClient;

  // In-memory mock storage for testing & offline resilience
  public mockTenants: any[] = [];
  public mockUsers: any[] = [];
  public mockRooms: any[] = [];
  public mockMemberships: any[] = [];
  public mockVisitors: any[] = [];

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
        id: 'usr_owner_1',
        name: 'Prince Mess Manager',
        email: 'manager@prince-mess.dev',
      },
      {
        id: 'usr_resident_1',
        name: 'Tanvir Ahmed',
        email: 'tanvir@messmate.dev',
      },
      {
        id: 'usr_resident_2',
        name: 'Sabbir Hossain',
        email: 'sabbir@messmate.dev',
      },
    ];

    this.mockRooms = [
      {
        id: 'room_101',
        tenantId: 'tenant_prince_mess',
        roomNumber: '101',
      },
    ];

    this.mockMemberships = [
      {
        id: 'mem_resident_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_1',
        roomId: 'room_101',
      },
      {
        id: 'mem_resident_2',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_2',
        roomId: 'room_101',
      },
    ];

    this.mockVisitors = [
      {
        id: 'vis_seed_1',
        referenceNumber: 'VIS-2611-001',
        tenantId: 'tenant_prince_mess',
        visitorName: 'Kamal Hassan',
        visitorPhone: '01819001122',
        visitPurpose: 'STUDY_ACADEMIC',
        hostMembershipId: 'mem_resident_1',
        hostUserId: 'usr_resident_1',
        expectedArrival: new Date('2026-11-22T14:00:00Z'),
        expectedDeparture: new Date('2026-11-22T18:00:00Z'),
        actualCheckIn: new Date('2026-11-22T14:15:00Z'),
        actualCheckOut: null,
        numberOfVisitors: 1,
        status: 'CHECKED_IN',
        rejectionReason: null,
        notes: 'University study group project session in dining room.',
        recordedById: 'usr_owner_1',
        checkedInById: 'usr_owner_1',
        checkedOutById: null,
        createdAt: new Date('2026-11-22T10:00:00Z'),
        updatedAt: new Date('2026-11-22T14:15:00Z'),
      },
      {
        id: 'vis_seed_2',
        referenceNumber: 'VIS-2611-002',
        tenantId: 'tenant_prince_mess',
        visitorName: 'Daraz Delivery Rider',
        visitorPhone: '01711223344',
        visitPurpose: 'DELIVERY_SERVICE',
        hostMembershipId: 'mem_resident_1',
        hostUserId: 'usr_resident_1',
        expectedArrival: new Date('2026-11-22T11:00:00Z'),
        expectedDeparture: new Date('2026-11-22T11:30:00Z'),
        actualCheckIn: new Date('2026-11-22T11:05:00Z'),
        actualCheckOut: new Date('2026-11-22T11:15:00Z'),
        numberOfVisitors: 1,
        status: 'CHECKED_OUT',
        rejectionReason: null,
        notes: 'Delivered parcel at main gate.',
        recordedById: 'usr_owner_1',
        checkedInById: 'usr_owner_1',
        checkedOutById: 'usr_owner_1',
        createdAt: new Date('2026-11-22T11:00:00Z'),
        updatedAt: new Date('2026-11-22T11:15:00Z'),
      },
      {
        id: 'vis_seed_3',
        referenceNumber: 'VIS-2611-003',
        tenantId: 'tenant_prince_mess',
        visitorName: 'Shafiqul Islam (Uncle)',
        visitorPhone: '01911998877',
        visitPurpose: 'FAMILY_VISIT',
        hostMembershipId: 'mem_resident_1',
        hostUserId: 'usr_resident_1',
        expectedArrival: new Date('2026-11-23T16:00:00Z'),
        expectedDeparture: new Date('2026-11-23T20:00:00Z'),
        actualCheckIn: null,
        actualCheckOut: null,
        numberOfVisitors: 2,
        status: 'PENDING_APPROVAL',
        rejectionReason: null,
        notes: 'Visiting from village with homemade snacks.',
        recordedById: 'usr_resident_1',
        checkedInById: null,
        checkedOutById: null,
        createdAt: new Date('2026-11-22T09:00:00Z'),
        updatedAt: new Date('2026-11-22T09:00:00Z'),
      },
      {
        id: 'vis_green_1',
        referenceNumber: 'VIS-GV-001',
        tenantId: 'tenant_green_villa',
        visitorName: 'Green Villa Internet Technician',
        visitorPhone: '01511223344',
        visitPurpose: 'OFFICIAL_WORK',
        hostMembershipId: null,
        hostUserId: null,
        expectedArrival: new Date('2026-11-22T15:00:00Z'),
        expectedDeparture: new Date('2026-11-22T17:00:00Z'),
        actualCheckIn: null,
        actualCheckOut: null,
        numberOfVisitors: 1,
        status: 'EXPECTED',
        rejectionReason: null,
        notes: 'Optical fiber line maintenance.',
        recordedById: 'usr_owner_1',
        checkedInById: null,
        checkedOutById: null,
        createdAt: new Date('2026-11-22T08:00:00Z'),
        updatedAt: new Date('2026-11-22T08:00:00Z'),
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

  private mapVisitorToDto(
    v: any,
    options: {
      isStaff?: boolean;
      requestingUserId?: string;
      userMap?: Map<string, string>;
      roomMap?: Map<string, string>;
    } = {}
  ): VisitorDto {
    const isStaff = options.isStaff !== false;
    const isHost = options.requestingUserId && v.hostUserId === options.requestingUserId;
    // Data minimization: phone is visible only to authorized staff or the host themselves
    const canSeePhone = isStaff || isHost;

    const hostUserName =
      v.hostUser?.name ||
      (v.hostUserId && options.userMap ? options.userMap.get(v.hostUserId) : null) ||
      null;

    const recorderName =
      v.recorder?.name ||
      (v.recordedById && options.userMap ? options.userMap.get(v.recordedById) : null) ||
      null;

    const checkedInStaffName =
      v.checkInStaff?.name ||
      (v.checkedInById && options.userMap ? options.userMap.get(v.checkedInById) : null) ||
      null;

    const checkedOutStaffName =
      v.checkOutStaff?.name ||
      (v.checkedOutById && options.userMap ? options.userMap.get(v.checkedOutById) : null) ||
      null;

    return {
      id: v.id,
      referenceNumber: v.referenceNumber,
      tenantId: v.tenantId,
      visitorName: v.visitorName,
      visitorPhone: canSeePhone ? v.visitorPhone || null : null,
      visitPurpose: v.visitPurpose,
      hostMembershipId: v.hostMembershipId || null,
      hostUserId: v.hostUserId || null,
      hostUserName,
      expectedArrival: v.expectedArrival ? v.expectedArrival.toISOString() : null,
      formattedExpectedArrival: v.expectedArrival ? formatDhakaDateTime(v.expectedArrival) : null,
      expectedDeparture: v.expectedDeparture ? v.expectedDeparture.toISOString() : null,
      formattedExpectedDeparture: v.expectedDeparture ? formatDhakaDateTime(v.expectedDeparture) : null,
      actualCheckIn: v.actualCheckIn ? v.actualCheckIn.toISOString() : null,
      formattedActualCheckIn: v.actualCheckIn ? formatDhakaDateTime(v.actualCheckIn) : null,
      actualCheckOut: v.actualCheckOut ? v.actualCheckOut.toISOString() : null,
      formattedActualCheckOut: v.actualCheckOut ? formatDhakaDateTime(v.actualCheckOut) : null,
      numberOfVisitors: v.numberOfVisitors || 1,
      status: v.status,
      rejectionReason: v.rejectionReason || null,
      notes: v.notes || null,
      recordedById: v.recordedById || null,
      recorderName,
      checkedInById: v.checkedInById || null,
      checkedInStaffName,
      checkedOutById: v.checkedOutById || null,
      checkedOutStaffName,
      createdAt: v.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(v.createdAt),
      updatedAt: v.updatedAt ? v.updatedAt.toISOString() : v.createdAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD & OVERVIEW
  // ---------------------------------------------------------------------------

  async getVisitorDashboard(
    tenantSlug: string,
    requestingUserId?: string,
    isStaff = true
  ): Promise<VisitorDashboardDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (this.isDbConfigured()) {
      const visitors = await this.db.visitor.findMany({
        where: { tenantId: tenant.id },
        include: {
          hostUser: { select: { name: true } },
          recorder: { select: { name: true } },
          checkInStaff: { select: { name: true } },
          checkOutStaff: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      let expectedTodayCount = 0;
      let currentlyCheckedInCount = 0;
      let checkedOutTodayCount = 0;
      let pendingApprovalCount = 0;

      for (const v of visitors) {
        if (v.status === 'CHECKED_IN') currentlyCheckedInCount++;
        if (v.status === 'PENDING_APPROVAL') pendingApprovalCount++;
        if (v.status === 'CHECKED_OUT' && v.actualCheckOut && v.actualCheckOut >= startOfDay && v.actualCheckOut <= endOfDay) {
          checkedOutTodayCount++;
        }
        if ((v.status === 'EXPECTED' || v.status === 'APPROVED') && v.expectedArrival && v.expectedArrival >= startOfDay && v.expectedArrival <= endOfDay) {
          expectedTodayCount++;
        }
      }

      const dtoList = visitors.map((v: any) =>
        this.mapVisitorToDto(v, { isStaff, requestingUserId })
      );

      const recentVisitors = dtoList.slice(0, 10);
      const myExpectedVisitors = requestingUserId
        ? dtoList.filter((v) => v.hostUserId === requestingUserId)
        : [];

      return {
        expectedTodayCount,
        currentlyCheckedInCount,
        checkedOutTodayCount,
        pendingApprovalCount,
        totalVisitorsAllTime: visitors.length,
        recentVisitors: isStaff ? recentVisitors : myExpectedVisitors.slice(0, 5),
        myExpectedVisitors,
      };
    }

    // In-memory fallback
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const visitors = this.mockVisitors.filter((v) => v.tenantId === tenant.id);

    let expectedTodayCount = 0;
    let currentlyCheckedInCount = 0;
    let checkedOutTodayCount = 0;
    let pendingApprovalCount = 0;

    for (const v of visitors) {
      if (v.status === 'CHECKED_IN') currentlyCheckedInCount++;
      if (v.status === 'PENDING_APPROVAL') pendingApprovalCount++;
      if (v.status === 'CHECKED_OUT' && v.actualCheckOut && v.actualCheckOut >= startOfDay && v.actualCheckOut <= endOfDay) {
        checkedOutTodayCount++;
      }
      if ((v.status === 'EXPECTED' || v.status === 'APPROVED') && v.expectedArrival && v.expectedArrival >= startOfDay && v.expectedArrival <= endOfDay) {
        expectedTodayCount++;
      }
    }

    const dtoList = visitors
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((v) => this.mapVisitorToDto(v, { isStaff, requestingUserId, userMap }));

    const recentVisitors = dtoList.slice(0, 10);
    const myExpectedVisitors = requestingUserId
      ? dtoList.filter((v) => v.hostUserId === requestingUserId)
      : [];

    return {
      expectedTodayCount,
      currentlyCheckedInCount,
      checkedOutTodayCount,
      pendingApprovalCount,
      totalVisitorsAllTime: visitors.length,
      recentVisitors: isStaff ? recentVisitors : myExpectedVisitors.slice(0, 5),
      myExpectedVisitors,
    };
  }

  // ---------------------------------------------------------------------------
  // VISITOR LOG & LISTING
  // ---------------------------------------------------------------------------

  async listVisitors(
    tenantSlug: string,
    filters: {
      status?: string;
      visitPurpose?: string;
      hostUserId?: string;
      search?: string;
      date?: string;
      checkedInOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {},
    isStaff = true,
    requestingUserId?: string
  ): Promise<{ visitors: VisitorDto[]; total: number }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
    const offset = Math.max(filters.offset || 0, 0);

    // Privacy boundary: Members can only see their own visitor requests
    const effectiveHostUserId = !isStaff ? requestingUserId : (filters.hostUserId || undefined);

    if (this.isDbConfigured()) {
      const where: any = { tenantId: tenant.id };
      if (effectiveHostUserId) where.hostUserId = effectiveHostUserId;
      if (filters.status && filters.status !== 'ALL') where.status = filters.status;
      if (filters.visitPurpose && filters.visitPurpose !== 'ALL') where.visitPurpose = filters.visitPurpose;
      if (filters.checkedInOnly) where.status = 'CHECKED_IN';

      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim();
        where.OR = [
          { referenceNumber: { contains: q, mode: 'insensitive' } },
          { visitorName: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [total, rawVisitors] = await Promise.all([
        this.db.visitor.count({ where }),
        this.db.visitor.findMany({
          where,
          include: {
            hostUser: { select: { name: true } },
            recorder: { select: { name: true } },
            checkInStaff: { select: { name: true } },
            checkOutStaff: { select: { name: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const visitors = rawVisitors.map((v: any) =>
        this.mapVisitorToDto(v, { isStaff, requestingUserId })
      );

      return { visitors, total };
    }

    // In-memory fallback
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    let filtered = this.mockVisitors.filter((v) => v.tenantId === tenant.id);

    if (effectiveHostUserId) {
      filtered = filtered.filter((v) => v.hostUserId === effectiveHostUserId);
    }
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((v) => v.status === filters.status);
    }
    if (filters.visitPurpose && filters.visitPurpose !== 'ALL') {
      filtered = filtered.filter((v) => v.visitPurpose === filters.visitPurpose);
    }
    if (filters.checkedInOnly) {
      filtered = filtered.filter((v) => v.status === 'CHECKED_IN');
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.referenceNumber.toLowerCase().includes(q) ||
          v.visitorName.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const paginated = filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    const visitors = paginated.map((v) =>
      this.mapVisitorToDto(v, { isStaff, requestingUserId, userMap })
    );

    return { visitors, total };
  }

  async getVisitorById(
    tenantSlug: string,
    visitorId: string,
    isStaff = true,
    requestingUserId?: string
  ): Promise<VisitorDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const v = await this.db.visitor.findFirst({
        where: { id: visitorId, tenantId: tenant.id },
        include: {
          hostUser: { select: { name: true } },
          recorder: { select: { name: true } },
          checkInStaff: { select: { name: true } },
          checkOutStaff: { select: { name: true } },
        },
      });

      if (!v) {
        throw new NotFoundError('Visitor record not found.');
      }

      // IDOR protection: Non-staff can only see their own visitor
      if (!isStaff && requestingUserId && v.hostUserId !== requestingUserId) {
        throw new NotFoundError('Visitor record not found.');
      }

      return this.mapVisitorToDto(v, { isStaff, requestingUserId });
    }

    // In-memory fallback
    const v = this.mockVisitors.find((item) => item.id === visitorId && item.tenantId === tenant.id);
    if (!v) {
      throw new NotFoundError('Visitor record not found.');
    }

    if (!isStaff && requestingUserId && v.hostUserId !== requestingUserId) {
      throw new NotFoundError('Visitor record not found.');
    }

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    return this.mapVisitorToDto(v, { isStaff, requestingUserId, userMap });
  }

  // ---------------------------------------------------------------------------
  // MEMBER PRE-REGISTRATION
  // ---------------------------------------------------------------------------

  async preRegisterVisitor(
    tenantSlug: string,
    hostUserId: string,
    input: PreRegisterVisitorInput
  ): Promise<VisitorDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (!input.visitorName || !input.visitorName.trim()) {
      throw new ValidationError('Visitor name is required.');
    }
    if (!input.expectedArrival) {
      throw new ValidationError('Expected arrival date and time are required.');
    }

    const expectedArr = new Date(input.expectedArrival);
    if (isNaN(expectedArr.getTime())) {
      throw new ValidationError('Invalid expected arrival date.');
    }

    const expectedDep = input.expectedDeparture ? new Date(input.expectedDeparture) : null;
    const numVisitors = Math.max(input.numberOfVisitors || 1, 1);
    const refNumber = `VIS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Resolve host membership
    let hostMembershipId: string | null = null;
    if (this.isDbConfigured()) {
      const membership = await this.db.membership.findFirst({
        where: { tenantId: tenant.id, userId: hostUserId, status: 'ACTIVE' },
      });
      if (!membership) {
        throw new ForbiddenError('Host user is not an active member of this mess.');
      }
      hostMembershipId = membership.id;

      const created = await this.db.visitor.create({
        data: {
          referenceNumber: refNumber,
          tenantId: tenant.id,
          visitorName: input.visitorName.trim(),
          visitorPhone: input.visitorPhone?.trim() || null,
          visitPurpose: input.visitPurpose || 'FRIEND',
          hostMembershipId,
          hostUserId,
          expectedArrival: expectedArr,
          expectedDeparture: expectedDep,
          numberOfVisitors: numVisitors,
          status: 'PENDING_APPROVAL',
          notes: input.notes?.trim() || null,
          recordedById: hostUserId,
        },
        include: {
          hostUser: { select: { name: true } },
          recorder: { select: { name: true } },
        },
      });

      // Notify mess manager/staff of pending visitor request
      await this.notifyStaffNewRequest(tenantSlug, created);

      return this.mapVisitorToDto(created, { isStaff: false, requestingUserId: hostUserId });
    }

    // In-memory fallback
    const membership = this.mockMemberships.find(
      (m) => m.tenantId === tenant.id && m.userId === hostUserId
    );
    if (!membership) {
      throw new ForbiddenError('Host user is not an active member of this mess.');
    }
    hostMembershipId = membership.id;

    const now = new Date();
    const newVisitor = {
      id: `vis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      referenceNumber: refNumber,
      tenantId: tenant.id,
      visitorName: input.visitorName.trim(),
      visitorPhone: input.visitorPhone?.trim() || null,
      visitPurpose: input.visitPurpose || 'FRIEND',
      hostMembershipId,
      hostUserId,
      expectedArrival: expectedArr,
      expectedDeparture: expectedDep,
      actualCheckIn: null,
      actualCheckOut: null,
      numberOfVisitors: numVisitors,
      status: 'PENDING_APPROVAL',
      rejectionReason: null,
      notes: input.notes?.trim() || null,
      recordedById: hostUserId,
      checkedInById: null,
      checkedOutById: null,
      createdAt: now,
      updatedAt: now,
    };

    this.mockVisitors.unshift(newVisitor);

    await this.notifyStaffNewRequest(tenantSlug, newVisitor);

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    return this.mapVisitorToDto(newVisitor, { isStaff: false, requestingUserId: hostUserId, userMap });
  }

  // ---------------------------------------------------------------------------
  // APPROVAL WORKFLOW
  // ---------------------------------------------------------------------------

  async reviewVisitorRequest(
    tenantSlug: string,
    staffUserId: string,
    visitorId: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string
  ): Promise<VisitorDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const visitor = await this.getVisitorById(tenantSlug, visitorId, true);

    // Rule: Member cannot approve their own visitor request
    if (visitor.hostUserId === staffUserId) {
      throw new ForbiddenError('Members cannot approve their own visitor requests.');
    }

    if (visitor.status !== 'PENDING_APPROVAL') {
      throw new ValidationError(
        `Cannot review request with status '${visitor.status}'. Only PENDING_APPROVAL requests can be reviewed.`
      );
    }

    const targetStatus: VisitorStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const now = new Date();

    if (this.isDbConfigured()) {
      const updated = await this.db.visitor.update({
        where: { id: visitor.id },
        data: {
          status: targetStatus,
          rejectionReason: action === 'REJECT' ? reason || 'Request rejected by staff.' : null,
        },
        include: {
          hostUser: { select: { name: true } },
          recorder: { select: { name: true } },
        },
      });

      // Notify host member of approval/rejection
      if (updated.hostUserId) {
        await this.notifyHostReviewResult(tenantSlug, updated.hostUserId, updated, targetStatus);
      }

      return this.mapVisitorToDto(updated, { isStaff: true });
    }

    // In-memory fallback
    const v = this.mockVisitors.find((item) => item.id === visitorId && item.tenantId === tenant.id);
    if (!v) {
      throw new NotFoundError('Visitor record not found.');
    }

    v.status = targetStatus;
    v.rejectionReason = action === 'REJECT' ? reason || 'Request rejected by staff.' : null;
    v.updatedAt = now;

    if (v.hostUserId) {
      await this.notifyHostReviewResult(tenantSlug, v.hostUserId, v, targetStatus);
    }

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    return this.mapVisitorToDto(v, { isStaff: true, userMap });
  }

  // ---------------------------------------------------------------------------
  // CHECK-IN & CHECK-OUT LIFECYCLE
  // ---------------------------------------------------------------------------

  async checkInVisitor(
    tenantSlug: string,
    staffUserId: string,
    visitorId: string
  ): Promise<VisitorDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const visitor = await this.getVisitorById(tenantSlug, visitorId, true);

    // Check-in constraints
    if (visitor.status === 'CHECKED_IN') {
      throw new ValidationError(`Visitor '${visitor.visitorName}' is already checked in.`);
    }
    if (visitor.status === 'CHECKED_OUT') {
      throw new ValidationError(`Visitor '${visitor.visitorName}' has already checked out.`);
    }
    if (visitor.status === 'REJECTED' || visitor.status === 'CANCELLED') {
      throw new ValidationError(`Cannot check in a visitor with status '${visitor.status}'.`);
    }

    // Server-generated actual check-in timestamp
    const now = new Date();

    if (this.isDbConfigured()) {
      const updated = await this.db.visitor.update({
        where: { id: visitor.id },
        data: {
          status: 'CHECKED_IN',
          actualCheckIn: now,
          checkedInById: staffUserId,
        },
        include: {
          hostUser: { select: { name: true } },
          recorder: { select: { name: true } },
          checkInStaff: { select: { name: true } },
        },
      });

      // Notify host member that visitor arrived
      if (updated.hostUserId) {
        await this.notifyHostArrival(tenantSlug, updated.hostUserId, updated);
      }

      return this.mapVisitorToDto(updated, { isStaff: true });
    }

    // In-memory fallback
    const v = this.mockVisitors.find((item) => item.id === visitorId && item.tenantId === tenant.id);
    if (!v) {
      throw new NotFoundError('Visitor record not found.');
    }

    v.status = 'CHECKED_IN';
    v.actualCheckIn = now;
    v.checkedInById = staffUserId;
    v.updatedAt = now;

    if (v.hostUserId) {
      await this.notifyHostArrival(tenantSlug, v.hostUserId, v);
    }

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    return this.mapVisitorToDto(v, { isStaff: true, userMap });
  }

  async checkOutVisitor(
    tenantSlug: string,
    staffUserId: string,
    visitorId: string
  ): Promise<VisitorDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const visitor = await this.getVisitorById(tenantSlug, visitorId, true);

    // Checkout requires prior check-in
    if (visitor.status !== 'CHECKED_IN') {
      throw new ValidationError(
        `Cannot check out: visitor '${visitor.visitorName}' is not currently checked in (current status: ${visitor.status}).`
      );
    }

    // Server-generated actual checkout timestamp
    const now = new Date();

    if (this.isDbConfigured()) {
      const updated = await this.db.visitor.update({
        where: { id: visitor.id },
        data: {
          status: 'CHECKED_OUT',
          actualCheckOut: now,
          checkedOutById: staffUserId,
        },
        include: {
          hostUser: { select: { name: true } },
          recorder: { select: { name: true } },
          checkInStaff: { select: { name: true } },
          checkOutStaff: { select: { name: true } },
        },
      });

      return this.mapVisitorToDto(updated, { isStaff: true });
    }

    // In-memory fallback
    const v = this.mockVisitors.find((item) => item.id === visitorId && item.tenantId === tenant.id);
    if (!v) {
      throw new NotFoundError('Visitor record not found.');
    }

    v.status = 'CHECKED_OUT';
    v.actualCheckOut = now;
    v.checkedOutById = staffUserId;
    v.updatedAt = now;

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    return this.mapVisitorToDto(v, { isStaff: true, userMap });
  }

  // ---------------------------------------------------------------------------
  // CANCELLATION & WALK-INS
  // ---------------------------------------------------------------------------

  async cancelVisitorRequest(
    tenantSlug: string,
    requestingUserId: string,
    visitorId: string,
    isStaff = false
  ): Promise<VisitorDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const visitor = await this.getVisitorById(tenantSlug, visitorId, isStaff, requestingUserId);

    if (visitor.status === 'CHECKED_IN' || visitor.status === 'CHECKED_OUT') {
      throw new ValidationError(`Cannot cancel a visitor who has already checked in or checked out.`);
    }

    const now = new Date();

    if (this.isDbConfigured()) {
      const updated = await this.db.visitor.update({
        where: { id: visitor.id },
        data: {
          status: 'CANCELLED',
        },
        include: {
          hostUser: { select: { name: true } },
        },
      });

      return this.mapVisitorToDto(updated, { isStaff, requestingUserId });
    }

    // In-memory fallback
    const v = this.mockVisitors.find((item) => item.id === visitorId && item.tenantId === tenant.id);
    if (!v) {
      throw new NotFoundError('Visitor record not found.');
    }

    v.status = 'CANCELLED';
    v.updatedAt = now;

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    return this.mapVisitorToDto(v, { isStaff, requestingUserId, userMap });
  }

  async registerWalkInVisitor(
    tenantSlug: string,
    staffUserId: string,
    input: WalkInVisitorInput
  ): Promise<VisitorDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (!input.visitorName || !input.visitorName.trim()) {
      throw new ValidationError('Visitor name is required.');
    }

    const now = new Date();
    const refNumber = `VIS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const numVisitors = Math.max(input.numberOfVisitors || 1, 1);

    if (this.isDbConfigured()) {
      const created = await this.db.visitor.create({
        data: {
          referenceNumber: refNumber,
          tenantId: tenant.id,
          visitorName: input.visitorName.trim(),
          visitorPhone: input.visitorPhone?.trim() || null,
          visitPurpose: input.visitPurpose || 'OTHER',
          hostUserId: input.hostUserId || null,
          actualCheckIn: now,
          numberOfVisitors: numVisitors,
          status: 'CHECKED_IN',
          notes: input.notes?.trim() || 'Front-desk walk-in registration',
          recordedById: staffUserId,
          checkedInById: staffUserId,
        },
        include: {
          hostUser: { select: { name: true } },
          checkInStaff: { select: { name: true } },
        },
      });

      if (input.hostUserId) {
        await this.notifyHostArrival(tenantSlug, input.hostUserId, created);
      }

      return this.mapVisitorToDto(created, { isStaff: true });
    }

    // In-memory fallback
    const newVisitor = {
      id: `vis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      referenceNumber: refNumber,
      tenantId: tenant.id,
      visitorName: input.visitorName.trim(),
      visitorPhone: input.visitorPhone?.trim() || null,
      visitPurpose: input.visitPurpose || 'OTHER',
      hostMembershipId: null,
      hostUserId: input.hostUserId || null,
      expectedArrival: now,
      expectedDeparture: null,
      actualCheckIn: now,
      actualCheckOut: null,
      numberOfVisitors: numVisitors,
      status: 'CHECKED_IN',
      rejectionReason: null,
      notes: input.notes?.trim() || 'Front-desk walk-in registration',
      recordedById: staffUserId,
      checkedInById: staffUserId,
      checkedOutById: null,
      createdAt: now,
      updatedAt: now,
    };

    this.mockVisitors.unshift(newVisitor);

    if (input.hostUserId) {
      await this.notifyHostArrival(tenantSlug, input.hostUserId, newVisitor);
    }

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    return this.mapVisitorToDto(newVisitor, { isStaff: true, userMap });
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATION HELPERS
  // ---------------------------------------------------------------------------

  private async notifyStaffNewRequest(tenantSlug: string, visitor: any) {
    try {
      await tenantNotificationService.createNotification({
        tenantSlug,
        userId: visitor.tenantId, // Broadcast/staff recipient
        category: 'VISITOR',
        title: `Visitor Request: ${visitor.visitorName}`,
        message: `${visitor.visitorName} scheduled a visit for ${formatDhakaDateTime(visitor.expectedArrival)}. Review request.`,
        link: `/mess/${tenantSlug}/visitors`,
        eventReference: `VIS_REQ_${visitor.id}`,
      });
    } catch (err: any) {
      console.warn('[VisitorService] Notify staff warning:', err?.message || err);
    }
  }

  private async notifyHostReviewResult(
    tenantSlug: string,
    hostUserId: string,
    visitor: any,
    status: 'APPROVED' | 'REJECTED'
  ) {
    try {
      await tenantNotificationService.createNotification({
        tenantSlug,
        userId: hostUserId,
        category: 'VISITOR',
        title: status === 'APPROVED' ? `Visitor Approved: ${visitor.visitorName}` : `Visitor Rejected: ${visitor.visitorName}`,
        message: status === 'APPROVED'
          ? `Your visitor request for ${visitor.visitorName} has been approved by management.`
          : `Your visitor request for ${visitor.visitorName} was rejected: ${visitor.rejectionReason || 'No reason specified'}`,
        link: `/portal/${tenantSlug}/visitors`,
        eventReference: `VIS_REVIEW_${visitor.id}_${status}`,
      });
    } catch (err: any) {
      console.warn('[VisitorService] Notify host review warning:', err?.message || err);
    }
  }

  private async notifyHostArrival(tenantSlug: string, hostUserId: string, visitor: any) {
    try {
      await tenantNotificationService.createNotification({
        tenantSlug,
        userId: hostUserId,
        category: 'VISITOR',
        title: `Visitor Arrived: ${visitor.visitorName}`,
        message: `${visitor.visitorName} has just checked in at the front desk.`,
        link: `/portal/${tenantSlug}/visitors`,
        eventReference: `VIS_CHECKIN_${visitor.id}`,
      });
    } catch (err: any) {
      console.warn('[VisitorService] Notify host arrival warning:', err?.message || err);
    }
  }
}

export const visitorService = new VisitorService();
