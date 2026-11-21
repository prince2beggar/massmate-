import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import type { SubscriptionAnalyticsSummary } from './types';

export class SubscriptionAnalyticsService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Aggregates live subscription and financial metrics.
   * INVARIANT: Never presents unpaid or pending invoices as collected revenue.
   * MRR is calculated strictly from active confirmed recurring subscriptions.
   */
  async getSubscriptionAnalytics(): Promise<SubscriptionAnalyticsSummary> {
    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return this.getZeroSummary();
      }
    }

    try {
      const [
        totalActive,
        trialAccounts,
        expiredTrials,
        starterSubscribers,
        customSubscribers,
        cancelledSubscriptions,
        activeSubscriptions,
        confirmedInvoices,
        pendingInvoices,
        totalTrialsStarted,
        convertedTrials,
      ] = await Promise.all([
        this.db.subscription.count({ where: { status: 'ACTIVE' } }),
        this.db.subscription.count({ where: { status: 'TRIALING' } }),
        this.db.subscription.count({ where: { trialStatus: 'EXPIRED' } }),
        this.db.subscription.count({ where: { subscriptionType: 'STARTER', status: 'ACTIVE' } }),
        this.db.subscription.count({ where: { subscriptionType: 'CUSTOM_BUSINESS', status: 'ACTIVE' } }),
        this.db.subscription.count({ where: { status: 'CANCELLED' } }),
        this.db.subscription.findMany({
          where: { status: 'ACTIVE' },
          select: { priceLocked: true },
        }),
        this.db.subscriptionInvoice.findMany({
          where: { paymentStatus: 'CONFIRMED' },
          select: { amount: true },
        }),
        this.db.subscriptionInvoice.findMany({
          where: { paymentStatus: 'PENDING' },
          select: { amount: true },
        }),
        this.db.subscription.count({
          where: { trialStatus: { in: ['ACTIVE', 'EXPIRED', 'CONVERTED'] } },
        }),
        this.db.subscription.count({
          where: { trialStatus: 'CONVERTED' },
        }),
      ]);

      // Calculate MRR from active subscriptions' locked prices
      const mrrBdt = activeSubscriptions.reduce(
        (sum: number, s: any) => sum + Number(s.priceLocked || 0),
        0
      );

      // Calculate Collected Revenue from strictly confirmed payments
      const collectedRevenueBdt = confirmedInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.amount || 0),
        0
      );

      // Calculate Pending Revenue from open/unconfirmed invoices
      const pendingRevenueBdt = pendingInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.amount || 0),
        0
      );

      // Calculate Trial Conversion Rate
      const trialToPaidConversionRate =
        totalTrialsStarted > 0
          ? Number(((convertedTrials / totalTrialsStarted) * 100).toFixed(1))
          : 0;

      return {
        totalActiveSubscriptions: totalActive,
        trialAccounts,
        expiredTrials,
        starterSubscribers,
        customBusinessSubscribers: customSubscribers,
        cancelledSubscriptions,
        mrrBdt,
        collectedRevenueBdt,
        pendingRevenueBdt,
        trialToPaidConversionRate,
      };
    } catch {
      return this.getZeroSummary();
    }
  }

  private getZeroSummary(): SubscriptionAnalyticsSummary {
    return {
      totalActiveSubscriptions: 0,
      trialAccounts: 0,
      expiredTrials: 0,
      starterSubscribers: 0,
      customBusinessSubscribers: 0,
      cancelledSubscriptions: 0,
      mrrBdt: 0,
      collectedRevenueBdt: 0,
      pendingRevenueBdt: 0,
      trialToPaidConversionRate: 0,
    };
  }
}

export const subscriptionAnalyticsService = new SubscriptionAnalyticsService();
