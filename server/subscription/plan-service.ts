import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import {
  STARTER_PLAN_DEFAULTS,
  CUSTOM_BUSINESS_TEMPLATE_DEFAULTS,
  type PlanFeatureKey,
} from './constants';
import type { PlanDto } from './types';
import type { PlanType, PlanStatus, BillingInterval } from '@/types/database';

export interface CreatePlanInput {
  name: string;
  slug: string;
  description?: string;
  planType: PlanType;
  priceMonthly: number;
  currency?: string;
  billingInterval?: BillingInterval;
  trialEligible?: boolean;
  trialDays?: number;
  entitlements: string[];
  limits?: Record<string, number>;
  status?: PlanStatus;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  priceMonthly?: number;
  billingInterval?: BillingInterval;
  trialEligible?: boolean;
  trialDays?: number;
  entitlements?: string[];
  limits?: Record<string, number>;
  status?: PlanStatus;
}

export class PlanService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Lists all available SaaS plans.
   */
  async listPlans(includeInactive = false): Promise<PlanDto[]> {
    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return this.getFallbackPlans();
      }
    }

    try {
      const where: any = {};
      if (!includeInactive) {
        where.status = 'ACTIVE';
      }

      const plans = await this.db.plan.findMany({
        where,
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
        orderBy: {
          priceMonthly: 'asc',
        },
      });

      if (plans.length === 0) {
        return this.getFallbackPlans();
      }

      return plans.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        planType: p.planType,
        priceMonthly: Number(p.priceMonthly),
        currency: p.currency,
        billingInterval: p.billingInterval,
        trialEligible: p.trialEligible,
        trialDays: p.trialDays,
        entitlements: (Array.isArray(p.entitlements) ? p.entitlements : []) as PlanFeatureKey[],
        limits: (p.limits && typeof p.limits === 'object' ? p.limits : {}) as Record<string, number>,
        status: p.status,
        tenantCount: p._count?.subscriptions || 0,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      }));
    } catch {
      return this.getFallbackPlans();
    }
  }

  /**
   * Retrieves a plan by unique slug.
   */
  async getPlanBySlug(slug: string): Promise<PlanDto | null> {
    const plans = await this.listPlans(true);
    return plans.find((p) => p.slug === slug) || null;
  }

  /**
   * Retrieves a plan by ID.
   */
  async getPlanById(id: string): Promise<PlanDto | null> {
    const plans = await this.listPlans(true);
    return plans.find((p) => p.id === id) || null;
  }

  /**
   * Creates a new plan configuration.
   */
  async createPlan(input: CreatePlanInput, actorUserId?: string): Promise<PlanDto> {
    const plan = await this.db.plan.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        planType: input.planType,
        priceMonthly: input.priceMonthly,
        currency: input.currency || 'BDT',
        billingInterval: input.billingInterval || 'MONTHLY',
        trialEligible: input.trialEligible ?? true,
        trialDays: input.trialDays ?? 7,
        entitlements: input.entitlements,
        limits: input.limits || {},
        status: input.status || 'ACTIVE',
      },
    });

    if (actorUserId) {
      await this.logAudit({
        action: 'plan.created',
        entityId: plan.id,
        actorUserId,
        description: `Created SaaS plan: ${plan.name} (${plan.slug}) with monthly price ${plan.priceMonthly} ${plan.currency}`,
        afterData: {
          name: plan.name,
          slug: plan.slug,
          priceMonthly: Number(plan.priceMonthly),
          currency: plan.currency,
          entitlements: plan.entitlements,
        },
      });
    }

    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      planType: plan.planType,
      priceMonthly: Number(plan.priceMonthly),
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      trialEligible: plan.trialEligible,
      trialDays: plan.trialDays,
      entitlements: (Array.isArray(plan.entitlements) ? plan.entitlements : []) as PlanFeatureKey[],
      limits: (plan.limits && typeof plan.limits === 'object' ? plan.limits : {}) as Record<string, number>,
      status: plan.status,
      tenantCount: 0,
      createdAt: new Date(plan.createdAt).toISOString(),
      updatedAt: new Date(plan.updatedAt).toISOString(),
    };
  }

  /**
   * Updates an existing plan.
   * Crucial: Historical subscription pricing is strictly preserved.
   * Existing active subscriptions retain their locked price and are never automatically mutated.
   */
  async updatePlan(id: string, input: UpdatePlanInput, actorUserId?: string): Promise<PlanDto> {
    const existing = await this.db.plan.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Plan with ID "${id}" not found.`);
    }

    const updated = await this.db.plan.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.priceMonthly !== undefined ? { priceMonthly: input.priceMonthly } : {}),
        ...(input.billingInterval !== undefined ? { billingInterval: input.billingInterval } : {}),
        ...(input.trialEligible !== undefined ? { trialEligible: input.trialEligible } : {}),
        ...(input.trialDays !== undefined ? { trialDays: input.trialDays } : {}),
        ...(input.entitlements !== undefined ? { entitlements: input.entitlements } : {}),
        ...(input.limits !== undefined ? { limits: input.limits } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (actorUserId) {
      await this.logAudit({
        action: 'plan.updated',
        entityId: id,
        actorUserId,
        description: `Updated plan: ${updated.name}. Note: Existing subscriptions retain their locked pricing.`,
        beforeData: {
          name: existing.name,
          priceMonthly: Number(existing.priceMonthly),
          status: existing.status,
          entitlements: existing.entitlements,
        },
        afterData: {
          name: updated.name,
          priceMonthly: Number(updated.priceMonthly),
          status: updated.status,
          entitlements: updated.entitlements,
        },
      });
    }

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      planType: updated.planType,
      priceMonthly: Number(updated.priceMonthly),
      currency: updated.currency,
      billingInterval: updated.billingInterval,
      trialEligible: updated.trialEligible,
      trialDays: updated.trialDays,
      entitlements: (Array.isArray(updated.entitlements) ? updated.entitlements : []) as PlanFeatureKey[],
      limits: (updated.limits && typeof updated.limits === 'object' ? updated.limits : {}) as Record<string, number>,
      status: updated.status,
      tenantCount: updated._count?.subscriptions || 0,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString(),
    };
  }

  private getFallbackPlans(): PlanDto[] {
    return [
      {
        id: 'plan_starter_default',
        name: STARTER_PLAN_DEFAULTS.name,
        slug: STARTER_PLAN_DEFAULTS.slug,
        description: STARTER_PLAN_DEFAULTS.description,
        planType: STARTER_PLAN_DEFAULTS.planType,
        priceMonthly: STARTER_PLAN_DEFAULTS.priceMonthly,
        currency: STARTER_PLAN_DEFAULTS.currency,
        billingInterval: STARTER_PLAN_DEFAULTS.billingInterval,
        trialEligible: STARTER_PLAN_DEFAULTS.trialEligible,
        trialDays: STARTER_PLAN_DEFAULTS.trialDays,
        entitlements: STARTER_PLAN_DEFAULTS.entitlements,
        limits: STARTER_PLAN_DEFAULTS.limits,
        status: 'ACTIVE',
        tenantCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'plan_custom_business_default',
        name: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.name,
        slug: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.slug,
        description: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.description,
        planType: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.planType,
        priceMonthly: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.priceMonthly,
        currency: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.currency,
        billingInterval: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.billingInterval,
        trialEligible: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.trialEligible,
        trialDays: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.trialDays,
        entitlements: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.entitlements,
        limits: CUSTOM_BUSINESS_TEMPLATE_DEFAULTS.limits,
        status: 'ACTIVE',
        tenantCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private async logAudit(params: {
    action: string;
    entityId: string;
    actorUserId: string;
    description: string;
    beforeData?: any;
    afterData?: any;
  }) {
    try {
      await this.db.auditLog.create({
        data: {
          action: params.action,
          entityType: 'plan',
          entityId: params.entityId,
          actorUserId: params.actorUserId,
          description: params.description,
          beforeData: params.beforeData || null,
          afterData: params.afterData || null,
        },
      });
    } catch {
      // Audit failure should not break caller flow
    }
  }
}

export const planService = new PlanService();
