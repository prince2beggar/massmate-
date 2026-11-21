import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import type { TenantType, SupportTicketCategory } from '@/types/database';

export type AnalyticsDatePreset =
  | 'today'
  | '7d'
  | '30d'
  | '90d'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

export interface AnalyticsDateRangeFilter {
  preset: AnalyticsDatePreset;
  startDate: Date;
  endDate: Date;
}

export interface PlatformAnalyticsDto {
  dateRange: {
    preset: AnalyticsDatePreset;
    startDate: string;
    endDate: string;
  };
  tenants: {
    total: number;
    newInRange: number;
    active: number;
    suspended: number;
    typeDistribution: Record<TenantType, number>;
    growthTrend: Array<{ date: string; count: number }>;
  };
  users: {
    total: number;
    active: number;
    newInRange: number;
    membershipDistribution: {
      zero: number;
      single: number;
      multiple: number;
    };
    growthTrend: Array<{ date: string; count: number }>;
  };
  subscriptions: {
    freeTrialAccounts: number;
    activeStarter: number;
    customBusiness: number;
    expired: number;
    cancelled: number;
    trialToPaidConversionRate: number; // percentage
  };
  revenue: {
    totalCollectedRevenue: number;
    monthlyCollectedRevenue: number;
    outstandingInvoices: number;
    refunds: number;
    netCollectedRevenue: number;
    currency: string;
    revenueByPlan: Array<{ planName: string; amount: number; percentage: number }>;
  };
  domains: {
    totalPlatformSubdomains: number;
    totalCustomDomains: number;
    pendingVerification: number;
    verifiedDomains: number;
    failedVerification: number;
  };
  support: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    averageResolutionHours: number;
    categoryDistribution: Record<string, number>;
    volumeTrend: Array<{ date: string; count: number }>;
  };
}

export function resolveDateRange(
  preset: AnalyticsDatePreset = '30d',
  customStart?: string | Date,
  customEnd?: string | Date
): AnalyticsDateRangeFilter {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date(now);

  switch (preset) {
    case 'today': {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    }
    case '7d': {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    }
    case '30d': {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    }
    case '90d': {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    }
    case 'this_month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    }
    case 'last_month': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'this_year': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    }
    case 'custom': {
      if (customStart) startDate = new Date(customStart);
      if (customEnd) endDate = new Date(customEnd);
      break;
    }
  }

  return { preset, startDate, endDate };
}

export class PlatformAnalyticsService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Computes holistic platform analytics across all subsystems.
   */
  async getAnalytics(filter: AnalyticsDateRangeFilter): Promise<PlatformAnalyticsDto> {
    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return this.getEmptyAnalytics(filter);
      }
    }

    const { startDate, endDate } = filter;

    const [
      // Tenant queries
      totalTenants,
      newTenantsInRange,
      activeTenants,
      suspendedTenants,
      tenantsByType,
      // User queries
      totalUsers,
      activeUsers,
      newUsersInRange,
      usersWithMemberships,
      // Subscription queries
      trialSubscriptions,
      activeStarterSubscriptions,
      customSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,
      convertedSubscriptions,
      // Revenue queries
      confirmedInvoices,
      periodInvoices,
      pendingInvoices,
      refundedInvoices,
      invoicesByPlan,
      // Domain queries
      platformSubdomains,
      customDomains,
      pendingDomains,
      verifiedDomains,
      failedDomains,
      // Support queries
      allTickets,
      openTickets,
      resolvedTickets,
      resolvedTicketsWithTimes,
      ticketsByCategory,
    ] = await Promise.all([
      this.db.tenant.count(),
      this.db.tenant.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      this.db.tenant.count({ where: { status: 'ACTIVE' } }),
      this.db.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.db.tenant.groupBy ? this.db.tenant.groupBy({ by: ['tenantType'], _count: { id: true } }) : [],

      this.db.user.count(),
      this.db.user.count({ where: { status: 'ACTIVE' } }),
      this.db.user.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      this.db.user.findMany ? this.db.user.findMany({ select: { _count: { select: { memberships: true } } } }) : [],

      this.db.subscription.count({ where: { trialStatus: 'ACTIVE' } }),
      this.db.subscription.count({ where: { status: 'ACTIVE', plan: { planType: 'STARTER' } } }),
      this.db.subscription.count({ where: { status: 'ACTIVE', plan: { planType: 'CUSTOM_BUSINESS' } } }),
      this.db.subscription.count({ where: { status: 'EXPIRED' } }),
      this.db.subscription.count({ where: { status: 'CANCELLED' } }),
      this.db.subscription.count({ where: { trialStatus: 'CONVERTED' } }),

      this.db.subscriptionInvoice.findMany ? this.db.subscriptionInvoice.findMany({
        where: { paymentStatus: 'CONFIRMED' },
        select: { amount: true },
      }) : [],
      this.db.subscriptionInvoice.findMany ? this.db.subscriptionInvoice.findMany({
        where: { paymentStatus: 'CONFIRMED', createdAt: { gte: startDate, lte: endDate } },
        select: { amount: true },
      }) : [],
      this.db.subscriptionInvoice.findMany ? this.db.subscriptionInvoice.findMany({
        where: { paymentStatus: 'PENDING' },
        select: { amount: true },
      }) : [],
      this.db.subscriptionInvoice.findMany ? this.db.subscriptionInvoice.findMany({
        where: { paymentStatus: 'REFUNDED' },
        select: { amount: true },
      }) : [],
      this.db.subscriptionInvoice.findMany ? this.db.subscriptionInvoice.findMany({
        where: { paymentStatus: 'CONFIRMED' },
        select: { amount: true, subscription: { select: { plan: { select: { name: true } } } } },
      }) : [],

      this.db.domain.count({ where: { domainType: 'PLATFORM_SUBDOMAIN' } }),
      this.db.domain.count({ where: { domainType: 'CUSTOM_DOMAIN' } }),
      this.db.domain.count({ where: { verificationStatus: 'PENDING' } }),
      this.db.domain.count({ where: { verificationStatus: 'VERIFIED' } }),
      this.db.domain.count({ where: { verificationStatus: 'FAILED' } }),

      this.db.supportTicket.count(),
      this.db.supportTicket.count({ where: { status: { in: ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] } } }),
      this.db.supportTicket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      this.db.supportTicket.findMany ? this.db.supportTicket.findMany({
        where: { resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }) : [],
      this.db.supportTicket.groupBy ? this.db.supportTicket.groupBy({ by: ['category'], _count: { id: true } }) : [],
    ]);

    // Financial Computations
    const totalCollected = (confirmedInvoices || []).reduce((acc: number, inv: any) => acc + Number(inv.amount || 0), 0);
    const monthlyCollected = (periodInvoices || []).reduce((acc: number, inv: any) => acc + Number(inv.amount || 0), 0);
    const outstanding = (pendingInvoices || []).reduce((acc: number, inv: any) => acc + Number(inv.amount || 0), 0);
    const totalRefunds = (refundedInvoices || []).reduce((acc: number, inv: any) => acc + Number(inv.amount || 0), 0);
    const netRevenue = Math.max(0, totalCollected - totalRefunds);

    // Revenue by Plan
    const planRevenueMap: Record<string, number> = {};
    (invoicesByPlan || []).forEach((inv: any) => {
      const planName = inv.subscription?.plan?.name || 'Standard Starter';
      planRevenueMap[planName] = (planRevenueMap[planName] || 0) + Number(inv.amount || 0);
    });
    const revenueByPlan = Object.entries(planRevenueMap).map(([planName, amount]) => ({
      planName,
      amount,
      percentage: totalCollected > 0 ? Math.round((amount / totalCollected) * 100) : 0,
    }));

    // User memberships breakdown
    let zeroMem = 0;
    let singleMem = 0;
    let multiMem = 0;
    (usersWithMemberships || []).forEach((u: any) => {
      const count = u._count?.memberships || 0;
      if (count === 0) zeroMem++;
      else if (count === 1) singleMem++;
      else multiMem++;
    });

    // Tenant Type breakdown
    const typeDistribution: Record<TenantType, number> = {
      STUDENT_MESS: 0,
      BACHELOR_MESS: 0,
      HOSTEL: 0,
      SHARED_APARTMENT: 0,
      OTHER: 0,
    };
    (tenantsByType || []).forEach((t: any) => {
      if (t.tenantType in typeDistribution) {
        typeDistribution[t.tenantType as TenantType] = t._count?.id || 0;
      }
    });

    // Conversion rate
    const totalTrials = trialSubscriptions + convertedSubscriptions;
    const conversionRate = totalTrials > 0 ? Math.round((convertedSubscriptions / totalTrials) * 100) : 0;

    // Average Resolution Time (Hours)
    let avgResolutionHours = 0;
    if (resolvedTicketsWithTimes && resolvedTicketsWithTimes.length > 0) {
      const totalHours = resolvedTicketsWithTimes.reduce((acc: number, t: any) => {
        const diffMs = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
        return acc + Math.max(0, diffMs / (1000 * 60 * 60));
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedTicketsWithTimes.length) * 10) / 10;
    }

    // Category Distribution
    const categoryDistribution: Record<string, number> = {};
    (ticketsByCategory || []).forEach((c: any) => {
      categoryDistribution[c.category] = c._count?.id || 0;
    });

    return {
      dateRange: {
        preset: filter.preset,
        startDate: filter.startDate.toISOString(),
        endDate: filter.endDate.toISOString(),
      },
      tenants: {
        total: totalTenants,
        newInRange: newTenantsInRange,
        active: activeTenants,
        suspended: suspendedTenants,
        typeDistribution,
        growthTrend: [
          { date: startDate.toISOString().split('T')[0], count: Math.max(0, totalTenants - newTenantsInRange) },
          { date: endDate.toISOString().split('T')[0], count: totalTenants },
        ],
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        newInRange: newUsersInRange,
        membershipDistribution: {
          zero: zeroMem,
          single: singleMem,
          multiple: multiMem,
        },
        growthTrend: [
          { date: startDate.toISOString().split('T')[0], count: Math.max(0, totalUsers - newUsersInRange) },
          { date: endDate.toISOString().split('T')[0], count: totalUsers },
        ],
      },
      subscriptions: {
        freeTrialAccounts: trialSubscriptions,
        activeStarter: activeStarterSubscriptions,
        customBusiness: customSubscriptions,
        expired: expiredSubscriptions,
        cancelled: cancelledSubscriptions,
        trialToPaidConversionRate: conversionRate,
      },
      revenue: {
        totalCollectedRevenue: totalCollected,
        monthlyCollectedRevenue: monthlyCollected,
        outstandingInvoices: outstanding,
        refunds: totalRefunds,
        netCollectedRevenue: netRevenue,
        currency: 'BDT',
        revenueByPlan,
      },
      domains: {
        totalPlatformSubdomains: platformSubdomains,
        totalCustomDomains: customDomains,
        pendingVerification: pendingDomains,
        verifiedDomains: verifiedDomains,
        failedVerification: failedDomains,
      },
      support: {
        totalTickets: allTickets,
        openTickets,
        resolvedTickets,
        averageResolutionHours: avgResolutionHours,
        categoryDistribution,
        volumeTrend: [
          { date: startDate.toISOString().split('T')[0], count: Math.max(0, allTickets - openTickets) },
          { date: endDate.toISOString().split('T')[0], count: allTickets },
        ],
      },
    };
  }

  private getEmptyAnalytics(filter: AnalyticsDateRangeFilter): PlatformAnalyticsDto {
    return {
      dateRange: {
        preset: filter.preset,
        startDate: filter.startDate.toISOString(),
        endDate: filter.endDate.toISOString(),
      },
      tenants: {
        total: 0,
        newInRange: 0,
        active: 0,
        suspended: 0,
        typeDistribution: { STUDENT_MESS: 0, BACHELOR_MESS: 0, HOSTEL: 0, SHARED_APARTMENT: 0, OTHER: 0 },
        growthTrend: [],
      },
      users: {
        total: 0,
        active: 0,
        newInRange: 0,
        membershipDistribution: { zero: 0, single: 0, multiple: 0 },
        growthTrend: [],
      },
      subscriptions: {
        freeTrialAccounts: 0,
        activeStarter: 0,
        customBusiness: 0,
        expired: 0,
        cancelled: 0,
        trialToPaidConversionRate: 0,
      },
      revenue: {
        totalCollectedRevenue: 0,
        monthlyCollectedRevenue: 0,
        outstandingInvoices: 0,
        refunds: 0,
        netCollectedRevenue: 0,
        currency: 'BDT',
        revenueByPlan: [],
      },
      domains: {
        totalPlatformSubdomains: 0,
        totalCustomDomains: 0,
        pendingVerification: 0,
        verifiedDomains: 0,
        failedVerification: 0,
      },
      support: {
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        averageResolutionHours: 0,
        categoryDistribution: {},
        volumeTrend: [],
      },
    };
  }
}

export const platformAnalyticsService = new PlatformAnalyticsService();
