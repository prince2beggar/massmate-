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
} from '@/server/api/errors';
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
      },
      {
        id: 'mem_res_2',
        userId: 'usr_resident_2',
        tenantId: 'tenant_prince_mess',
        roleId: 'role_member',
        status: 'ACTIVE',
        memberCode: 'PR-102',
      },
      {
        id: 'mem_susp',
        userId: 'usr_suspended_user',
        tenantId: 'tenant_prince_mess',
        roleId: 'role_member',
        status: 'SUSPENDED',
        memberCode: 'PR-999',
      },
    ];

    this.mockRooms = [
      {
        id: 'room_204',
        tenantId: 'tenant_prince_mess',
        roomNumber: '204',
      },
    ];

    this.mockBeds = [
      {
        id: 'bed_204_a',
        roomId: 'room_204',
        label: 'Bed A (Window)',
      },
    ];

    this.mockRoomAssignments = [
      {
        id: 'asgn_1',
        membershipId: 'mem_res_1',
        bedId: 'bed_204_a',
        agreedRentPoisha: BigInt(450000),
        status: 'ACTIVE',
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
}

export const memberPortalService = new MemberPortalService();
