import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlanService } from './plan-service';
import { SubscriptionService } from './subscription-service';
import { EntitlementService } from './entitlement-service';
import { CustomProposalService } from './custom-proposal-service';
import { SubscriptionAnalyticsService } from './subscription-analytics-service';
import {
  STARTER_PLAN_DEFAULTS,
  ALWAYS_ALLOWED_FEATURES,
  type PlanFeatureKey,
} from './constants';
import { getPlatformRolePermissions } from '@/server/platform/platform-roles';
import type {
  Plan,
  Subscription,
  SubscriptionInvoice,
  CustomPlanInquiry,
  CustomQuotation,
  AuditLog,
  PlatformRole,
} from '@/types/database';

describe('Task 26: Subscription, Plan & Entitlement Management Tests', () => {
  function createMockSubscriptionDb() {
    const plans: any[] = [];
    const subscriptions: any[] = [];
    const subscriptionInvoices: any[] = [];
    const customPlanInquiries: any[] = [];
    const customQuotations: any[] = [];
    const auditLogs: any[] = [];

    const db = {
      plan: {
        create: async ({ data }: any) => {
          const item = {
            id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          };
          plans.push(item);
          return item;
        },
        findMany: async ({ where }: any = {}) => {
          return plans.filter((p) => {
            if (where?.status && p.status !== where.status) return false;
            return true;
          });
        },
        findUnique: async ({ where }: any) => {
          return plans.find((p) => p.id === where.id || (where.slug && p.slug === where.slug)) || null;
        },
        findFirst: async ({ where }: any) => {
          return plans.find((p) => {
            if (where?.planType && p.planType !== where.planType) return false;
            return true;
          }) || null;
        },
        update: async ({ where, data }: any) => {
          const idx = plans.findIndex((p) => p.id === where.id);
          if (idx === -1) throw new Error('Plan not found');
          plans[idx] = { ...plans[idx], ...data, updatedAt: new Date() };
          return plans[idx];
        },
      },
      subscription: {
        create: async ({ data }: any) => {
          const item = {
            id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          };
          subscriptions.push(item);
          return item;
        },
        findUnique: async ({ where }: any) => {
          const sub = subscriptions.find((s) => s.id === where.id || (where.tenantId && s.tenantId === where.tenantId));
          if (!sub) return null;
          const plan = plans.find((p) => p.id === sub.planId);
          return { ...sub, plan, tenant: { id: sub.tenantId, name: 'Prince Mess', slug: 'prince-mess' } };
        },
        findMany: async ({ where }: any = {}) => {
          return subscriptions
            .filter((s) => {
              if (where?.status && s.status !== where.status) return false;
              if (where?.subscriptionType && s.subscriptionType !== where.subscriptionType) return false;
              return true;
            })
            .map((s) => {
              const plan = plans.find((p) => p.id === s.planId);
              return { ...s, plan, tenant: { id: s.tenantId, name: 'Prince Mess', slug: 'prince-mess' } };
            });
        },
        count: async ({ where }: any = {}) => {
          return subscriptions.filter((s) => {
            if (where?.status && s.status !== where.status) return false;
            if (where?.subscriptionType && s.subscriptionType !== where.subscriptionType) return false;
            if (where?.trialStatus) {
              if (where.trialStatus.in && !where.trialStatus.in.includes(s.trialStatus)) return false;
              if (typeof where.trialStatus === 'string' && s.trialStatus !== where.trialStatus) return false;
            }
            return true;
          }).length;
        },
        upsert: async ({ where, update, create }: any) => {
          const idx = subscriptions.findIndex((s) => s.tenantId === where.tenantId);
          if (idx !== -1) {
            subscriptions[idx] = { ...subscriptions[idx], ...update, updatedAt: new Date() };
            return subscriptions[idx];
          } else {
            const item = {
              id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...create,
            };
            subscriptions.push(item);
            return item;
          }
        },
        update: async ({ where, data }: any) => {
          const idx = subscriptions.findIndex((s) => s.id === where.id || (where.tenantId && s.tenantId === where.tenantId));
          if (idx === -1) throw new Error('Subscription not found');
          subscriptions[idx] = { ...subscriptions[idx], ...data, updatedAt: new Date() };
          return subscriptions[idx];
        },
      },
      subscriptionInvoice: {
        create: async ({ data }: any) => {
          const item = {
            id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          };
          subscriptionInvoices.push(item);
          return item;
        },
        findMany: async ({ where }: any = {}) => {
          return subscriptionInvoices.filter((inv) => {
            if (where?.paymentStatus && inv.paymentStatus !== where.paymentStatus) return false;
            return true;
          });
        },
      },
      customPlanInquiry: {
        create: async ({ data }: any) => {
          const item = {
            id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          };
          customPlanInquiries.push(item);
          return item;
        },
        findUnique: async ({ where }: any) => {
          const inq = customPlanInquiries.find((i) => i.id === where.id);
          if (!inq) return null;
          const quotes = customQuotations.filter((q) => q.inquiryId === inq.id);
          return { ...inq, quotations: quotes };
        },
        findMany: async ({ where }: any = {}) => {
          return customPlanInquiries.filter((i) => {
            if (where?.status && i.status !== where.status) return false;
            return true;
          });
        },
        update: async ({ where, data }: any) => {
          const idx = customPlanInquiries.findIndex((i) => i.id === where.id);
          if (idx === -1) throw new Error('Inquiry not found');
          customPlanInquiries[idx] = { ...customPlanInquiries[idx], ...data, updatedAt: new Date() };
          return customPlanInquiries[idx];
        },
      },
      customQuotation: {
        create: async ({ data }: any) => {
          const item = {
            id: `quote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          };
          customQuotations.push(item);
          return item;
        },
        findUnique: async ({ where }: any) => {
          const q = customQuotations.find((item) => item.id === where.id);
          if (!q) return null;
          const inquiry = customPlanInquiries.find((i) => i.id === q.inquiryId);
          return { ...q, inquiry };
        },
        update: async ({ where, data }: any) => {
          const idx = customQuotations.findIndex((q) => q.id === where.id);
          if (idx === -1) throw new Error('Quotation not found');
          customQuotations[idx] = { ...customQuotations[idx], ...data, updatedAt: new Date() };
          return customQuotations[idx];
        },
      },
      auditLog: {
        create: async ({ data }: any) => {
          const item = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date(),
            ...data,
          };
          auditLogs.push(item);
          return item;
        },
        findMany: async () => auditLogs,
      },
      _auditLogs: auditLogs,
    };

    return db;
  }

  // Scenario 1: Create a Starter plan
  it('Scenario 1 — Create a Starter plan with proper specifications', async () => {
    const db = createMockSubscriptionDb();
    const planService = new PlanService(db);

    const plan = await planService.createPlan(
      {
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
      },
      'admin_user_1'
    );

    assert.ok(plan.id);
    assert.equal(plan.name, 'Starter');
    assert.equal(plan.slug, 'starter');
    assert.equal(plan.planType, 'STARTER');
    assert.equal(plan.trialDays, 7);
    assert.ok(plan.entitlements.includes('meal_management'));
    assert.ok(plan.entitlements.includes('bazar_management'));
  });

  // Scenario 2: Validate ৳99 monthly price
  it('Scenario 2 — Validate exact ৳99 monthly price representation', async () => {
    const db = createMockSubscriptionDb();
    const planService = new PlanService(db);

    const plan = await planService.createPlan(
      {
        name: 'Starter',
        slug: 'starter',
        planType: 'STARTER',
        priceMonthly: 99.0,
        currency: 'BDT',
        entitlements: ['member_management'],
      },
      'admin_user_1'
    );

    assert.equal(plan.priceMonthly, 99);
    assert.equal(plan.currency, 'BDT');
  });

  // Scenario 3: Start a 7-day trial
  it('Scenario 3 — Start a 7-day trial and verify start date, end date, and duplicate rejection', async () => {
    const db = createMockSubscriptionDb();
    const planService = new PlanService(db);
    const subService = new SubscriptionService(db);

    await planService.createPlan({
      name: 'Starter',
      slug: 'starter',
      planType: 'STARTER',
      priceMonthly: 99,
      entitlements: ['meal_management', 'bazar_management'],
    });

    const tenantId = 'tnt_mess_dhanmondi_1';
    const sub = await subService.startFreeTrial(tenantId, { planSlug: 'starter' }, 'operator_1');

    assert.equal(sub.status, 'TRIALING');
    assert.equal(sub.trialStatus, 'ACTIVE');
    assert.ok(sub.trialStartsAt);
    assert.ok(sub.trialEndsAt);

    // Verify exactly 7-day duration
    const startMs = new Date(sub.trialStartsAt!).getTime();
    const endMs = new Date(sub.trialEndsAt!).getTime();
    const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 7);

    // Duplicate trial attempt without override must be rejected
    await assert.rejects(
      async () => {
        await subService.startFreeTrial(tenantId, { planSlug: 'starter' });
      },
      /Trial already granted/
    );
  });

  // Scenario 4: Verify trial expiration
  it('Scenario 4 — Verify trial expiration transitions status to EXPIRED', async () => {
    const db = createMockSubscriptionDb();
    const subService = new SubscriptionService(db);

    // Seed a past-due trial
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    await db.subscription.create({
      data: {
        tenantId: 'tnt_expired_mess',
        planId: 'plan_starter',
        status: 'TRIALING',
        trialStatus: 'ACTIVE',
        trialStartsAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        trialEndsAt: pastDate,
        priceLocked: 99.0,
      },
    });

    const result = await subService.evaluateTrialExpiration('tnt_expired_mess');
    assert.ok(result);
    assert.equal(result.status, 'EXPIRED');
    assert.equal(result.trialStatus, 'EXPIRED');
  });

  // Scenario 5: Convert a trial to a paid subscription after confirmed payment
  it('Scenario 5 — Convert a trial to a paid subscription after confirmed payment', async () => {
    const db = createMockSubscriptionDb();
    const subService = new SubscriptionService(db);

    await db.subscription.create({
      data: {
        id: 'sub_trial_1',
        tenantId: 'tnt_converting_mess',
        planId: 'plan_starter',
        status: 'TRIALING',
        trialStatus: 'ACTIVE',
        priceLocked: 99.0,
      },
    });

    const invoice = await subService.recordPayment(
      {
        tenantId: 'tnt_converting_mess',
        amount: 99.0,
        currency: 'BDT',
        periodMonths: 1,
        paymentStatus: 'CONFIRMED',
        paymentMethod: 'BKASH',
        transactionReference: 'TRX_BKASH_998877',
      },
      'finance_admin_1'
    );

    assert.equal(invoice.paymentStatus, 'CONFIRMED');
    assert.ok(invoice.invoiceNumber.startsWith('INV-'));

    const updatedSub = await subService.getSubscriptionByTenantId('tnt_converting_mess');
    assert.ok(updatedSub);
    assert.equal(updatedSub.status, 'ACTIVE');
    assert.equal(updatedSub.trialStatus, 'CONVERTED');
    assert.ok(updatedSub.currentPeriodEndsAt);
  });

  // Scenario 6: Reject an unconfirmed payment
  it('Scenario 6 — Unconfirmed or pending payment does NOT activate paid access', async () => {
    const db = createMockSubscriptionDb();
    const subService = new SubscriptionService(db);

    await db.subscription.create({
      data: {
        id: 'sub_trial_2',
        tenantId: 'tnt_pending_mess',
        planId: 'plan_starter',
        status: 'TRIALING',
        trialStatus: 'ACTIVE',
        priceLocked: 99.0,
      },
    });

    const invoice = await subService.recordPayment(
      {
        tenantId: 'tnt_pending_mess',
        amount: 99.0,
        currency: 'BDT',
        paymentStatus: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
      },
      'staff_user_1'
    );

    assert.equal(invoice.paymentStatus, 'PENDING');

    const sub = await subService.getSubscriptionByTenantId('tnt_pending_mess');
    assert.ok(sub);
    assert.equal(sub.status, 'TRIALING', 'Paid access must NOT be granted while payment is pending');
    assert.equal(sub.trialStatus, 'ACTIVE');
  });

  // Scenario 7: Create a custom business proposal
  it('Scenario 7 — Create a custom business inquiry and quotation proposal', async () => {
    const db = createMockSubscriptionDb();
    const proposalService = new CustomProposalService(db);

    const inquiry = await proposalService.createInquiry({
      businessName: 'Uttara Student Living',
      businessCategory: 'student-hostel',
      contactName: 'Rahim Chowdhury',
      contactEmail: 'rahim@uttarahostel.com',
      propertyCount: 3,
      estimatedMembers: 120,
      requiredFeatures: ['meal_management', 'multiple_properties', 'advanced_analytics'],
      additionalRequirements: 'Need dedicated phone support and seat allocation',
    });

    assert.ok(inquiry.id);
    assert.equal(inquiry.status, 'NEW');

    const quote = await proposalService.createQuotation(
      {
        inquiryId: inquiry.id,
        businessName: inquiry.businessName,
        propertyCount: inquiry.propertyCount,
        estimatedMembers: inquiry.estimatedMembers,
        monthlyPrice: 2500.0,
        currency: 'BDT',
        includedFeatures: inquiry.requiredFeatures,
        proposalValidDays: 30,
        internalNotes: 'Offered ৳2,500/month for 3 hostel buildings',
      },
      'super_admin_sales'
    );

    assert.ok(quote.id);
    assert.equal(quote.monthlyPrice, 2500);
    assert.equal(quote.status, 'SENT');
  });

  // Scenario 8: Approve a custom package
  it('Scenario 8 — Approve a custom quotation and provision custom subscription', async () => {
    const db = createMockSubscriptionDb();
    const proposalService = new CustomProposalService(db);
    const subService = new SubscriptionService(db);

    const inquiry = await proposalService.createInquiry({
      businessName: 'Green Hostel Group',
      businessCategory: 'multiple-mess',
      contactName: 'Tanvir Hossain',
      requiredFeatures: ['multiple_properties'],
    });

    const quote = await proposalService.createQuotation(
      {
        inquiryId: inquiry.id,
        tenantId: 'tnt_green_hostel_multi',
        businessName: inquiry.businessName,
        propertyCount: 4,
        estimatedMembers: 150,
        monthlyPrice: 3200.0,
        currency: 'BDT',
        includedFeatures: ['member_management', 'meal_management', 'multiple_properties'],
      },
      'sales_admin'
    );

    const approved = await proposalService.approveQuotation(
      quote.id,
      'super_admin_exec',
      'tnt_green_hostel_multi'
    );

    assert.equal(approved.status, 'ACCEPTED');
    assert.equal(approved.approvedByUserId, 'super_admin_exec');

    // Verify custom subscription provisioned with locked price
    const sub = await subService.getSubscriptionByTenantId('tnt_green_hostel_multi');
    assert.ok(sub);
    assert.equal(sub.subscriptionType, 'CUSTOM_BUSINESS');
    assert.equal(sub.priceLocked, 3200);
    assert.equal(sub.status, 'ACTIVE');
  });

  // Scenario 9: Update plan entitlements
  it('Scenario 9 — Update plan entitlements and limits', async () => {
    const db = createMockSubscriptionDb();
    const planService = new PlanService(db);

    const plan = await planService.createPlan({
      name: 'Standard Mess',
      slug: 'standard-mess',
      planType: 'STANDARD',
      priceMonthly: 199,
      entitlements: ['meal_management'],
      limits: { maxMembers: 30 },
    });

    const updated = await planService.updatePlan(
      plan.id,
      {
        entitlements: ['meal_management', 'bazar_management', 'finance_management'],
        limits: { maxMembers: 50 },
      },
      'admin_user_1'
    );

    assert.equal(updated.entitlements.length, 3);
    assert.equal(updated.limits.maxMembers, 50);
  });

  // Scenario 10: Verify backend entitlement checks
  it('Scenario 10 — Entitlement checks enforce feature access and emergency safety invariant', async () => {
    const db = createMockSubscriptionDb();
    const entitlementService = new EntitlementService(db);

    // Seed plan with limited features
    const plan = await db.plan.create({
      data: {
        name: 'Basic Mess',
        slug: 'basic-mess',
        planType: 'STARTER',
        priceMonthly: 99,
        entitlements: ['meal_management'],
        limits: { maxMembers: 20 },
      },
    });

    await db.subscription.create({
      data: {
        tenantId: 'tnt_limited_mess',
        planId: plan.id,
        status: 'ACTIVE',
        priceLocked: 99,
      },
    });

    // 1. Included feature is allowed
    const mealCheck = await entitlementService.checkPlanEntitlement('tnt_limited_mess', 'meal_management');
    assert.equal(mealCheck.allowed, true);

    // 2. Unincluded feature is denied
    const domainCheck = await entitlementService.checkPlanEntitlement('tnt_limited_mess', 'custom_domain');
    assert.equal(domainCheck.allowed, false);
    assert.equal(domainCheck.reason, 'FEATURE_NOT_INCLUDED_IN_PLAN');

    // 3. Limit enforcement
    const memberCheckExceeded = await entitlementService.checkPlanEntitlement(
      'tnt_limited_mess',
      'maxMembers',
      { requestedQuantity: 25 }
    );
    assert.equal(memberCheckExceeded.allowed, false);

    // 4. Critical Safety Invariant: Emergency contacts & safety info are ALWAYS allowed
    for (const emergencyFeature of ALWAYS_ALLOWED_FEATURES) {
      const emergencyCheck = await entitlementService.checkPlanEntitlement(
        'tnt_limited_mess',
        emergencyFeature
      );
      assert.equal(
        emergencyCheck.allowed,
        true,
        `Safety feature "${emergencyFeature}" must NEVER be paywalled`
      );
    }
  });

  // Scenario 11: Prevent unauthorized subscription modifications
  it('Scenario 11 — Unauthorized roles cannot manage subscriptions', () => {
    const staffRole: PlatformRole = 'SUPPORT_STAFF';
    const adminRole: PlatformRole = 'PLATFORM_ADMIN';
    const ownerRole: PlatformRole = 'PLATFORM_OWNER';

    // SUPPORT_STAFF cannot manage subscriptions
    const canStaffManage = getPlatformRolePermissions(staffRole).has('subscriptions.manage');
    assert.equal(canStaffManage, false);

    // PLATFORM_ADMIN and PLATFORM_OWNER can manage subscriptions
    assert.equal(getPlatformRolePermissions(adminRole).has('subscriptions.manage'), true);
    assert.equal(getPlatformRolePermissions(ownerRole).has('subscriptions.manage'), true);
  });

  // Scenario 12: Preserve historical billing prices
  it('Scenario 12 — Updating a plan price does NOT silently alter existing subscriptions', async () => {
    const db = createMockSubscriptionDb();
    const planService = new PlanService(db);
    const subService = new SubscriptionService(db);

    const plan = await planService.createPlan({
      name: 'Starter',
      slug: 'starter',
      planType: 'STARTER',
      priceMonthly: 99.0,
      entitlements: ['meal_management'],
    });

    // Tenant subscribes at original price ৳99
    await db.subscription.create({
      data: {
        tenantId: 'tnt_early_adopter',
        planId: plan.id,
        status: 'ACTIVE',
        priceLocked: 99.0,
        currency: 'BDT',
      },
    });

    // Platform updates Starter plan price to ৳149
    await planService.updatePlan(
      plan.id,
      {
        priceMonthly: 149.0,
      },
      'admin_user_pricing'
    );

    // Early adopter subscriber MUST still have locked price of ৳99
    const sub = await subService.getSubscriptionByTenantId('tnt_early_adopter');
    assert.ok(sub);
    assert.equal(sub.priceLocked, 99.0, 'Historical subscription locked price must remain untouched');
  });

  // Scenario 13: Record subscription changes in audit logs
  it('Scenario 13 — Record subscription trial, payment, and cancellation events in audit logs', async () => {
    const db = createMockSubscriptionDb();
    const subService = new SubscriptionService(db);

    const plan = await db.plan.create({
      data: {
        name: 'Starter',
        slug: 'starter',
        planType: 'STARTER',
        priceMonthly: 99,
        entitlements: ['meal_management'],
      },
    });

    // 1. Trial started audit
    await subService.startFreeTrial('tnt_audit_mess', { planSlug: 'starter' }, 'operator_audit_1');

    // 2. Trial extended audit
    await subService.extendTrial('tnt_audit_mess', 5, 'Special promotion extension requested', 'operator_audit_1');

    // 3. Payment confirmed audit
    await subService.recordPayment(
      {
        tenantId: 'tnt_audit_mess',
        amount: 99,
        paymentStatus: 'CONFIRMED',
        paymentMethod: 'BKASH',
      },
      'finance_audit_1'
    );

    // 4. Cancelled audit
    await subService.cancelSubscription('tnt_audit_mess', 'Closing mess premises', 'operator_audit_1');

    const logs = await db.auditLog.findMany();
    const actions = logs.map((l: any) => l.action);

    assert.ok(actions.includes('subscription.trial_started'));
    assert.ok(actions.includes('subscription.trial_extended'));
    assert.ok(actions.includes('subscription.payment_confirmed'));
    assert.ok(actions.includes('subscription.cancelled'));
  });

  // Scenario 14: Verify no automatic renewal occurs without consent
  it('Scenario 14 — Default auto-renewal is false and requires explicit user consent record', async () => {
    const db = createMockSubscriptionDb();
    const subService = new SubscriptionService(db);

    await db.plan.create({
      data: {
        name: 'Starter',
        slug: 'starter',
        planType: 'STARTER',
        priceMonthly: 99,
        entitlements: ['meal_management'],
      },
    });

    const sub = await subService.startFreeTrial('tnt_no_consent_mess', { planSlug: 'starter' });
    assert.equal(sub.autoRenewConsent, false, 'Auto-renewal must be disabled by default');

    // Explicit consent update
    const updated = await subService.updateAutoRenewConsent('tnt_no_consent_mess', true, 'resident_owner');
    assert.equal(updated.autoRenewConsent, true);
    assert.ok(updated.autoRenewConsentAt);
  });
});
