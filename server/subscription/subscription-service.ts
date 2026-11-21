import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import { STARTER_PLAN_DEFAULTS, type PlanFeatureKey } from './constants';
import type {
  SubscriptionDto,
  SubscriptionFilterQuery,
  SubscriptionInvoiceDto,
} from './types';
import type {
  SubscriptionStatus,
  TrialStatus,
  PaymentStatus,
  PaymentMethod,
} from '@/types/database';

export interface StartTrialOptions {
  planSlug?: string;
  allowDuplicate?: boolean;
}

export interface RecordPaymentInput {
  tenantId: string;
  amount: number;
  currency?: string;
  periodMonths?: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  notes?: string;
}

export class SubscriptionService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Lists subscriptions with server-side pagination, search, and filtering.
   */
  async listSubscriptions(query: SubscriptionFilterQuery = {}): Promise<{
    subscriptions: SubscriptionDto[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return {
          subscriptions: [],
          pagination: { page, limit, totalCount: 0, totalPages: 0 },
        };
      }
    }

    try {
      const where: any = {};

      if (query.status && query.status !== 'ALL') {
        where.status = query.status;
      }

      if (query.subscriptionType && query.subscriptionType !== 'ALL') {
        where.subscriptionType = query.subscriptionType;
      }

      if (query.search && query.search.trim()) {
        const term = query.search.trim();
        where.OR = [
          { tenant: { name: { contains: term, mode: 'insensitive' } } },
          { tenant: { slug: { contains: term, mode: 'insensitive' } } },
          { plan: { name: { contains: term, mode: 'insensitive' } } },
        ];
      }

      const [totalCount, rows] = await Promise.all([
        this.db.subscription.count({ where }),
        this.db.subscription.findMany({
          where,
          include: {
            tenant: true,
            plan: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      const now = new Date();
      const subscriptions: SubscriptionDto[] = rows.map((s: any) => {
        let trialRemainingDays: number | null = null;
        if (s.status === 'TRIALING' && s.trialEndsAt) {
          const diffMs = new Date(s.trialEndsAt).getTime() - now.getTime();
          trialRemainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }

        return {
          id: s.id,
          tenantId: s.tenantId,
          tenantName: s.tenant?.name || 'Unknown Mess',
          tenantSlug: s.tenant?.slug || '',
          planId: s.planId,
          planName: s.plan?.name || 'Starter Plan',
          subscriptionType: s.subscriptionType,
          status: s.status,
          trialStatus: s.trialStatus,
          trialStartsAt: s.trialStartsAt ? new Date(s.trialStartsAt).toISOString() : null,
          trialEndsAt: s.trialEndsAt ? new Date(s.trialEndsAt).toISOString() : null,
          trialRemainingDays,
          currentPeriodStartsAt: s.currentPeriodStartsAt
            ? new Date(s.currentPeriodStartsAt).toISOString()
            : null,
          currentPeriodEndsAt: s.currentPeriodEndsAt
            ? new Date(s.currentPeriodEndsAt).toISOString()
            : null,
          cancelledAt: s.cancelledAt ? new Date(s.cancelledAt).toISOString() : null,
          priceLocked: Number(s.priceLocked),
          currency: s.currency,
          billingInterval: s.billingInterval,
          entitlements: (Array.isArray(s.entitlements)
            ? s.entitlements
            : s.plan?.entitlements || []) as PlanFeatureKey[],
          limits: (s.limits || s.plan?.limits || {}) as Record<string, number>,
          autoRenewConsent: Boolean(s.autoRenewConsent),
          autoRenewConsentAt: s.autoRenewConsentAt
            ? new Date(s.autoRenewConsentAt).toISOString()
            : null,
          approvedByUserId: s.approvedByUserId,
          approvedAt: s.approvedAt ? new Date(s.approvedAt).toISOString() : null,
          createdAt: new Date(s.createdAt).toISOString(),
          updatedAt: new Date(s.updatedAt).toISOString(),
        };
      });

      return {
        subscriptions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      };
    } catch {
      return {
        subscriptions: [],
        pagination: { page, limit, totalCount: 0, totalPages: 0 },
      };
    }
  }

  /**
   * Retrieves a tenant's subscription by tenant ID.
   */
  async getSubscriptionByTenantId(tenantId: string): Promise<SubscriptionDto | null> {
    try {
      const s = await this.db.subscription.findUnique({
        where: { tenantId },
        include: { tenant: true, plan: true },
      });

      if (!s) return null;

      const now = new Date();
      let trialRemainingDays: number | null = null;
      if (s.status === 'TRIALING' && s.trialEndsAt) {
        const diffMs = new Date(s.trialEndsAt).getTime() - now.getTime();
        trialRemainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        id: s.id,
        tenantId: s.tenantId,
        tenantName: s.tenant?.name || 'Unknown Mess',
        tenantSlug: s.tenant?.slug || '',
        planId: s.planId,
        planName: s.plan?.name || 'Starter Plan',
        subscriptionType: s.subscriptionType,
        status: s.status,
        trialStatus: s.trialStatus,
        trialStartsAt: s.trialStartsAt ? new Date(s.trialStartsAt).toISOString() : null,
        trialEndsAt: s.trialEndsAt ? new Date(s.trialEndsAt).toISOString() : null,
        trialRemainingDays,
        currentPeriodStartsAt: s.currentPeriodStartsAt
          ? new Date(s.currentPeriodStartsAt).toISOString()
          : null,
        currentPeriodEndsAt: s.currentPeriodEndsAt
          ? new Date(s.currentPeriodEndsAt).toISOString()
          : null,
        cancelledAt: s.cancelledAt ? new Date(s.cancelledAt).toISOString() : null,
        priceLocked: Number(s.priceLocked),
        currency: s.currency,
        billingInterval: s.billingInterval,
        entitlements: (Array.isArray(s.entitlements)
          ? s.entitlements
          : s.plan?.entitlements || []) as PlanFeatureKey[],
        limits: (s.limits || s.plan?.limits || {}) as Record<string, number>,
        autoRenewConsent: Boolean(s.autoRenewConsent),
        autoRenewConsentAt: s.autoRenewConsentAt
          ? new Date(s.autoRenewConsentAt).toISOString()
          : null,
        approvedByUserId: s.approvedByUserId,
        approvedAt: s.approvedAt ? new Date(s.approvedAt).toISOString() : null,
        createdAt: new Date(s.createdAt).toISOString(),
        updatedAt: new Date(s.updatedAt).toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Starts a 7-day free trial for a tenant.
   * Enforces duplicate trial policy unless explicitly authorized.
   */
  async startFreeTrial(
    tenantId: string,
    options: StartTrialOptions = {},
    actorUserId?: string
  ): Promise<SubscriptionDto> {
    const existing = await this.db.subscription.findUnique({
      where: { tenantId },
    });

    if (existing && existing.trialStatus !== 'NOT_STARTED' && !options.allowDuplicate) {
      throw new Error('Trial already granted for this tenant. Duplicate trial rejected.');
    }

    const planSlug = options.planSlug || 'starter';
    let plan = await this.db.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      // Create fallback starter plan if not present in DB
      plan = await this.db.plan.create({
        data: {
          name: STARTER_PLAN_DEFAULTS.name,
          slug: STARTER_PLAN_DEFAULTS.slug,
          description: STARTER_PLAN_DEFAULTS.description,
          planType: STARTER_PLAN_DEFAULTS.planType,
          priceMonthly: STARTER_PLAN_DEFAULTS.priceMonthly,
          currency: STARTER_PLAN_DEFAULTS.currency,
          billingInterval: STARTER_PLAN_DEFAULTS.billingInterval,
          trialEligible: true,
          trialDays: 7,
          entitlements: STARTER_PLAN_DEFAULTS.entitlements,
          limits: STARTER_PLAN_DEFAULTS.limits,
          status: 'ACTIVE',
        },
      });
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Exactly 7 days

    const sub = await this.db.subscription.upsert({
      where: { tenantId },
      update: {
        planId: plan.id,
        subscriptionType: plan.planType,
        status: 'TRIALING',
        trialStatus: 'ACTIVE',
        trialStartsAt: now,
        trialEndsAt,
        priceLocked: plan.priceMonthly,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        autoRenewConsent: false, // Explicit consent policy
      },
      create: {
        tenantId,
        planId: plan.id,
        subscriptionType: plan.planType,
        status: 'TRIALING',
        trialStatus: 'ACTIVE',
        trialStartsAt: now,
        trialEndsAt,
        priceLocked: plan.priceMonthly,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        autoRenewConsent: false, // Explicit consent policy
      },
      include: {
        tenant: true,
        plan: true,
      },
    });

    if (actorUserId) {
      await this.logAudit({
        action: 'subscription.trial_started',
        tenantId,
        actorUserId,
        entityId: sub.id,
        description: `Activated 7-day free trial ending on ${trialEndsAt.toISOString()}`,
        afterData: {
          status: 'TRIALING',
          trialStatus: 'ACTIVE',
          trialEndsAt: trialEndsAt.toISOString(),
          planName: plan.name,
        },
      });
    }

    return this.getSubscriptionByTenantId(tenantId) as Promise<SubscriptionDto>;
  }

  /**
   * Extends a trial with mandatory reason and audit logging.
   */
  async extendTrial(
    tenantId: string,
    additionalDays: number,
    reason: string,
    actorUserId: string
  ): Promise<SubscriptionDto> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A valid reason (minimum 5 characters) is required for trial extension.');
    }

    const sub = await this.db.subscription.findUnique({ where: { tenantId } });
    if (!sub) {
      throw new Error(`Subscription for tenant "${tenantId}" not found.`);
    }

    const currentEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : new Date();
    const newEnd = new Date(currentEnd.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    const updated = await this.db.subscription.update({
      where: { tenantId },
      data: {
        status: 'TRIALING',
        trialStatus: 'ACTIVE',
        trialEndsAt: newEnd,
      },
      include: { tenant: true, plan: true },
    });

    await this.logAudit({
      action: 'subscription.trial_extended',
      tenantId,
      actorUserId,
      entityId: sub.id,
      description: `Extended trial by ${additionalDays} days. Reason: ${reason.trim()}`,
      beforeData: { trialEndsAt: sub.trialEndsAt },
      afterData: { trialEndsAt: newEnd, reason: reason.trim() },
    });

    return this.getSubscriptionByTenantId(tenantId) as Promise<SubscriptionDto>;
  }

  /**
   * Records a payment against a subscription.
   * CRITICAL INVARIANT: Only CONFIRMED payments activate or renew paid access!
   * Unconfirmed or PENDING payments do NOT activate paid status.
   */
  async recordPayment(input: RecordPaymentInput, actorUserId: string): Promise<SubscriptionInvoiceDto> {
    const sub = await this.db.subscription.findUnique({
      where: { tenantId: input.tenantId },
      include: { plan: true },
    });

    if (!sub) {
      throw new Error(`No subscription found for tenant "${input.tenantId}".`);
    }

    const now = new Date();
    const periodMonths = input.periodMonths || 1;
    const periodEnd = new Date(now.getTime() + periodMonths * 30 * 24 * 60 * 60 * 1000);

    // Generate unique invoice number
    const timestamp = Date.now().toString().slice(-6);
    const invoiceNumber = `INV-${now.getFullYear()}-${timestamp}`;

    const isConfirmed = input.paymentStatus === 'CONFIRMED';

    // 1. Create Invoice record
    const invoice = await this.db.subscriptionInvoice.create({
      data: {
        invoiceNumber,
        subscriptionId: sub.id,
        tenantId: input.tenantId,
        amount: input.amount,
        currency: input.currency || 'BDT',
        periodStart: now,
        periodEnd,
        dueDate: now,
        paidAt: isConfirmed ? now : null,
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod || null,
        transactionReference: input.transactionReference || null,
        confirmedByUserId: isConfirmed ? actorUserId : null,
        notes: input.notes || null,
      },
      include: {
        tenant: true,
      },
    });

    // 2. State transition rule: ONLY confirmed payments activate paid subscription
    if (isConfirmed) {
      const trialStatus: TrialStatus =
        sub.status === 'TRIALING' ? 'CONVERTED' : sub.trialStatus;

      await this.db.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'ACTIVE',
          trialStatus,
          currentPeriodStartsAt: now,
          currentPeriodEndsAt: periodEnd,
        },
      });

      await this.logAudit({
        action: 'subscription.payment_confirmed',
        tenantId: input.tenantId,
        actorUserId,
        entityId: sub.id,
        description: `Confirmed payment of ${input.amount} ${input.currency || 'BDT'} (${invoiceNumber}). Subscription activated until ${periodEnd.toISOString()}.`,
        afterData: {
          invoiceNumber,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          periodEnd: periodEnd.toISOString(),
          status: 'ACTIVE',
        },
      });
    } else {
      await this.logAudit({
        action: 'subscription.invoice_created',
        tenantId: input.tenantId,
        actorUserId,
        entityId: sub.id,
        description: `Created billing invoice ${invoiceNumber} with status ${input.paymentStatus}. Paid access remains unchanged pending payment confirmation.`,
        afterData: {
          invoiceNumber,
          amount: input.amount,
          status: input.paymentStatus,
        },
      });
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      tenantId: invoice.tenantId,
      tenantName: invoice.tenant?.name || 'Mess',
      amount: Number(invoice.amount),
      currency: invoice.currency,
      periodStart: new Date(invoice.periodStart).toISOString(),
      periodEnd: new Date(invoice.periodEnd).toISOString(),
      dueDate: new Date(invoice.dueDate).toISOString(),
      paidAt: invoice.paidAt ? new Date(invoice.paidAt).toISOString() : null,
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod,
      transactionReference: invoice.transactionReference,
      confirmedByUserId: invoice.confirmedByUserId,
      notes: invoice.notes,
      createdAt: new Date(invoice.createdAt).toISOString(),
    };
  }

  /**
   * Cancels a tenant subscription.
   */
  async cancelSubscription(tenantId: string, reason: string, actorUserId: string): Promise<SubscriptionDto> {
    const sub = await this.db.subscription.findUnique({ where: { tenantId } });
    if (!sub) {
      throw new Error(`Subscription for tenant "${tenantId}" not found.`);
    }

    const now = new Date();
    await this.db.subscription.update({
      where: { tenantId },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
      },
    });

    await this.logAudit({
      action: 'subscription.cancelled',
      tenantId,
      actorUserId,
      entityId: sub.id,
      description: `Cancelled subscription. Reason: ${reason}`,
      afterData: { status: 'CANCELLED', cancelledAt: now.toISOString(), reason },
    });

    return this.getSubscriptionByTenantId(tenantId) as Promise<SubscriptionDto>;
  }

  /**
   * Updates explicit auto-renewal consent.
   * Business invariant: Never charge or auto-renew without explicit consent.
   */
  async updateAutoRenewConsent(tenantId: string, consent: boolean, actorUserId?: string): Promise<SubscriptionDto> {
    const sub = await this.db.subscription.findUnique({ where: { tenantId } });
    if (!sub) {
      throw new Error(`Subscription for tenant "${tenantId}" not found.`);
    }

    const now = new Date();
    await this.db.subscription.update({
      where: { tenantId },
      data: {
        autoRenewConsent: consent,
        autoRenewConsentAt: consent ? now : null,
      },
    });

    if (actorUserId) {
      await this.logAudit({
        action: 'subscription.renewal_consent_updated',
        tenantId,
        actorUserId,
        entityId: sub.id,
        description: `Updated auto-renewal consent to: ${consent}`,
        afterData: { autoRenewConsent: consent },
      });
    }

    return this.getSubscriptionByTenantId(tenantId) as Promise<SubscriptionDto>;
  }

  /**
   * Evaluates trial expiration for a subscription.
   */
  async evaluateTrialExpiration(tenantId: string): Promise<SubscriptionDto | null> {
    const sub = await this.db.subscription.findUnique({ where: { tenantId } });
    if (!sub || sub.status !== 'TRIALING') return null;

    if (sub.trialEndsAt && new Date(sub.trialEndsAt) < new Date()) {
      await this.db.subscription.update({
        where: { tenantId },
        data: {
          status: 'EXPIRED',
          trialStatus: 'EXPIRED',
        },
      });

      await this.logAudit({
        action: 'subscription.trial_expired',
        tenantId,
        entityId: sub.id,
        description: 'Free trial duration elapsed without conversion to paid plan.',
        afterData: { status: 'EXPIRED', trialStatus: 'EXPIRED' },
      });
    }

    return this.getSubscriptionByTenantId(tenantId);
  }

  private async logAudit(params: {
    action: string;
    entityId: string;
    tenantId?: string;
    actorUserId?: string;
    description: string;
    beforeData?: any;
    afterData?: any;
  }) {
    try {
      await this.db.auditLog.create({
        data: {
          action: params.action,
          entityType: 'subscription',
          entityId: params.entityId,
          tenantId: params.tenantId || null,
          actorUserId: params.actorUserId || null,
          description: params.description,
          beforeData: params.beforeData || null,
          afterData: params.afterData || null,
        },
      });
    } catch {
      // Audit failure should not block primary operations
    }
  }
}

export const subscriptionService = new SubscriptionService();
