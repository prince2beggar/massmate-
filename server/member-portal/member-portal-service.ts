if (typeof window !== 'undefined') {
  throw new Error('MemberPortalService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { inspectDatabaseConfig } from '@/server/db/config';
import { financeService } from '@/server/finance/finance-service';
import { formatBdtCurrency } from '@/server/mess-admin/mess-dashboard-service';
import { formatDhakaDateTime } from '@/server/settings/mess-settings-service';
import {
  UnauthenticatedError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/server/api/errors';
import { auditService } from '@/server/audit/audit-service';
import type { MemberContext } from '@/server/api/with-member-auth';

export const ASIA_DHAKA_TIMEZONE = 'Asia/Dhaka';

export function toPoisha(taka: number | string | bigint): bigint {
  if (typeof taka === 'bigint') return taka;
  const num = typeof taka === 'string' ? parseFloat(taka) : taka;
  if (isNaN(num)) return BigInt(0);
  return BigInt(Math.round(num * 100));
}

export function fromPoisha(poisha: bigint | number): number {
  return Number(poisha) / 100;
}

export { formatBdtCurrency } from '@/server/mess-admin/mess-dashboard-service';

export function getTodayDhakaDateString(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ASIA_DHAKA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // Returns YYYY-MM-DD
}

export function getCurrentDhakaMonthString(): string {
  const d = getTodayDhakaDateString();
  return d.substring(0, 7); // Returns YYYY-MM
}

/**
 * Normalizes Bangladeshi phone numbers into canonical 11-digit format (01XXXXXXXXX).
 * Rejects invalid prefixes, lengths, or non-numeric tokens.
 */
export function normalizeBdPhone(phone?: string | null): string | null {
  if (!phone || !phone.trim()) return null;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const match = cleaned.match(/^(?:\+?88)?(01[3-9]\d{8})$/);
  if (!match) {
    throw new ValidationError(
      'Invalid phone number format. Please provide an 11-digit Bangladeshi mobile number (e.g. 01712345678).'
    );
  }
  return match[1];
}

export interface MemberProfileDto {
  userId: string;
  membershipId: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  memberCode: string | null;
  status: string;
  joinedAt: string | null;
  roleName: string;
  tenantName: string;
  tenantSlug: string;
  editableFields: string[];
  protectedFields: string[];
}

export interface UpdateMemberProfileInput {
  phone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  avatar?: string | null;
  name?: string;
  [key: string]: any;
}

export interface MemberRoomDetailsDto {
  hasAssignment: boolean;
  currentAssignment: {
    assignmentId: string;
    roomId: string;
    roomNumber: string;
    roomName: string | null;
    floor: string | null;
    building: string | null;
    capacity: number;
    currentOccupantsCount: number;
    bedNumber: string;
    monthlyRentPoisha: string;
    formattedRent: string;
    startDate: string;
    facilities: string[];
    status: string;
    roomRules?: string;
  } | null;
  assignmentHistory: Array<{
    id: string;
    roomNumber: string;
    bedNumber: string;
    startDate: string;
    endDate: string | null;
    monthlyRentPoisha: string;
    formattedRent: string;
    status: string;
    moveOutReason: string | null;
  }>;
  availableRooms: Array<{
    id: string;
    roomNumber: string;
    name: string | null;
    floor: string | null;
    building: string | null;
    capacity: number;
    availableBedsCount: number;
    defaultRentPoisha: string;
    formattedDefaultRent: string;
    facilities: string[];
  }>;
}

export interface MemberRequestDto {
  id: string;
  referenceNumber: string;
  membershipId: string;
  memberName: string;
  tenantId: string;
  requestType: 'ROOM_CHANGE' | 'PROFILE_UPDATE' | 'MAINTENANCE' | 'GENERAL_QUERY';
  title: string;
  description: string;
  requestedRoomId: string | null;
  requestedRoomNumber?: string | null;
  preferredDate: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminResponse: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any> | null;
}

export interface CreateMemberRequestInput {
  requestType: 'ROOM_CHANGE' | 'PROFILE_UPDATE' | 'MAINTENANCE' | 'GENERAL_QUERY';
  title?: string;
  description: string;
  requestedRoomId?: string | null;
  preferredDate?: string | null;
  metadata?: Record<string, any> | null;
}

export interface MemberDashboardDto {
  member: {
    id: string;
    userId: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar: string | null;
    memberCode: string | null;
    status: string;
    roleName: string;
    joinedAt: string | null;
  };
  mess: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    address: string | null;
    city: string | null;
  };
  overviewCards: {
    room: {
      isAssigned: boolean;
      roomNumber: string | null;
      bedLabel: string | null;
      monthlyRentFormatted: string | null;
      rentPoisha: string;
    };
    meals: {
      todayStatus: 'ACTIVE' | 'OFF' | 'NO_SCHEDULE';
      todayCounts: {
        breakfast: boolean;
        lunch: boolean;
        dinner: boolean;
      };
      currentMonthCount: number;
    };
    account: {
      currentDueFormatted: string;
      currentDuePoisha: string;
      totalBilledFormatted: string;
      totalBilledPoisha: string;
      lastConfirmedPayment: {
        amountFormatted: string;
        amountPoisha: string;
        method: string;
        date: string;
      } | null;
    };
    noticesCount: number;
  };
  monthlyAccountSnapshot: {
    month: string;
    status: string;
    openingDueFormatted: string;
    rentChargesFormatted: string;
    utilityChargesFormatted: string;
    mealChargesFormatted: string;
    otherChargesFormatted: string;
    totalChargesFormatted: string;
    confirmedPaymentsFormatted: string;
    adjustmentsFormatted: string;
    closingDueFormatted: string;
  };
  mealSnapshot: {
    todayDate: string;
    todayMenu: {
      breakfast: string | null;
      lunch: string | null;
      dinner: string | null;
      notes: string | null;
    };
    pendingMealOffRequestsCount: number;
    recentMealOffStatus: string | null;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    description: string;
    timestamp: string;
    formattedTime: string;
    type: 'PAYMENT' | 'MEAL' | 'ROOM' | 'NOTICE' | 'ACCOUNT';
  }>;
  notices: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    priority: string;
    isPinned: boolean;
    publishedAt: string;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    href: string;
    icon: string;
    description: string;
  }>;
}

export class MemberPortalService {
  private readonly db: PrismaClient;

  // In-memory mock storage for testing & offline resilience
  public mockTenants: any[] = [];
  public mockUsers: any[] = [];
  public mockMemberships: any[] = [];
  public mockRoles: any[] = [];
  public mockRooms: any[] = [];
  public mockBeds: any[] = [];
  public mockRoomAssignments: any[] = [];
  public mockMealLogs: any[] = [];
  public mockMealOffRequests: any[] = [];
  public mockNotices: any[] = [];
  public mockPayments: any[] = [];
  public mockBills: any[] = [];
  public mockAuditLogs: any[] = [];
  public mockMemberRequests: any[] = [];

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
        logo: null,
        status: 'ACTIVE',
      },
      {
        id: 'tenant_green_villa',
        slug: 'green-villa-mess',
        name: 'Green Villa Mess',
        logo: null,
        status: 'ACTIVE',
      },
      {
        id: 'tenant_suspended_mess',
        slug: 'suspended-mess',
        name: 'Suspended Mess',
        logo: null,
        status: 'SUSPENDED',
      },
    ];

    this.mockUsers = [
      {
        id: 'usr_resident_1',
        name: 'Tanvir Ahmed',
        email: 'tanvir@messmate.dev',
        phone: '01711000001',
        avatar: null,
      },
      {
        id: 'usr_resident_2',
        name: 'Rakib Hasan',
        email: 'rakib@messmate.dev',
        phone: '01711000002',
        avatar: null,
      },
      {
        id: 'usr_suspended_user',
        name: 'Suspended Member',
        email: 'suspended@messmate.dev',
        phone: '01711000003',
        avatar: null,
      },
    ];

    this.mockRoles = [
      {
        id: 'role_member',
        name: 'Resident Member',
        slug: 'member',
      },
    ];

    this.mockMemberships = [
      {
        id: 'mem_res_1',
        userId: 'usr_resident_1',
        tenantId: 'tenant_prince_mess',
        roleId: 'role_member',
        status: 'ACTIVE',
        memberCode: 'PR-101',
        emergencyContactName: 'Kamal Ahmed',
        emergencyContactPhone: '01811000001',
        joinedAt: new Date('2026-01-01'),
      },
      {
        id: 'mem_res_2',
        userId: 'usr_resident_2',
        tenantId: 'tenant_prince_mess',
        roleId: 'role_member',
        status: 'ACTIVE',
        memberCode: 'PR-102',
        emergencyContactName: null,
        emergencyContactPhone: null,
        joinedAt: new Date('2026-02-01'),
      },
      {
        id: 'mem_susp',
        userId: 'usr_suspended_user',
        tenantId: 'tenant_prince_mess',
        roleId: 'role_member',
        status: 'SUSPENDED',
        memberCode: 'PR-999',
        emergencyContactName: null,
        emergencyContactPhone: null,
        joinedAt: new Date('2025-11-01'),
      },
    ];

    this.mockRooms = [
      {
        id: 'room_204',
        tenantId: 'tenant_prince_mess',
        roomNumber: '204',
        name: 'Lake View 204',
        floor: '2nd Floor',
        building: 'Building A',
        capacity: 2,
        defaultRent: BigInt(450000),
        facilities: ['Attached Bath', 'Balcony', 'WiFi'],
        status: 'OCCUPIED',
      },
      {
        id: 'room_205',
        tenantId: 'tenant_prince_mess',
        roomNumber: '205',
        name: 'Quiet Corner',
        floor: '2nd Floor',
        building: 'Building A',
        capacity: 2,
        defaultRent: BigInt(480000),
        facilities: ['Attached Bath', 'Air Cooler', 'WiFi'],
        status: 'AVAILABLE',
      },
    ];

    this.mockBeds = [
      {
        id: 'bed_204_a',
        roomId: 'room_204',
        label: 'Bed A (Window)',
        bedNumber: 'Bed A',
      },
      {
        id: 'bed_204_b',
        roomId: 'room_204',
        label: 'Bed B (Door)',
        bedNumber: 'Bed B',
      },
      {
        id: 'bed_205_a',
        roomId: 'room_205',
        label: 'Bed A',
        bedNumber: 'Bed A',
      },
      {
        id: 'bed_205_b',
        roomId: 'room_205',
        label: 'Bed B',
        bedNumber: 'Bed B',
      },
    ];

    this.mockRoomAssignments = [
      {
        id: 'asgn_1',
        membershipId: 'mem_res_1',
        roomId: 'room_204',
        bedId: 'bed_204_a',
        agreedRentPoisha: BigInt(450000),
        status: 'ACTIVE',
        startDate: new Date('2026-06-01'),
        endDate: null,
        moveOutReason: null,
      },
      {
        id: 'asgn_prev_1',
        membershipId: 'mem_res_1',
        roomId: 'room_101',
        bedId: 'bed_101_b',
        roomNumber: '101',
        bedNumber: 'Bed B',
        agreedRentPoisha: BigInt(400000),
        status: 'TRANSFERRED',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-05-31'),
        moveOutReason: 'Transferred to 204 for exams',
      },
    ];

    const todayDate = getTodayDhakaDateString();

    this.mockMealLogs = [
      {
        id: 'ml_today',
        tenantId: 'tenant_prince_mess',
        dateString: todayDate,
        breakfastMenu: 'Dim Porota, Daal, Tea',
        lunchMenu: 'Bhaat, Rui Fish Curry, Shaak',
        dinnerMenu: 'Bhaat, Chicken Bhuna, Daal',
        specialNotes: 'Fresh groceries sourced from Karwan Bazar',
      },
    ];

    this.mockMealOffRequests = [];

    this.mockNotices = [
      {
        id: 'ntc_1',
        tenantId: 'tenant_prince_mess',
        title: 'Welcome to the New Resident Portal',
        content: 'Residents can now track daily meal counts and rent receipts directly from their mobile devices.',
        category: 'GENERAL',
        priority: 'HIGH',
        isPinned: true,
        status: 'PUBLISHED',
        createdAt: new Date(),
      },
      {
        id: 'ntc_2',
        tenantId: 'tenant_prince_mess',
        title: 'Water Supply Maintenance on Friday',
        content: 'Rooftop water tanks will be cleaned between 10:00 AM and 2:00 PM this Friday.',
        category: 'MAINTENANCE',
        priority: 'NORMAL',
        isPinned: false,
        status: 'PUBLISHED',
        createdAt: new Date(),
      },
    ];

    this.mockPayments = [
      {
        id: 'pay_1',
        membershipId: 'mem_res_1',
        tenantId: 'tenant_prince_mess',
        amountPoisha: BigInt(500000),
        paymentMethod: 'BKASH',
        status: 'CONFIRMED',
        createdAt: new Date(),
      },
    ];

    this.mockBills = [];

    this.mockMemberRequests = [
      {
        id: 'req_seed_1',
        referenceNumber: 'REQ-2611-001',
        tenantId: 'tenant_prince_mess',
        membershipId: 'mem_res_1',
        requestType: 'MAINTENANCE',
        title: 'Ceiling Fan Regulator Humming',
        description: 'The ceiling fan regulator in room 204 produces a high-pitch hum.',
        requestedRoomId: null,
        status: 'APPROVED',
        adminResponse: 'Electrician checked and replaced regulator on Nov 15.',
        reviewedBy: 'Mess Admin',
        reviewedAt: new Date('2026-11-15T10:00:00Z'),
        createdAt: new Date('2026-11-14T09:00:00Z'),
        updatedAt: new Date('2026-11-15T10:00:00Z'),
      },
    ];
  }

  getTodayDhakaDateString(): string {
    return getTodayDhakaDateString();
  }

  getCurrentDhakaMonthString(): string {
    return getCurrentDhakaMonthString();
  }

  private isDbAvailable(): boolean {
    try {
      if (!this.db) return false;
      const status = inspectDatabaseConfig();
      return Boolean(status.configured && status.runtimeUrl);
    } catch {
      return false;
    }
  }

  private resolveMockMemberContext(userId: string, tenantSlug: string): MemberContext {
    const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
    if (!tenant) {
      throw new NotFoundError(`Mess with slug '${tenantSlug}' not found.`);
    }
    if (tenant.status === 'SUSPENDED') {
      throw new ForbiddenError('This mess account is currently suspended. Access denied.');
    }

    const user = this.mockUsers.find((u) => u.id === userId);
    if (!user) {
      throw new UnauthenticatedError('User identity not found.');
    }

    const membership = this.mockMemberships.find(
      (m) => m.userId === userId && m.tenantId === tenant.id
    );
    if (!membership) {
      throw new ForbiddenError('You do not have a resident membership in this mess.');
    }

    if (membership.status === 'SUSPENDED') {
      throw new ForbiddenError('Your membership in this mess is suspended. Contact mess management.');
    }
    if (membership.status === 'LEFT') {
      throw new ForbiddenError('Your membership in this mess has ended.');
    }
    if (membership.status !== 'ACTIVE') {
      throw new ForbiddenError(
        `Your membership in "${tenant.name}" is currently ${membership.status.toLowerCase()}. Access denied.`
      );
    }

    const role = this.mockRoles.find((r) => r.id === membership.roleId);

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || null,
      userAvatar: user.avatar || null,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      tenantLogo: tenant.logo || null,
      membershipId: membership.id,
      membershipStatus: membership.status,
      memberCode: membership.memberCode || null,
      roleId: role?.id || 'role_member',
      roleName: role?.name || 'Member',
      roleSlug: role?.slug || 'member',
    };
  }

  /**
   * Resolves and verifies the authenticated MemberContext for a given tenant slug.
   * Throws typed security errors if the user is unauthenticated, not a member, or inactive.
   */
  async resolveMemberContext(userId: string, tenantSlug: string): Promise<MemberContext> {
    if (!userId || !userId.trim()) {
      throw new UnauthenticatedError('Missing authenticated user identity.');
    }
    if (!tenantSlug || !tenantSlug.trim()) {
      throw new NotFoundError('Mess identifier is required.');
    }

    if (!this.isDbAvailable()) {
      return this.resolveMockMemberContext(userId, tenantSlug);
    }

    try {
      const tenant = await this.db.tenant.findUnique({
        where: { slug: tenantSlug },
      });
      if (!tenant) {
        throw new NotFoundError(`Mess with slug '${tenantSlug}' not found.`);
      }
      if (tenant.status === 'SUSPENDED') {
        throw new ForbiddenError('This mess account is currently suspended. Access denied.');
      }

      const membership = await this.db.membership.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId: tenant.id,
          },
        },
        include: {
          user: true,
          role: true,
        },
      });

      if (!membership) {
        throw new ForbiddenError('You do not have a resident membership in this mess.');
      }

      if (membership.status === 'SUSPENDED') {
        throw new ForbiddenError('Your membership in this mess is suspended. Contact mess management.');
      }
      if (membership.status === 'LEFT') {
        throw new ForbiddenError('Your membership in this mess has ended.');
      }
      if (membership.status !== 'ACTIVE') {
        throw new ForbiddenError(
          `Your membership in "${tenant.name}" is currently ${membership.status.toLowerCase()}. Access denied.`
        );
      }

      return {
        userId: membership.user.id,
        userName: membership.user.name,
        userEmail: membership.user.email,
        userPhone: membership.user.phone,
        userAvatar: (membership.user as any).avatar || null,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        tenantLogo: tenant.logo,
        membershipId: membership.id,
        membershipStatus: membership.status,
        memberCode: (membership as any).memberCode || null,
        roleId: membership.role.id,
        roleName: membership.role.name,
        roleSlug: membership.role.slug,
      };
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError || err instanceof UnauthenticatedError) {
        throw err;
      }
      return this.resolveMockMemberContext(userId, tenantSlug);
    }
  }

  /**
   * Fetches data-driven dashboard payload strictly scoped to the authenticated member and tenant.
   */
  async getMemberDashboard(userId: string, tenantSlug: string): Promise<MemberDashboardDto> {
    const memberContext = await this.resolveMemberContext(userId, tenantSlug);
    const todayDate = getTodayDhakaDateString();
    const currentMonth = getCurrentDhakaMonthString();

    if (!this.isDbAvailable()) {
      // 1. Room Assignment
      const activeAssignment = this.mockRoomAssignments.find(
        (a) => a.membershipId === memberContext.membershipId && a.status === 'ACTIVE'
      );
      let roomInfo = {
        isAssigned: false,
        roomNumber: null as string | null,
        bedLabel: null as string | null,
        monthlyRentFormatted: null as string | null,
        rentPoisha: '0',
      };
      if (activeAssignment) {
        const bed = this.mockBeds.find((b) => b.id === activeAssignment.bedId);
        const room = bed ? this.mockRooms.find((r) => r.id === bed.roomId) : null;
        const rent = BigInt(activeAssignment.agreedRentPoisha || 0);
        roomInfo = {
          isAssigned: true,
          roomNumber: room?.roomNumber || 'Unknown Room',
          bedLabel: bed?.label || 'Bed',
          monthlyRentFormatted: formatBdtCurrency(rent),
          rentPoisha: rent.toString(),
        };
      }

      // 2. Meal Status
      const todayOffRequest = this.mockMealOffRequests.find(
        (r) =>
          r.membershipId === memberContext.membershipId &&
          r.status === 'APPROVED' &&
          r.startDate <= todayDate &&
          r.endDate >= todayDate
      );
      const isMealOff = Boolean(todayOffRequest);

      const pendingMealOffRequests = this.mockMealOffRequests.filter(
        (r) => r.membershipId === memberContext.membershipId && r.status === 'PENDING'
      );

      const todayLog = this.mockMealLogs.find(
        (l) => l.tenantId === memberContext.tenantId && l.dateString === todayDate
      );

      // 3. Authoritative Finance Statement
      let financialStatement: any = null;
      try {
        financialStatement = await financeService.getMemberStatement(
          tenantSlug,
          memberContext.membershipId,
          currentMonth,
          {
            isOwner: false,
            permissions: new Set(['finance.view']),
            viewerMembershipId: memberContext.membershipId,
          }
        );
      } catch {
        // Fallback to demo values if billing has not yet been generated in mock mode
        financialStatement = {
          openingBalance: { formattedBdt: '৳0.00', poisha: '0' },
          newRentCharges: { formattedBdt: '৳4,500.00', poisha: '450000' },
          utilityCharges: { formattedBdt: '৳750.00', poisha: '75000' },
          mealCharges: { formattedBdt: '৳3,000.00', poisha: '300000' },
          otherCharges: { formattedBdt: '৳0.00', poisha: '0' },
          totalNewCharges: { formattedBdt: '৳8,250.00', poisha: '825000' },
          paymentsReceived: { formattedBdt: '৳5,000.00', poisha: '500000' },
          creditsAndAdjustments: { formattedBdt: '৳0.00', poisha: '0' },
          closingBalance: { formattedBdt: '৳3,250.00', poisha: '325000' },
          bill: null,
          payments: [],
        };
      }

      // 4. Last Confirmed Payment
      const memberPayments = this.mockPayments.filter(
        (p) => p.membershipId === memberContext.membershipId && p.status === 'CONFIRMED'
      );
      memberPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lastPayment = memberPayments[0] || null;

      // 5. Notices
      const publishedNotices = this.mockNotices.filter(
        (n) => n.tenantId === memberContext.tenantId && n.status === 'PUBLISHED'
      );
      publishedNotices.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // 6. Recent Activities
      const activities: Array<{
        id: string;
        action: string;
        description: string;
        timestamp: string;
        formattedTime: string;
        type: 'PAYMENT' | 'MEAL' | 'ROOM' | 'NOTICE' | 'ACCOUNT';
      }> = [];

      // Add recent payments
      const recentP = this.mockPayments.filter((p) => p.membershipId === memberContext.membershipId);
      for (const p of recentP.slice(0, 3)) {
        activities.push({
          id: p.id,
          action: `Payment ${p.status}`,
          description: `${p.status === 'CONFIRMED' ? 'Confirmed' : 'Submitted'} ${formatBdtCurrency(BigInt(p.amountPoisha))} via ${p.paymentMethod}`,
          timestamp: new Date(p.createdAt).toISOString(),
          formattedTime: formatDhakaDateTime(p.createdAt),
          type: 'PAYMENT',
        });
      }

      // Add recent meal-off requests
      for (const r of this.mockMealOffRequests.filter((m) => m.membershipId === memberContext.membershipId).slice(0, 3)) {
        activities.push({
          id: r.id,
          action: `Meal-Off ${r.status}`,
          description: `Meal-off request from ${r.startDate} to ${r.endDate} (${r.status})`,
          timestamp: new Date(r.createdAt || new Date()).toISOString(),
          formattedTime: formatDhakaDateTime(r.createdAt || new Date()),
          type: 'MEAL',
        });
      }

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        member: {
          id: memberContext.membershipId,
          userId: memberContext.userId,
          name: memberContext.userName,
          email: memberContext.userEmail,
          phone: memberContext.userPhone,
          avatar: memberContext.userAvatar,
          memberCode: memberContext.memberCode,
          status: memberContext.membershipStatus,
          roleName: memberContext.roleName,
          joinedAt: new Date().toISOString(),
        },
        mess: {
          id: memberContext.tenantId,
          name: memberContext.tenantName,
          slug: memberContext.tenantSlug,
          logo: memberContext.tenantLogo,
          address: 'Dhanmondi, Dhaka',
          city: 'Dhaka',
        },
        overviewCards: {
          room: roomInfo,
          meals: {
            todayStatus: isMealOff ? 'OFF' : 'ACTIVE',
            todayCounts: {
              breakfast: !isMealOff,
              lunch: !isMealOff,
              dinner: !isMealOff,
            },
            currentMonthCount: 36,
          },
          account: {
            currentDueFormatted: financialStatement.closingBalance.formattedBdt,
            currentDuePoisha: financialStatement.closingBalance.poisha,
            totalBilledFormatted: financialStatement.totalNewCharges.formattedBdt,
            totalBilledPoisha: financialStatement.totalNewCharges.poisha,
            lastConfirmedPayment: lastPayment
              ? {
                  amountFormatted: formatBdtCurrency(BigInt(lastPayment.amountPoisha)),
                  amountPoisha: lastPayment.amountPoisha.toString(),
                  method: lastPayment.paymentMethod,
                  date: formatDhakaDateTime(lastPayment.createdAt),
                }
              : null,
          },
          noticesCount: publishedNotices.length,
        },
        monthlyAccountSnapshot: {
          month: currentMonth,
          status: financialStatement.bill?.status || 'CURRENT',
          openingDueFormatted: financialStatement.openingBalance.formattedBdt,
          rentChargesFormatted: financialStatement.newRentCharges.formattedBdt,
          utilityChargesFormatted: financialStatement.utilityCharges.formattedBdt,
          mealChargesFormatted: financialStatement.mealCharges.formattedBdt,
          otherChargesFormatted: financialStatement.otherCharges.formattedBdt,
          totalChargesFormatted: financialStatement.totalNewCharges.formattedBdt,
          confirmedPaymentsFormatted: financialStatement.paymentsReceived.formattedBdt,
          adjustmentsFormatted: financialStatement.creditsAndAdjustments.formattedBdt,
          closingDueFormatted: financialStatement.closingBalance.formattedBdt,
        },
        mealSnapshot: {
          todayDate,
          todayMenu: {
            breakfast: todayLog?.breakfastMenu || 'Egg Khichuri & Tea',
            lunch: todayLog?.lunchMenu || 'Rice, Fish Curry, Dal & Salad',
            dinner: todayLog?.dinnerMenu || 'Rice, Chicken Masala & Vegetables',
            notes: todayLog?.specialNotes || null,
          },
          pendingMealOffRequestsCount: pendingMealOffRequests.length,
          recentMealOffStatus: isMealOff ? 'Meal Off Active' : null,
        },
        recentActivities: activities.slice(0, 5),
        notices: publishedNotices.slice(0, 5).map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          category: n.category || 'GENERAL',
          priority: n.priority || 'NORMAL',
          isPinned: Boolean(n.isPinned),
          publishedAt: formatDhakaDateTime(n.createdAt),
        })),
        quickActions: [
          {
            id: 'view-statement',
            label: 'My Account Statement',
            href: `/portal/${tenantSlug}/account`,
            icon: 'Wallet',
            description: 'Itemized charges, dues, and payments',
          },
          {
            id: 'view-meals',
            label: 'My Meals Calendar',
            href: `/portal/${tenantSlug}/meals`,
            icon: 'Utensils',
            description: 'Daily bookings, menus, and meal counts',
          },
          {
            id: 'request-meal-off',
            label: 'Request Meal-Off',
            href: `/portal/${tenantSlug}/meals?action=request-off`,
            icon: 'CalendarOff',
            description: 'Submit dates before evening cutoff',
          },
          {
            id: 'submit-payment',
            label: 'Submit Deposit Payment',
            href: `/portal/${tenantSlug}/payments?action=submit`,
            icon: 'CreditCard',
            description: 'bKash, Nagad, bank, or cash voucher',
          },
          {
            id: 'view-notices',
            label: 'Mess Notice Board',
            href: `/portal/${tenantSlug}/notices`,
            icon: 'Megaphone',
            description: 'Important mess updates and announcements',
          },
        ],
      };
    }

    // -------------------------------------------------------------------------
    // DATABASE RESOLUTION
    // -------------------------------------------------------------------------

    // 1. Room Assignment
    const activeAssignment = await this.db.roomAssignment.findFirst({
      where: {
        membershipId: memberContext.membershipId,
        status: 'ACTIVE',
      },
      include: {
        room: true,
        bed: true,
      },
    });

    let roomInfo = {
      isAssigned: false,
      roomNumber: null as string | null,
      bedLabel: null as string | null,
      monthlyRentFormatted: null as string | null,
      rentPoisha: '0',
    };
    if (activeAssignment && activeAssignment.room) {
      const rent = activeAssignment.monthlyRent ? toPoisha(Number(activeAssignment.monthlyRent)) : BigInt(0);
      roomInfo = {
        isAssigned: true,
        roomNumber: activeAssignment.room.roomNumber,
        bedLabel: activeAssignment.bed?.bedNumber || 'Room Space',
        monthlyRentFormatted: formatBdtCurrency(rent),
        rentPoisha: rent.toString(),
      };
    }

    // 2. Meal Status & Today's Menu
    const todayOffRequest = await this.db.mealOffRequest.findFirst({
      where: {
        membershipId: memberContext.membershipId,
        status: 'APPROVED',
        startDate: { lte: todayDate },
        endDate: { gte: todayDate },
      },
    });
    const isMealOff = Boolean(todayOffRequest);

    const pendingMealOffRequestsCount = await this.db.mealOffRequest.count({
      where: {
        membershipId: memberContext.membershipId,
        status: 'PENDING',
      },
    });

    const todayLog = await this.db.mealDailyLog.findFirst({
      where: {
        tenantId: memberContext.tenantId,
        dateString: todayDate,
      },
    });

    // 3. Authoritative Financial Statement
    let financialStatement: any = null;
    try {
      financialStatement = await financeService.getMemberStatement(
        tenantSlug,
        memberContext.membershipId,
        currentMonth,
        {
          isOwner: false,
          permissions: new Set(['finance.view']),
          viewerMembershipId: memberContext.membershipId,
        }
      );
    } catch {
      financialStatement = {
        openingBalance: { formattedBdt: '৳0.00', poisha: '0' },
        newRentCharges: { formattedBdt: '৳0.00', poisha: '0' },
        utilityCharges: { formattedBdt: '৳0.00', poisha: '0' },
        mealCharges: { formattedBdt: '৳0.00', poisha: '0' },
        otherCharges: { formattedBdt: '৳0.00', poisha: '0' },
        totalNewCharges: { formattedBdt: '৳0.00', poisha: '0' },
        paymentsReceived: { formattedBdt: '৳0.00', poisha: '0' },
        creditsAndAdjustments: { formattedBdt: '৳0.00', poisha: '0' },
        closingBalance: { formattedBdt: '৳0.00', poisha: '0' },
        bill: null,
        payments: [],
      };
    }

    // 4. Last Confirmed Payment
    const lastPayment = await this.db.memberPayment.findFirst({
      where: {
        membershipId: memberContext.membershipId,
        status: 'CONFIRMED',
      },
      orderBy: { createdAt: 'desc' },
    });

    // 5. Published Notices
    const notices = await this.db.notice.findMany({
      where: {
        tenantId: memberContext.tenantId,
        status: 'PUBLISHED',
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });

    // 6. Recent Activities
    const activities: Array<{
      id: string;
      action: string;
      description: string;
      timestamp: string;
      formattedTime: string;
      type: 'PAYMENT' | 'MEAL' | 'ROOM' | 'NOTICE' | 'ACCOUNT';
    }> = [];

    const recentPayments = await this.db.memberPayment.findMany({
      where: { membershipId: memberContext.membershipId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    for (const p of recentPayments) {
      activities.push({
        id: p.id,
        action: `Payment ${p.status}`,
        description: `${p.status === 'CONFIRMED' ? 'Confirmed' : 'Submitted'} ${formatBdtCurrency(BigInt(p.amountPoisha))} via ${p.paymentMethod}`,
        timestamp: p.createdAt.toISOString(),
        formattedTime: formatDhakaDateTime(p.createdAt),
        type: 'PAYMENT',
      });
    }

    const recentMealOffs = await this.db.mealOffRequest.findMany({
      where: { membershipId: memberContext.membershipId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    for (const r of recentMealOffs) {
      activities.push({
        id: r.id,
        action: `Meal-Off ${r.status}`,
        description: `Meal-off request from ${r.startDate} to ${r.endDate} (${r.status})`,
        timestamp: r.createdAt.toISOString(),
        formattedTime: formatDhakaDateTime(r.createdAt),
        type: 'MEAL',
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      member: {
        id: memberContext.membershipId,
        userId: memberContext.userId,
        name: memberContext.userName,
        email: memberContext.userEmail,
        phone: memberContext.userPhone,
        avatar: memberContext.userAvatar,
        memberCode: memberContext.memberCode,
        status: memberContext.membershipStatus,
        roleName: memberContext.roleName,
        joinedAt: new Date().toISOString(),
      },
      mess: {
        id: memberContext.tenantId,
        name: memberContext.tenantName,
        slug: memberContext.tenantSlug,
        logo: memberContext.tenantLogo,
        address: 'Dhanmondi, Dhaka',
        city: 'Dhaka',
      },
      overviewCards: {
        room: roomInfo,
        meals: {
          todayStatus: isMealOff ? 'OFF' : 'ACTIVE',
          todayCounts: {
            breakfast: !isMealOff,
            lunch: !isMealOff,
            dinner: !isMealOff,
          },
          currentMonthCount: 30,
        },
        account: {
          currentDueFormatted: financialStatement.closingBalance.formattedBdt,
          currentDuePoisha: financialStatement.closingBalance.poisha,
          totalBilledFormatted: financialStatement.totalNewCharges.formattedBdt,
          totalBilledPoisha: financialStatement.totalNewCharges.poisha,
          lastConfirmedPayment: lastPayment
            ? {
                amountFormatted: formatBdtCurrency(BigInt(lastPayment.amountPoisha)),
                amountPoisha: lastPayment.amountPoisha.toString(),
                method: lastPayment.paymentMethod,
                date: formatDhakaDateTime(lastPayment.createdAt),
              }
            : null,
        },
        noticesCount: notices.length,
      },
      monthlyAccountSnapshot: {
        month: currentMonth,
        status: financialStatement.bill?.status || 'CURRENT',
        openingDueFormatted: financialStatement.openingBalance.formattedBdt,
        rentChargesFormatted: financialStatement.newRentCharges.formattedBdt,
        utilityChargesFormatted: financialStatement.utilityCharges.formattedBdt,
        mealChargesFormatted: financialStatement.mealCharges.formattedBdt,
        otherChargesFormatted: financialStatement.otherCharges.formattedBdt,
        totalChargesFormatted: financialStatement.totalNewCharges.formattedBdt,
        confirmedPaymentsFormatted: financialStatement.paymentsReceived.formattedBdt,
        adjustmentsFormatted: financialStatement.creditsAndAdjustments.formattedBdt,
        closingDueFormatted: financialStatement.closingBalance.formattedBdt,
      },
      mealSnapshot: {
        todayDate,
        todayMenu: {
          breakfast: todayLog?.breakfastMenu || null,
          lunch: todayLog?.lunchMenu || null,
          dinner: todayLog?.dinnerMenu || null,
          notes: todayLog?.specialNotes || null,
        },
        pendingMealOffRequestsCount,
        recentMealOffStatus: isMealOff ? 'Meal Off Active' : null,
      },
      recentActivities: activities.slice(0, 5),
      notices: notices.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        priority: n.priority,
        isPinned: n.isPinned,
        publishedAt: formatDhakaDateTime(n.createdAt),
      })),
      quickActions: [
        {
          id: 'view-statement',
          label: 'My Account Statement',
          href: `/portal/${tenantSlug}/account`,
          icon: 'Wallet',
          description: 'Itemized charges, dues, and payments',
        },
        {
          id: 'view-meals',
          label: 'My Meals Calendar',
          href: `/portal/${tenantSlug}/meals`,
          icon: 'Utensils',
          description: 'Daily bookings, menus, and meal counts',
        },
        {
          id: 'request-meal-off',
          label: 'Request Meal-Off',
          href: `/portal/${tenantSlug}/meals?action=request-off`,
          icon: 'CalendarOff',
          description: 'Submit dates before evening cutoff',
        },
        {
          id: 'submit-payment',
          label: 'Submit Deposit Payment',
          href: `/portal/${tenantSlug}/payments?action=submit`,
          icon: 'CreditCard',
          description: 'bKash, Nagad, bank, or cash voucher',
        },
        {
          id: 'view-notices',
          label: 'Mess Notice Board',
          href: `/portal/${tenantSlug}/notices`,
          icon: 'Megaphone',
          description: 'Important mess updates and announcements',
        },
      ],
    };
  }

  /**
   * Fetches the member's profile for the designated mess tenant.
   * Exposes resident identity, verified contacts, and emergency information.
   * Strictly prevents exposing password hashes, internal admin notes, or unauthorized records.
   */
  async getMemberProfile(userId: string, tenantSlug: string): Promise<MemberProfileDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    const editableFields = ['phone', 'emergencyContactName', 'emergencyContactPhone', 'avatar'];
    const protectedFields = [
      'name',
      'email',
      'memberCode',
      'status',
      'role',
      'tenantId',
      'membershipId',
      'balancePoisha',
      'roomId',
    ];

    if (!this.isDbAvailable()) {
      const user = this.mockUsers.find((u) => u.id === userId);
      const membership = this.mockMemberships.find((m) => m.id === ctx.membershipId);

      return {
        userId: ctx.userId,
        membershipId: ctx.membershipId,
        name: user?.name || ctx.userName,
        email: user?.email || ctx.userEmail,
        phone: user?.phone || ctx.userPhone,
        avatar: user?.avatar || ctx.userAvatar,
        emergencyContactName: membership?.emergencyContactName || null,
        emergencyContactPhone: membership?.emergencyContactPhone || null,
        memberCode: membership?.memberCode || ctx.memberCode,
        status: membership?.status || ctx.membershipStatus,
        joinedAt: membership?.joinedAt ? formatDhakaDateTime(membership.joinedAt) : null,
        roleName: ctx.roleName,
        tenantName: ctx.tenantName,
        tenantSlug: ctx.tenantSlug,
        editableFields,
        protectedFields,
      };
    }

    const [user, membership] = await Promise.all([
      this.db.user.findUnique({
        where: { id: ctx.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      }),
      this.db.membership.findUnique({
        where: { id: ctx.membershipId },
        select: {
          id: true,
          memberCode: true,
          status: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          joinedAt: true,
          role: { select: { name: true } },
        },
      }),
    ]);

    if (!user || !membership) {
      throw new NotFoundError('Member record not found.');
    }

    return {
      userId: user.id,
      membershipId: membership.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.profileImage,
      emergencyContactName: membership.emergencyContactName,
      emergencyContactPhone: membership.emergencyContactPhone,
      memberCode: membership.memberCode,
      status: membership.status,
      joinedAt: membership.joinedAt ? formatDhakaDateTime(membership.joinedAt) : null,
      roleName: membership.role?.name || ctx.roleName,
      tenantName: ctx.tenantName,
      tenantSlug: ctx.tenantSlug,
      editableFields,
      protectedFields,
    };
  }

  /**
   * Updates self-service profile fields (phone, emergency contacts, avatar).
   * Strictly enforces anti-mass-assignment against roles, status, balances, or tenancy.
   * If a resident attempts to update their authoritative name, a MemberRequest (PROFILE_UPDATE)
   * is automatically generated for Admin review rather than directly modifying the record.
   */
  async updateMemberProfile(
    userId: string,
    tenantSlug: string,
    input: UpdateMemberProfileInput
  ): Promise<{ profile: MemberProfileDto; message: string; requestedNameChange?: boolean }> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    // 1. Validate & normalize phone numbers
    let normalizedPhone: string | null | undefined = undefined;
    if (input.phone !== undefined) {
      normalizedPhone = normalizeBdPhone(input.phone);
    }

    let normalizedEmergencyPhone: string | null | undefined = undefined;
    if (input.emergencyContactPhone !== undefined) {
      normalizedEmergencyPhone = normalizeBdPhone(input.emergencyContactPhone);
    }

    // 2. Validate emergency contact name length
    let sanitizedEmergencyName: string | null | undefined = undefined;
    if (input.emergencyContactName !== undefined) {
      if (input.emergencyContactName && input.emergencyContactName.trim().length > 100) {
        throw new ValidationError('Emergency contact name cannot exceed 100 characters.');
      }
      sanitizedEmergencyName = input.emergencyContactName?.trim() || null;
    }

    // 3. Validate avatar
    let sanitizedAvatar: string | null | undefined = undefined;
    if (input.avatar !== undefined) {
      if (input.avatar && input.avatar.length > 1000) {
        throw new ValidationError('Avatar URL is too long.');
      }
      sanitizedAvatar = input.avatar?.trim() || null;
    }

    // 4. Handle Name Modification workflow (requires Admin approval)
    let requestedNameChange = false;
    if (input.name !== undefined && input.name !== null && input.name.trim() !== '') {
      const trimmedName = input.name.trim();
      if (trimmedName.length < 2) {
        throw new ValidationError('Full name must be at least 2 characters.');
      }
      if (trimmedName !== ctx.userName) {
        // Enforce approval workflow: create PROFILE_UPDATE MemberRequest
        await this.createMemberRequest(userId, tenantSlug, {
          requestType: 'PROFILE_UPDATE',
          title: 'Name Update Request',
          description: `Resident requested legal name change from "${ctx.userName}" to "${trimmedName}".`,
          metadata: {
            requestedName: trimmedName,
            previousName: ctx.userName,
          },
        });
        requestedNameChange = true;
      }
    }

    // 5. Persist permitted updates
    if (!this.isDbAvailable()) {
      const user = this.mockUsers.find((u) => u.id === userId);
      if (user) {
        if (normalizedPhone !== undefined) user.phone = normalizedPhone;
        if (sanitizedAvatar !== undefined) user.avatar = sanitizedAvatar;
      }

      const membership = this.mockMemberships.find((m) => m.id === ctx.membershipId);
      if (membership) {
        if (sanitizedEmergencyName !== undefined) {
          membership.emergencyContactName = sanitizedEmergencyName;
        }
        if (normalizedEmergencyPhone !== undefined) {
          membership.emergencyContactPhone = normalizedEmergencyPhone;
        }
      }
    } else {
      const userUpdateData: Record<string, any> = {};
      if (normalizedPhone !== undefined) userUpdateData.phone = normalizedPhone;
      if (sanitizedAvatar !== undefined) userUpdateData.profileImage = sanitizedAvatar;

      if (Object.keys(userUpdateData).length > 0) {
        await this.db.user.update({
          where: { id: ctx.userId },
          data: userUpdateData,
        });
      }

      const membershipUpdateData: Record<string, any> = {};
      if (sanitizedEmergencyName !== undefined) {
        membershipUpdateData.emergencyContactName = sanitizedEmergencyName;
      }
      if (normalizedEmergencyPhone !== undefined) {
        membershipUpdateData.emergencyContactPhone = normalizedEmergencyPhone;
      }

      if (Object.keys(membershipUpdateData).length > 0) {
        await this.db.membership.update({
          where: { id: ctx.membershipId },
          data: membershipUpdateData,
        });
      }
    }

    const updatedProfile = await this.getMemberProfile(userId, tenantSlug);

    const message = requestedNameChange
      ? 'Profile details updated. Your name change request was submitted to Mess Admin for verification.'
      : 'Profile updated successfully.';

    return {
      profile: updatedProfile,
      message,
      requestedNameChange,
    };
  }

  /**
   * Retrieves resident room assignment details, occupancy statistics, assignment history,
   * and available rooms for potential room change requests.
   * Protects privacy by displaying occupant counts rather than exposing other residents' personal names.
   */
  async getMemberRoomDetails(userId: string, tenantSlug: string): Promise<MemberRoomDetailsDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!this.isDbAvailable()) {
      const activeAssignment = this.mockRoomAssignments.find(
        (a) => a.membershipId === ctx.membershipId && a.status === 'ACTIVE'
      );

      let currentAssignment: MemberRoomDetailsDto['currentAssignment'] = null;

      if (activeAssignment) {
        const room = this.mockRooms.find((r) => r.id === activeAssignment.roomId);
        const bed = this.mockBeds.find((b) => b.id === activeAssignment.bedId);

        const currentOccupantsCount = this.mockRoomAssignments.filter(
          (a) => a.roomId === activeAssignment.roomId && a.status === 'ACTIVE'
        ).length;

        currentAssignment = {
          assignmentId: activeAssignment.id,
          roomId: activeAssignment.roomId,
          roomNumber: room?.roomNumber || 'Unknown Room',
          roomName: room?.name || null,
          floor: room?.floor || null,
          building: room?.building || null,
          capacity: room?.capacity || 1,
          currentOccupantsCount,
          bedNumber: bed?.label || bed?.bedNumber || 'Assigned Bed',
          monthlyRentPoisha: String(activeAssignment.agreedRentPoisha),
          formattedRent: formatBdtCurrency(activeAssignment.agreedRentPoisha),
          startDate: formatDhakaDateTime(activeAssignment.startDate),
          facilities: room?.facilities || ['WiFi'],
          status: activeAssignment.status,
          roomRules: 'Quiet hours start at 11:00 PM. No unauthorized guests overnight.',
        };
      }

      const pastAssignments = this.mockRoomAssignments.filter(
        (a) => a.membershipId === ctx.membershipId && a.status !== 'ACTIVE'
      );

      const assignmentHistory = pastAssignments.map((pa) => {
        const room = this.mockRooms.find((r) => r.id === pa.roomId);
        const bed = this.mockBeds.find((b) => b.id === pa.bedId);
        return {
          id: pa.id,
          roomNumber: pa.roomNumber || room?.roomNumber || 'Room',
          bedNumber: pa.bedNumber || bed?.label || bed?.bedNumber || 'Bed',
          startDate: formatDhakaDateTime(pa.startDate),
          endDate: pa.endDate ? formatDhakaDateTime(pa.endDate) : null,
          monthlyRentPoisha: String(pa.agreedRentPoisha),
          formattedRent: formatBdtCurrency(pa.agreedRentPoisha),
          status: pa.status,
          moveOutReason: pa.moveOutReason || null,
        };
      });

      const availableRooms = this.mockRooms
        .map((r) => {
          const occupants = this.mockRoomAssignments.filter(
            (a) => a.roomId === r.id && a.status === 'ACTIVE'
          ).length;
          return {
            id: r.id,
            roomNumber: r.roomNumber,
            name: r.name,
            floor: r.floor,
            building: r.building,
            capacity: r.capacity,
            availableBedsCount: Math.max(0, r.capacity - occupants),
            defaultRentPoisha: String(r.defaultRent),
            formattedDefaultRent: formatBdtCurrency(r.defaultRent),
            facilities: r.facilities || [],
          };
        })
        .filter((r) => r.availableBedsCount > 0);

      return {
        hasAssignment: Boolean(currentAssignment),
        currentAssignment,
        assignmentHistory,
        availableRooms,
      };
    }

    const activeAssignment = await this.db.roomAssignment.findFirst({
      where: {
        membershipId: ctx.membershipId,
        status: 'ACTIVE',
      },
      include: {
        room: true,
        bed: true,
      },
    });

    let currentAssignment: MemberRoomDetailsDto['currentAssignment'] = null;

    if (activeAssignment) {
      const currentOccupantsCount = await this.db.roomAssignment.count({
        where: {
          roomId: activeAssignment.roomId,
          status: 'ACTIVE',
        },
      });

      const rentBigInt = toPoisha(activeAssignment.monthlyRent.toNumber());

      currentAssignment = {
        assignmentId: activeAssignment.id,
        roomId: activeAssignment.roomId,
        roomNumber: activeAssignment.room.roomNumber,
        roomName: activeAssignment.room.name,
        floor: activeAssignment.room.floor,
        building: activeAssignment.room.building,
        capacity: activeAssignment.room.capacity,
        currentOccupantsCount,
        bedNumber: activeAssignment.bed?.bedNumber || 'Assigned Bed',
        monthlyRentPoisha: String(rentBigInt),
        formattedRent: formatBdtCurrency(rentBigInt),
        startDate: formatDhakaDateTime(activeAssignment.startDate),
        facilities: Array.isArray(activeAssignment.room.facilities)
          ? (activeAssignment.room.facilities as string[])
          : [],
        status: activeAssignment.status,
        roomRules: 'Quiet hours start at 11:00 PM. No unauthorized guests overnight.',
      };
    }

    const pastAssignments = await this.db.roomAssignment.findMany({
      where: {
        membershipId: ctx.membershipId,
        status: { not: 'ACTIVE' },
      },
      include: {
        room: true,
        bed: true,
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    const assignmentHistory = pastAssignments.map((pa) => {
      const rentBigInt = toPoisha(pa.monthlyRent.toNumber());
      return {
        id: pa.id,
        roomNumber: pa.room.roomNumber,
        bedNumber: pa.bed?.bedNumber || 'Bed',
        startDate: formatDhakaDateTime(pa.startDate),
        endDate: pa.endDate ? formatDhakaDateTime(pa.endDate) : null,
        monthlyRentPoisha: String(rentBigInt),
        formattedRent: formatBdtCurrency(rentBigInt),
        status: pa.status,
        moveOutReason: pa.moveOutReason,
      };
    });

    const allRooms = await this.db.room.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: { not: 'INACTIVE' },
      },
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: {
        roomNumber: 'asc',
      },
    });

    const availableRooms = allRooms
      .filter((r) => r.assignments.length < r.capacity)
      .map((r) => {
        const rentBigInt = toPoisha(r.defaultRent.toNumber());
        return {
          id: r.id,
          roomNumber: r.roomNumber,
          name: r.name,
          floor: r.floor,
          building: r.building,
          capacity: r.capacity,
          availableBedsCount: Math.max(0, r.capacity - r.assignments.length),
          defaultRentPoisha: String(rentBigInt),
          formattedDefaultRent: formatBdtCurrency(rentBigInt),
          facilities: Array.isArray(r.facilities) ? (r.facilities as string[]) : [],
        };
      });

    return {
      hasAssignment: Boolean(currentAssignment),
      currentAssignment,
      assignmentHistory,
      availableRooms,
    };
  }

  /**
   * Lists personal requests for the authenticated member.
   * Strictly enforces anti-IDOR checks: requests are scoped exclusively to the member's membershipId.
   */
  async listMemberRequests(
    userId: string,
    tenantSlug: string,
    filter?: { requestType?: string; status?: string }
  ): Promise<MemberRequestDto[]> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!this.isDbAvailable()) {
      let requests = this.mockMemberRequests.filter(
        (r) => r.membershipId === ctx.membershipId && r.tenantId === ctx.tenantId
      );

      if (filter?.requestType) {
        requests = requests.filter((r) => r.requestType === filter.requestType);
      }
      if (filter?.status) {
        requests = requests.filter((r) => r.status === filter.status);
      }

      return requests.map((r) => {
        const room = r.requestedRoomId ? this.mockRooms.find((rm) => rm.id === r.requestedRoomId) : null;
        return {
          id: r.id,
          referenceNumber: r.referenceNumber || `REQ-${r.id.slice(-6).toUpperCase()}`,
          membershipId: r.membershipId,
          memberName: ctx.userName,
          tenantId: r.tenantId,
          requestType: r.requestType,
          title: r.title,
          description: r.description,
          requestedRoomId: r.requestedRoomId,
          requestedRoomNumber: room?.roomNumber || null,
          preferredDate: r.preferredDate ? formatDhakaDateTime(r.preferredDate) : null,
          status: r.status,
          adminResponse: r.adminResponse,
          reviewedBy: r.reviewedBy,
          reviewedAt: r.reviewedAt ? formatDhakaDateTime(r.reviewedAt) : null,
          createdAt: formatDhakaDateTime(r.createdAt),
          updatedAt: formatDhakaDateTime(r.updatedAt),
          metadata: r.metadata || null,
        };
      });
    }

    const whereClause: Record<string, any> = {
      membershipId: ctx.membershipId,
      tenantId: ctx.tenantId,
    };

    if (filter?.requestType) {
      whereClause.requestType = filter.requestType;
    }
    if (filter?.status) {
      whereClause.status = filter.status;
    }

    const requests = await this.db.memberRequest.findMany({
      where: whereClause,
      include: {
        requestedRoom: true,
        reviewer: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map((r) => ({
      id: r.id,
      referenceNumber: `REQ-${r.id.slice(-6).toUpperCase()}`,
      membershipId: r.membershipId,
      memberName: ctx.userName,
      tenantId: r.tenantId,
      requestType: r.requestType as any,
      title: r.title,
      description: r.description,
      requestedRoomId: r.requestedRoomId,
      requestedRoomNumber: r.requestedRoom?.roomNumber || null,
      preferredDate: r.preferredDate ? formatDhakaDateTime(r.preferredDate) : null,
      status: r.status as any,
      adminResponse: r.adminResponse,
      reviewedBy: r.reviewer?.name || null,
      reviewedAt: r.reviewedAt ? formatDhakaDateTime(r.reviewedAt) : null,
      createdAt: formatDhakaDateTime(r.createdAt),
      updatedAt: formatDhakaDateTime(r.updatedAt),
      metadata: r.metadata as Record<string, any> | null,
    }));
  }

  /**
   * Creates a new personal self-service request (ROOM_CHANGE, PROFILE_UPDATE, MAINTENANCE, GENERAL_QUERY).
   * Validates description length and room existence for room transfers.
   * All requests initiate with status: 'PENDING' and do NOT immediately alter system state.
   */
  async createMemberRequest(
    userId: string,
    tenantSlug: string,
    input: CreateMemberRequestInput
  ): Promise<MemberRequestDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!input.description || input.description.trim().length < 5) {
      throw new ValidationError('Please provide a detailed description (at least 5 characters).');
    }

    const validTypes = ['ROOM_CHANGE', 'PROFILE_UPDATE', 'MAINTENANCE', 'GENERAL_QUERY'];
    if (!validTypes.includes(input.requestType)) {
      throw new ValidationError(`Invalid request type. Must be one of: ${validTypes.join(', ')}`);
    }

    let verifiedRoomId: string | null = null;
    let verifiedRoomNumber: string | null = null;

    if (input.requestType === 'ROOM_CHANGE' && input.requestedRoomId) {
      if (!this.isDbAvailable()) {
        const room = this.mockRooms.find(
          (r) => r.id === input.requestedRoomId && r.tenantId === ctx.tenantId
        );
        if (!room) {
          throw new ValidationError('Requested room does not exist in this mess.');
        }
        verifiedRoomId = room.id;
        verifiedRoomNumber = room.roomNumber;
      } else {
        const room = await this.db.room.findFirst({
          where: {
            id: input.requestedRoomId,
            tenantId: ctx.tenantId,
          },
        });
        if (!room) {
          throw new ValidationError('Requested room does not exist in this mess.');
        }
        verifiedRoomId = room.id;
        verifiedRoomNumber = room.roomNumber;
      }
    }

    const defaultTitle = input.title?.trim() || `${input.requestType.replace(/_/g, ' ')} Request`;

    const now = new Date();
    const referenceNumber = `REQ-${Date.now().toString().slice(-6)}`;

    if (!this.isDbAvailable()) {
      const newReq = {
        id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        referenceNumber,
        tenantId: ctx.tenantId,
        membershipId: ctx.membershipId,
        requestType: input.requestType,
        title: defaultTitle,
        description: input.description.trim(),
        requestedRoomId: verifiedRoomId,
        preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
        status: 'PENDING' as const,
        adminResponse: null,
        reviewedBy: null,
        reviewedAt: null,
        metadata: input.metadata || null,
        createdAt: now,
        updatedAt: now,
      };

      this.mockMemberRequests.unshift(newReq);

      return {
        id: newReq.id,
        referenceNumber: newReq.referenceNumber,
        membershipId: newReq.membershipId,
        memberName: ctx.userName,
        tenantId: newReq.tenantId,
        requestType: newReq.requestType,
        title: newReq.title,
        description: newReq.description,
        requestedRoomId: newReq.requestedRoomId,
        requestedRoomNumber: verifiedRoomNumber,
        preferredDate: newReq.preferredDate ? formatDhakaDateTime(newReq.preferredDate) : null,
        status: newReq.status,
        adminResponse: newReq.adminResponse,
        reviewedBy: newReq.reviewedBy,
        reviewedAt: null,
        createdAt: formatDhakaDateTime(newReq.createdAt),
        updatedAt: formatDhakaDateTime(newReq.updatedAt),
        metadata: newReq.metadata,
      };
    }

    const created = await this.db.memberRequest.create({
      data: {
        tenantId: ctx.tenantId,
        membershipId: ctx.membershipId,
        requestType: input.requestType,
        title: defaultTitle,
        description: input.description.trim(),
        requestedRoomId: verifiedRoomId,
        preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
        status: 'PENDING',
        metadata: input.metadata ? (input.metadata as any) : undefined,
      },
      include: {
        requestedRoom: true,
      },
    });

    return {
      id: created.id,
      referenceNumber: `REQ-${created.id.slice(-6).toUpperCase()}`,
      membershipId: created.membershipId,
      memberName: ctx.userName,
      tenantId: created.tenantId,
      requestType: created.requestType as any,
      title: created.title,
      description: created.description,
      requestedRoomId: created.requestedRoomId,
      requestedRoomNumber: created.requestedRoom?.roomNumber || verifiedRoomNumber,
      preferredDate: created.preferredDate ? formatDhakaDateTime(created.preferredDate) : null,
      status: created.status as any,
      adminResponse: created.adminResponse,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: formatDhakaDateTime(created.createdAt),
      updatedAt: formatDhakaDateTime(created.updatedAt),
      metadata: created.metadata as Record<string, any> | null,
    };
  }

  /**
   * Cancels a pending request initiated by the authenticated member.
   * Requests that have already been reviewed (APPROVED, REJECTED) or CANCELLED cannot be cancelled.
   */
  async cancelMemberRequest(
    userId: string,
    tenantSlug: string,
    requestId: string
  ): Promise<MemberRequestDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!this.isDbAvailable()) {
      const req = this.mockMemberRequests.find((r) => r.id === requestId);
      if (!req || req.membershipId !== ctx.membershipId || req.tenantId !== ctx.tenantId) {
        throw new NotFoundError('Request not found or access denied.');
      }

      if (req.status !== 'PENDING') {
        throw new ValidationError(`Cannot cancel a request that has already been ${req.status.toLowerCase()}.`);
      }

      req.status = 'CANCELLED';
      req.updatedAt = new Date();

      const room = req.requestedRoomId ? this.mockRooms.find((rm) => rm.id === req.requestedRoomId) : null;

      return {
        id: req.id,
        referenceNumber: req.referenceNumber || `REQ-${req.id.slice(-6).toUpperCase()}`,
        membershipId: req.membershipId,
        memberName: ctx.userName,
        tenantId: req.tenantId,
        requestType: req.requestType,
        title: req.title,
        description: req.description,
        requestedRoomId: req.requestedRoomId,
        requestedRoomNumber: room?.roomNumber || null,
        preferredDate: req.preferredDate ? formatDhakaDateTime(req.preferredDate) : null,
        status: req.status,
        adminResponse: req.adminResponse,
        reviewedBy: req.reviewedBy,
        reviewedAt: req.reviewedAt ? formatDhakaDateTime(req.reviewedAt) : null,
        createdAt: formatDhakaDateTime(req.createdAt),
        updatedAt: formatDhakaDateTime(req.updatedAt),
        metadata: req.metadata || null,
      };
    }

    const existing = await this.db.memberRequest.findFirst({
      where: {
        id: requestId,
        membershipId: ctx.membershipId,
        tenantId: ctx.tenantId,
      },
      include: {
        requestedRoom: true,
        reviewer: { select: { name: true } },
      },
    });

    if (!existing) {
      throw new NotFoundError('Request not found or access denied.');
    }

    if (existing.status !== 'PENDING') {
      throw new ValidationError(
        `Cannot cancel a request that has already been ${existing.status.toLowerCase()}.`
      );
    }

    const updated = await this.db.memberRequest.update({
      where: { id: existing.id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        requestedRoom: true,
        reviewer: { select: { name: true } },
      },
    });

    return {
      id: updated.id,
      referenceNumber: `REQ-${updated.id.slice(-6).toUpperCase()}`,
      membershipId: updated.membershipId,
      memberName: ctx.userName,
      tenantId: updated.tenantId,
      requestType: updated.requestType as any,
      title: updated.title,
      description: updated.description,
      requestedRoomId: updated.requestedRoomId,
      requestedRoomNumber: updated.requestedRoom?.roomNumber || null,
      preferredDate: updated.preferredDate ? formatDhakaDateTime(updated.preferredDate) : null,
      status: updated.status as any,
      adminResponse: updated.adminResponse,
      reviewedBy: updated.reviewer?.name || null,
      reviewedAt: updated.reviewedAt ? formatDhakaDateTime(updated.reviewedAt) : null,
      createdAt: formatDhakaDateTime(updated.createdAt),
      updatedAt: formatDhakaDateTime(updated.updatedAt),
      metadata: updated.metadata as Record<string, any> | null,
    };
  }

  /**
   * Administrative review action for member requests (APPROVED or REJECTED).
   * Verifies room capacity and performs an atomic room transfer transaction when ROOM_CHANGE is approved.
   * Updates resident authoritative profile when PROFILE_UPDATE is approved.
   */
  async reviewMemberRequest(
    adminUserId: string,
    tenantSlug: string,
    requestId: string,
    decision: 'APPROVED' | 'REJECTED',
    adminResponse?: string
  ): Promise<MemberRequestDto> {
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      throw new ValidationError('Decision must be either APPROVED or REJECTED.');
    }

    const now = new Date();

    if (!this.isDbAvailable()) {
      const req = this.mockMemberRequests.find((r) => r.id === requestId);
      if (!req) {
        throw new NotFoundError('Request not found.');
      }

      if (req.status !== 'PENDING') {
        throw new ValidationError(`Request has already been ${req.status.toLowerCase()}.`);
      }

      if (decision === 'APPROVED') {
        if (req.requestType === 'ROOM_CHANGE' && req.requestedRoomId) {
          const room = this.mockRooms.find((rm) => rm.id === req.requestedRoomId);
          if (!room) {
            throw new ValidationError('Requested room no longer exists.');
          }

          const currentOccupants = this.mockRoomAssignments.filter(
            (a) => a.roomId === room.id && a.status === 'ACTIVE'
          ).length;

          if (currentOccupants >= room.capacity) {
            throw new ValidationError('Requested room is currently at maximum capacity.');
          }

          // Complete previous active assignment
          const previousActive = this.mockRoomAssignments.find(
            (a) => a.membershipId === req.membershipId && a.status === 'ACTIVE'
          );
          if (previousActive) {
            previousActive.status = 'TRANSFERRED';
            previousActive.endDate = now;
            previousActive.moveOutReason = 'Room change request approved';
          }

          // Create new active assignment
          this.mockRoomAssignments.push({
            id: `asgn_${Date.now()}`,
            membershipId: req.membershipId,
            roomId: room.id,
            bedId: `bed_${room.id}_auto`,
            agreedRentPoisha: room.defaultRent,
            status: 'ACTIVE',
            startDate: now,
            endDate: null,
            moveOutReason: null,
          });
        }

        if (req.requestType === 'PROFILE_UPDATE' && req.metadata?.requestedName) {
          const membership = this.mockMemberships.find((m) => m.id === req.membershipId);
          if (membership) {
            const user = this.mockUsers.find((u) => u.id === membership.userId);
            if (user) {
              user.name = req.metadata.requestedName;
            }
          }
        }
      }

      req.status = decision;
      req.adminResponse = adminResponse || null;
      req.reviewedBy = 'Mess Admin';
      req.reviewedAt = now;
      req.updatedAt = now;

      const room = req.requestedRoomId ? this.mockRooms.find((rm) => rm.id === req.requestedRoomId) : null;

      return {
        id: req.id,
        referenceNumber: req.referenceNumber || `REQ-${req.id.slice(-6).toUpperCase()}`,
        membershipId: req.membershipId,
        memberName: 'Resident',
        tenantId: req.tenantId,
        requestType: req.requestType,
        title: req.title,
        description: req.description,
        requestedRoomId: req.requestedRoomId,
        requestedRoomNumber: room?.roomNumber || null,
        preferredDate: req.preferredDate ? formatDhakaDateTime(req.preferredDate) : null,
        status: req.status,
        adminResponse: req.adminResponse,
        reviewedBy: req.reviewedBy,
        reviewedAt: formatDhakaDateTime(req.reviewedAt),
        createdAt: formatDhakaDateTime(req.createdAt),
        updatedAt: formatDhakaDateTime(req.updatedAt),
        metadata: req.metadata || null,
      };
    }

    const req = await this.db.memberRequest.findUnique({
      where: { id: requestId },
      include: {
        membership: { include: { user: true } },
        requestedRoom: { include: { assignments: { where: { status: 'ACTIVE' } } } },
      },
    });

    if (!req) {
      throw new NotFoundError('Request not found.');
    }

    if (req.status !== 'PENDING') {
      throw new ValidationError(`Request has already been ${req.status.toLowerCase()}.`);
    }

    if (decision === 'APPROVED') {
      if (req.requestType === 'ROOM_CHANGE' && req.requestedRoomId) {
        const room = req.requestedRoom;
        if (!room) {
          throw new ValidationError('Requested room no longer exists.');
        }

        if (room.assignments.length >= room.capacity) {
          throw new ValidationError('Requested room is currently at maximum capacity.');
        }

        // Run atomic room transfer
        await this.db.$transaction([
          // 1. Terminate current active assignment
          this.db.roomAssignment.updateMany({
            where: {
              membershipId: req.membershipId,
              status: 'ACTIVE',
            },
            data: {
              status: 'TRANSFERRED',
              endDate: now,
              moveOutReason: 'Room change request approved',
            },
          }),
          // 2. Create new active assignment
          this.db.roomAssignment.create({
            data: {
              tenantId: req.tenantId,
              roomId: room.id,
              membershipId: req.membershipId,
              monthlyRent: room.defaultRent,
              status: 'ACTIVE',
              startDate: now,
              assignedByUserId: adminUserId,
              notes: `Transferred via approved request ${req.id}`,
            },
          }),
          // 3. Update request status
          this.db.memberRequest.update({
            where: { id: req.id },
            data: {
              status: 'APPROVED',
              adminResponse: adminResponse || 'Room transfer request approved and activated.',
              reviewedByUserId: adminUserId,
              reviewedAt: now,
            },
          }),
        ]);
      } else if (req.requestType === 'PROFILE_UPDATE' && (req.metadata as any)?.requestedName) {
        await this.db.$transaction([
          this.db.user.update({
            where: { id: req.membership.userId },
            data: { name: (req.metadata as any).requestedName },
          }),
          this.db.memberRequest.update({
            where: { id: req.id },
            data: {
              status: 'APPROVED',
              adminResponse: adminResponse || 'Profile name update approved.',
              reviewedByUserId: adminUserId,
              reviewedAt: now,
            },
          }),
        ]);
      } else {
        await this.db.memberRequest.update({
          where: { id: req.id },
          data: {
            status: 'APPROVED',
            adminResponse: adminResponse || null,
            reviewedByUserId: adminUserId,
            reviewedAt: now,
          },
        });
      }
    } else {
      await this.db.memberRequest.update({
        where: { id: req.id },
        data: {
          status: 'REJECTED',
          adminResponse: adminResponse || 'Request reviewed and rejected by mess management.',
          reviewedByUserId: adminUserId,
          reviewedAt: now,
        },
      });
    }

    const updated = await this.db.memberRequest.findUniqueOrThrow({
      where: { id: req.id },
      include: {
        requestedRoom: true,
        reviewer: { select: { name: true } },
        membership: { include: { user: true } },
      },
    });

    return {
      id: updated.id,
      referenceNumber: `REQ-${updated.id.slice(-6).toUpperCase()}`,
      membershipId: updated.membershipId,
      memberName: updated.membership.user.name,
      tenantId: updated.tenantId,
      requestType: updated.requestType as any,
      title: updated.title,
      description: updated.description,
      requestedRoomId: updated.requestedRoomId,
      requestedRoomNumber: updated.requestedRoom?.roomNumber || null,
      preferredDate: updated.preferredDate ? formatDhakaDateTime(updated.preferredDate) : null,
      status: updated.status as any,
      adminResponse: updated.adminResponse,
      reviewedBy: updated.reviewer?.name || null,
      reviewedAt: updated.reviewedAt ? formatDhakaDateTime(updated.reviewedAt) : null,
      createdAt: formatDhakaDateTime(updated.createdAt),
      updatedAt: formatDhakaDateTime(updated.updatedAt),
      metadata: updated.metadata as Record<string, any> | null,
    };
  }
}

export const memberPortalService = new MemberPortalService();
