import { prisma as defaultPrisma } from '@/server/db/prisma';
import { auditService } from '@/server/audit/audit-service';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '@/server/api/errors';
import type {
  AllocationRule,
  BillingPeriodStatus,
  BillStatus,
  MemberPaymentStatus,
  AdjustmentType,
  PaymentMethod,
} from '@/types/database';

export interface FinancialCategoryInput {
  name: string;
  code?: string;
  description?: string;
  allocationRule?: AllocationRule;
  defaultAmountTaka?: number;
}

export interface MonthlyBillChargeInput {
  categoryId: string;
  totalAmountTaka?: number;
  allocationRule?: AllocationRule;
  memberAmounts?: Record<string, number>; // membershipId -> amountTaka
  notes?: string;
}

export interface GenerateBillsInput {
  monthString: string; // "YYYY-MM"
  dueDate?: string;
  notes?: string;
  charges: MonthlyBillChargeInput[];
}

export interface RecordPaymentInput {
  membershipId: string;
  billId?: string;
  paymentDate: string; // "YYYY-MM-DD"
  amountTaka: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface PaymentVerificationInput {
  decision: 'CONFIRM' | 'REJECT';
  rejectionReason?: string;
}

export interface BalanceAdjustmentInput {
  membershipId: string;
  billId?: string;
  amountTaka: number;
  type: AdjustmentType;
  reason: string;
}

// In-Memory storage fallback structures
interface MockTenant {
  id: string;
  slug: string;
  name: string;
}

interface MockMembership {
  id: string;
  tenantId: string;
  userId: string;
  status: string;
  memberCode?: string | null;
  user?: { name: string; email?: string; phone?: string };
}

export class FinanceService {
  private db: any;

  // In-Memory Mock Store for offline testing and fallback
  private mockTenants: MockTenant[] = [];
  private mockMemberships: MockMembership[] = [];
  private mockCategories: any[] = [];
  private mockPeriods: any[] = [];
  private mockBills: any[] = [];
  private mockBillItems: any[] = [];
  private mockPayments: any[] = [];
  private mockAdjustments: any[] = [];

  constructor(customPrisma?: any) {
    this.db = customPrisma || (defaultPrisma as any);
  }

  private isDbAvailable(): boolean {
    return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');
  }

  // ---------------------------------------------------------------------------
  // Mock Data Seed Helpers for Unit Testing
  // ---------------------------------------------------------------------------
  public seedMockTenant(tenant: MockTenant) {
    if (!this.mockTenants.some((t) => t.id === tenant.id)) {
      this.mockTenants.push(tenant);
    }
  }

  public seedMockMembership(member: MockMembership) {
    if (!this.mockMemberships.some((m) => m.id === member.id)) {
      this.mockMemberships.push(member);
    }
  }

  // ---------------------------------------------------------------------------
  // Helper: Tenant Resolution
  // ---------------------------------------------------------------------------
  private async resolveTenant(tenantSlug: string): Promise<{ id: string; slug: string; name: string } | null> {
    if (this.isDbAvailable()) {
      try {
        const tenant = await this.db.tenant.findUnique({
          where: { slug: tenantSlug },
          select: { id: true, slug: true, name: true },
        });
        if (tenant) return tenant;
      } catch {}
    }
    const mock = this.mockTenants.find((t) => t.slug === tenantSlug);
    return mock || null;
  }

  // ---------------------------------------------------------------------------
  // 1. FINANCIAL CATEGORIES MANAGEMENT
  // ---------------------------------------------------------------------------

  public async listCategories(tenantSlug: string, includeInactive = false) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (this.isDbAvailable()) {
      try {
        let categories = await this.db.financialCategory.findMany({
          where: {
            tenantId: tenant.id,
            ...(includeInactive ? {} : { isActive: true }),
          },
          orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        });

        if (categories.length === 0) {
          await this.seedDefaultCategories(tenant.id);
          categories = await this.db.financialCategory.findMany({
            where: {
              tenantId: tenant.id,
              ...(includeInactive ? {} : { isActive: true }),
            },
            orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
          });
        }

        return categories.map(this.formatCategory);
      } catch {}
    }

    // In-memory fallback
    let list = this.mockCategories.filter((c) => c.tenantId === tenant.id);
    if (list.length === 0) {
      this.seedDefaultCategoriesInMemory(tenant.id);
      list = this.mockCategories.filter((c) => c.tenantId === tenant.id);
    }
    if (!includeInactive) {
      list = list.filter((c) => c.isActive);
    }
    return list.map(this.formatCategory);
  }

  public async createCategory(tenantSlug: string, input: FinancialCategoryInput, actorUserId: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (!input.name?.trim()) {
      throw new ValidationError('Category name is required.');
    }

    const code = (input.code?.trim() || input.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_')).substring(0, 30);
    const defaultPoisha = input.defaultAmountTaka && input.defaultAmountTaka > 0
      ? BigInt(Math.round(input.defaultAmountTaka * 100))
      : null;

    if (this.isDbAvailable()) {
      try {
        const existing = await this.db.financialCategory.findUnique({
          where: { tenantId_code: { tenantId: tenant.id, code } },
        });
        if (existing) throw new ConflictError(`Financial category with code "${code}" already exists.`);

        const created = await this.db.financialCategory.create({
          data: {
            tenantId: tenant.id,
            name: input.name.trim(),
            code,
            description: input.description?.trim() || null,
            allocationRule: input.allocationRule || 'EQUAL_PER_MEMBER',
            defaultAmountPoisha: defaultPoisha,
            isActive: true,
            isSystem: false,
          },
        });

        await auditService.recordAuditEvent({
          tenantId: tenant.id,
          actorUserId,
          action: 'finance.category.create',
          entityType: 'financial_category',
          entityId: created.id,
          description: `Created financial charge category "${created.name}" (${created.code})`,
        });

        return this.formatCategory(created);
      } catch (err) {
        if (err instanceof ConflictError) throw err;
      }
    }

    // In-memory
    const existingMock = this.mockCategories.find((c) => c.tenantId === tenant.id && c.code === code);
    if (existingMock) throw new ConflictError(`Financial category with code "${code}" already exists.`);

    const newCat = {
      id: `fcat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: tenant.id,
      name: input.name.trim(),
      code,
      description: input.description?.trim() || null,
      allocationRule: input.allocationRule || 'EQUAL_PER_MEMBER',
      defaultAmountPoisha: defaultPoisha,
      isActive: true,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.mockCategories.push(newCat);

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'finance.category.create',
      entityType: 'financial_category',
      entityId: newCat.id,
      description: `Created financial charge category "${newCat.name}" (${newCat.code})`,
    });

    return this.formatCategory(newCat);
  }

  public async updateCategory(
    tenantSlug: string,
    categoryId: string,
    input: {
      name?: string;
      description?: string;
      allocationRule?: AllocationRule;
      defaultAmountTaka?: number;
      isActive?: boolean;
    },
    actorUserId: string
  ) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    const defaultPoisha = input.defaultAmountTaka !== undefined
      ? input.defaultAmountTaka > 0 ? BigInt(Math.round(input.defaultAmountTaka * 100)) : null
      : undefined;

    if (this.isDbAvailable()) {
      try {
        const cat = await this.db.financialCategory.findFirst({
          where: { id: categoryId, tenantId: tenant.id },
        });
        if (!cat) throw new NotFoundError('Category not found');

        const updated = await this.db.financialCategory.update({
          where: { id: categoryId },
          data: {
            name: input.name?.trim() || undefined,
            description: input.description !== undefined ? input.description?.trim() || null : undefined,
            allocationRule: input.allocationRule || undefined,
            defaultAmountPoisha: defaultPoisha,
            isActive: input.isActive !== undefined ? input.isActive : undefined,
          },
        });

        await auditService.recordAuditEvent({
          tenantId: tenant.id,
          actorUserId,
          action: 'finance.category.update',
          entityType: 'financial_category',
          entityId: updated.id,
          description: `Updated category "${updated.name}" (Active: ${updated.isActive})`,
        });

        return this.formatCategory(updated);
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
      }
    }

    // In-memory
    const cat = this.mockCategories.find((c) => c.id === categoryId && c.tenantId === tenant.id);
    if (!cat) throw new NotFoundError('Category not found');

    if (input.name?.trim()) cat.name = input.name.trim();
    if (input.description !== undefined) cat.description = input.description?.trim() || null;
    if (input.allocationRule) cat.allocationRule = input.allocationRule;
    if (defaultPoisha !== undefined) cat.defaultAmountPoisha = defaultPoisha;
    if (input.isActive !== undefined) cat.isActive = input.isActive;
    cat.updatedAt = new Date();

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'finance.category.update',
      entityType: 'financial_category',
      entityId: cat.id,
      description: `Updated category "${cat.name}" (Active: ${cat.isActive})`,
    });

    return this.formatCategory(cat);
  }

  // ---------------------------------------------------------------------------
  // 2. MONTHLY BILLING RUN & BILL GENERATION
  // ---------------------------------------------------------------------------

  public async getOrCreateBillingPeriod(tenantSlug: string, monthString: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (!/^\d{4}-\d{2}$/.test(monthString)) {
      throw new ValidationError('Invalid month format. Expected YYYY-MM.');
    }

    if (this.isDbAvailable()) {
      try {
        let period = await this.db.monthlyBillingPeriod.findUnique({
          where: { tenantId_monthString: { tenantId: tenant.id, monthString } },
          include: { memberBills: { include: { items: true, payments: true } } },
        });

        if (!period) {
          period = await this.db.monthlyBillingPeriod.create({
            data: {
              tenantId: tenant.id,
              monthString,
              status: 'DRAFT',
              totalBilledPoisha: BigInt(0),
              totalCollectedPoisha: BigInt(0),
            },
            include: { memberBills: { include: { items: true, payments: true } } },
          });
        }

        return this.formatBillingPeriod(period);
      } catch {}
    }

    // In-memory
    let p = this.mockPeriods.find((x) => x.tenantId === tenant.id && x.monthString === monthString);
    if (!p) {
      p = {
        id: `period_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenantId: tenant.id,
        monthString,
        status: 'DRAFT',
        totalBilledPoisha: BigInt(0),
        totalCollectedPoisha: BigInt(0),
        notes: null,
        publishedAt: null,
        closedAt: null,
        closedByUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.mockPeriods.push(p);
    }
    return this.formatBillingPeriod(p);
  }

  public async listBillingPeriods(tenantSlug: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (this.isDbAvailable()) {
      try {
        const periods = await this.db.monthlyBillingPeriod.findMany({
          where: { tenantId: tenant.id },
          orderBy: { monthString: 'desc' },
        });
        return periods.map(this.formatBillingPeriod);
      } catch {}
    }

    return this.mockPeriods
      .filter((p) => p.tenantId === tenant.id)
      .sort((a, b) => b.monthString.localeCompare(a.monthString))
      .map(this.formatBillingPeriod);
  }

  /**
   * Generates or updates itemized monthly bills for all active residents.
   * Safety Guard: If period is LOCKED, changes are strictly forbidden.
   */
  public async generateMonthlyBills(tenantSlug: string, input: GenerateBillsInput, actorUserId: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (!/^\d{4}-\d{2}$/.test(input.monthString)) {
      throw new ValidationError('Invalid month format. Expected YYYY-MM.');
    }

    // Check if period is already locked
    const period = await this.getOrCreateBillingPeriod(tenantSlug, input.monthString);
    if (period.status === 'LOCKED') {
      throw new ForbiddenError(
        `Billing period for ${input.monthString} is closed and locked. Modifying or regenerating bills is forbidden.`
      );
    }

    // Get active members for tenant
    const members = await this.getActiveMembers(tenant.id);
    if (members.length === 0) {
      throw new ValidationError('No active members found in this mess to generate bills for.');
    }

    // Load categories
    const categories = await this.listCategories(tenantSlug, true);
    const categoryMap = new Map<string, any>(categories.map((c: any) => [c.id, c]));

    // Compute previous month string to roll over opening due
    const [y, m] = input.monthString.split('-').map(Number);
    const prevDate = new Date(Date.UTC(y, m - 2, 1));
    const prevMonthString = prevDate.toISOString().substring(0, 7);

    // Calculate charges per member
    let periodTotalBilledPoisha = BigInt(0);
    const generatedBills: any[] = [];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const previousClosingDue = await this.getPreviousMonthClosingBalance(tenant.id, member.id, prevMonthString);

      let rentPoisha = BigInt(0);
      let utilityPoisha = BigInt(0);
      let mealPoisha = BigInt(0);
      let otherPoisha = BigInt(0);

      const billItems: any[] = [];

      // Allocate each charge
      for (const charge of input.charges) {
        const cat = categoryMap.get(charge.categoryId);
        const catCode = cat?.code || 'CHARGE';
        const rule = charge.allocationRule || cat?.allocationRule || 'EQUAL_PER_MEMBER';
        let memberChargePoisha = BigInt(0);

        if (rule === 'CUSTOM_PER_MEMBER' && charge.memberAmounts) {
          const taka = charge.memberAmounts[member.id] || 0;
          memberChargePoisha = BigInt(Math.round(taka * 100));
        } else if (rule === 'FIXED_AMOUNT') {
          const taka = charge.totalAmountTaka || (cat?.defaultAmountPoisha ? Number(cat.defaultAmountPoisha) / 100 : 0);
          memberChargePoisha = BigInt(Math.round(taka * 100));
        } else {
          // Equal per member distribution: distribute remainder safely down to exact single poisha!
          const totalPoisha = BigInt(Math.round((charge.totalAmountTaka || 0) * 100));
          const count = BigInt(members.length);
          const base = totalPoisha / count;
          const remainder = totalPoisha % count;
          memberChargePoisha = BigInt(i) < remainder ? base + BigInt(1) : base;
        }

        if (memberChargePoisha > BigInt(0)) {
          // Categorize into rent, utility, meal, other
          if (catCode === 'ROOM_RENT') {
            rentPoisha += memberChargePoisha;
          } else if (['ELECTRICITY', 'GAS', 'WATER', 'WIFI'].includes(catCode)) {
            utilityPoisha += memberChargePoisha;
          } else if (['MEAL_CHARGES', 'GUEST_MEAL_CHARGES'].includes(catCode)) {
            mealPoisha += memberChargePoisha;
          } else {
            otherPoisha += memberChargePoisha;
          }

          billItems.push({
            categoryId: charge.categoryId,
            categoryName: cat?.name || 'Standard Charge',
            amountPoisha: memberChargePoisha,
            allocationRule: rule,
            notes: charge.notes || null,
          });
        }
      }

      const totalChargesPoisha = rentPoisha + utilityPoisha + mealPoisha + otherPoisha;
      const paidPoisha = BigInt(0);
      const creditPoisha = BigInt(0);
      const closingBalancePoisha = previousClosingDue + totalChargesPoisha - paidPoisha - creditPoisha;

      const billNumber = `${tenant.slug.toUpperCase().substring(0, 4)}-${input.monthString.replace('-', '')}-${member.memberCode || (i + 1).toString().padStart(3, '0')}`;

      generatedBills.push({
        tenantId: tenant.id,
        billingPeriodId: period.id,
        membershipId: member.id,
        monthString: input.monthString,
        billNumber,
        openingDuePoisha: previousClosingDue,
        rentChargesPoisha: rentPoisha,
        utilityChargesPoisha: utilityPoisha,
        mealChargesPoisha: mealPoisha,
        otherChargesPoisha: otherPoisha,
        totalChargesPoisha,
        paidAmountPoisha: paidPoisha,
        creditAdjustmentPoisha: creditPoisha,
        closingBalancePoisha,
        status: 'DRAFT',
        dueDate: input.dueDate || null,
        notes: input.notes || null,
        items: billItems,
      });

      periodTotalBilledPoisha += totalChargesPoisha;
    }

    // Persist in DB or in-memory
    if (this.isDbAvailable()) {
      try {
        await this.db.monthlyBillingPeriod.update({
          where: { id: period.id },
          data: {
            totalBilledPoisha: periodTotalBilledPoisha,
            notes: input.notes || undefined,
          },
        });

        // Upsert bills
        for (const billData of generatedBills) {
          const { items, ...mainData } = billData;
          const bill = await this.db.memberBill.upsert({
            where: {
              tenantId_billingPeriodId_membershipId: {
                tenantId: tenant.id,
                billingPeriodId: period.id,
                membershipId: mainData.membershipId,
              },
            },
            create: mainData,
            update: mainData,
          });

          await this.db.billItem.deleteMany({ where: { billId: bill.id } });
          if (items.length > 0) {
            await this.db.billItem.createMany({
              data: items.map((it: any) => ({ ...it, billId: bill.id })),
            });
          }
        }

        await auditService.recordAuditEvent({
          tenantId: tenant.id,
          actorUserId,
          action: 'finance.bills.generate',
          entityType: 'monthly_billing_period',
          entityId: period.id,
          description: `Generated ${generatedBills.length} monthly member bills for ${input.monthString} totaling ৳${(Number(periodTotalBilledPoisha) / 100).toFixed(2)}`,
        });

        return this.listMemberBills(tenantSlug, input.monthString);
      } catch {}
    }

    // In-memory
    const targetPeriod = this.mockPeriods.find((p) => p.id === period.id);
    if (targetPeriod) {
      targetPeriod.totalBilledPoisha = periodTotalBilledPoisha;
      targetPeriod.notes = input.notes || null;
    }

    // Remove old drafts for this period
    this.mockBills = this.mockBills.filter((b) => b.billingPeriodId !== period.id);

    for (const billData of generatedBills) {
      const { items, ...mainData } = billData;
      const billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const savedBill = {
        id: billId,
        ...mainData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.mockBills.push(savedBill);

      for (const item of items) {
        this.mockBillItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          billId,
          ...item,
          createdAt: new Date(),
        });
      }
    }

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'finance.bills.generate',
      entityType: 'monthly_billing_period',
      entityId: period.id,
      description: `Generated ${generatedBills.length} monthly member bills for ${input.monthString} totaling ৳${(Number(periodTotalBilledPoisha) / 100).toFixed(2)}`,
    });

    return this.listMemberBills(tenantSlug, input.monthString);
  }

  public async publishBills(tenantSlug: string, monthString: string, actorUserId: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    const period = await this.getOrCreateBillingPeriod(tenantSlug, monthString);
    if (period.status === 'LOCKED') {
      throw new ForbiddenError('Billing period is already locked.');
    }

    const now = new Date();

    if (this.isDbAvailable()) {
      try {
        await this.db.monthlyBillingPeriod.update({
          where: { id: period.id },
          data: { status: 'PUBLISHED', publishedAt: now },
        });

        await this.db.memberBill.updateMany({
          where: { billingPeriodId: period.id, status: 'DRAFT' },
          data: { status: 'PUBLISHED', publishedAt: now },
        });

        await auditService.recordAuditEvent({
          tenantId: tenant.id,
          actorUserId,
          action: 'finance.bills.publish',
          entityType: 'monthly_billing_period',
          entityId: period.id,
          description: `Published all member bills for ${monthString}`,
        });

        return { success: true, monthString, status: 'PUBLISHED' };
      } catch {}
    }

    // In-memory
    const targetPeriod = this.mockPeriods.find((p) => p.id === period.id);
    if (targetPeriod) {
      targetPeriod.status = 'PUBLISHED';
      targetPeriod.publishedAt = now;
    }

    this.mockBills
      .filter((b) => b.billingPeriodId === period.id && b.status === 'DRAFT')
      .forEach((b) => {
        b.status = 'PUBLISHED';
        b.publishedAt = now;
      });

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'finance.bills.publish',
      entityType: 'monthly_billing_period',
      entityId: period.id,
      description: `Published all member bills for ${monthString}`,
    });

    return { success: true, monthString, status: 'PUBLISHED' };
  }

  /**
   * Closes and locks monthly billing period. Freezes statements.
   */
  public async closeMonthlyBilling(tenantSlug: string, monthString: string, actorUserId: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    const period = await this.getOrCreateBillingPeriod(tenantSlug, monthString);
    if (period.status === 'LOCKED') {
      throw new ConflictError(`Billing period for ${monthString} is already closed and locked.`);
    }

    const now = new Date();

    if (this.isDbAvailable()) {
      try {
        const closed = await this.db.monthlyBillingPeriod.update({
          where: { id: period.id },
          data: {
            status: 'LOCKED',
            closedAt: now,
            closedByUserId: actorUserId,
          },
        });

        await auditService.recordAuditEvent({
          tenantId: tenant.id,
          actorUserId,
          action: 'finance.month.close',
          entityType: 'monthly_billing_period',
          entityId: closed.id,
          description: `Closed and locked monthly financial ledger for ${monthString}`,
        });

        return this.formatBillingPeriod(closed);
      } catch {}
    }

    // In-memory
    const p = this.mockPeriods.find((x) => x.id === period.id);
    if (p) {
      p.status = 'LOCKED';
      p.closedAt = now;
      p.closedByUserId = actorUserId;
    }

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'finance.month.close',
      entityType: 'monthly_billing_period',
      entityId: period.id,
      description: `Closed and locked monthly financial ledger for ${monthString}`,
    });

    return this.formatBillingPeriod(p);
  }

  // ---------------------------------------------------------------------------
  // 3. MEMBER BILLS & STATEMENT INVENTORY
  // ---------------------------------------------------------------------------

  public async listMemberBills(tenantSlug: string, monthString: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (this.isDbAvailable()) {
      try {
        const bills = await this.db.memberBill.findMany({
          where: { tenantId: tenant.id, monthString },
          include: {
            membership: { include: { user: true } },
            items: true,
            payments: true,
          },
          orderBy: { billNumber: 'asc' },
        });
        return bills.map((b: any) => this.formatMemberBill(b));
      } catch {}
    }

    // In-memory
    const period = this.mockPeriods.find((p) => p.tenantId === tenant.id && p.monthString === monthString);
    if (!period) return [];

    const bills = this.mockBills.filter((b) => b.billingPeriodId === period.id);
    return bills.map((b) => {
      const items = this.mockBillItems.filter((it) => it.billId === b.id);
      const payments = this.mockPayments.filter((pm) => pm.billId === b.id && pm.status === 'CONFIRMED');
      const membership = this.mockMemberships.find((m) => m.id === b.membershipId);
      return this.formatMemberBill({ ...b, items, payments, membership });
    });
  }

  /**
   * Retrieves a single member's financial statement.
   * Privacy Guard: Regular members cannot inspect other members' financial statements!
   */
  public async getMemberStatement(
    tenantSlug: string,
    membershipId: string,
    monthString?: string,
    viewerContext?: { isOwner: boolean; permissions: Set<string>; viewerMembershipId?: string }
  ) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    // Strict privacy enforcement
    if (viewerContext) {
      const isSelf = viewerContext.viewerMembershipId === membershipId;
      const canViewAll = viewerContext.isOwner || viewerContext.permissions.has('finance.view_all_members');
      if (!isSelf && !canViewAll) {
        throw new ForbiddenError('Unauthorized: You are not permitted to view other members financial statements.');
      }
    }

    const currentMonth = monthString || new Date().toISOString().substring(0, 7);

    let bill: any = null;
    let items: any[] = [];
    let payments: any[] = [];
    let adjustments: any[] = [];
    let memberData: any = null;

    if (this.isDbAvailable()) {
      try {
        bill = await this.db.memberBill.findFirst({
          where: { tenantId: tenant.id, membershipId, monthString: currentMonth },
          include: {
            membership: { include: { user: true } },
            items: true,
            payments: true,
            adjustments: true,
            billingPeriod: true,
          },
        });

        if (bill) {
          items = bill.items;
          payments = bill.payments;
          adjustments = bill.adjustments;
          memberData = bill.membership;
        } else {
          memberData = await this.db.membership.findFirst({
            where: { id: membershipId, tenantId: tenant.id },
            include: { user: true },
          });
        }
      } catch {}
    }

    if (!bill) {
      bill = this.mockBills.find((b) => b.tenantId === tenant.id && b.membershipId === membershipId && b.monthString === currentMonth);
      if (bill) {
        items = this.mockBillItems.filter((it) => it.billId === bill.id);
        payments = this.mockPayments.filter((p) => p.billId === bill.id);
        adjustments = this.mockAdjustments.filter((a) => a.billId === bill.id);
      }
      memberData = this.mockMemberships.find((m) => m.id === membershipId && m.tenantId === tenant.id);
    }

    if (!memberData) {
      throw new NotFoundError('Member record not found in this mess');
    }

    const period = await this.getOrCreateBillingPeriod(tenantSlug, currentMonth);

    const openingDuePoisha = bill?.openingDuePoisha ? BigInt(bill.openingDuePoisha) : BigInt(0);
    const rentChargesPoisha = bill?.rentChargesPoisha ? BigInt(bill.rentChargesPoisha) : BigInt(0);
    const utilityChargesPoisha = bill?.utilityChargesPoisha ? BigInt(bill.utilityChargesPoisha) : BigInt(0);
    const mealChargesPoisha = bill?.mealChargesPoisha ? BigInt(bill.mealChargesPoisha) : BigInt(0);
    const otherChargesPoisha = bill?.otherChargesPoisha ? BigInt(bill.otherChargesPoisha) : BigInt(0);
    const totalChargesPoisha = bill?.totalChargesPoisha ? BigInt(bill.totalChargesPoisha) : rentChargesPoisha + utilityChargesPoisha + mealChargesPoisha + otherChargesPoisha;
    const paidAmountPoisha = bill?.paidAmountPoisha ? BigInt(bill.paidAmountPoisha) : BigInt(0);
    const creditAdjustmentPoisha = bill?.creditAdjustmentPoisha ? BigInt(bill.creditAdjustmentPoisha) : BigInt(0);

    // Closing Balance Formula:
    // Closing Balance = Opening Due + Total Charges - Confirmed Payments - Credits
    const closingBalancePoisha = openingDuePoisha + totalChargesPoisha - paidAmountPoisha - creditAdjustmentPoisha;

    return {
      membershipId,
      memberName: memberData?.user?.name || 'Member',
      memberCode: memberData?.memberCode || null,
      monthString: currentMonth,
      billId: bill?.id || null,
      billNumber: bill?.billNumber || null,
      billStatus: bill?.status || 'UNBILLED',
      isPeriodLocked: period.status === 'LOCKED',
      openingDueTaka: Number(openingDuePoisha) / 100,
      rentChargesTaka: Number(rentChargesPoisha) / 100,
      utilityChargesTaka: Number(utilityChargesPoisha) / 100,
      mealChargesTaka: Number(mealChargesPoisha) / 100,
      otherChargesTaka: Number(otherChargesPoisha) / 100,
      totalChargesTaka: Number(totalChargesPoisha) / 100,
      paidAmountTaka: Number(paidAmountPoisha) / 100,
      creditAdjustmentTaka: Number(creditAdjustmentPoisha) / 100,
      closingBalanceTaka: Number(closingBalancePoisha) / 100,
      items: items.map((it) => ({
        id: it.id,
        categoryName: it.categoryName,
        amountTaka: Number(it.amountPoisha) / 100,
        allocationRule: it.allocationRule,
        notes: it.notes,
      })),
      payments: payments.map(this.formatPayment),
      adjustments: adjustments.map((ad) => ({
        id: ad.id,
        type: ad.type,
        amountTaka: Number(ad.amountPoisha) / 100,
        reason: ad.reason,
        createdAt: ad.createdAt,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // 4. MANUAL PAYMENT RECORDING
  // ---------------------------------------------------------------------------

  public async recordPayment(tenantSlug: string, input: RecordPaymentInput, actorUserId: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (!input.membershipId) throw new ValidationError('Member ID is required.');
    if (!input.amountTaka || input.amountTaka <= 0) {
      throw new ValidationError('Payment amount must be greater than zero.');
    }
    if (!input.paymentDate) throw new ValidationError('Payment date is required.');

    const amountPoisha = BigInt(Math.round(input.amountTaka * 100));

    // Duplicate transaction verification for digital payments (bKash/Nagad/Rocket/Bank)
    const cleanTrx = input.transactionId?.trim() || null;
    if (cleanTrx) {
      const isDuplicate = await this.checkDuplicateTransaction(tenant.id, cleanTrx);
      if (isDuplicate) {
        throw new ConflictError(`Payment with transaction ID "${cleanTrx}" has already been recorded in this mess.`);
      }
    }

    if (this.isDbAvailable()) {
      try {
        const payment = await this.db.memberPayment.create({
          data: {
            tenantId: tenant.id,
            membershipId: input.membershipId,
            billId: input.billId || null,
            paymentDate: input.paymentDate,
            amountPoisha,
            paymentMethod: input.paymentMethod || 'CASH',
            transactionId: cleanTrx,
            receiptUrl: input.receiptUrl?.trim() || null,
            notes: input.notes?.trim() || null,
            status: 'PENDING',
            receivedByUserId: actorUserId,
          },
          include: {
            membership: { include: { user: true } },
          },
        });

        await auditService.recordAuditEvent({
          tenantId: tenant.id,
          actorUserId,
          action: 'finance.payment.record',
          entityType: 'member_payment',
          entityId: payment.id,
          description: `Recorded payment of ৳${input.amountTaka.toFixed(2)} (${input.paymentMethod}) for member ${payment.membership?.user?.name || input.membershipId}`,
        });

        return this.formatPayment(payment);
      } catch (err) {
        if (err instanceof ConflictError) throw err;
      }
    }

    // In-memory
    const newPayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: tenant.id,
      membershipId: input.membershipId,
      billId: input.billId || null,
      paymentDate: input.paymentDate,
      amountPoisha,
      paymentMethod: input.paymentMethod || 'CASH',
      transactionId: cleanTrx,
      receiptUrl: input.receiptUrl?.trim() || null,
      notes: input.notes?.trim() || null,
      status: 'PENDING' as MemberPaymentStatus,
      receivedByUserId: actorUserId,
      verifiedByUserId: null,
      verifiedAt: null,
      rejectionReason: null,
      refundReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      membership: this.mockMemberships.find((m) => m.id === input.membershipId),
    };
    this.mockPayments.push(newPayment);

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'finance.payment.record',
      entityType: 'member_payment',
      entityId: newPayment.id,
      description: `Recorded payment of ৳${input.amountTaka.toFixed(2)} (${input.paymentMethod}) for member ${newPayment.membership?.user?.name || input.membershipId}`,
    });

    return this.formatPayment(newPayment);
  }

  public async listPayments(
    tenantSlug: string,
    filters: { status?: string; month?: string; membershipId?: string } = {}
  ) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (this.isDbAvailable()) {
      try {
        const where: any = { tenantId: tenant.id };
        if (filters.status && filters.status !== 'ALL') where.status = filters.status;
        if (filters.month) where.paymentDate = { startsWith: filters.month };
        if (filters.membershipId) where.membershipId = filters.membershipId;

        const payments = await this.db.memberPayment.findMany({
          where,
          include: { membership: { include: { user: true } } },
          orderBy: { paymentDate: 'desc' },
        });

        return payments.map((p: any) => this.formatPayment(p));
      } catch {}
    }

    // In-memory
    let list = this.mockPayments.filter((p) => p.tenantId === tenant.id);
    if (filters.status && filters.status !== 'ALL') list = list.filter((p) => p.status === filters.status);
    if (filters.month) list = list.filter((p) => p.paymentDate.startsWith(filters.month!));
    if (filters.membershipId) list = list.filter((p) => p.membershipId === filters.membershipId);

    return list
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
      .map((p) => {
        const membership = p.membership || this.mockMemberships.find((m) => m.id === p.membershipId);
        return this.formatPayment({ ...p, membership });
      });
  }

  // ---------------------------------------------------------------------------
  // 5. PAYMENT VERIFICATION WORKFLOW
  // ---------------------------------------------------------------------------

  public async verifyPayment(
    tenantSlug: string,
    paymentId: string,
    input: PaymentVerificationInput,
    actorUserId: string
  ) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (input.decision === 'REJECT' && !input.rejectionReason?.trim()) {
      throw new ValidationError('Rejection reason is mandatory when rejecting a payment.');
    }

    const now = new Date();

    if (this.isDbAvailable()) {
      try {
        const payment = await this.db.memberPayment.findFirst({
          where: { id: paymentId, tenantId: tenant.id },
          include: { bill: true },
        });
        if (!payment) throw new NotFoundError('Payment record not found');
        if (payment.status !== 'PENDING') {
          throw new ConflictError(`Payment is already in ${payment.status} status.`);
        }

        const isApproved = input.decision === 'CONFIRM';
        const newStatus: MemberPaymentStatus = isApproved ? 'CONFIRMED' : 'REJECTED';

        const updatedPayment = await this.db.memberPayment.update({
          where: { id: paymentId },
          data: {
            status: newStatus,
            verifiedByUserId: actorUserId,
            verifiedAt: now,
            rejectionReason: isApproved ? null : input.rejectionReason?.trim() || null,
          },
        });

        // If confirmed, update member's bill & collected total
        if (isApproved && payment.billId) {
          await this.applyPaymentToBillInDb(payment.billId, payment.amountPoisha);
        }

        await auditService.recordAuditEvent({
          tenantId: tenant.id,
          actorUserId,
          action: isApproved ? 'finance.payment.verify' : 'finance.payment.reject',
          entityType: 'member_payment',
          entityId: payment.id,
          description: `${isApproved ? 'Confirmed' : 'Rejected'} payment of ৳${(Number(payment.amountPoisha) / 100).toFixed(2)} (Reason: ${input.rejectionReason || 'Verified by manager'})`,
        });

        return this.formatPayment(updatedPayment);
      } catch (err) {
        if (err instanceof NotFoundError || err instanceof ConflictError || err instanceof ValidationError) throw err;
      }
    }

    // In-memory
    const payment = this.mockPayments.find((p) => p.id === paymentId && p.tenantId === tenant.id);
    if (!payment) throw new NotFoundError('Payment record not found');
    if (payment.status !== 'PENDING') {
      throw new ConflictError(`Payment is already in ${payment.status} status.`);
    }

    const isApproved = input.decision === 'CONFIRM';
    payment.status = isApproved ? 'CONFIRMED' : 'REJECTED';
    payment.verifiedByUserId = actorUserId;
    payment.verifiedAt = now;
    payment.rejectionReason = isApproved ? null : input.rejectionReason?.trim() || null;
    payment.updatedAt = now;

    if (isApproved && payment.billId) {
      this.applyPaymentToBillInMemory(payment.billId, payment.amountPoisha);
    }

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: isApproved ? 'finance.payment.verify' : 'finance.payment.reject',
      entityType: 'member_payment',
      entityId: payment.id,
      description: `${isApproved ? 'Confirmed' : 'Rejected'} payment of ৳${(Number(payment.amountPoisha) / 100).toFixed(2)} (Reason: ${input.rejectionReason || 'Verified by manager'})`,
    });

    return this.formatPayment(payment);
  }

  public async refundPayment(tenantSlug: string, paymentId: string, input: { reason: string }, actorUserId: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (!input.reason?.trim()) {
      throw new ValidationError('A refund reason is mandatory for financial reconciliation.');
    }

    const now = new Date();

    if (this.isDbAvailable()) {
      try {
        const payment = await this.db.memberPayment.findFirst({
          where: { id: paymentId, tenantId: tenant.id },
        });
        if (!payment) throw new NotFoundError('Payment not found');
        if (payment.status !== 'CONFIRMED') {
          throw new ConflictError('Only confirmed payments can be refunded or reversed.');
        }

        const updated = await this.db.memberPayment.update({
          where: { id: paymentId },
          data: {
            status: 'REFUNDED',
            refundReason: input.reason.trim(),
          },
        });

        if (payment.billId) {
          // Revert amount
          await this.revertPaymentFromBillInDb(payment.billId, payment.amountPoisha);
        }

        await auditService.recordAuditEvent({
          tenantId: tenant.id,
          actorUserId,
          action: 'finance.payment.refund',
          entityType: 'member_payment',
          entityId: updated.id,
          description: `Refunded payment of ৳${(Number(payment.amountPoisha) / 100).toFixed(2)} (Reason: ${input.reason.trim()})`,
        });

        return this.formatPayment(updated);
      } catch (err) {
        if (err instanceof NotFoundError || err instanceof ConflictError) throw err;
      }
    }

    // In-memory
    const payment = this.mockPayments.find((p) => p.id === paymentId && p.tenantId === tenant.id);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== 'CONFIRMED') {
      throw new ConflictError('Only confirmed payments can be refunded or reversed.');
    }

    payment.status = 'REFUNDED';
    payment.refundReason = input.reason.trim();
    payment.updatedAt = now;

    if (payment.billId) {
      this.revertPaymentFromBillInMemory(payment.billId, payment.amountPoisha);
    }

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'finance.payment.refund',
      entityType: 'member_payment',
      entityId: payment.id,
      description: `Refunded payment of ৳${(Number(payment.amountPoisha) / 100).toFixed(2)} (Reason: ${input.reason.trim()})`,
    });

    return this.formatPayment(payment);
  }

  // ---------------------------------------------------------------------------
  // 6. BALANCE ADJUSTMENTS & CORRECTIONS
  // ---------------------------------------------------------------------------

  public async createAdjustment(tenantSlug: string, input: BalanceAdjustmentInput, actorUserId: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (!input.membershipId) throw new ValidationError('Member ID is required.');
    if (!input.amountTaka || input.amountTaka <= 0) {
      throw new ValidationError('Adjustment amount must be greater than zero.');
    }
    if (!input.reason?.trim()) {
      throw new ValidationError('Adjustment reason is required.');
    }

    const amountPoisha = BigInt(Math.round(input.amountTaka * 100));

    if (this.isDbAvailable()) {
      try {
        const adjustment = await this.db.balanceAdjustment.create({
          data: {
            tenantId: tenant.id,
            membershipId: input.membershipId,
            billId: input.billId || null,
            amountPoisha,
            type: input.type,
            reason: input.reason.trim(),
            authorizedByUserId: actorUserId,
          },
        });

        if (input.billId) {
          const bill = await this.db.memberBill.findUnique({ where: { id: input.billId } });
          if (bill) {
            const currentCredit = BigInt(bill.creditAdjustmentPoisha);
            const newCredit = input.type === 'CREDIT' ? currentCredit + amountPoisha : currentCredit - amountPoisha;
            const newClosing = BigInt(bill.openingDuePoisha) + BigInt(bill.totalChargesPoisha) - BigInt(bill.paidAmountPoisha) - newCredit;

            await this.db.memberBill.update({
              where: { id: bill.id },
              data: {
                creditAdjustmentPoisha: newCredit,
                closingBalancePoisha: newClosing,
              },
            });
          }
        }

        await auditService.recordAuditEvent({
          tenantId: tenant.id,
          actorUserId,
          action: 'finance.balance.adjust',
          entityType: 'balance_adjustment',
          entityId: adjustment.id,
          description: `Applied ${input.type} of ৳${input.amountTaka.toFixed(2)} to member (Reason: ${input.reason.trim()})`,
        });

        return {
          id: adjustment.id,
          membershipId: adjustment.membershipId,
          amountTaka: input.amountTaka,
          type: adjustment.type,
          reason: adjustment.reason,
          createdAt: adjustment.createdAt,
        };
      } catch {}
    }

    // In-memory
    const adj = {
      id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: tenant.id,
      membershipId: input.membershipId,
      billId: input.billId || null,
      amountPoisha,
      type: input.type,
      reason: input.reason.trim(),
      authorizedByUserId: actorUserId,
      createdAt: new Date(),
    };
    this.mockAdjustments.push(adj);

    if (input.billId) {
      const bill = this.mockBills.find((b) => b.id === input.billId);
      if (bill) {
        const currentCredit = BigInt(bill.creditAdjustmentPoisha || 0);
        const newCredit = input.type === 'CREDIT' ? currentCredit + amountPoisha : currentCredit - amountPoisha;
        bill.creditAdjustmentPoisha = newCredit;
        bill.closingBalancePoisha = BigInt(bill.openingDuePoisha) + BigInt(bill.totalChargesPoisha) - BigInt(bill.paidAmountPoisha) - newCredit;
      }
    }

    await auditService.recordAuditEvent({
      tenantId: tenant.id,
      actorUserId,
      action: 'finance.balance.adjust',
      entityType: 'balance_adjustment',
      entityId: adj.id,
      description: `Applied ${input.type} of ৳${input.amountTaka.toFixed(2)} to member (Reason: ${input.reason.trim()})`,
    });

    return {
      id: adj.id,
      membershipId: adj.membershipId,
      amountTaka: input.amountTaka,
      type: adj.type,
      reason: adj.reason,
      createdAt: adj.createdAt,
    };
  }

  // ---------------------------------------------------------------------------
  // 7. FINANCIAL OVERVIEW & REPORTING
  // ---------------------------------------------------------------------------

  public async getFinancialOverview(tenantSlug: string, monthString: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    const bills = await this.listMemberBills(tenantSlug, monthString);
    const payments = await this.listPayments(tenantSlug, { month: monthString });
    const period = await this.getOrCreateBillingPeriod(tenantSlug, monthString);

    let totalBilledPoisha = BigInt(0);
    let totalCollectedPoisha = BigInt(0);
    let totalOutstandingDuePoisha = BigInt(0);
    let totalPendingVerificationPoisha = BigInt(0);

    for (const b of bills) {
      totalBilledPoisha += BigInt(Math.round(b.totalChargesTaka * 100));
      if (b.closingBalanceTaka > 0) {
        totalOutstandingDuePoisha += BigInt(Math.round(b.closingBalanceTaka * 100));
      }
    }

    const paymentMethodBreakdown: Record<string, { count: number; totalTaka: number }> = {
      CASH: { count: 0, totalTaka: 0 },
      BKASH: { count: 0, totalTaka: 0 },
      NAGAD: { count: 0, totalTaka: 0 },
      ROCKET: { count: 0, totalTaka: 0 },
      BANK: { count: 0, totalTaka: 0 },
      OTHER: { count: 0, totalTaka: 0 },
    };

    for (const p of payments) {
      if (p.status === 'CONFIRMED') {
        totalCollectedPoisha += BigInt(Math.round(p.amountTaka * 100));
        const method = p.paymentMethod || 'OTHER';
        if (!paymentMethodBreakdown[method]) paymentMethodBreakdown[method] = { count: 0, totalTaka: 0 };
        paymentMethodBreakdown[method].count += 1;
        paymentMethodBreakdown[method].totalTaka += p.amountTaka;
      } else if (p.status === 'PENDING') {
        totalPendingVerificationPoisha += BigInt(Math.round(p.amountTaka * 100));
      }
    }

    return {
      monthString,
      isPeriodLocked: period.status === 'LOCKED',
      periodStatus: period.status,
      kpis: {
        totalBilledTaka: Number(totalBilledPoisha) / 100,
        totalCollectedTaka: Number(totalCollectedPoisha) / 100,
        totalOutstandingDueTaka: Number(totalOutstandingDuePoisha) / 100,
        totalPendingVerificationTaka: Number(totalPendingVerificationPoisha) / 100,
      },
      paymentMethodBreakdown,
      memberCount: bills.length,
      bills,
    };
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers & Invariants
  // ---------------------------------------------------------------------------

  private async getPreviousMonthClosingBalance(tenantId: string, membershipId: string, prevMonth: string): Promise<bigint> {
    if (this.isDbAvailable()) {
      try {
        const prevBill = await this.db.memberBill.findFirst({
          where: { tenantId, membershipId, monthString: prevMonth },
          select: { closingBalancePoisha: true },
        });
        if (prevBill) return BigInt(prevBill.closingBalancePoisha);
      } catch {}
    }
    const prev = this.mockBills.find((b) => b.tenantId === tenantId && b.membershipId === membershipId && b.monthString === prevMonth);
    return prev ? BigInt(prev.closingBalancePoisha) : BigInt(0);
  }

  private async checkDuplicateTransaction(tenantId: string, trxId: string): Promise<boolean> {
    if (this.isDbAvailable()) {
      try {
        const count = await this.db.memberPayment.count({
          where: { tenantId, transactionId: trxId },
        });
        return count > 0;
      } catch {}
    }
    return this.mockPayments.some((p) => p.tenantId === tenantId && p.transactionId === trxId);
  }

  private async getActiveMembers(tenantId: string): Promise<Array<{ id: string; name: string; memberCode?: string | null }>> {
    if (this.isDbAvailable()) {
      try {
        const members = await this.db.membership.findMany({
          where: { tenantId, status: 'ACTIVE' },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        });
        return members.map((m: any) => ({
          id: m.id,
          name: m.user?.name || 'Resident',
          memberCode: m.memberCode || null,
        }));
      } catch {}
    }
    return this.mockMemberships
      .filter((m) => m.tenantId === tenantId && m.status === 'ACTIVE')
      .map((m) => ({
        id: m.id,
        name: m.user?.name || 'Resident',
        memberCode: m.memberCode || null,
      }));
  }

  private async applyPaymentToBillInDb(billId: string, paymentPoisha: bigint) {
    const bill = await this.db.memberBill.findUnique({ where: { id: billId } });
    if (!bill) return;

    const newPaid = BigInt(bill.paidAmountPoisha) + paymentPoisha;
    const newClosing = BigInt(bill.openingDuePoisha) + BigInt(bill.totalChargesPoisha) - newPaid - BigInt(bill.creditAdjustmentPoisha);
    const newStatus: BillStatus = newClosing <= BigInt(0) ? 'PAID' : 'PARTIALLY_PAID';

    await this.db.memberBill.update({
      where: { id: billId },
      data: {
        paidAmountPoisha: newPaid,
        closingBalancePoisha: newClosing,
        status: newStatus,
      },
    });

    await this.db.monthlyBillingPeriod.update({
      where: { id: bill.billingPeriodId },
      data: {
        totalCollectedPoisha: { increment: paymentPoisha },
      },
    });
  }

  private applyPaymentToBillInMemory(billId: string, paymentPoisha: bigint) {
    const bill = this.mockBills.find((b) => b.id === billId);
    if (!bill) return;

    const newPaid = BigInt(bill.paidAmountPoisha || 0) + paymentPoisha;
    const newClosing = BigInt(bill.openingDuePoisha) + BigInt(bill.totalChargesPoisha) - newPaid - BigInt(bill.creditAdjustmentPoisha || 0);
    bill.paidAmountPoisha = newPaid;
    bill.closingBalancePoisha = newClosing;
    bill.status = newClosing <= BigInt(0) ? 'PAID' : 'PARTIALLY_PAID';

    const period = this.mockPeriods.find((p) => p.id === bill.billingPeriodId);
    if (period) {
      period.totalCollectedPoisha = BigInt(period.totalCollectedPoisha || 0) + paymentPoisha;
    }
  }

  private async revertPaymentFromBillInDb(billId: string, paymentPoisha: bigint) {
    const bill = await this.db.memberBill.findUnique({ where: { id: billId } });
    if (!bill) return;

    const newPaid = BigInt(bill.paidAmountPoisha) - paymentPoisha;
    const safePaid = newPaid < BigInt(0) ? BigInt(0) : newPaid;
    const newClosing = BigInt(bill.openingDuePoisha) + BigInt(bill.totalChargesPoisha) - safePaid - BigInt(bill.creditAdjustmentPoisha);
    const newStatus: BillStatus = safePaid === BigInt(0) ? 'PUBLISHED' : newClosing <= BigInt(0) ? 'PAID' : 'PARTIALLY_PAID';

    await this.db.memberBill.update({
      where: { id: billId },
      data: {
        paidAmountPoisha: safePaid,
        closingBalancePoisha: newClosing,
        status: newStatus,
      },
    });

    await this.db.monthlyBillingPeriod.update({
      where: { id: bill.billingPeriodId },
      data: {
        totalCollectedPoisha: { decrement: paymentPoisha },
      },
    });
  }

  private revertPaymentFromBillInMemory(billId: string, paymentPoisha: bigint) {
    const bill = this.mockBills.find((b) => b.id === billId);
    if (!bill) return;

    const newPaid = BigInt(bill.paidAmountPoisha || 0) - paymentPoisha;
    const safePaid = newPaid < BigInt(0) ? BigInt(0) : newPaid;
    const newClosing = BigInt(bill.openingDuePoisha) + BigInt(bill.totalChargesPoisha) - safePaid - BigInt(bill.creditAdjustmentPoisha || 0);
    bill.paidAmountPoisha = safePaid;
    bill.closingBalancePoisha = newClosing;
    bill.status = safePaid === BigInt(0) ? 'PUBLISHED' : newClosing <= BigInt(0) ? 'PAID' : 'PARTIALLY_PAID';

    const period = this.mockPeriods.find((p) => p.id === bill.billingPeriodId);
    if (period) {
      const cur = BigInt(period.totalCollectedPoisha || 0);
      period.totalCollectedPoisha = cur - paymentPoisha < BigInt(0) ? BigInt(0) : cur - paymentPoisha;
    }
  }

  private async seedDefaultCategories(tenantId: string) {
    const defaults = this.getDefaultCategoriesData(tenantId);
    for (const d of defaults) {
      await this.db.financialCategory.create({ data: d });
    }
  }

  private seedDefaultCategoriesInMemory(tenantId: string) {
    const defaults = this.getDefaultCategoriesData(tenantId);
    for (const d of defaults) {
      this.mockCategories.push({
        id: `fcat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ...d,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  private getDefaultCategoriesData(tenantId: string) {
    return [
      { tenantId, name: 'Room Rent', code: 'ROOM_RENT', allocationRule: 'PER_ROOM' as AllocationRule, isSystem: true, isActive: true },
      { tenantId, name: 'Electricity Bill', code: 'ELECTRICITY', allocationRule: 'EQUAL_PER_MEMBER' as AllocationRule, isSystem: true, isActive: true },
      { tenantId, name: 'Gas Supply', code: 'GAS', allocationRule: 'EQUAL_PER_MEMBER' as AllocationRule, isSystem: true, isActive: true },
      { tenantId, name: 'Water Supply', code: 'WATER', allocationRule: 'EQUAL_PER_MEMBER' as AllocationRule, isSystem: true, isActive: true },
      { tenantId, name: 'WiFi Internet', code: 'WIFI', allocationRule: 'EQUAL_PER_MEMBER' as AllocationRule, isSystem: true, isActive: true },
      { tenantId, name: 'Cleaning & Bua', code: 'CLEANING_BUA', allocationRule: 'EQUAL_PER_MEMBER' as AllocationRule, isSystem: true, isActive: true },
      { tenantId, name: 'Mess Maintenance', code: 'MAINTENANCE', allocationRule: 'EQUAL_PER_MEMBER' as AllocationRule, isSystem: true, isActive: true },
      { tenantId, name: 'Monthly Meal Cost', code: 'MEAL_CHARGES', allocationRule: 'CUSTOM_PER_MEMBER' as AllocationRule, isSystem: true, isActive: true },
      { tenantId, name: 'Guest Meal Charges', code: 'GUEST_MEAL_CHARGES', allocationRule: 'CUSTOM_PER_MEMBER' as AllocationRule, isSystem: true, isActive: true },
      { tenantId, name: 'Other Charges', code: 'CUSTOM_OVERHEAD', allocationRule: 'FIXED_AMOUNT' as AllocationRule, isSystem: false, isActive: true },
    ];
  }

  private formatCategory(cat: any) {
    return {
      id: cat.id,
      tenantId: cat.tenantId,
      name: cat.name,
      code: cat.code,
      description: cat.description,
      allocationRule: cat.allocationRule,
      defaultAmountPoisha: cat.defaultAmountPoisha ? cat.defaultAmountPoisha.toString() : null,
      defaultAmountTaka: cat.defaultAmountPoisha ? Number(cat.defaultAmountPoisha) / 100 : null,
      isActive: cat.isActive,
      isSystem: cat.isSystem,
      createdAt: cat.createdAt,
    };
  }

  private formatBillingPeriod(p: any) {
    return {
      id: p.id,
      tenantId: p.tenantId,
      monthString: p.monthString,
      status: p.status,
      totalBilledPoisha: p.totalBilledPoisha ? p.totalBilledPoisha.toString() : '0',
      totalBilledTaka: p.totalBilledPoisha ? Number(p.totalBilledPoisha) / 100 : 0,
      totalCollectedPoisha: p.totalCollectedPoisha ? p.totalCollectedPoisha.toString() : '0',
      totalCollectedTaka: p.totalCollectedPoisha ? Number(p.totalCollectedPoisha) / 100 : 0,
      notes: p.notes,
      publishedAt: p.publishedAt,
      closedAt: p.closedAt,
      closedByUserId: p.closedByUserId,
      createdAt: p.createdAt,
    };
  }

  private formatMemberBill(b: any) {
    const openingDueTaka = Number(b.openingDuePoisha || 0) / 100;
    const rentChargesTaka = Number(b.rentChargesPoisha || 0) / 100;
    const utilityChargesTaka = Number(b.utilityChargesPoisha || 0) / 100;
    const mealChargesTaka = Number(b.mealChargesPoisha || 0) / 100;
    const otherChargesTaka = Number(b.otherChargesPoisha || 0) / 100;
    const totalChargesTaka = Number(b.totalChargesPoisha || 0) / 100;
    const paidAmountTaka = Number(b.paidAmountPoisha || 0) / 100;
    const creditAdjustmentTaka = Number(b.creditAdjustmentPoisha || 0) / 100;
    const closingBalanceTaka = Number(b.closingBalancePoisha || 0) / 100;

    return {
      id: b.id,
      tenantId: b.tenantId,
      billingPeriodId: b.billingPeriodId,
      membershipId: b.membershipId,
      memberName: b.membership?.user?.name || b.memberName || 'Resident',
      memberCode: b.membership?.memberCode || b.memberCode || null,
      monthString: b.monthString,
      billNumber: b.billNumber,
      openingDueTaka,
      rentChargesTaka,
      utilityChargesTaka,
      mealChargesTaka,
      otherChargesTaka,
      totalChargesTaka,
      paidAmountTaka,
      creditAdjustmentTaka,
      closingBalanceTaka,
      status: b.status,
      dueDate: b.dueDate,
      publishedAt: b.publishedAt,
      notes: b.notes,
      items: b.items ? b.items.map((it: any) => ({
        id: it.id,
        categoryName: it.categoryName,
        amountTaka: Number(it.amountPoisha || 0) / 100,
        allocationRule: it.allocationRule,
        notes: it.notes,
      })) : [],
    };
  }

  private formatPayment(p: any) {
    return {
      id: p.id,
      tenantId: p.tenantId,
      membershipId: p.membershipId,
      memberName: p.membership?.user?.name || 'Resident',
      memberCode: p.membership?.memberCode || null,
      billId: p.billId,
      paymentDate: p.paymentDate,
      amountPoisha: p.amountPoisha ? p.amountPoisha.toString() : '0',
      amountTaka: p.amountPoisha ? Number(p.amountPoisha) / 100 : 0,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId,
      receiptUrl: p.receiptUrl,
      notes: p.notes,
      status: p.status,
      receivedByUserId: p.receivedByUserId,
      verifiedByUserId: p.verifiedByUserId,
      verifiedAt: p.verifiedAt,
      rejectionReason: p.rejectionReason,
      refundReason: p.refundReason,
      createdAt: p.createdAt,
    };
  }
}

export const financeService = new FinanceService();
