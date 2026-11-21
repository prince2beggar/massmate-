if (typeof window !== 'undefined') {
  throw new Error('PlatformOverviewService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import type { PrismaClient } from '@/generated/prisma/client';

export type DateRangePreset = 'today' | '7d' | '30d' | '90d' | 'this_year' | 'all';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate: Date;
  endDate: Date;
}

export interface TenantMetrics {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  inactive: number;
}

export interface MemberMetrics {
  totalMembers: number;
  activeMembers: number;
}

export interface SubscriptionMetrics {
  isLive: boolean;
  moduleStatus: 'UNAVAILABLE_PHASE3_PENDING' | 'ACTIVE';
  activeSubscriptions: number;
  freeTrialAccounts: number;
  expiredSubscriptions: number;
  customPlans: number;
}

export interface RevenueMetrics {
  isLive: boolean;
  moduleStatus: 'UNAVAILABLE_PHASE3_PENDING' | 'ACTIVE';
  totalCollectedRevenue: number;
  currentMonthRevenue: number;
  pendingPayments: number;
  failedPayments: number;
  currency: string;
}

export interface GrowthPoint {
  date: string;
  label: string;
  count: number;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface PlatformOverviewData {
  range: DateRangePreset;
  rangeLabel: string;
  startDate: string;
  endDate: string;
  system: {
    databaseConfigured: boolean;
    serverTimestamp: string;
    environment: string;
  };
  metrics: {
    tenants: TenantMetrics;
    members: MemberMetrics;
    subscriptions: SubscriptionMetrics;
    revenue: RevenueMetrics;
  };
  charts: {
    tenantGrowth: {
      points: GrowthPoint[];
      hasData: boolean;
    };
    tenantStatusDistribution: {
      active: number;
      pending: number;
      suspended: number;
      inactive: number;
      hasData: boolean;
    };
    monthlyRevenue: {
      hasData: boolean;
      message: string;
      points: Array<{ month: string; amount: number }>;
    };
    planDistribution: {
      hasData: boolean;
      message: string;
      plans: Array<{ name: string; count: number }>;
    };
    trialConversion: {
      hasData: boolean;
      message: string;
      rate: number;
    };
  };
  recentActivity: RecentActivityItem[];
}

export class PlatformOverviewService {
  private readonly db: PrismaClient;

  constructor(customDb?: PrismaClient) {
    this.db = customDb ?? defaultPrisma;
  }

  /**
   * Resolves date boundaries based on user-selected range preset.
   */
  resolveDateRange(preset: string = '30d', customStart?: string, customEnd?: string): DateRangeFilter {
    const now = new Date();
    const end = customEnd ? new Date(customEnd) : now;
    let start: Date;
    let validPreset: DateRangePreset = '30d';

    switch (preset) {
      case 'today':
        validPreset = 'today';
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case '7d':
        validPreset = '7d';
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        validPreset = '90d';
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'this_year':
        validPreset = 'this_year';
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      case 'all':
        validPreset = 'all';
        start = new Date(2025, 0, 1);
        break;
      case '30d':
      default:
        validPreset = '30d';
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    if (customStart) {
      start = new Date(customStart);
    }

    return { preset: validPreset, startDate: start, endDate: end };
  }

  /**
   * Aggregates real platform-wide metrics across tenants, memberships, and audit trails.
   * If Neon PostgreSQL is not yet connected in the local environment, returns safe empty metrics.
   */
  async getOverviewData(preset: string = '30d'): Promise<PlatformOverviewData> {
    const range = this.resolveDateRange(preset);
    const config = inspectDatabaseConfig();

    const rangeLabels: Record<DateRangePreset, string> = {
      today: 'Today',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      this_year: 'This Year (2026)',
      all: 'All Time',
    };

    // If database connection strings are unconfigured, return honest zero metrics
    if (!config.configured || !config.runtimeUrl) {
      return {
        range: range.preset,
        rangeLabel: rangeLabels[range.preset],
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        system: {
          databaseConfigured: false,
          serverTimestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        },
        metrics: {
          tenants: { total: 0, active: 0, pending: 0, suspended: 0, inactive: 0 },
          members: { totalMembers: 0, activeMembers: 0 },
          subscriptions: {
            isLive: false,
            moduleStatus: 'UNAVAILABLE_PHASE3_PENDING',
            activeSubscriptions: 0,
            freeTrialAccounts: 0,
            expiredSubscriptions: 0,
            customPlans: 0,
          },
          revenue: {
            isLive: false,
            moduleStatus: 'UNAVAILABLE_PHASE3_PENDING',
            totalCollectedRevenue: 0,
            currentMonthRevenue: 0,
            pendingPayments: 0,
            failedPayments: 0,
            currency: 'BDT',
          },
        },
        charts: {
          tenantGrowth: { points: [], hasData: false },
          tenantStatusDistribution: { active: 0, pending: 0, suspended: 0, inactive: 0, hasData: false },
          monthlyRevenue: {
            hasData: false,
            message: 'No billing records found. Subscription billing module scheduled for Phase 3.',
            points: [],
          },
          planDistribution: {
            hasData: false,
            message: 'Plan management scheduled for Phase 3 subscription integration.',
            plans: [],
          },
          trialConversion: {
            hasData: false,
            message: 'Conversion tracking requires active billing module.',
            rate: 0,
          },
        },
        recentActivity: [],
      };
    }

    try {
      // 1. Tenant Metrics Aggregation
      const [
        totalTenants,
        activeTenants,
        pendingTenants,
        suspendedTenants,
        inactiveTenants,
        totalMembers,
        activeMembers,
        tenantsInRange,
        auditLogs,
      ] = await Promise.all([
        this.db.tenant.count(),
        this.db.tenant.count({ where: { status: 'ACTIVE' } }),
        this.db.tenant.count({ where: { status: 'PENDING' } }),
        this.db.tenant.count({ where: { status: 'SUSPENDED' } }),
        this.db.tenant.count({ where: { status: 'INACTIVE' } }),
        this.db.membership.count(),
        this.db.membership.count({ where: { status: 'ACTIVE' } }),
        this.db.tenant.findMany({
          where: {
            createdAt: {
              gte: range.startDate,
              lte: range.endDate,
            },
          },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        this.db.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            actorUser: {
              select: { id: true, name: true, email: true },
            },
            tenant: {
              select: { id: true, name: true, slug: true },
            },
          },
        }),
      ]);

      // 2. Compute Tenant Growth Time-Series Buckets
      const growthPoints = this.buildGrowthBuckets(range, tenantsInRange);

      // 3. Map Audit Logs safely
      const recentActivity: RecentActivityItem[] = auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        createdAt: log.createdAt.toISOString(),
        actor: log.actorUser
          ? {
              id: log.actorUser.id,
              name: log.actorUser.name,
              email: log.actorUser.email,
            }
          : null,
        tenant: log.tenant
          ? {
              id: log.tenant.id,
              name: log.tenant.name,
              slug: log.tenant.slug,
            }
          : null,
      }));

      return {
        range: range.preset,
        rangeLabel: rangeLabels[range.preset],
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        system: {
          databaseConfigured: true,
          serverTimestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        },
        metrics: {
          tenants: {
            total: totalTenants,
            active: activeTenants,
            pending: pendingTenants,
            suspended: suspendedTenants,
            inactive: inactiveTenants,
          },
          members: {
            totalMembers,
            activeMembers,
          },
          subscriptions: {
            isLive: false,
            moduleStatus: 'UNAVAILABLE_PHASE3_PENDING',
            activeSubscriptions: 0,
            freeTrialAccounts: 0,
            expiredSubscriptions: 0,
            customPlans: 0,
          },
          revenue: {
            isLive: false,
            moduleStatus: 'UNAVAILABLE_PHASE3_PENDING',
            totalCollectedRevenue: 0,
            currentMonthRevenue: 0,
            pendingPayments: 0,
            failedPayments: 0,
            currency: 'BDT',
          },
        },
        charts: {
          tenantGrowth: {
            points: growthPoints,
            hasData: growthPoints.some((p) => p.count > 0),
          },
          tenantStatusDistribution: {
            active: activeTenants,
            pending: pendingTenants,
            suspended: suspendedTenants,
            inactive: inactiveTenants,
            hasData: totalTenants > 0,
          },
          monthlyRevenue: {
            hasData: false,
            message: 'No billing records found. Subscription billing module scheduled for Phase 3.',
            points: [],
          },
          planDistribution: {
            hasData: false,
            message: 'Plan management scheduled for Phase 3 subscription integration.',
            plans: [],
          },
          trialConversion: {
            hasData: false,
            message: 'Conversion tracking requires active billing module.',
            rate: 0,
          },
        },
        recentActivity,
      };
    } catch (dbError) {
      // In case of transient database connection interruption, return safe degraded response
      return {
        range: range.preset,
        rangeLabel: rangeLabels[range.preset],
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        system: {
          databaseConfigured: false,
          serverTimestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        },
        metrics: {
          tenants: { total: 0, active: 0, pending: 0, suspended: 0, inactive: 0 },
          members: { totalMembers: 0, activeMembers: 0 },
          subscriptions: {
            isLive: false,
            moduleStatus: 'UNAVAILABLE_PHASE3_PENDING',
            activeSubscriptions: 0,
            freeTrialAccounts: 0,
            expiredSubscriptions: 0,
            customPlans: 0,
          },
          revenue: {
            isLive: false,
            moduleStatus: 'UNAVAILABLE_PHASE3_PENDING',
            totalCollectedRevenue: 0,
            currentMonthRevenue: 0,
            pendingPayments: 0,
            failedPayments: 0,
            currency: 'BDT',
          },
        },
        charts: {
          tenantGrowth: { points: [], hasData: false },
          tenantStatusDistribution: { active: 0, pending: 0, suspended: 0, inactive: 0, hasData: false },
          monthlyRevenue: {
            hasData: false,
            message: 'Database connection interrupted.',
            points: [],
          },
          planDistribution: {
            hasData: false,
            message: 'Database connection interrupted.',
            plans: [],
          },
          trialConversion: {
            hasData: false,
            message: 'Database connection interrupted.',
            rate: 0,
          },
        },
        recentActivity: [],
      };
    }
  }

  /**
   * Groups tenant creation timestamps into uniform visual buckets for charts.
   */
  private buildGrowthBuckets(
    range: DateRangeFilter,
    tenants: Array<{ createdAt: Date }>
  ): GrowthPoint[] {
    const bucketCount = range.preset === 'today' ? 6 : range.preset === '7d' ? 7 : range.preset === 'this_year' ? 12 : 10;
    const startTime = range.startDate.getTime();
    const endTime = range.endDate.getTime();
    const duration = Math.max(endTime - startTime, 1);
    const bucketSize = duration / bucketCount;

    const buckets: GrowthPoint[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const bStart = new Date(startTime + i * bucketSize);
      const bEnd = new Date(startTime + (i + 1) * bucketSize);

      let label = bStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (range.preset === 'today') {
        label = bStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (range.preset === 'this_year') {
        label = bStart.toLocaleDateString('en-US', { month: 'short' });
      }

      // Count items falling into this time segment
      const count = tenants.filter(
        (t) => t.createdAt.getTime() >= bStart.getTime() && t.createdAt.getTime() < bEnd.getTime()
      ).length;

      buckets.push({
        date: bStart.toISOString(),
        label,
        count,
      });
    }

    return buckets;
  }
}

export const platformOverviewService = new PlatformOverviewService();
