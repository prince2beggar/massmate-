import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional(),
  planType: z.enum(['STARTER', 'CUSTOM_BUSINESS', 'ENTERPRISE', 'STANDARD']),
  priceMonthly: z
    .number()
    .min(0, 'Monthly price cannot be negative')
    .refine((val) => Number.isFinite(val), 'Price must be a valid number'),
  currency: z.string().default('BDT'),
  billingInterval: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).default('MONTHLY'),
  trialEligible: z.boolean().default(true),
  trialDays: z.number().int().min(0).max(90).default(7),
  entitlements: z.array(z.string()).min(1, 'At least one feature entitlement is required'),
  limits: z.record(z.string(), z.number().int().min(0)).default({}),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export const updatePlanSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  priceMonthly: z.number().min(0).optional(),
  billingInterval: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
  trialEligible: z.boolean().optional(),
  trialDays: z.number().int().min(0).max(90).optional(),
  entitlements: z.array(z.string()).min(1).optional(),
  limits: z.record(z.string(), z.number().int().min(0)).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

export const startTrialSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  planSlug: z.string().default('starter'),
  allowDuplicate: z.boolean().default(false),
});

export const extendTrialSchema = z.object({
  additionalDays: z.number().int().min(1, 'Must extend by at least 1 day').max(30),
  reason: z.string().min(5, 'A clear reason (minimum 5 characters) is required for trial extension'),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  currency: z.string().default('BDT'),
  periodMonths: z.number().int().min(1).max(24).default(1),
  paymentStatus: z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'REJECTED', 'REFUNDED', 'PARTIALLY_PAID']),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'BKASH', 'NAGAD', 'ROCKET', 'ONLINE_GATEWAY', 'OTHER']),
  transactionReference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const createCustomQuotationSchema = z.object({
  inquiryId: z.string().min(1, 'Inquiry ID is required'),
  tenantId: z.string().optional(),
  businessName: z.string().min(2, 'Business name is required'),
  propertyCount: z.number().int().min(1),
  estimatedMembers: z.number().int().min(1),
  monthlyPrice: z.number().min(0, 'Monthly price cannot be negative'),
  currency: z.string().default('BDT'),
  billingInterval: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).default('MONTHLY'),
  includedFeatures: z.array(z.string()).min(1, 'Select at least one feature'),
  usageLimits: z.record(z.string(), z.number().int().min(0)).default({}),
  proposalValidDays: z.number().int().min(1).max(90).default(30),
  internalNotes: z.string().max(1000).optional(),
  customerNotes: z.string().max(1000).optional(),
});

export const approveQuotationSchema = z.object({
  tenantId: z.string().optional(),
  notes: z.string().optional(),
});

export const autoRenewConsentSchema = z.object({
  consent: z.boolean(),
});
