-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('STARTER', 'CUSTOM_BUSINESS', 'ENTERPRISE', 'STANDARD');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TrialStatus" AS ENUM ('NOT_STARTED', 'ACTIVE', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REJECTED', 'REFUNDED', 'PARTIALLY_PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'BKASH', 'NAGAD', 'ROCKET', 'ONLINE_GATEWAY', 'OTHER');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'REVIEWING', 'PROPOSAL_SENT', 'NEGOTIATION', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "planType" "PlanType" NOT NULL DEFAULT 'STARTER',
    "priceMonthly" DECIMAL(10,2) NOT NULL DEFAULT 99.00,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "trialEligible" BOOLEAN NOT NULL DEFAULT true,
    "trialDays" INTEGER NOT NULL DEFAULT 7,
    "entitlements" JSONB NOT NULL,
    "limits" JSONB NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "subscriptionType" "PlanType" NOT NULL DEFAULT 'STARTER',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "trialStatus" "TrialStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "trialStartsAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStartsAt" TIMESTAMP(3),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "priceLocked" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "entitlements" JSONB,
    "limits" JSONB,
    "autoRenewConsent" BOOLEAN NOT NULL DEFAULT false,
    "autoRenewConsentAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "transactionReference" TEXT,
    "confirmedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_plan_inquiries" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessCategory" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "propertyCount" INTEGER NOT NULL DEFAULT 1,
    "estimatedMembers" INTEGER NOT NULL DEFAULT 10,
    "requiredFeatures" JSONB NOT NULL,
    "additionalRequirements" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "assignedToUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_plan_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_quotations" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "tenantId" TEXT,
    "businessName" TEXT NOT NULL,
    "propertyCount" INTEGER NOT NULL,
    "estimatedMembers" INTEGER NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "includedFeatures" JSONB NOT NULL,
    "usageLimits" JSONB NOT NULL,
    "proposalValidUntil" TIMESTAMP(3) NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "internalNotes" TEXT,
    "customerNotes" TEXT,
    "preparedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");
CREATE INDEX "plans_status_idx" ON "plans"("status");
CREATE INDEX "plans_planType_idx" ON "plans"("planType");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_tenantId_key" ON "subscriptions"("tenantId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX "subscriptions_trialStatus_idx" ON "subscriptions"("trialStatus");
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_invoices_invoiceNumber_key" ON "subscription_invoices"("invoiceNumber");
CREATE INDEX "subscription_invoices_subscriptionId_idx" ON "subscription_invoices"("subscriptionId");
CREATE INDEX "subscription_invoices_tenantId_idx" ON "subscription_invoices"("tenantId");
CREATE INDEX "subscription_invoices_paymentStatus_idx" ON "subscription_invoices"("paymentStatus");
CREATE INDEX "subscription_invoices_transactionReference_idx" ON "subscription_invoices"("transactionReference");
CREATE INDEX "subscription_invoices_createdAt_idx" ON "subscription_invoices"("createdAt");

-- CreateIndex
CREATE INDEX "custom_plan_inquiries_status_idx" ON "custom_plan_inquiries"("status");
CREATE INDEX "custom_plan_inquiries_businessCategory_idx" ON "custom_plan_inquiries"("businessCategory");
CREATE INDEX "custom_plan_inquiries_createdAt_idx" ON "custom_plan_inquiries"("createdAt");

-- CreateIndex
CREATE INDEX "custom_quotations_inquiryId_idx" ON "custom_quotations"("inquiryId");
CREATE INDEX "custom_quotations_status_idx" ON "custom_quotations"("status");
CREATE INDEX "custom_quotations_createdAt_idx" ON "custom_quotations"("createdAt");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_plan_inquiries" ADD CONSTRAINT "custom_plan_inquiries_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_quotations" ADD CONSTRAINT "custom_quotations_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "custom_plan_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custom_quotations" ADD CONSTRAINT "custom_quotations_preparedByUserId_fkey" FOREIGN KEY ("preparedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "custom_quotations" ADD CONSTRAINT "custom_quotations_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
