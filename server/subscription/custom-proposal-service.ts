import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import type { CustomInquiryDto, CustomQuotationDto } from './types';
import type { InquiryStatus, QuotationStatus, BillingInterval } from '@/types/database';

export interface CreateInquiryInput {
  businessName: string;
  businessCategory: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  propertyCount?: number;
  estimatedMembers?: number;
  requiredFeatures: string[];
  additionalRequirements?: string;
}

export interface CreateQuotationInput {
  inquiryId: string;
  tenantId?: string;
  businessName: string;
  propertyCount: number;
  estimatedMembers: number;
  monthlyPrice: number;
  currency?: string;
  billingInterval?: BillingInterval;
  includedFeatures: string[];
  usageLimits?: Record<string, number>;
  proposalValidDays?: number;
  internalNotes?: string;
  customerNotes?: string;
}

export class CustomProposalService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Lists custom plan inquiries with optional status filtering.
   */
  async listInquiries(query?: { status?: InquiryStatus | 'ALL'; search?: string }): Promise<CustomInquiryDto[]> {
    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return [];
      }
    }

    try {
      const where: any = {};
      if (query?.status && query.status !== 'ALL') {
        where.status = query.status;
      }
      if (query?.search && query.search.trim()) {
        const term = query.search.trim();
        where.OR = [
          { businessName: { contains: term, mode: 'insensitive' } },
          { contactName: { contains: term, mode: 'insensitive' } },
          { contactEmail: { contains: term, mode: 'insensitive' } },
          { contactPhone: { contains: term } },
        ];
      }

      const rows = await this.db.customPlanInquiry.findMany({
        where,
        include: {
          _count: {
            select: { quotations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return rows.map((r: any) => ({
        id: r.id,
        businessName: r.businessName,
        businessCategory: r.businessCategory,
        contactName: r.contactName,
        contactEmail: r.contactEmail,
        contactPhone: r.contactPhone,
        propertyCount: r.propertyCount,
        estimatedMembers: r.estimatedMembers,
        requiredFeatures: Array.isArray(r.requiredFeatures) ? r.requiredFeatures : [],
        additionalRequirements: r.additionalRequirements,
        status: r.status,
        assignedToUserId: r.assignedToUserId,
        createdAt: new Date(r.createdAt).toISOString(),
        quotationsCount: r._count?.quotations || 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Retrieves an inquiry with its quotation history.
   */
  async getInquiryById(id: string): Promise<(CustomInquiryDto & { quotations: CustomQuotationDto[] }) | null> {
    try {
      const row = await this.db.customPlanInquiry.findUnique({
        where: { id },
        include: {
          quotations: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!row) return null;

      return {
        id: row.id,
        businessName: row.businessName,
        businessCategory: row.businessCategory,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        contactPhone: row.contactPhone,
        propertyCount: row.propertyCount,
        estimatedMembers: row.estimatedMembers,
        requiredFeatures: Array.isArray(row.requiredFeatures) ? row.requiredFeatures : [],
        additionalRequirements: row.additionalRequirements,
        status: row.status,
        assignedToUserId: row.assignedToUserId,
        createdAt: new Date(row.createdAt).toISOString(),
        quotationsCount: row.quotations.length,
        quotations: row.quotations.map((q: any) => ({
          id: q.id,
          inquiryId: q.inquiryId,
          tenantId: q.tenantId,
          businessName: q.businessName,
          propertyCount: q.propertyCount,
          estimatedMembers: q.estimatedMembers,
          monthlyPrice: Number(q.monthlyPrice),
          currency: q.currency,
          billingInterval: q.billingInterval,
          includedFeatures: Array.isArray(q.includedFeatures) ? q.includedFeatures : [],
          usageLimits: q.usageLimits && typeof q.usageLimits === 'object' ? q.usageLimits : {},
          proposalValidUntil: new Date(q.proposalValidUntil).toISOString(),
          status: q.status,
          internalNotes: q.internalNotes,
          customerNotes: q.customerNotes,
          preparedByUserId: q.preparedByUserId,
          approvedByUserId: q.approvedByUserId,
          approvedAt: q.approvedAt ? new Date(q.approvedAt).toISOString() : null,
          createdAt: new Date(q.createdAt).toISOString(),
        })),
      };
    } catch {
      return null;
    }
  }

  /**
   * Creates a new customer inquiry (e.g. from public website custom pricing inquiry form).
   */
  async createInquiry(input: CreateInquiryInput): Promise<CustomInquiryDto> {
    const row = await this.db.customPlanInquiry.create({
      data: {
        businessName: input.businessName,
        businessCategory: input.businessCategory,
        contactName: input.contactName,
        contactEmail: input.contactEmail || null,
        contactPhone: input.contactPhone || null,
        propertyCount: input.propertyCount || 1,
        estimatedMembers: input.estimatedMembers || 10,
        requiredFeatures: input.requiredFeatures,
        additionalRequirements: input.additionalRequirements || null,
        status: 'NEW',
      },
    });

    return {
      id: row.id,
      businessName: row.businessName,
      businessCategory: row.businessCategory,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      propertyCount: row.propertyCount,
      estimatedMembers: row.estimatedMembers,
      requiredFeatures: Array.isArray(row.requiredFeatures) ? row.requiredFeatures : [],
      additionalRequirements: row.additionalRequirements,
      status: row.status,
      assignedToUserId: null,
      createdAt: new Date(row.createdAt).toISOString(),
      quotationsCount: 0,
    };
  }

  /**
   * Creates a formal quotation proposal for an inquiry.
   */
  async createQuotation(input: CreateQuotationInput, actorUserId: string): Promise<CustomQuotationDto> {
    const inquiry = await this.db.customPlanInquiry.findUnique({ where: { id: input.inquiryId } });
    if (!inquiry) {
      throw new Error(`Inquiry with ID "${input.inquiryId}" not found.`);
    }

    const now = new Date();
    const validDays = input.proposalValidDays || 30;
    const proposalValidUntil = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);

    const quotation = await this.db.customQuotation.create({
      data: {
        inquiryId: input.inquiryId,
        tenantId: input.tenantId || null,
        businessName: input.businessName,
        propertyCount: input.propertyCount,
        estimatedMembers: input.estimatedMembers,
        monthlyPrice: input.monthlyPrice,
        currency: input.currency || 'BDT',
        billingInterval: input.billingInterval || 'MONTHLY',
        includedFeatures: input.includedFeatures,
        usageLimits: input.usageLimits || {},
        proposalValidUntil,
        status: 'SENT',
        internalNotes: input.internalNotes || null,
        customerNotes: input.customerNotes || null,
        preparedByUserId: actorUserId,
      },
    });

    // Update parent inquiry status to PROPOSAL_SENT
    await this.db.customPlanInquiry.update({
      where: { id: input.inquiryId },
      data: { status: 'PROPOSAL_SENT' },
    });

    await this.logAudit({
      action: 'custom_proposal.quotation_created',
      entityId: quotation.id,
      actorUserId,
      description: `Created quotation for ${input.businessName}: ${input.monthlyPrice} ${input.currency || 'BDT'}/mo.`,
      afterData: {
        monthlyPrice: input.monthlyPrice,
        propertyCount: input.propertyCount,
        estimatedMembers: input.estimatedMembers,
        includedFeatures: input.includedFeatures,
      },
    });

    return {
      id: quotation.id,
      inquiryId: quotation.inquiryId,
      tenantId: quotation.tenantId,
      businessName: quotation.businessName,
      propertyCount: quotation.propertyCount,
      estimatedMembers: quotation.estimatedMembers,
      monthlyPrice: Number(quotation.monthlyPrice),
      currency: quotation.currency,
      billingInterval: quotation.billingInterval,
      includedFeatures: Array.isArray(quotation.includedFeatures) ? quotation.includedFeatures : [],
      usageLimits: quotation.usageLimits && typeof quotation.usageLimits === 'object' ? quotation.usageLimits : {},
      proposalValidUntil: new Date(quotation.proposalValidUntil).toISOString(),
      status: quotation.status,
      internalNotes: quotation.internalNotes,
      customerNotes: quotation.customerNotes,
      preparedByUserId: quotation.preparedByUserId,
      approvedByUserId: null,
      approvedAt: null,
      createdAt: new Date(quotation.createdAt).toISOString(),
    };
  }

  /**
   * Approves a custom quotation and provisions custom package subscription if tenant exists.
   */
  async approveQuotation(
    quotationId: string,
    actorUserId: string,
    targetTenantId?: string
  ): Promise<CustomQuotationDto> {
    const q = await this.db.customQuotation.findUnique({
      where: { id: quotationId },
      include: { inquiry: true },
    });

    if (!q) {
      throw new Error(`Quotation with ID "${quotationId}" not found.`);
    }

    const now = new Date();
    const effectiveTenantId = targetTenantId || q.tenantId;

    const updated = await this.db.customQuotation.update({
      where: { id: quotationId },
      data: {
        status: 'ACCEPTED',
        approvedByUserId: actorUserId,
        approvedAt: now,
        tenantId: effectiveTenantId || null,
      },
    });

    await this.db.customPlanInquiry.update({
      where: { id: q.inquiryId },
      data: { status: 'APPROVED' },
    });

    // If an effective tenant is designated, provision or update the tenant's subscription
    if (effectiveTenantId) {
      // Find custom business plan template
      let customPlan = await this.db.plan.findFirst({
        where: { planType: 'CUSTOM_BUSINESS' },
      });

      if (!customPlan) {
        customPlan = await this.db.plan.create({
          data: {
            name: 'Custom Business Plan',
            slug: 'custom-business',
            description: 'Negotiated business plan for multi-property operations',
            planType: 'CUSTOM_BUSINESS',
            priceMonthly: q.monthlyPrice,
            currency: q.currency,
            billingInterval: q.billingInterval,
            trialEligible: false,
            trialDays: 0,
            entitlements: q.includedFeatures,
            limits: q.usageLimits,
            status: 'ACTIVE',
          },
        });
      }

      await this.db.subscription.upsert({
        where: { tenantId: effectiveTenantId },
        update: {
          planId: customPlan.id,
          subscriptionType: 'CUSTOM_BUSINESS',
          status: 'ACTIVE',
          priceLocked: q.monthlyPrice,
          currency: q.currency,
          billingInterval: q.billingInterval,
          entitlements: q.includedFeatures,
          limits: q.usageLimits,
          approvedByUserId: actorUserId,
          approvedAt: now,
          autoRenewConsent: false,
        },
        create: {
          tenantId: effectiveTenantId,
          planId: customPlan.id,
          subscriptionType: 'CUSTOM_BUSINESS',
          status: 'ACTIVE',
          priceLocked: q.monthlyPrice,
          currency: q.currency,
          billingInterval: q.billingInterval,
          entitlements: q.includedFeatures,
          limits: q.usageLimits,
          approvedByUserId: actorUserId,
          approvedAt: now,
          autoRenewConsent: false,
        },
      });
    }

    await this.logAudit({
      action: 'custom_proposal.quotation_approved',
      entityId: quotationId,
      actorUserId,
      description: `Approved custom business quotation (${quotationId}) for ${q.businessName} at ${q.monthlyPrice} ${q.currency}/mo.`,
      afterData: {
        monthlyPrice: Number(q.monthlyPrice),
        tenantId: effectiveTenantId,
        approvedAt: now.toISOString(),
      },
    });

    return {
      id: updated.id,
      inquiryId: updated.inquiryId,
      tenantId: updated.tenantId,
      businessName: updated.businessName,
      propertyCount: updated.propertyCount,
      estimatedMembers: updated.estimatedMembers,
      monthlyPrice: Number(updated.monthlyPrice),
      currency: updated.currency,
      billingInterval: updated.billingInterval,
      includedFeatures: Array.isArray(updated.includedFeatures) ? updated.includedFeatures : [],
      usageLimits: updated.usageLimits && typeof updated.usageLimits === 'object' ? updated.usageLimits : {},
      proposalValidUntil: new Date(updated.proposalValidUntil).toISOString(),
      status: updated.status,
      internalNotes: updated.internalNotes,
      customerNotes: updated.customerNotes,
      preparedByUserId: updated.preparedByUserId,
      approvedByUserId: updated.approvedByUserId,
      approvedAt: updated.approvedAt ? new Date(updated.approvedAt).toISOString() : null,
      createdAt: new Date(updated.createdAt).toISOString(),
    };
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
          entityType: 'custom_proposal',
          entityId: params.entityId,
          actorUserId: params.actorUserId,
          description: params.description,
          beforeData: params.beforeData || null,
          afterData: params.afterData || null,
        },
      });
    } catch {
      // Non-blocking audit logger
    }
  }
}

export const customProposalService = new CustomProposalService();
