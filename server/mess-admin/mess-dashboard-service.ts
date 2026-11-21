if (typeof window !== 'undefined') {
  throw new Error('MessDashboardService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import type { TenantContext } from '@/server/tenant/tenant-context';
import { auditService } from '@/server/audit/audit-service';

export const ASIA_DHAKA_TIMEZONE = 'Asia/Dhaka';

export type DashboardPeriodFilter =
  | 'current-month'
  | 'previous-month'
  | 'last-3-months'
  | 'last-6-months'
  | 'custom';

export interface DashboardDateRange {
  period: DashboardPeriodFilter;
  startDate: Date;
  endDate: Date;
  formattedRange: string;
}

export interface PoishaAmount {
  poisha: bigint;
  formattedBdt: string;
}

/**
 * Exact integer Poisha arithmetic to strictly eliminate floating-point calculation errors.
 * 1 BDT = 100 Poisha.
 */
export function toPoisha(amount: unknown): bigint {
  if (amount === null || amount === undefined) return BigInt(0);
  const str =
    typeof amount === 'object' && amount && 'toString' in amount
      ? amount.toString()
      : String(amount);
  const trimmed = str.trim();
  if (!trimmed || isNaN(Number(trimmed))) return BigInt(0);

  const isNeg = trimmed.startsWith('-');
  const cleanStr = isNeg ? trimmed.slice(1) : trimmed;
  const parts = cleanStr.split('.');
  const whole = BigInt(parts[0] || '0') * BigInt(100);
  let fraction = BigInt(0);
  if (parts[1]) {
    const pad = (parts[1] + '00').slice(0, 2);
    fraction = BigInt(pad);
  }
  const total = whole + fraction;
  return isNeg ? -total : total;
}

export function fromPoisha(poisha: bigint): string {
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const isNeg = poisha < zero;
  const abs = isNeg ? -poisha : poisha;
  const whole = abs / hundred;
  const frac = abs % hundred;
  const fracStr = frac.toString().padStart(2, '0');
  return `${isNeg ? '-' : ''}${whole.toString()}.${fracStr}`;
}

export function formatBdtCurrency(poisha: bigint): string {
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const isNeg = poisha < zero;
  const abs = isNeg ? -poisha : poisha;
  const whole = abs / hundred;
  const frac = abs % hundred;
  const wholeFormatted = whole.toLocaleString('en-US');
  const fracStr = frac.toString().padStart(2, '0');
  return `৳${isNeg ? '-' : ''}${wholeFormatted}.${fracStr}`;
}

/**
 * Resolves Date Range for the given period filter in Asia/Dhaka timezone.
 */
export function resolveDhakaDateRange(
  period: DashboardPeriodFilter = 'current-month',
  customStart?: string | Date,
  customEnd?: string | Date
): DashboardDateRange {
  const now = new Date();

  // Get current year and month in Asia/Dhaka
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ASIA_DHAKA_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);

  const year = parseInt(parts.find((p) => p.type === 'year')?.value || `${now.getFullYear()}`, 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || `${now.getMonth() + 1}`, 10) - 1;

  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'previous-month': {
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonth = month === 0 ? 11 : month - 1;
      startDate = new Date(Date.UTC(prevYear, prevMonth, 1, 0, 0, 0, 0));
      // Last day of previous month
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      break;
    }
    case 'last-3-months': {
      startDate = new Date(Date.UTC(year, month - 2, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      break;
    }
    case 'last-6-months': {
      startDate = new Date(Date.UTC(year, month - 5, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      break;
    }
    case 'custom': {
      if (customStart && customEnd) {
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
          endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
        }
      } else {
        startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      }
      break;
    }
    case 'current-month':
    default: {
      startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      break;
    }
  }

  const formattedRange = `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;
  return { period, startDate, endDate, formattedRange };
}

/**
 * Returns greeting and localized current date/time info for Asia/Dhaka.
 */
export function getDhakaWelcomeInfo(messName: string) {
  const now = new Date();

  // Hour in Asia/Dhaka (0-23)
  const hourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ASIA_DHAKA_TIMEZONE,
    hour: 'numeric',
    hour12: false,
  });
  const hour = parseInt(hourFormatter.format(now), 10);

  let greeting = 'Good evening';
  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    greeting = 'Good evening';
  }

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ASIA_DHAKA_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const monthFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ASIA_DHAKA_TIMEZONE,
    month: 'long',
    year: 'numeric',
  });

  return {
    greeting,
    messName,
    currentDate: dateFormatter.format(now),
    currentMonth: monthFormatter.format(now),
    timezone: ASIA_DHAKA_TIMEZONE,
  };
}

export type MessDashboardDbClient = Pick<
  PrismaClient,
  'tenant' | 'membership' | 'role' | 'subscriptionInvoice' | 'auditLog'
>;

export interface MessDashboardOverviewDto {
  welcome: {
    greeting: string;
    messName: string;
    currentDate: string;
    currentMonth: string;
    summary: string;
    timezone: string;
  };
  kpiCards: {
    members: {
      total: number;
      active: number;
      pending: number;
      suspended: number;
      isImplemented: boolean;
    };
    rooms: {
      total: number;
      occupied: number;
      available: number;
      occupancyRate: number;
      isImplemented: boolean;
      statusNote: string;
    };
    meals: {
      totalThisMonth: number;
      todayCount: number;
      systemStatus: 'ACTIVE' | 'INACTIVE' | 'NOT_CONFIGURED';
      isImplemented: boolean;
      statusNote: string;
    };
    monthlyExpenses: {
      totalApproved: string;
      bazarExpenses: string;
      otherExpenses: string;
      currency: string;
      isImplemented: boolean;
      statusNote: string;
    };
    payments: {
      confirmedThisMonth: string;
      confirmedCount: number;
      pendingVerificationCount: number;
      pendingAmount: string;
      currency: string;
      isImplemented: boolean;
    };
    outstandingDues: {
      totalBalance: string;
      membersWithDuesCount: number;
      currency: string;
      isImplemented: boolean;
      statusNote: string;
    };
  };
  financialSummary: {
    dateRange: {
      period: DashboardPeriodFilter;
      startDate: string;
      endDate: string;
      formattedRange: string;
    };
    rentCharges: string;
    utilityCharges: string;
    mealExpenses: string;
    confirmedPayments: string;
    outstandingDues: string;
    approvedExpenses: string;
    netBalance: string;
    currency: string;
    incomeVsExpenseChart: Array<{
      label: string;
      income: number;
      expense: number;
    }>;
  };
  charts: {
    memberStatistics: {
      active: number;
      pending: number;
      inactive: number;
    };
    roomOccupancy: {
      occupied: number;
      available: number;
      isConfigured: boolean;
    };
    mealStatistics: {
      data: Array<{ date: string; count: number }>;
      isConfigured: boolean;
    };
    expenseBreakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  recentActivities: Array<{
    id: string;
    description: string;
    actorName: string;
    actorRole: string;
    createdAt: string;
    module: string;
    action: string;
    status: string;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    icon: string;
    href: string;
    permission: string;
    isAllowed: boolean;
    isImplemented: boolean;
    moduleNote?: string;
  }>;
}

export class MessDashboardService {
  private readonly db: MessDashboardDbClient;

  constructor(customDb?: MessDashboardDbClient) {
    this.db = customDb ?? (defaultPrisma as unknown as MessDashboardDbClient);
  }

  /**
   * Generates the complete, tenant-isolated dashboard overview.
   */
  async getDashboardOverview(
    tenantContext: TenantContext,
    filterInput?: {
      period?: DashboardPeriodFilter;
      startDate?: string | Date;
      endDate?: string | Date;
    }
  ): Promise<MessDashboardOverviewDto> {
    const tenantId = tenantContext.tenantId;
    if (!tenantId) {
      throw new Error('TenantContext missing tenantId');
    }

    const dateRange = resolveDhakaDateRange(
      filterInput?.period ?? 'current-month',
      filterInput?.startDate,
      filterInput?.endDate
    );

    // 1. Parallel Tenant-Scoped Data Fetching
    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      suspendedMembers,
      allInvoices,
      auditLogs,
    ] = await Promise.all([
      // Total memberships in this tenant
      this.db.membership.count({
        where: { tenantId },
      }),
      // Active memberships
      this.db.membership.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      // Pending memberships
      this.db.membership.count({
        where: { tenantId, status: 'PENDING' },
      }),
      // Suspended/Left memberships
      this.db.membership.count({
        where: { tenantId, status: { in: ['SUSPENDED', 'LEFT'] } },
      }),
      // Tenant Invoices / Payments (Subscription/Tenant Invoices)
      this.db.subscriptionInvoice ? this.db.subscriptionInvoice.findMany({
        where: { tenantId },
        select: {
          id: true,
          amount: true,
          paymentStatus: true,
          periodStart: true,
          periodEnd: true,
          paidAt: true,
          createdAt: true,
        },
      }) : Promise.resolve([]),
      // Tenant Audit Logs (Strictly filtered by tenantId)
      this.db.auditLog ? this.db.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          actorUser: {
            select: {
              name: true,
              email: true,
              platformRole: true,
            },
          },
        },
      }) : Promise.resolve([]),
    ]);

    // 2. Financial Aggregations using exact BigInt Poisha
    let confirmedPeriodPoisha = BigInt(0);
    let confirmedPeriodCount = 0;
    let pendingPeriodPoisha = BigInt(0);
    let pendingPeriodCount = 0;

    for (const inv of allInvoices || []) {
      const invDate = inv.paidAt || inv.createdAt;
      const inRange =
        invDate >= dateRange.startDate && invDate <= dateRange.endDate;

      if (inv.paymentStatus === 'CONFIRMED') {
        if (inRange) {
          confirmedPeriodPoisha += toPoisha(inv.amount);
          confirmedPeriodCount++;
        }
      } else if (inv.paymentStatus === 'PENDING') {
        if (inRange) {
          pendingPeriodPoisha += toPoisha(inv.amount);
          pendingPeriodCount++;
        }
      }
      // Note: REJECTED, FAILED, REFUNDED are strictly excluded from confirmed payments
    }

    // 3. Welcome Info
    const welcome = getDhakaWelcomeInfo(tenantContext.tenantName);
    const summary = `${tenantContext.tenantName} is currently operating with ${activeMembers} active member${
      activeMembers === 1 ? '' : 's'
    }. Overview and operations monitoring are active.`;

    // 4. Monthly Expenses & Unimplemented Modules (Rooms, Meals, Bazar, Billing)
    // Note: In Task 29-30, Rooms (T31), Meals (T32), Bazar (T33), Billing (T34) are upcoming.
    // We report real zero with transparent status notes without fake data.
    const zeroPoisha = BigInt(0);

    // 5. Income vs Expense Chart for the selected period
    // Generates comparison slots (e.g. 30 days or month chunks)
    const incomeExpenseChart = this.buildIncomeExpenseChart(
      dateRange,
      confirmedPeriodPoisha
    );

    // 6. Recent Activities
    const recentActivities = (auditLogs || []).map((log: any) => {
      const actorName = log.actorUser?.name || 'System User';
      const actorRole =
        log.actorUserId === tenantContext.userId
          ? tenantContext.roleName
          : log.actorUser?.platformRole || 'Mess Member';

      return {
        id: log.id,
        description: log.description || log.action,
        actorName,
        actorRole,
        createdAt: log.createdAt.toISOString(),
        module: log.entityType || 'General',
        action: log.action,
        status: 'SUCCESS',
      };
    });

    // 7. Quick Actions with granular permission gating
    const quickActions = this.buildQuickActions(tenantContext);

    return {
      welcome: {
        ...welcome,
        summary,
      },
      kpiCards: {
        members: {
          total: totalMembers,
          active: activeMembers,
          pending: pendingMembers,
          suspended: suspendedMembers,
          isImplemented: true,
        },
        rooms: {
          total: 0,
          occupied: 0,
          available: 0,
          occupancyRate: 0,
          isImplemented: false,
          statusNote: 'Room & Seat inventory launches in Task 31',
        },
        meals: {
          totalThisMonth: 0,
          todayCount: 0,
          systemStatus: 'NOT_CONFIGURED',
          isImplemented: false,
          statusNote: 'Daily meal tracking launches in Task 32',
        },
        monthlyExpenses: {
          totalApproved: fromPoisha(zeroPoisha),
          bazarExpenses: fromPoisha(zeroPoisha),
          otherExpenses: fromPoisha(zeroPoisha),
          currency: 'BDT',
          isImplemented: false,
          statusNote: 'Bazar & shared expense tracking launches in Task 33',
        },
        payments: {
          confirmedThisMonth: fromPoisha(confirmedPeriodPoisha),
          confirmedCount: confirmedPeriodCount,
          pendingVerificationCount: pendingPeriodCount,
          pendingAmount: fromPoisha(pendingPeriodPoisha),
          currency: 'BDT',
          isImplemented: true,
        },
        outstandingDues: {
          totalBalance: fromPoisha(zeroPoisha),
          membersWithDuesCount: 0,
          currency: 'BDT',
          isImplemented: false,
          statusNote: 'Automated billing engine launches in Task 34',
        },
      },
      financialSummary: {
        dateRange: {
          period: dateRange.period,
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          formattedRange: dateRange.formattedRange,
        },
        rentCharges: fromPoisha(zeroPoisha),
        utilityCharges: fromPoisha(zeroPoisha),
        mealExpenses: fromPoisha(zeroPoisha),
        confirmedPayments: fromPoisha(confirmedPeriodPoisha),
        outstandingDues: fromPoisha(zeroPoisha),
        approvedExpenses: fromPoisha(zeroPoisha),
        netBalance: fromPoisha(confirmedPeriodPoisha), // Net = Confirmed - Expenses
        currency: 'BDT',
        incomeVsExpenseChart: incomeExpenseChart,
      },
      charts: {
        memberStatistics: {
          active: activeMembers,
          pending: pendingMembers,
          inactive: suspendedMembers,
        },
        roomOccupancy: {
          occupied: 0,
          available: 0,
          isConfigured: false,
        },
        mealStatistics: {
          data: [],
          isConfigured: false,
        },
        expenseBreakdown: [],
      },
      recentActivities,
      quickActions,
    };
  }

  /**
   * Builds Income vs Expense Chart points based on range.
   */
  private buildIncomeExpenseChart(
    dateRange: DashboardDateRange,
    confirmedPoisha: bigint
  ): Array<{ label: string; income: number; expense: number }> {
    const incomeBdt = Number(fromPoisha(confirmedPoisha));

    if (dateRange.period === 'last-6-months' || dateRange.period === 'last-3-months') {
      const months = dateRange.period === 'last-6-months' ? 6 : 3;
      const results: Array<{ label: string; income: number; expense: number }> = [];
      const currentMonth = dateRange.endDate.getMonth();
      const currentYear = dateRange.endDate.getFullYear();

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(currentYear, currentMonth - i, 1));
        const monthLabel = d.toLocaleString('en-US', { month: 'short' });
        // The active month has the actual confirmed income; previous placeholder months have zero
        const isCurrent = i === 0;
        results.push({
          label: monthLabel,
          income: isCurrent ? incomeBdt : 0,
          expense: 0,
        });
      }
      return results;
    }

    // Default: Single period comparison
    return [
      {
        label: dateRange.period === 'previous-month' ? 'Prev Month' : 'This Month',
        income: incomeBdt,
        expense: 0,
      },
    ];
  }

  /**
   * Constructs Quick Actions with RBAC permission enforcement and implementation status.
   */
  private buildQuickActions(tenantContext: TenantContext) {
    const slug = tenantContext.tenantSlug;
    const permissions = tenantContext.permissions;
    const isOwner = tenantContext.isOwner;

    const has = (key: string) => isOwner || permissions.has(key);

    return [
      {
        id: 'add-member',
        label: 'Add Member',
        icon: 'UserPlus',
        href: `/mess/${slug}/members?action=add`,
        permission: 'members.create',
        isAllowed: has('members.create') || has('members.invite'),
        isImplemented: false,
        moduleNote: 'Member Management module launches in Task 30',
      },
      {
        id: 'add-room',
        label: 'Add Room',
        icon: 'Bed',
        href: `/mess/${slug}/rooms?action=add`,
        permission: 'rooms.create',
        isAllowed: has('rooms.create'),
        isImplemented: false,
        moduleNote: 'Room & Seat Inventory launches in Task 31',
      },
      {
        id: 'record-bazar',
        label: 'Record Bazar Expense',
        icon: 'ShoppingCart',
        href: `/mess/${slug}/bazar?action=record`,
        permission: 'bazar.create',
        isAllowed: has('bazar.create'),
        isImplemented: false,
        moduleNote: 'Bazar & Shared Expense module launches in Task 33',
      },
      {
        id: 'record-payment',
        label: 'Record Payment',
        icon: 'CreditCard',
        href: `/mess/${slug}/payments?action=record`,
        permission: 'payments.create',
        isAllowed: has('payments.create'),
        isImplemented: false,
        moduleNote: 'Payment Gateway & Ledger launches in Task 34',
      },
      {
        id: 'update-meal',
        label: 'Update Meal Info',
        icon: 'Utensils',
        href: `/mess/${slug}/meals?action=update`,
        permission: 'meals.update',
        isAllowed: has('meals.update') || has('meals.create'),
        isImplemented: false,
        moduleNote: 'Daily Meal Management launches in Task 32',
      },
      {
        id: 'publish-notice',
        label: 'Publish Notice',
        icon: 'Megaphone',
        href: `/mess/${slug}/notices?action=publish`,
        permission: 'notices.create',
        isAllowed: has('notices.create'),
        isImplemented: false,
        moduleNote: 'Notices & Community launches in Task 35',
      },
      {
        id: 'view-reports',
        label: 'View Reports',
        icon: 'BarChart3',
        href: `/mess/${slug}/reports`,
        permission: 'reports.view',
        isAllowed: has('reports.view'),
        isImplemented: false,
        moduleNote: 'Reports & Export Analytics launches in Task 36',
      },
      {
        id: 'manage-settings',
        label: 'Manage Mess Settings',
        icon: 'Settings',
        href: `/mess/${slug}/settings`,
        permission: 'settings.manage',
        isAllowed: has('settings.manage'),
        isImplemented: false,
        moduleNote: 'Mess Settings module launches in upcoming task',
      },
    ];
  }
}

export const messDashboardService = new MessDashboardService();
