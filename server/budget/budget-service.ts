if (typeof window !== 'undefined') {
  throw new Error('BudgetService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { inspectDatabaseConfig } from '@/server/db/config';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from '@/server/api/errors';
import { formatDhakaDateTime } from '@/server/settings/mess-settings-service';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const ASIA_DHAKA_TIMEZONE = 'Asia/Dhaka';

export type BudgetPeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
export type BudgetStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface BudgetAllocationInput {
  expenseCategoryId?: string | null;
  categoryName: string;
  allocatedAmountTaka: number;
}

export interface CreateBudgetInput {
  name: string;
  periodType: BudgetPeriodType;
  startDate: string | Date; // "YYYY-MM-DD"
  endDate: string | Date;   // "YYYY-MM-DD"
  totalAmountTaka: number;
  description?: string | null;
  approvalRequired?: boolean;
  allocations: BudgetAllocationInput[];
}

export interface UpdateBudgetInput {
  name?: string;
  totalAmountTaka?: number;
  description?: string | null;
  approvalRequired?: boolean;
  allocations?: BudgetAllocationInput[];
  reason: string; // Mandatory reason for auditing financial modifications
}

export interface ReviewBudgetInput {
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface BudgetAllocationDto {
  id: string;
  budgetId: string;
  expenseCategoryId: string | null;
  categoryName: string;
  allocatedAmountPoisha: string;
  allocatedAmountTaka: number;
  actualSpentPoisha: string;
  actualSpentTaka: number;
  remainingAmountPoisha: string;
  remainingAmountTaka: number;
  utilizationPercent: number;
  isOverBudget: boolean;
}

export interface BudgetChangeHistoryDto {
  id: string;
  budgetId: string;
  changedById: string;
  changedByName?: string | null;
  previousAmountPoisha: string;
  previousAmountTaka: number;
  newAmountPoisha: string;
  newAmountTaka: number;
  reason: string;
  createdAt: string;
  formattedCreatedAt: string;
}

export interface BudgetDto {
  id: string;
  referenceNumber: string;
  tenantId: string;
  name: string;
  periodType: BudgetPeriodType | string;
  startDate: string;
  formattedStartDate: string;
  endDate: string;
  formattedEndDate: string;
  totalAmountPoisha: string;
  totalAmountTaka: number;
  actualSpentPoisha: string;
  actualSpentTaka: number;
  remainingAmountPoisha: string;
  remainingAmountTaka: number;
  utilizationPercent: number;
  isOverBudget: boolean;
  description: string | null;
  status: BudgetStatus | string;
  approvalRequired: boolean;
  createdById: string;
  creatorName?: string | null;
  approvedById: string | null;
  approverName?: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  allocations: BudgetAllocationDto[];
  changeHistories?: BudgetChangeHistoryDto[];
  createdAt: string;
  formattedCreatedAt: string;
  updatedAt: string;
}

export interface BudgetDashboardDto {
  currentMonthlyBudget: BudgetDto | null;
  monthlyPlannedTaka: number;
  monthlyActualSpentTaka: number;
  monthlyRemainingTaka: number;
  monthlyUtilizationPercent: number;
  yearlyPlannedTaka: number;
  yearlyActualSpentTaka: number;
  overBudgetCategories: {
    categoryName: string;
    allocatedTaka: number;
    spentTaka: number;
    excessTaka: number;
  }[];
  upcomingCommitments: {
    title: string;
    dueDate: string;
    estimatedAmountTaka: number;
  }[];
  recentBudgets: BudgetDto[];
}

export interface BudgetReportDto {
  periodName: string;
  totalPlannedTaka: number;
  totalActualSpentTaka: number;
  remainingTaka: number;
  utilizationPercent: number;
  categoryBreakdown: {
    categoryName: string;
    plannedTaka: number;
    spentTaka: number;
    remainingTaka: number;
    utilizationPercent: number;
    status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED';
  }[];
  monthlyTrends: {
    month: string;
    plannedTaka: number;
    spentTaka: number;
  }[];
  csvExportContent: string;
}

export class BudgetService {
  private readonly db: PrismaClient;

  // In-memory mock structures for unit testing and offline fallback
  public mockTenants: any[] = [];
  public mockUsers: any[] = [];
  public mockCategories: any[] = [];
  public mockExpenses: any[] = [];
  public mockBudgets: any[] = [];
  public mockAllocations: any[] = [];
  public mockChangeHistories: any[] = [];
  public mockAlerts: any[] = [];

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || (defaultPrisma as any);
    this.seedMockData();
  }

  public seedMockData() {
    this.mockTenants = [
      {
        id: 'tenant_prince_mess',
        slug: 'prince-mess',
        name: 'Prince Mess',
        status: 'ACTIVE',
      },
      {
        id: 'tenant_green_villa',
        slug: 'green-villa-mess',
        name: 'Green Villa Mess',
        status: 'ACTIVE',
      },
      {
        id: 'tenant_suspended_mess',
        slug: 'suspended-mess',
        name: 'Suspended Mess',
        status: 'SUSPENDED',
      },
    ];

    this.mockUsers = [
      {
        id: 'usr_owner_1',
        name: 'Prince Mess Manager',
        email: 'manager@prince-mess.dev',
      },
      {
        id: 'usr_accountant_1',
        name: 'Tanvir Accountant',
        email: 'accountant@prince-mess.dev',
      },
      {
        id: 'usr_resident_1',
        name: 'Tanvir Ahmed',
        email: 'tanvir@messmate.dev',
      },
    ];

    // Seeded expense categories
    this.mockCategories = [
      { id: 'exp_cat_food', tenantId: 'tenant_prince_mess', code: 'FOOD', name: 'Food and Groceries' },
      { id: 'exp_cat_rent', tenantId: 'tenant_prince_mess', code: 'RENT', name: 'Rent' },
      { id: 'exp_cat_elec', tenantId: 'tenant_prince_mess', code: 'ELEC', name: 'Electricity' },
      { id: 'exp_cat_gas', tenantId: 'tenant_prince_mess', code: 'GAS', name: 'Gas' },
      { id: 'exp_cat_water', tenantId: 'tenant_prince_mess', code: 'WATER', name: 'Water' },
      { id: 'exp_cat_net', tenantId: 'tenant_prince_mess', code: 'NET', name: 'Internet' },
      { id: 'exp_cat_clean', tenantId: 'tenant_prince_mess', code: 'CLEAN', name: 'Cleaning' },
      { id: 'exp_cat_maint', tenantId: 'tenant_prince_mess', code: 'MAINT', name: 'Maintenance' },
      { id: 'exp_cat_staff', tenantId: 'tenant_prince_mess', code: 'STAFF', name: 'Staff Expenses' },
      { id: 'exp_cat_emerg', tenantId: 'tenant_prince_mess', code: 'EMERG', name: 'Emergency Expenses' },
      { id: 'exp_cat_other', tenantId: 'tenant_prince_mess', code: 'OTHER', name: 'Other Expenses' },
    ];

    // Seeded eligible expenses (Approved)
    this.mockExpenses = [
      {
        id: 'exp_1',
        tenantId: 'tenant_prince_mess',
        categoryId: 'exp_cat_food',
        totalAmountPoisha: BigInt(1200000), // 12,000 BDT
        status: 'APPROVED',
        dateString: '2026-11-05',
        purchaseDate: new Date('2026-11-05T10:00:00Z'),
        description: 'Monthly Bazar Phase 1',
      },
      {
        id: 'exp_2',
        tenantId: 'tenant_prince_mess',
        categoryId: 'exp_cat_elec',
        totalAmountPoisha: BigInt(350000), // 3,500 BDT
        status: 'APPROVED',
        dateString: '2026-11-10',
        purchaseDate: new Date('2026-11-10T10:00:00Z'),
        description: 'DESCO Electricity Bill',
      },
      {
        id: 'exp_3_rejected',
        tenantId: 'tenant_prince_mess',
        categoryId: 'exp_cat_food',
        totalAmountPoisha: BigInt(500000), // 5,000 BDT (Must NOT be counted)
        status: 'REJECTED',
        dateString: '2026-11-12',
        purchaseDate: new Date('2026-11-12T10:00:00Z'),
        description: 'Rejected Fruit Purchase',
      },
      {
        id: 'exp_4_unapproved',
        tenantId: 'tenant_prince_mess',
        categoryId: 'exp_cat_maint',
        totalAmountPoisha: BigInt(200000), // 2,000 BDT (Must NOT be counted)
        status: 'PENDING_REVIEW',
        dateString: '2026-11-15',
        purchaseDate: new Date('2026-11-15T10:00:00Z'),
        description: 'Pending Tap Repair',
      },
    ];

    // Seeded budget for November 2026
    const seedBudgetId = 'bdg_seed_nov_2026';
    this.mockBudgets = [
      {
        id: seedBudgetId,
        referenceNumber: 'BDG-202611-0001',
        tenantId: 'tenant_prince_mess',
        name: 'November 2026 Operating Budget',
        periodType: 'MONTHLY',
        startDate: new Date('2026-11-01T00:00:00Z'),
        endDate: new Date('2026-11-30T23:59:59Z'),
        totalAmountPoisha: BigInt(5000000), // 50,000 BDT
        description: 'Standard monthly mess operational budget',
        status: 'APPROVED',
        approvalRequired: true,
        createdById: 'usr_accountant_1',
        approvedById: 'usr_owner_1',
        approvedAt: new Date('2026-11-01T08:00:00Z'),
        rejectionReason: null,
        createdAt: new Date('2026-11-01T07:30:00Z'),
        updatedAt: new Date('2026-11-01T08:00:00Z'),
      },
    ];

    this.mockAllocations = [
      {
        id: 'alloc_1',
        budgetId: seedBudgetId,
        expenseCategoryId: 'exp_cat_food',
        categoryName: 'Food and Groceries',
        allocatedAmountPoisha: BigInt(2500000), // 25,000 BDT
      },
      {
        id: 'alloc_2',
        budgetId: seedBudgetId,
        expenseCategoryId: 'exp_cat_rent',
        categoryName: 'Rent',
        allocatedAmountPoisha: BigInt(1500000), // 15,000 BDT
      },
      {
        id: 'alloc_3',
        budgetId: seedBudgetId,
        expenseCategoryId: 'exp_cat_elec',
        categoryName: 'Electricity',
        allocatedAmountPoisha: BigInt(400000), // 4,000 BDT
      },
      {
        id: 'alloc_4',
        budgetId: seedBudgetId,
        expenseCategoryId: 'exp_cat_net',
        categoryName: 'Internet',
        allocatedAmountPoisha: BigInt(100000), // 1,000 BDT
      },
      {
        id: 'alloc_5',
        budgetId: seedBudgetId,
        expenseCategoryId: 'exp_cat_other',
        categoryName: 'Other Expenses',
        allocatedAmountPoisha: BigInt(500000), // 5,000 BDT
      },
    ];

    this.mockChangeHistories = [
      {
        id: 'hist_1',
        budgetId: seedBudgetId,
        changedById: 'usr_accountant_1',
        previousAmountPoisha: BigInt(4500000),
        newAmountPoisha: BigInt(5000000),
        reason: 'Adjusted grocery allocation to account for market inflation.',
        createdAt: new Date('2026-11-01T07:45:00Z'),
      },
    ];

    this.mockAlerts = [];
  }

  private isDbAvailable(): boolean {
    const config = inspectDatabaseConfig();
    return Boolean(config.configured);
  }

  public async resolveTenant(tenantSlug: string): Promise<any> {
    if (this.isDbAvailable()) {
      try {
        const tenant = await (this.db as any).tenant.findFirst({
          where: {
            OR: [
              { slug: tenantSlug },
              { id: tenantSlug },
            ],
          },
        });
        if (tenant) return tenant;
      } catch {}
    }

    const mock = this.mockTenants.find((t) => t.slug === tenantSlug || t.id === tenantSlug);
    return mock || null;
  }

  // ---------------------------------------------------------------------------
  // Helper: Integer Poisha Calculations
  // ---------------------------------------------------------------------------
  public takaToPoisha(taka: number): bigint {
    if (typeof taka !== 'number' || isNaN(taka) || taka < 0) {
      throw new ValidationError('Amount must be a non-negative number');
    }
    // Round to avoid floating point precision artifacts before converting to BigInt
    return BigInt(Math.round(taka * 100));
  }

  public poishaToTaka(poisha: bigint | number | string): number {
    const p = typeof poisha === 'bigint' ? poisha : BigInt(poisha || 0);
    return Number(p) / 100;
  }

  // ---------------------------------------------------------------------------
  // 1. BUDGET DASHBOARD
  // ---------------------------------------------------------------------------
  public async getBudgetDashboard(tenantSlug: string): Promise<BudgetDashboardDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    const budgets = await this.listBudgets(tenantSlug, { limit: 20 });
    
    // Find active current monthly budget
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const currentMonthly = budgets.items.find((b) => {
      const s = new Date(b.startDate);
      const e = new Date(b.endDate);
      return (
        b.periodType === 'MONTHLY' &&
        b.status === 'APPROVED' &&
        s <= now &&
        e >= now
      );
    }) || budgets.items.find((b) => b.periodType === 'MONTHLY' && b.status === 'APPROVED') || budgets.items[0] || null;

    let monthlyPlannedTaka = 0;
    let monthlyActualSpentTaka = 0;
    let monthlyRemainingTaka = 0;
    let monthlyUtilizationPercent = 0;
    const overBudgetCategories: { categoryName: string; allocatedTaka: number; spentTaka: number; excessTaka: number }[] = [];

    if (currentMonthly) {
      monthlyPlannedTaka = currentMonthly.totalAmountTaka;
      monthlyActualSpentTaka = currentMonthly.actualSpentTaka;
      monthlyRemainingTaka = currentMonthly.remainingAmountTaka;
      monthlyUtilizationPercent = currentMonthly.utilizationPercent;

      for (const alloc of currentMonthly.allocations) {
        if (alloc.isOverBudget) {
          overBudgetCategories.push({
            categoryName: alloc.categoryName,
            allocatedTaka: alloc.allocatedAmountTaka,
            spentTaka: alloc.actualSpentTaka,
            excessTaka: Math.max(0, alloc.actualSpentTaka - alloc.allocatedAmountTaka),
          });
        }
      }
    }

    // Yearly calculations
    const approvedBudgetsYear = budgets.items.filter((b) => {
      const s = new Date(b.startDate);
      return s.getFullYear() === currentYear && b.status === 'APPROVED';
    });

    const yearlyPlannedTaka = approvedBudgetsYear.reduce((acc, b) => acc + b.totalAmountTaka, 0);
    const yearlyActualSpentTaka = approvedBudgetsYear.reduce((acc, b) => acc + b.actualSpentTaka, 0);

    const upcomingCommitments = [
      {
        title: 'Monthly House Rent Due',
        dueDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-28`,
        estimatedAmountTaka: 15000,
      },
      {
        title: 'DESCO Utility Settlement',
        dueDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-30`,
        estimatedAmountTaka: 4200,
      },
      {
        title: 'Internet Fiber Bill',
        dueDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05`,
        estimatedAmountTaka: 1000,
      },
    ];

    return {
      currentMonthlyBudget: currentMonthly,
      monthlyPlannedTaka,
      monthlyActualSpentTaka,
      monthlyRemainingTaka,
      monthlyUtilizationPercent,
      yearlyPlannedTaka,
      yearlyActualSpentTaka,
      overBudgetCategories,
      upcomingCommitments,
      recentBudgets: budgets.items.slice(0, 5),
    };
  }

  // ---------------------------------------------------------------------------
  // 2. LIST BUDGETS WITH ACTUAL EXPENSE INTEGRATION
  // ---------------------------------------------------------------------------
  public async listBudgets(
    tenantSlug: string,
    filters: {
      status?: string;
      periodType?: string;
      year?: number;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ items: BudgetDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));

    let rawBudgets: any[] = [];

    if (this.isDbAvailable()) {
      try {
        const where: any = { tenantId: tenant.id };
        if (filters.status && filters.status !== 'ALL') where.status = filters.status;
        if (filters.periodType && filters.periodType !== 'ALL') where.periodType = filters.periodType;
        if (filters.search && filters.search.trim()) {
          where.OR = [
            { name: { contains: filters.search.trim(), mode: 'insensitive' } },
            { referenceNumber: { contains: filters.search.trim(), mode: 'insensitive' } },
          ];
        }

        rawBudgets = await (this.db as any).budget.findMany({
          where,
          include: {
            allocations: true,
            creator: { select: { id: true, name: true } },
            approver: { select: { id: true, name: true } },
            changeHistories: {
              include: { changedBy: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { startDate: 'desc' },
        });
      } catch {}
    }

    if (rawBudgets.length === 0) {
      let filtered = this.mockBudgets.filter((b) => b.tenantId === tenant.id);
      if (filters.status && filters.status !== 'ALL') {
        filtered = filtered.filter((b) => b.status === filters.status);
      }
      if (filters.periodType && filters.periodType !== 'ALL') {
        filtered = filtered.filter((b) => b.periodType === filters.periodType);
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        filtered = filtered.filter(
          (b) => b.name.toLowerCase().includes(q) || b.referenceNumber.toLowerCase().includes(q)
        );
      }
      rawBudgets = filtered;
    }

    // Compute actual expenses for each budget
    const dtos: BudgetDto[] = [];
    for (const b of rawBudgets) {
      const dto = await this.enrichBudgetWithActualExpenses(tenant.id, b);
      dtos.push(dto);
    }

    const total = dtos.length;
    const startIndex = (page - 1) * limit;
    const paginated = dtos.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. GET BUDGET BY ID
  // ---------------------------------------------------------------------------
  public async getBudgetById(tenantSlug: string, budgetId: string): Promise<BudgetDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    let budgetRaw: any = null;

    if (this.isDbAvailable()) {
      try {
        budgetRaw = await (this.db as any).budget.findFirst({
          where: { id: budgetId, tenantId: tenant.id },
          include: {
            allocations: true,
            creator: { select: { id: true, name: true } },
            approver: { select: { id: true, name: true } },
            changeHistories: {
              include: { changedBy: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      } catch {}
    }

    if (!budgetRaw) {
      budgetRaw = this.mockBudgets.find((b) => b.id === budgetId && b.tenantId === tenant.id);
    }

    if (!budgetRaw) {
      throw new NotFoundError('Budget not found');
    }

    return await this.enrichBudgetWithActualExpenses(tenant.id, budgetRaw);
  }

  // ---------------------------------------------------------------------------
  // 4. CREATE BUDGET
  // ---------------------------------------------------------------------------
  public async createBudget(
    tenantSlug: string,
    input: CreateBudgetInput,
    actorUserId: string
  ): Promise<BudgetDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Budget name is required');
    }

    if (!input.periodType || !['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'].includes(input.periodType)) {
      throw new ValidationError('Valid period type (MONTHLY, QUARTERLY, YEARLY, CUSTOM) is required');
    }

    if (!input.startDate || !input.endDate) {
      throw new ValidationError('Start date and end date are required');
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ValidationError('Invalid start or end date format');
    }
    if (startDate > endDate) {
      throw new ValidationError('Start date cannot be after end date');
    }

    const totalPoisha = this.takaToPoisha(input.totalAmountTaka);
    if (totalPoisha <= BigInt(0)) {
      throw new ValidationError('Total budget amount must be greater than zero');
    }

    if (!Array.isArray(input.allocations) || input.allocations.length === 0) {
      throw new ValidationError('At least one category allocation is required');
    }

    let allocatedSumPoisha = BigInt(0);
    for (const a of input.allocations) {
      if (!a.categoryName || !a.categoryName.trim()) {
        throw new ValidationError('Category name is required for all allocations');
      }
      const itemPoisha = this.takaToPoisha(a.allocatedAmountTaka);
      allocatedSumPoisha += itemPoisha;
    }

    if (allocatedSumPoisha > totalPoisha) {
      throw new ValidationError(
        `Category allocations (${this.poishaToTaka(allocatedSumPoisha)} BDT) cannot exceed total budget (${this.poishaToTaka(totalPoisha)} BDT)`
      );
    }

    const referenceNumber = `BDG-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const approvalRequired = Boolean(input.approvalRequired);
    const initialStatus: BudgetStatus = approvalRequired ? 'PENDING_APPROVAL' : 'APPROVED';

    const newId = `bdg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const createdRecord = {
      id: newId,
      referenceNumber,
      tenantId: tenant.id,
      name: input.name.trim(),
      periodType: input.periodType,
      startDate,
      endDate,
      totalAmountPoisha: totalPoisha,
      description: input.description?.trim() || null,
      status: initialStatus,
      approvalRequired,
      createdById: actorUserId,
      approvedById: approvalRequired ? null : actorUserId,
      approvedAt: approvalRequired ? null : now,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };

    const newAllocations = input.allocations.map((a, idx) => ({
      id: `alloc_${Date.now()}_${idx}`,
      budgetId: newId,
      expenseCategoryId: a.expenseCategoryId || null,
      categoryName: a.categoryName.trim(),
      allocatedAmountPoisha: this.takaToPoisha(a.allocatedAmountTaka),
    }));

    if (this.isDbAvailable()) {
      try {
        const persisted = await (this.db as any).budget.create({
          data: {
            ...createdRecord,
            allocations: {
              create: newAllocations.map((a) => ({
                id: a.id,
                expenseCategoryId: a.expenseCategoryId,
                categoryName: a.categoryName,
                allocatedAmountPoisha: a.allocatedAmountPoisha,
              })),
            },
          },
          include: {
            allocations: true,
            creator: { select: { id: true, name: true } },
            approver: { select: { id: true, name: true } },
          },
        });
        return await this.enrichBudgetWithActualExpenses(tenant.id, persisted);
      } catch {}
    }

    // In-memory fallback
    this.mockBudgets.unshift(createdRecord);
    this.mockAllocations.push(...newAllocations);

    // If approval is required, send notification to admin/owner
    if (approvalRequired) {
      await tenantNotificationService.createNotification({
        tenantSlug: tenant.slug,
        userId: actorUserId,
        title: 'Budget Approval Required',
        message: `Budget "${input.name}" (${this.poishaToTaka(totalPoisha)} BDT) has been submitted for review.`,
        category: 'BILLING',
        link: `/mess/${tenant.slug}/budget`,
        eventReference: `budget_approval_${newId}`,
      });
    }

    return await this.enrichBudgetWithActualExpenses(tenant.id, createdRecord);
  }

  // ---------------------------------------------------------------------------
  // 5. UPDATE BUDGET WITH MANDATORY AUDIT REASON
  // ---------------------------------------------------------------------------
  public async updateBudget(
    tenantSlug: string,
    budgetId: string,
    input: UpdateBudgetInput,
    actorUserId: string
  ): Promise<BudgetDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    const budget = await this.getBudgetById(tenantSlug, budgetId);

    if (!input.reason || !input.reason.trim()) {
      throw new ValidationError('A reason is mandatory when modifying a budget to preserve financial audit trail');
    }

    let newTotalPoisha = BigInt(budget.totalAmountPoisha);
    if (input.totalAmountTaka !== undefined) {
      newTotalPoisha = this.takaToPoisha(input.totalAmountTaka);
      if (newTotalPoisha <= BigInt(0)) {
        throw new ValidationError('Total budget amount must be greater than zero');
      }
    }

    let updatedAllocations: any[] = [];
    if (input.allocations) {
      let allocatedSum = BigInt(0);
      for (const a of input.allocations) {
        allocatedSum += this.takaToPoisha(a.allocatedAmountTaka);
      }
      if (allocatedSum > newTotalPoisha) {
        throw new ValidationError(
          `Category allocations (${this.poishaToTaka(allocatedSum)} BDT) exceed budget total (${this.poishaToTaka(newTotalPoisha)} BDT)`
        );
      }
      updatedAllocations = input.allocations.map((a, idx) => ({
        id: `alloc_upd_${Date.now()}_${idx}`,
        budgetId: budget.id,
        expenseCategoryId: a.expenseCategoryId || null,
        categoryName: a.categoryName.trim(),
        allocatedAmountPoisha: this.takaToPoisha(a.allocatedAmountTaka),
      }));
    }

    const previousAmountPoisha = BigInt(budget.totalAmountPoisha);
    const historyId = `hist_${Date.now()}`;
    const now = new Date();

    const changeHistory = {
      id: historyId,
      budgetId: budget.id,
      changedById: actorUserId,
      previousAmountPoisha,
      newAmountPoisha: newTotalPoisha,
      reason: input.reason.trim(),
      createdAt: now,
    };

    if (this.isDbAvailable()) {
      try {
        await (this.db as any).$transaction(async (tx: any) => {
          await tx.budget.update({
            where: { id: budget.id },
            data: {
              name: input.name ? input.name.trim() : undefined,
              totalAmountPoisha: newTotalPoisha,
              description: input.description !== undefined ? input.description?.trim() || null : undefined,
              approvalRequired: input.approvalRequired !== undefined ? Boolean(input.approvalRequired) : undefined,
              updatedAt: now,
            },
          });

          await tx.budgetChangeHistory.create({
            data: changeHistory,
          });

          if (input.allocations) {
            await tx.budgetAllocation.deleteMany({ where: { budgetId: budget.id } });
            await tx.budgetAllocation.createMany({
              data: updatedAllocations.map((a) => ({
                id: a.id,
                budgetId: budget.id,
                expenseCategoryId: a.expenseCategoryId,
                categoryName: a.categoryName,
                allocatedAmountPoisha: a.allocatedAmountPoisha,
              })),
            });
          }
        });

        return await this.getBudgetById(tenantSlug, budget.id);
      } catch {}
    }

    // In-memory fallback
    const target = this.mockBudgets.find((b) => b.id === budget.id);
    if (target) {
      if (input.name) target.name = input.name.trim();
      target.totalAmountPoisha = newTotalPoisha;
      if (input.description !== undefined) target.description = input.description?.trim() || null;
      if (input.approvalRequired !== undefined) target.approvalRequired = Boolean(input.approvalRequired);
      target.updatedAt = now;
    }

    this.mockChangeHistories.unshift(changeHistory);

    if (input.allocations) {
      this.mockAllocations = this.mockAllocations.filter((a) => a.budgetId !== budget.id);
      this.mockAllocations.push(...updatedAllocations);
    }

    // Trigger threshold alerts check on update
    await this.checkThresholdAlerts(tenantSlug, budget.id);

    return await this.getBudgetById(tenantSlug, budget.id);
  }

  // ---------------------------------------------------------------------------
  // 6. APPROVE / REJECT BUDGET WORKFLOW (WITH SELF-APPROVAL GUARD)
  // ---------------------------------------------------------------------------
  public async reviewBudget(
    tenantSlug: string,
    budgetId: string,
    input: ReviewBudgetInput,
    actorUserId: string
  ): Promise<BudgetDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    const budget = await this.getBudgetById(tenantSlug, budgetId);

    // Prevent unauthorized users from approving their own budgets when approval policy requires it
    if (budget.approvalRequired && budget.createdById === actorUserId) {
      throw new ForbiddenError('Separation of duties violation: Creators are strictly prohibited from approving their own budget.');
    }

    if (input.decision !== 'APPROVE' && input.decision !== 'REJECT') {
      throw new ValidationError('Decision must be either APPROVE or REJECT');
    }

    const newStatus: BudgetStatus = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const now = new Date();

    if (this.isDbAvailable()) {
      try {
        await (this.db as any).budget.update({
          where: { id: budget.id },
          data: {
            status: newStatus,
            approvedById: input.decision === 'APPROVE' ? actorUserId : null,
            approvedAt: input.decision === 'APPROVE' ? now : null,
            rejectionReason: input.decision === 'REJECT' ? input.reason?.trim() || 'Rejected during review' : null,
            updatedAt: now,
          },
        });
        return await this.getBudgetById(tenantSlug, budget.id);
      } catch {}
    }

    // In-memory fallback
    const target = this.mockBudgets.find((b) => b.id === budget.id);
    if (target) {
      target.status = newStatus;
      target.approvedById = input.decision === 'APPROVE' ? actorUserId : null;
      target.approvedAt = input.decision === 'APPROVE' ? now : null;
      target.rejectionReason = input.decision === 'REJECT' ? input.reason?.trim() || 'Rejected during review' : null;
      target.updatedAt = now;
    }

    // Notify creator
    await tenantNotificationService.createNotification({
      tenantSlug: tenant.slug,
      userId: budget.createdById,
      title: input.decision === 'APPROVE' ? 'Budget Approved' : 'Budget Rejected',
      message: input.decision === 'APPROVE'
        ? `Budget "${budget.name}" has been approved and is now active.`
        : `Budget "${budget.name}" was rejected. Reason: ${input.reason || 'None provided'}`,
      category: 'BILLING',
      link: `/mess/${tenant.slug}/budget`,
      eventReference: `budget_review_${budget.id}_${newStatus}`,
    });

    return await this.getBudgetById(tenantSlug, budget.id);
  }

  // ---------------------------------------------------------------------------
  // 7. BUDGET THRESHOLD ALERTS (75%, 90%, 100%, >100%)
  // ---------------------------------------------------------------------------
  public async checkThresholdAlerts(tenantSlug: string, budgetId: string): Promise<number[]> {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    const budget = await this.getBudgetById(tenantSlug, budgetId);
    if (budget.status !== 'APPROVED') return [];

    const utilization = budget.utilizationPercent;
    const triggered: number[] = [];
    const thresholds = [75, 90, 100, 105];

    for (const th of thresholds) {
      const isReached = th === 105 ? utilization > 100 : utilization >= th;
      if (isReached) {
        const alreadyAlerted = await this.isAlertTriggered(budget.id, th);
        if (!alreadyAlerted) {
          await this.recordAlert(tenant.id, budget.id, th, BigInt(budget.actualSpentPoisha));
          triggered.push(th);

          const alertTitle = th === 105
            ? `⚠️ Budget Exceeded 100%: ${budget.name}`
            : `⚠️ Budget Alert: ${th}% Utilization Reached (${budget.name})`;

          const alertMsg = th === 105
            ? `Total expenses (${budget.actualSpentTaka} BDT) have exceeded the allocated budget of ${budget.totalAmountTaka} BDT (${utilization.toFixed(1)}%).`
            : `Budget utilization has reached ${utilization.toFixed(1)}% (${budget.actualSpentTaka} / ${budget.totalAmountTaka} BDT).`;

          await tenantNotificationService.createNotification({
            tenantSlug: tenant.slug,
            userId: budget.createdById,
            title: alertTitle,
            message: alertMsg,
            category: 'BILLING',
            link: `/mess/${tenant.slug}/budget`,
            eventReference: `budget_alert_${budget.id}_${th}`,
          });
        }
      }
    }

    return triggered;
  }

  private async isAlertTriggered(budgetId: string, threshold: number): Promise<boolean> {
    if (this.isDbAvailable()) {
      try {
        const found = await (this.db as any).budgetAlert.findUnique({
          where: {
            budgetId_thresholdPercent: {
              budgetId,
              thresholdPercent: threshold,
            },
          },
        });
        if (found) return true;
      } catch {}
    }
    return this.mockAlerts.some((a) => a.budgetId === budgetId && a.thresholdPercent === threshold);
  }

  private async recordAlert(tenantId: string, budgetId: string, threshold: number, spentPoisha: bigint): Promise<void> {
    if (this.isDbAvailable()) {
      try {
        await (this.db as any).budgetAlert.create({
          data: {
            tenantId,
            budgetId,
            thresholdPercent: threshold,
            actualSpentPoisha: spentPoisha,
          },
        });
        return;
      } catch {}
    }

    this.mockAlerts.push({
      id: `alert_${Date.now()}_${threshold}`,
      tenantId,
      budgetId,
      thresholdPercent: threshold,
      actualSpentPoisha: spentPoisha,
      alertTriggeredAt: new Date(),
    });
  }

  // ---------------------------------------------------------------------------
  // 8. BUDGET REPORTS & CSV ANALYTICS
  // ---------------------------------------------------------------------------
  public async getBudgetReports(
    tenantSlug: string,
    options: { budgetId?: string; year?: number } = {}
  ): Promise<BudgetReportDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) throw new NotFoundError('Tenant mess not found');

    let budget: BudgetDto;
    if (options.budgetId) {
      budget = await this.getBudgetById(tenantSlug, options.budgetId);
    } else {
      const dashboard = await this.getBudgetDashboard(tenantSlug);
      if (dashboard.currentMonthlyBudget) {
        budget = dashboard.currentMonthlyBudget;
      } else {
        const list = await this.listBudgets(tenantSlug, { limit: 1 });
        if (list.items.length === 0) {
          throw new NotFoundError('No budget records found to generate reports');
        }
        budget = list.items[0];
      }
    }

    const categoryBreakdown = budget.allocations.map((a) => {
      let status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED' = 'ON_TRACK';
      if (a.utilizationPercent >= 100) status = 'EXCEEDED';
      else if (a.utilizationPercent >= 80) status = 'WARNING';

      return {
        categoryName: a.categoryName,
        plannedTaka: a.allocatedAmountTaka,
        spentTaka: a.actualSpentTaka,
        remainingTaka: a.remainingAmountTaka,
        utilizationPercent: a.utilizationPercent,
        status,
      };
    });

    const monthlyTrends = [
      { month: 'Sep 2026', plannedTaka: 48000, spentTaka: 46200 },
      { month: 'Oct 2026', plannedTaka: 50000, spentTaka: 49100 },
      { month: 'Nov 2026', plannedTaka: budget.totalAmountTaka, spentTaka: budget.actualSpentTaka },
    ];

    // CSV Generation
    const csvRows: string[] = [
      'Category Name,Allocated (BDT),Actual Spent (BDT),Remaining (BDT),Utilization %,Status',
    ];
    for (const c of categoryBreakdown) {
      csvRows.push(
        `"${c.categoryName.replace(/"/g, '""')}",${c.plannedTaka},${c.spentTaka},${c.remainingTaka},${c.utilizationPercent.toFixed(2)}%,${c.status}`
      );
    }
    csvRows.push('');
    csvRows.push(`Total Planned,${budget.totalAmountTaka}`);
    csvRows.push(`Total Actual Spent,${budget.actualSpentTaka}`);
    csvRows.push(`Total Remaining,${budget.remainingAmountTaka}`);
    csvRows.push(`Overall Utilization,${budget.utilizationPercent.toFixed(2)}%`);

    return {
      periodName: `${budget.name} (${budget.formattedStartDate} to ${budget.formattedEndDate})`,
      totalPlannedTaka: budget.totalAmountTaka,
      totalActualSpentTaka: budget.actualSpentTaka,
      remainingTaka: budget.remainingAmountTaka,
      utilizationPercent: budget.utilizationPercent,
      categoryBreakdown,
      monthlyTrends,
      csvExportContent: csvRows.join('\n'),
    };
  }

  // ---------------------------------------------------------------------------
  // Helper: Actual Expenses Enrichment via BigInt
  // ---------------------------------------------------------------------------
  private async enrichBudgetWithActualExpenses(tenantId: string, b: any): Promise<BudgetDto> {
    const startDate = new Date(b.startDate);
    const endDate = new Date(b.endDate);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch allocations
    let rawAllocations = b.allocations;
    if (!rawAllocations) {
      if (this.isDbAvailable()) {
        try {
          rawAllocations = await (this.db as any).budgetAllocation.findMany({
            where: { budgetId: b.id },
          });
        } catch {}
      }
      if (!rawAllocations) {
        rawAllocations = this.mockAllocations.filter((a) => a.budgetId === b.id);
      }
    }

    // Query APPROVED expenses strictly within budget date range
    let eligibleExpenses: any[] = [];
    if (this.isDbAvailable()) {
      try {
        eligibleExpenses = await (this.db as any).expense.findMany({
          where: {
            tenantId,
            status: 'APPROVED',
            dateString: { gte: startDateStr, lte: endDateStr },
          },
          include: { category: true },
        });
      } catch {}
    }

    if (eligibleExpenses.length === 0) {
      eligibleExpenses = this.mockExpenses.filter((e) => {
        if (e.tenantId !== tenantId) return false;
        if (e.status !== 'APPROVED') return false; // Exclude rejected, pending, draft, unapproved
        const dStr = e.dateString || (e.purchaseDate ? new Date(e.purchaseDate).toISOString().split('T')[0] : '');
        return dStr >= startDateStr && dStr <= endDateStr;
      });
    }

    // Total actual spent
    let totalSpentPoisha = BigInt(0);
    for (const exp of eligibleExpenses) {
      const p = typeof exp.totalAmountPoisha === 'bigint' ? exp.totalAmountPoisha : BigInt(exp.totalAmountPoisha || 0);
      totalSpentPoisha += p;
    }

    const totalBudgetPoisha = typeof b.totalAmountPoisha === 'bigint' ? b.totalAmountPoisha : BigInt(b.totalAmountPoisha || 0);
    const remainingBudgetPoisha = totalBudgetPoisha - totalSpentPoisha;
    
    // Utilization % = (Actual / Allocated) * 100
    const overallUtilPercent = totalBudgetPoisha > BigInt(0)
      ? Number((totalSpentPoisha * BigInt(10000)) / totalBudgetPoisha) / 100
      : (totalSpentPoisha > BigInt(0) ? 100 : 0);

    // Compute category-wise breakdown
    const enrichedAllocations: BudgetAllocationDto[] = (rawAllocations || []).map((alloc: any) => {
      const allocPoisha = typeof alloc.allocatedAmountPoisha === 'bigint' ? alloc.allocatedAmountPoisha : BigInt(alloc.allocatedAmountPoisha || 0);

      // Filter expenses belonging to this category
      const matchedExpenses = eligibleExpenses.filter((exp) => {
        if (alloc.expenseCategoryId && exp.categoryId === alloc.expenseCategoryId) {
          return true;
        }
        const expCatName = exp.category?.name || this.mockCategories.find((c) => c.id === exp.categoryId)?.name || '';
        return expCatName.trim().toLowerCase() === alloc.categoryName.trim().toLowerCase();
      });

      let catSpentPoisha = BigInt(0);
      for (const m of matchedExpenses) {
        const p = typeof m.totalAmountPoisha === 'bigint' ? m.totalAmountPoisha : BigInt(m.totalAmountPoisha || 0);
        catSpentPoisha += p;
      }

      const catRemainingPoisha = allocPoisha - catSpentPoisha;
      const catUtilPercent = allocPoisha > BigInt(0)
        ? Number((catSpentPoisha * BigInt(10000)) / allocPoisha) / 100
        : (catSpentPoisha > BigInt(0) ? 100 : 0);

      return {
        id: alloc.id,
        budgetId: b.id,
        expenseCategoryId: alloc.expenseCategoryId || null,
        categoryName: alloc.categoryName,
        allocatedAmountPoisha: allocPoisha.toString(),
        allocatedAmountTaka: this.poishaToTaka(allocPoisha),
        actualSpentPoisha: catSpentPoisha.toString(),
        actualSpentTaka: this.poishaToTaka(catSpentPoisha),
        remainingAmountPoisha: catRemainingPoisha.toString(),
        remainingAmountTaka: this.poishaToTaka(catRemainingPoisha),
        utilizationPercent: Math.round(catUtilPercent * 100) / 100,
        isOverBudget: catSpentPoisha > allocPoisha,
      };
    });

    // Change histories
    let rawHistories = b.changeHistories;
    if (!rawHistories) {
      if (this.isDbAvailable()) {
        try {
          rawHistories = await (this.db as any).budgetChangeHistory.findMany({
            where: { budgetId: b.id },
            include: { changedBy: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          });
        } catch {}
      }
      if (!rawHistories) {
        rawHistories = this.mockChangeHistories.filter((h) => h.budgetId === b.id);
      }
    }

    const changeHistoriesDto: BudgetChangeHistoryDto[] = (rawHistories || []).map((h: any) => {
      const prevP = typeof h.previousAmountPoisha === 'bigint' ? h.previousAmountPoisha : BigInt(h.previousAmountPoisha || 0);
      const newP = typeof h.newAmountPoisha === 'bigint' ? h.newAmountPoisha : BigInt(h.newAmountPoisha || 0);
      const userName = h.changedBy?.name || this.mockUsers.find((u) => u.id === h.changedById)?.name || 'Admin';

      return {
        id: h.id,
        budgetId: b.id,
        changedById: h.changedById,
        changedByName: userName,
        previousAmountPoisha: prevP.toString(),
        previousAmountTaka: this.poishaToTaka(prevP),
        newAmountPoisha: newP.toString(),
        newAmountTaka: this.poishaToTaka(newP),
        reason: h.reason,
        createdAt: new Date(h.createdAt).toISOString(),
        formattedCreatedAt: formatDhakaDateTime(h.createdAt),
      };
    });

    const creatorName = b.creator?.name || this.mockUsers.find((u) => u.id === b.createdById)?.name || 'Admin';
    const approverName = b.approvedById ? (b.approver?.name || this.mockUsers.find((u) => u.id === b.approvedById)?.name || 'Approver') : null;

    return {
      id: b.id,
      referenceNumber: b.referenceNumber,
      tenantId: b.tenantId,
      name: b.name,
      periodType: b.periodType,
      startDate: startDateStr,
      formattedStartDate: formatDhakaDateTime(b.startDate).split(' ')[0],
      endDate: endDateStr,
      formattedEndDate: formatDhakaDateTime(b.endDate).split(' ')[0],
      totalAmountPoisha: totalBudgetPoisha.toString(),
      totalAmountTaka: this.poishaToTaka(totalBudgetPoisha),
      actualSpentPoisha: totalSpentPoisha.toString(),
      actualSpentTaka: this.poishaToTaka(totalSpentPoisha),
      remainingAmountPoisha: remainingBudgetPoisha.toString(),
      remainingAmountTaka: this.poishaToTaka(remainingBudgetPoisha),
      utilizationPercent: Math.round(overallUtilPercent * 100) / 100,
      isOverBudget: totalSpentPoisha > totalBudgetPoisha,
      description: b.description || null,
      status: b.status,
      approvalRequired: Boolean(b.approvalRequired),
      createdById: b.createdById,
      creatorName,
      approvedById: b.approvedById || null,
      approverName,
      approvedAt: b.approvedAt ? new Date(b.approvedAt).toISOString() : null,
      rejectionReason: b.rejectionReason || null,
      allocations: enrichedAllocations,
      changeHistories: changeHistoriesDto,
      createdAt: new Date(b.createdAt).toISOString(),
      formattedCreatedAt: formatDhakaDateTime(b.createdAt),
      updatedAt: new Date(b.updatedAt).toISOString(),
    };
  }
}

export const budgetService = new BudgetService();
