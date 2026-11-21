import type {
  PlanType,
  PlanStatus,
  BillingInterval,
  SubscriptionStatus,
  TrialStatus,
  PaymentStatus,
  PaymentMethod,
  InquiryStatus,
  QuotationStatus,
} from '@/types/database';
import type { PlanFeatureKey } from './constants';

export interface PlanDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  planType: PlanType;
  priceMonthly: number;
  currency: string;
  billingInterval: BillingInterval;
  trialEligible: boolean;
  trialDays: number;
  entitlements: PlanFeatureKey[];
  limits: Record<string, number>;
  status: PlanStatus;
  tenantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionDto {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  planId: string;
  planName: string;
  subscriptionType: PlanType;
  status: SubscriptionStatus;
  trialStatus: TrialStatus;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  trialRemainingDays: number | null;
  currentPeriodStartsAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelledAt: string | null;
  priceLocked: number;
  currency: string;
  billingInterval: BillingInterval;
  entitlements: PlanFeatureKey[];
  limits: Record<string, number>;
  autoRenewConsent: boolean;
  autoRenewConsentAt: string | null;
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionInvoiceDto {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  transactionReference: string | null;
  confirmedByUserId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CustomInquiryDto {
  id: string;
  businessName: string;
  businessCategory: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  propertyCount: number;
  estimatedMembers: number;
  requiredFeatures: string[];
  additionalRequirements: string | null;
  status: InquiryStatus;
  assignedToUserId: string | null;
  createdAt: string;
  quotationsCount: number;
}

export interface CustomQuotationDto {
  id: string;
  inquiryId: string;
  tenantId: string | null;
  businessName: string;
  propertyCount: number;
  estimatedMembers: number;
  monthlyPrice: number;
  currency: string;
  billingInterval: BillingInterval;
  includedFeatures: string[];
  usageLimits: Record<string, number>;
  proposalValidUntil: string;
  status: QuotationStatus;
  internalNotes: string | null;
  customerNotes: string | null;
  preparedByUserId: string | null;
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  featureKey: string;
  reason?: string;
  limit?: number;
  currentUsage?: number;
}

export interface SubscriptionAnalyticsSummary {
  totalActiveSubscriptions: number;
  trialAccounts: number;
  expiredTrials: number;
  starterSubscribers: number;
  customBusinessSubscribers: number;
  cancelledSubscriptions: number;
  mrrBdt: number;
  collectedRevenueBdt: number;
  pendingRevenueBdt: number;
  trialToPaidConversionRate: number; // percentage, e.g. 25.5%
}

export interface SubscriptionFilterQuery {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus | 'ALL';
  subscriptionType?: PlanType | 'ALL';
  search?: string;
}
