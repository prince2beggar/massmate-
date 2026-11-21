import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import { ALWAYS_ALLOWED_FEATURES, type PlanFeatureKey } from './constants';
import type { EntitlementCheckResult } from './types';

export class EntitlementService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Universal entitlement check service function.
   * Enforces backend feature gating and limits for any tenant-scoped request.
   * Safety and emergency information is ALWAYS allowed regardless of plan tier.
   */
  async checkPlanEntitlement(
    tenantId: string,
    featureKey: string,
    options?: { requestedQuantity?: number }
  ): Promise<EntitlementCheckResult> {
    // 1. Safety Invariant: Emergency and compliance info is universally allowed
    if (ALWAYS_ALLOWED_FEATURES.includes(featureKey)) {
      return {
        allowed: true,
        featureKey,
      };
    }

    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        // Fallback for unconfigured dev environment: permit standard features to prevent developer lockout
        return { allowed: true, featureKey };
      }
    }

    try {
      const subscription = await this.db.subscription.findUnique({
        where: { tenantId },
        include: {
          plan: true,
        },
      });

      if (!subscription) {
        return {
          allowed: false,
          featureKey,
          reason: 'NO_ACTIVE_SUBSCRIPTION',
        };
      }

      // Check subscription operational status
      if (subscription.status === 'SUSPENDED') {
        return {
          allowed: false,
          featureKey,
          reason: 'SUBSCRIPTION_SUSPENDED',
        };
      }

      if (subscription.status === 'CANCELLED') {
        return {
          allowed: false,
          featureKey,
          reason: 'SUBSCRIPTION_CANCELLED',
        };
      }

      if (subscription.status === 'EXPIRED') {
        return {
          allowed: false,
          featureKey,
          reason: 'SUBSCRIPTION_EXPIRED',
        };
      }

      // Check Trial status and expiration
      if (subscription.status === 'TRIALING') {
        if (subscription.trialEndsAt && new Date(subscription.trialEndsAt) < new Date()) {
          return {
            allowed: false,
            featureKey,
            reason: 'TRIAL_EXPIRED',
          };
        }
      }

      // Resolve effective entitlements (custom subscription override takes precedence over plan)
      const effectiveEntitlements: string[] = Array.isArray(subscription.entitlements)
        ? (subscription.entitlements as string[])
        : Array.isArray(subscription.plan?.entitlements)
          ? (subscription.plan.entitlements as string[])
          : [];

      const isFeatureIncluded = effectiveEntitlements.includes(featureKey);
      if (!isFeatureIncluded) {
        return {
          allowed: false,
          featureKey,
          reason: 'FEATURE_NOT_INCLUDED_IN_PLAN',
        };
      }

      // Resolve effective usage limits
      const effectiveLimits: Record<string, number> =
        subscription.limits && typeof subscription.limits === 'object'
          ? (subscription.limits as Record<string, number>)
          : subscription.plan?.limits && typeof subscription.plan.limits === 'object'
            ? (subscription.plan.limits as Record<string, number>)
            : {};

      const limit = effectiveLimits[featureKey];

      if (options?.requestedQuantity !== undefined && limit !== undefined) {
        if (options.requestedQuantity > limit) {
          return {
            allowed: false,
            featureKey,
            limit,
            currentUsage: options.requestedQuantity,
            reason: 'LIMIT_EXCEEDED',
          };
        }
      }

      return {
        allowed: true,
        featureKey,
        limit,
      };
    } catch {
      return {
        allowed: false,
        featureKey,
        reason: 'ENTITLEMENT_CHECK_FAILED',
      };
    }
  }

  /**
   * Retrieves full map of active entitlements and limits for a tenant.
   */
  async getTenantEntitlements(tenantId: string): Promise<{
    status: string;
    planName: string;
    entitlements: string[];
    limits: Record<string, number>;
  }> {
    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return {
          status: 'TRIALING',
          planName: 'Starter (Dev Mode)',
          entitlements: [...ALWAYS_ALLOWED_FEATURES, 'member_management', 'meal_management'],
          limits: { maxMembers: 50, maxProperties: 1 },
        };
      }
    }

    try {
      const subscription = await this.db.subscription.findUnique({
        where: { tenantId },
        include: { plan: true },
      });

      if (!subscription) {
        return {
          status: 'NONE',
          planName: 'No Plan',
          entitlements: [...ALWAYS_ALLOWED_FEATURES],
          limits: {},
        };
      }

      const effectiveEntitlements: string[] = Array.isArray(subscription.entitlements)
        ? (subscription.entitlements as string[])
        : Array.isArray(subscription.plan?.entitlements)
          ? (subscription.plan.entitlements as string[])
          : [];

      const effectiveLimits: Record<string, number> =
        subscription.limits && typeof subscription.limits === 'object'
          ? (subscription.limits as Record<string, number>)
          : subscription.plan?.limits && typeof subscription.plan.limits === 'object'
            ? (subscription.plan.limits as Record<string, number>)
            : {};

      return {
        status: subscription.status,
        planName: subscription.plan?.name || 'Custom Plan',
        entitlements: Array.from(new Set([...ALWAYS_ALLOWED_FEATURES, ...effectiveEntitlements])),
        limits: effectiveLimits,
      };
    } catch {
      return {
        status: 'ERROR',
        planName: 'Unknown',
        entitlements: [...ALWAYS_ALLOWED_FEATURES],
        limits: {},
      };
    }
  }
}

export const entitlementService = new EntitlementService();
