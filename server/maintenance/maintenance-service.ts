if (typeof window !== 'undefined') {
  throw new Error('MaintenanceService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { inspectDatabaseConfig } from '@/server/db/config';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '@/server/api/errors';
import { formatDhakaDateTime } from '@/server/settings/mess-settings-service';
import { formatBdtCurrency } from '@/server/mess-admin/mess-dashboard-service';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';
import { inventoryService } from '@/server/inventory/inventory-service';

export const ASIA_DHAKA_TIMEZONE = 'Asia/Dhaka';

export type WorkOrderCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'APPLIANCE'
  | 'FURNITURE'
  | 'CLEANING'
  | 'PEST_CONTROL'
  | 'BUILDING_REPAIR'
  | 'INTERNET_NETWORK'
  | 'OTHER';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkOrderStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'CANCELLED';

export type TaskCategory =
  | 'CLEANING'
  | 'INSPECTION'
  | 'MAINTENANCE'
  | 'UTILITY'
  | 'ADMINISTRATIVE'
  | 'OTHER';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type RecurrenceRule = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface WorkOrderStatusHistoryDto {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedById: string | null;
  changedByName?: string | null;
  reason: string | null;
  createdAt: string;
  formattedCreatedAt: string;
}

export interface WorkOrderDto {
  id: string;
  referenceNumber: string;
  tenantId: string;
  title: string;
  description: string;
  category: WorkOrderCategory | string;
  priority: WorkOrderPriority | string;
  status: WorkOrderStatus | string;
  roomId: string | null;
  roomNumber?: string | null;
  assetId: string | null;
  assetName?: string | null;
  complaintId: string | null;
  complaintRef?: string | null;
  assignedUserId: string | null;
  assignedUserName?: string | null;
  assignedVendorName: string | null;
  assignedVendorContact: string | null; // Staff-only
  expectedStartDate: string | null;
  dueDate: string | null;
  formattedDueDate: string | null;
  isOverdue: boolean;
  completedAt: string | null;
  formattedCompletedAt: string | null;
  verifiedAt: string | null;
  estimatedCostPoisha: string;
  estimatedCostTaka: number;
  formattedEstimatedCost: string;
  actualCostPoisha: string;
  actualCostTaka: number;
  formattedActualCost: string;
  internalNotes: string | null; // Staff-only
  memberUpdates: string | null; // Member-visible
  completionNotes: string | null;
  attachmentUrl: string | null;
  createdById: string | null;
  creatorName?: string | null;
  closedById: string | null;
  createdAt: string;
  formattedCreatedAt: string;
  updatedAt: string;
  statusHistory?: WorkOrderStatusHistoryDto[];
  tasks?: OperationalTaskDto[];
}

export interface OperationalTaskDto {
  id: string;
  referenceNumber: string;
  tenantId: string;
  workOrderId: string | null;
  workOrderRef?: string | null;
  title: string;
  description: string | null;
  category: TaskCategory | string;
  priority: TaskPriority | string;
  status: TaskStatus | string;
  assignedUserId: string | null;
  assignedUserName?: string | null;
  recurrenceRule: RecurrenceRule | string;
  dueDate: string | null;
  formattedDueDate: string | null;
  isOverdue: boolean;
  completedAt: string | null;
  formattedCompletedAt: string | null;
  checklist: Array<{ id: string; text: string; completed: boolean }>;
  completionNotes: string | null;
  createdById: string | null;
  creatorName?: string | null;
  createdAt: string;
  formattedCreatedAt: string;
  updatedAt: string;
}

export interface MaintenanceDashboardDto {
  totalWorkOrders: number;
  openCount: number;
  assignedCount: number;
  inProgressCount: number;
  waitingPartsCount: number;
  completedCount: number;
  overdueWorkOrdersCount: number;
  totalTasks: number;
  pendingTasksCount: number;
  completedTasksCount: number;
  totalMaintenanceCostPoisha: string;
  formattedTotalMaintenanceCost: string;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    totalCostPoisha: string;
    formattedTotalCost: string;
  }>;
  recentWorkOrders: WorkOrderDto[];
  assignedToCurrentUser: WorkOrderDto[];
}

export interface CreateWorkOrderInput {
  title: string;
  description: string;
  category?: WorkOrderCategory | string;
  priority?: WorkOrderPriority | string;
  roomId?: string | null;
  assetId?: string | null;
  complaintId?: string | null;
  assignedUserId?: string | null;
  assignedVendorName?: string | null;
  assignedVendorContact?: string | null;
  expectedStartDate?: string | Date | null;
  dueDate?: string | Date | null;
  estimatedCostTaka?: number | null;
  internalNotes?: string | null;
  memberUpdates?: string | null;
  attachmentUrl?: string | null;
}

export interface UpdateWorkOrderInput {
  title?: string;
  description?: string;
  category?: WorkOrderCategory | string;
  priority?: WorkOrderPriority | string;
  status?: WorkOrderStatus;
  roomId?: string | null;
  assetId?: string | null;
  assignedUserId?: string | null;
  assignedVendorName?: string | null;
  assignedVendorContact?: string | null;
  expectedStartDate?: string | Date | null;
  dueDate?: string | Date | null;
  actualCostTaka?: number | null;
  internalNotes?: string | null;
  memberUpdates?: string | null;
  completionNotes?: string | null;
  statusChangeReason?: string | null;
  attachmentUrl?: string | null;
}

export interface CreateOperationalTaskInput {
  title: string;
  description?: string | null;
  category?: TaskCategory | string;
  priority?: TaskPriority | string;
  assignedUserId?: string | null;
  workOrderId?: string | null;
  recurrenceRule?: RecurrenceRule | string;
  dueDate?: string | Date | null;
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
}

export interface UpdateOperationalTaskInput {
  title?: string;
  description?: string | null;
  category?: TaskCategory | string;
  priority?: TaskPriority | string;
  status?: TaskStatus;
  assignedUserId?: string | null;
  dueDate?: string | Date | null;
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  completionNotes?: string | null;
}

function toPoisha(taka?: number | string | null): bigint {
  if (taka === undefined || taka === null) return BigInt(0);
  const num = typeof taka === 'string' ? parseFloat(taka) : taka;
  if (isNaN(num)) return BigInt(0);
  return BigInt(Math.round(num * 100));
}

function fromPoisha(poisha?: bigint | string | number | null): number {
  if (poisha === undefined || poisha === null) return 0;
  return Number(poisha) / 100;
}

const ALLOWED_STATUS_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'WAITING_FOR_PARTS', 'CANCELLED', 'OPEN'],
  IN_PROGRESS: ['WAITING_FOR_PARTS', 'COMPLETED', 'CANCELLED', 'ASSIGNED'],
  WAITING_FOR_PARTS: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['VERIFIED', 'IN_PROGRESS'],
  VERIFIED: [],
  CANCELLED: ['OPEN'], // Staff can reopen a cancelled order if necessary
};

export class MaintenanceService {
  private readonly db: PrismaClient;

  // In-memory mock storage for testing & fallback
  public mockTenants: any[] = [];
  public mockUsers: any[] = [];
  public mockRooms: any[] = [];
  public mockAssets: any[] = [];
  public mockComplaints: any[] = [];
  public mockWorkOrders: any[] = [];
  public mockHistory: any[] = [];
  public mockTasks: any[] = [];

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
        id: 'usr_staff_1',
        name: 'Rahim Electrician',
        email: 'rahim.tech@messmate.dev',
      },
      {
        id: 'usr_resident_1',
        name: 'Tanvir Ahmed',
        email: 'tanvir@messmate.dev',
      },
    ];

    this.mockRooms = [
      {
        id: 'room_101',
        tenantId: 'tenant_prince_mess',
        roomNumber: '101',
        name: 'Deluxe South Room',
      },
      {
        id: 'room_102',
        tenantId: 'tenant_prince_mess',
        roomNumber: '102',
        name: 'North Corner Room',
      },
      {
        id: 'room_green_201',
        tenantId: 'tenant_green_villa',
        roomNumber: '201',
        name: 'Green Room 201',
      },
    ];

    this.mockAssets = [
      {
        id: 'item_fan',
        tenantId: 'tenant_prince_mess',
        name: 'BRB 56" Ceiling Fan',
        category: 'APPLIANCE',
        itemType: 'REUSABLE_ASSET',
        unit: 'piece',
        quantity: 1,
        location: 'Room 101',
        costPerUnitPoisha: BigInt(380000),
      },
      {
        id: 'item_green_gas',
        tenantId: 'tenant_green_villa',
        name: 'Green Villa Gas Cylinder',
        category: 'KITCHEN',
        itemType: 'CONSUMABLE',
        unit: 'piece',
        quantity: 2,
        costPerUnitPoisha: BigInt(140000),
      },
    ];

    this.mockComplaints = [
      {
        id: 'cmp_seed_1',
        referenceNumber: 'CMP-2611-001',
        tenantId: 'tenant_prince_mess',
        membershipId: 'mem_resident_1',
        category: 'MAINTENANCE',
        title: 'Ceiling fan making clicking noise and sparking',
        description: 'Room 101 ceiling fan regulates abnormally and sparks at speed 4.',
        status: 'IN_PROGRESS',
        adminResponse: 'Electrician assigned to inspect wiring.',
        createdAt: new Date('2026-11-20T10:00:00Z'),
      },
    ];

    this.mockWorkOrders = [
      {
        id: 'wo_seed_1',
        referenceNumber: 'WO-2611-001',
        tenantId: 'tenant_prince_mess',
        title: 'Repair Ceiling Fan Regulator & Wiring',
        description: 'Check regulator capacitor and fix wire sparks in Room 101.',
        category: 'ELECTRICAL',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        roomId: 'room_101',
        assetId: 'item_fan',
        complaintId: 'cmp_seed_1',
        assignedUserId: 'usr_staff_1',
        assignedVendorName: 'Rahim Electrical Services',
        assignedVendorContact: '01711002233',
        expectedStartDate: new Date('2026-11-21T09:00:00Z'),
        dueDate: new Date('2026-11-24T18:00:00Z'),
        completedAt: null,
        verifiedAt: null,
        estimatedCostPoisha: BigInt(50000), // 500 Taka
        actualCostPoisha: BigInt(35000), // 350 Taka
        internalNotes: 'Electrician requested replacement capacitor from Farmgate market.',
        memberUpdates: 'Electrician inspected. Sourcing new regulator switch.',
        completionNotes: null,
        attachmentUrl: null,
        createdById: 'usr_owner_1',
        closedById: null,
        createdAt: new Date('2026-11-20T11:00:00Z'),
        updatedAt: new Date('2026-11-21T09:30:00Z'),
      },
      {
        id: 'wo_seed_2',
        referenceNumber: 'WO-2611-002',
        tenantId: 'tenant_prince_mess',
        title: 'Kitchen Sink Drain Leakage Repair',
        description: 'Main kitchen washing basin pipe leaking into cabinet.',
        category: 'PLUMBING',
        priority: 'URGENT',
        status: 'OPEN',
        roomId: null,
        assetId: null,
        complaintId: null,
        assignedUserId: null,
        assignedVendorName: null,
        assignedVendorContact: null,
        expectedStartDate: null,
        dueDate: new Date('2026-11-22T20:00:00Z'),
        completedAt: null,
        verifiedAt: null,
        estimatedCostPoisha: BigInt(30000), // 300 Taka
        actualCostPoisha: BigInt(0),
        internalNotes: 'Plumber visited yesterday to assess thread size.',
        memberUpdates: null,
        completionNotes: null,
        attachmentUrl: null,
        createdById: 'usr_owner_1',
        closedById: null,
        createdAt: new Date('2026-11-21T14:00:00Z'),
        updatedAt: new Date('2026-11-21T14:00:00Z'),
      },
      {
        id: 'wo_green_1',
        referenceNumber: 'WO-GV-001',
        tenantId: 'tenant_green_villa',
        title: 'Green Villa Kitchen Burner Servicing',
        description: 'Clean burner nozzles for safe gas flow.',
        category: 'APPLIANCE',
        priority: 'MEDIUM',
        status: 'OPEN',
        roomId: null,
        assetId: null,
        complaintId: null,
        assignedUserId: null,
        assignedVendorName: null,
        assignedVendorContact: null,
        expectedStartDate: null,
        dueDate: new Date('2026-11-25T18:00:00Z'),
        completedAt: null,
        verifiedAt: null,
        estimatedCostPoisha: BigInt(25000),
        actualCostPoisha: BigInt(0),
        internalNotes: null,
        memberUpdates: null,
        completionNotes: null,
        attachmentUrl: null,
        createdById: 'usr_owner_1',
        closedById: null,
        createdAt: new Date('2026-11-21T10:00:00Z'),
        updatedAt: new Date('2026-11-21T10:00:00Z'),
      },
    ];

    this.mockHistory = [
      {
        id: 'hist_1',
        workOrderId: 'wo_seed_1',
        fromStatus: 'OPEN',
        toStatus: 'ASSIGNED',
        changedByUserId: 'usr_owner_1',
        reason: 'Assigned to technician Rahim',
        createdAt: new Date('2026-11-20T11:30:00Z'),
      },
      {
        id: 'hist_2',
        workOrderId: 'wo_seed_1',
        fromStatus: 'ASSIGNED',
        toStatus: 'IN_PROGRESS',
        changedByUserId: 'usr_staff_1',
        reason: 'Technician arrived on-site',
        createdAt: new Date('2026-11-21T09:00:00Z'),
      },
    ];

    this.mockTasks = [
      {
        id: 'task_seed_1',
        referenceNumber: 'TASK-2611-001',
        tenantId: 'tenant_prince_mess',
        workOrderId: null,
        title: 'Weekly Deep Kitchen & Pantry Sanitation',
        description: 'Clean grease off exhaust fan, scrub gas burners, sanitize spice containers.',
        category: 'CLEANING',
        priority: 'MEDIUM',
        status: 'TODO',
        assignedUserId: 'usr_staff_1',
        recurrenceRule: 'WEEKLY',
        dueDate: new Date('2026-11-23T12:00:00Z'),
        completedAt: null,
        checklistJson: JSON.stringify([
          { id: 'c1', text: 'Scrub cooking stoves and burners', completed: false },
          { id: 'c2', text: 'Clean kitchen exhaust chimney filters', completed: false },
          { id: 'c3', text: 'Mop storage pantry floors with disinfectant', completed: false },
        ]),
        completionNotes: null,
        createdById: 'usr_owner_1',
        createdAt: new Date('2026-11-18T00:00:00Z'),
        updatedAt: new Date('2026-11-18T00:00:00Z'),
      },
      {
        id: 'task_seed_2',
        referenceNumber: 'TASK-2611-002',
        tenantId: 'tenant_prince_mess',
        workOrderId: null,
        title: 'Monthly Water Purifier Filter Inspection',
        description: 'Inspect TDS level and replace carbon sediment filter cartridges.',
        category: 'INSPECTION',
        priority: 'HIGH',
        status: 'COMPLETED',
        assignedUserId: 'usr_owner_1',
        recurrenceRule: 'MONTHLY',
        dueDate: new Date('2026-11-15T18:00:00Z'),
        completedAt: new Date('2026-11-15T16:00:00Z'),
        checklistJson: JSON.stringify([
          { id: 'c1', text: 'Check output water TDS reading (target < 80)', completed: true },
          { id: 'c2', text: 'Flush membrane for 15 minutes', completed: true },
        ]),
        completionNotes: 'TDS tested at 48 ppm. All filters flushed and operating clean.',
        createdById: 'usr_owner_1',
        createdAt: new Date('2026-11-01T00:00:00Z'),
        updatedAt: new Date('2026-11-15T16:00:00Z'),
      },
    ];
  }

  private isDbConfigured(): boolean {
    return inspectDatabaseConfig().configured;
  }

  private async resolveTenant(tenantSlug: string): Promise<any> {
    if (this.isDbConfigured()) {
      const tenant = await this.db.tenant.findUnique({
        where: { slug: tenantSlug },
      });
      if (!tenant) {
        throw new NotFoundError(`Mess tenant '${tenantSlug}' not found.`);
      }
      if (tenant.status === 'SUSPENDED') {
        throw new ForbiddenError(`Mess tenant '${tenantSlug}' is suspended.`);
      }
      return tenant;
    }

    const mock = this.mockTenants.find((t) => t.slug === tenantSlug);
    if (!mock) {
      throw new NotFoundError(`Mess tenant '${tenantSlug}' not found.`);
    }
    if (mock.status === 'SUSPENDED') {
      throw new ForbiddenError(`Mess tenant '${tenantSlug}' is suspended.`);
    }
    return mock;
  }

  private mapWorkOrderToDto(
    wo: any,
    options: {
      isStaff?: boolean;
      roomMap?: Map<string, string>;
      assetMap?: Map<string, string>;
      complaintMap?: Map<string, string>;
      userMap?: Map<string, string>;
    } = {}
  ): WorkOrderDto {
    const isStaff = options.isStaff !== false; // Defaults to staff unless explicitly false
    const estPoisha = wo.estimatedCostPoisha ? BigInt(wo.estimatedCostPoisha) : BigInt(0);
    const actPoisha = wo.actualCostPoisha ? BigInt(wo.actualCostPoisha) : BigInt(0);

    const now = new Date();
    const isOverdue =
      wo.dueDate &&
      new Date(wo.dueDate).getTime() < now.getTime() &&
      wo.status !== 'COMPLETED' &&
      wo.status !== 'VERIFIED' &&
      wo.status !== 'CANCELLED';

    const roomNumber =
      wo.room?.roomNumber ||
      (wo.roomId && options.roomMap ? options.roomMap.get(wo.roomId) : null) ||
      null;

    const assetName =
      wo.asset?.name ||
      (wo.assetId && options.assetMap ? options.assetMap.get(wo.assetId) : null) ||
      null;

    const complaintRef =
      wo.complaint?.referenceNumber ||
      (wo.complaintId && options.complaintMap ? options.complaintMap.get(wo.complaintId) : null) ||
      null;

    const assignedUserName =
      wo.assignedUser?.name ||
      (wo.assignedUserId && options.userMap ? options.userMap.get(wo.assignedUserId) : null) ||
      null;

    const creatorName =
      wo.creator?.name ||
      (wo.createdById && options.userMap ? options.userMap.get(wo.createdById) : null) ||
      null;

    return {
      id: wo.id,
      referenceNumber: wo.referenceNumber,
      tenantId: wo.tenantId,
      title: wo.title,
      description: wo.description,
      category: wo.category,
      priority: wo.priority,
      status: wo.status,
      roomId: wo.roomId || null,
      roomNumber,
      assetId: wo.assetId || null,
      assetName,
      complaintId: wo.complaintId || null,
      complaintRef,
      assignedUserId: wo.assignedUserId || null,
      assignedUserName,
      assignedVendorName: isStaff ? wo.assignedVendorName || null : null,
      assignedVendorContact: isStaff ? wo.assignedVendorContact || null : null, // Redacted for members
      expectedStartDate: wo.expectedStartDate ? wo.expectedStartDate.toISOString() : null,
      dueDate: wo.dueDate ? wo.dueDate.toISOString() : null,
      formattedDueDate: wo.dueDate ? formatDhakaDateTime(wo.dueDate) : null,
      isOverdue: Boolean(isOverdue),
      completedAt: wo.completedAt ? wo.completedAt.toISOString() : null,
      formattedCompletedAt: wo.completedAt ? formatDhakaDateTime(wo.completedAt) : null,
      verifiedAt: wo.verifiedAt ? wo.verifiedAt.toISOString() : null,
      estimatedCostPoisha: estPoisha.toString(),
      estimatedCostTaka: fromPoisha(estPoisha),
      formattedEstimatedCost: formatBdtCurrency(estPoisha),
      actualCostPoisha: actPoisha.toString(),
      actualCostTaka: fromPoisha(actPoisha),
      formattedActualCost: formatBdtCurrency(actPoisha),
      internalNotes: isStaff ? wo.internalNotes || null : null, // Redacted for members
      memberUpdates: wo.memberUpdates || null,
      completionNotes: wo.completionNotes || null,
      attachmentUrl: wo.attachmentUrl || null,
      createdById: wo.createdById || null,
      creatorName,
      closedById: wo.closedById || null,
      createdAt: wo.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(wo.createdAt),
      updatedAt: wo.updatedAt ? wo.updatedAt.toISOString() : wo.createdAt.toISOString(),
    };
  }

  private mapTaskToDto(
    t: any,
    options: {
      userMap?: Map<string, string>;
      workOrderMap?: Map<string, string>;
    } = {}
  ): OperationalTaskDto {
    const now = new Date();
    const isOverdue =
      t.dueDate &&
      new Date(t.dueDate).getTime() < now.getTime() &&
      t.status !== 'COMPLETED' &&
      t.status !== 'CANCELLED';

    let checklist: Array<{ id: string; text: string; completed: boolean }> = [];
    if (t.checklistJson) {
      try {
        checklist = JSON.parse(t.checklistJson);
      } catch {
        checklist = [];
      }
    }

    const assignedUserName =
      t.assignedUser?.name ||
      (t.assignedUserId && options.userMap ? options.userMap.get(t.assignedUserId) : null) ||
      null;

    const creatorName =
      t.creator?.name ||
      (t.createdById && options.userMap ? options.userMap.get(t.createdById) : null) ||
      null;

    const workOrderRef =
      t.workOrder?.referenceNumber ||
      (t.workOrderId && options.workOrderMap ? options.workOrderMap.get(t.workOrderId) : null) ||
      null;

    return {
      id: t.id,
      referenceNumber: t.referenceNumber,
      tenantId: t.tenantId,
      workOrderId: t.workOrderId || null,
      workOrderRef,
      title: t.title,
      description: t.description || null,
      category: t.category,
      priority: t.priority,
      status: t.status,
      assignedUserId: t.assignedUserId || null,
      assignedUserName,
      recurrenceRule: t.recurrenceRule || 'NONE',
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      formattedDueDate: t.dueDate ? formatDhakaDateTime(t.dueDate) : null,
      isOverdue: Boolean(isOverdue),
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      formattedCompletedAt: t.completedAt ? formatDhakaDateTime(t.completedAt) : null,
      checklist,
      completionNotes: t.completionNotes || null,
      createdById: t.createdById || null,
      creatorName,
      createdAt: t.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(t.createdAt),
      updatedAt: t.updatedAt ? t.updatedAt.toISOString() : t.createdAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD & EXECUTIVE KPIs
  // ---------------------------------------------------------------------------

  async getMaintenanceDashboard(
    tenantSlug: string,
    currentUserId?: string
  ): Promise<MaintenanceDashboardDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const [workOrders, tasks] = await Promise.all([
        this.db.workOrder.findMany({
          where: { tenantId: tenant.id },
          include: {
            room: { select: { roomNumber: true } },
            asset: { select: { name: true } },
            assignedUser: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.db.operationalTask.findMany({
          where: { tenantId: tenant.id },
          include: {
            assignedUser: { select: { name: true } },
            workOrder: { select: { referenceNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const now = new Date();
      let openCount = 0;
      let assignedCount = 0;
      let inProgressCount = 0;
      let waitingPartsCount = 0;
      let completedCount = 0;
      let overdueCount = 0;
      let totalCostPoisha = BigInt(0);

      const categoryMap = new Map<string, { count: number; costPoisha: bigint }>();

      for (const wo of workOrders) {
        if (wo.status === 'OPEN') openCount++;
        else if (wo.status === 'ASSIGNED') assignedCount++;
        else if (wo.status === 'IN_PROGRESS') inProgressCount++;
        else if (wo.status === 'WAITING_FOR_PARTS') waitingPartsCount++;
        else if (wo.status === 'COMPLETED' || wo.status === 'VERIFIED') completedCount++;

        const isOverdue =
          wo.dueDate &&
          wo.dueDate.getTime() < now.getTime() &&
          wo.status !== 'COMPLETED' &&
          wo.status !== 'VERIFIED' &&
          wo.status !== 'CANCELLED';
        if (isOverdue) overdueCount++;

        const cost = wo.actualCostPoisha ? BigInt(wo.actualCostPoisha) : BigInt(0);
        totalCostPoisha += cost;

        const curCat = categoryMap.get(wo.category) || { count: 0, costPoisha: BigInt(0) };
        curCat.count++;
        curCat.costPoisha += cost;
        categoryMap.set(wo.category, curCat);
      }

      const pendingTasksCount = tasks.filter((t: any) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
      const completedTasksCount = tasks.filter((t: any) => t.status === 'COMPLETED').length;

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([cat, data]) => ({
        category: cat,
        count: data.count,
        totalCostPoisha: data.costPoisha.toString(),
        formattedTotalCost: formatBdtCurrency(data.costPoisha),
      }));

      const dtoList = workOrders.map((wo: any) => this.mapWorkOrderToDto(wo, { isStaff: true }));
      const recentWorkOrders = dtoList.slice(0, 10);
      const assignedToCurrentUser = currentUserId
        ? dtoList.filter((wo) => wo.assignedUserId === currentUserId)
        : [];

      return {
        totalWorkOrders: workOrders.length,
        openCount,
        assignedCount,
        inProgressCount,
        waitingPartsCount,
        completedCount,
        overdueWorkOrdersCount: overdueCount,
        totalTasks: tasks.length,
        pendingTasksCount,
        completedTasksCount,
        totalMaintenanceCostPoisha: totalCostPoisha.toString(),
        formattedTotalMaintenanceCost: formatBdtCurrency(totalCostPoisha),
        categoryBreakdown,
        recentWorkOrders,
        assignedToCurrentUser,
      };
    }

    // In-memory fallback
    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));
    const assetMap = new Map<string, string>(this.mockAssets.map((a) => [a.id, a.name]));
    const complaintMap = new Map<string, string>(this.mockComplaints.map((c) => [c.id, c.referenceNumber]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));

    const workOrders = this.mockWorkOrders.filter((wo) => wo.tenantId === tenant.id);
    const tasks = this.mockTasks.filter((t) => t.tenantId === tenant.id);

    const now = new Date();
    let openCount = 0;
    let assignedCount = 0;
    let inProgressCount = 0;
    let waitingPartsCount = 0;
    let completedCount = 0;
    let overdueCount = 0;
    let totalCostPoisha = BigInt(0);

    const categoryMap = new Map<string, { count: number; costPoisha: bigint }>();

    for (const wo of workOrders) {
      if (wo.status === 'OPEN') openCount++;
      else if (wo.status === 'ASSIGNED') assignedCount++;
      else if (wo.status === 'IN_PROGRESS') inProgressCount++;
      else if (wo.status === 'WAITING_FOR_PARTS') waitingPartsCount++;
      else if (wo.status === 'COMPLETED' || wo.status === 'VERIFIED') completedCount++;

      const isOverdue =
        wo.dueDate &&
        wo.dueDate.getTime() < now.getTime() &&
        wo.status !== 'COMPLETED' &&
        wo.status !== 'VERIFIED' &&
        wo.status !== 'CANCELLED';
      if (isOverdue) overdueCount++;

      const cost = wo.actualCostPoisha ? BigInt(wo.actualCostPoisha) : BigInt(0);
      totalCostPoisha += cost;

      const curCat = categoryMap.get(wo.category) || { count: 0, costPoisha: BigInt(0) };
      curCat.count++;
      curCat.costPoisha += cost;
      categoryMap.set(wo.category, curCat);
    }

    const pendingTasksCount = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
    const completedTasksCount = tasks.filter((t) => t.status === 'COMPLETED').length;

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([cat, data]) => ({
      category: cat,
      count: data.count,
      totalCostPoisha: data.costPoisha.toString(),
      formattedTotalCost: formatBdtCurrency(data.costPoisha),
    }));

    const dtoList = workOrders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((wo) =>
        this.mapWorkOrderToDto(wo, {
          isStaff: true,
          roomMap,
          assetMap,
          complaintMap,
          userMap,
        })
      );

    const recentWorkOrders = dtoList.slice(0, 10);
    const assignedToCurrentUser = currentUserId
      ? dtoList.filter((wo) => wo.assignedUserId === currentUserId)
      : [];

    return {
      totalWorkOrders: workOrders.length,
      openCount,
      assignedCount,
      inProgressCount,
      waitingPartsCount,
      completedCount,
      overdueWorkOrdersCount: overdueCount,
      totalTasks: tasks.length,
      pendingTasksCount,
      completedTasksCount,
      totalMaintenanceCostPoisha: totalCostPoisha.toString(),
      formattedTotalMaintenanceCost: formatBdtCurrency(totalCostPoisha),
      categoryBreakdown,
      recentWorkOrders,
      assignedToCurrentUser,
    };
  }

  // ---------------------------------------------------------------------------
  // WORK ORDERS CRUD & LIFECYCLE
  // ---------------------------------------------------------------------------

  async listWorkOrders(
    tenantSlug: string,
    filters: {
      status?: string;
      category?: string;
      priority?: string;
      assignedUserId?: string;
      roomId?: string;
      search?: string;
      overdueOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {},
    isStaff = true
  ): Promise<{ workOrders: WorkOrderDto[]; total: number }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
    const offset = Math.max(filters.offset || 0, 0);

    if (this.isDbConfigured()) {
      const where: any = { tenantId: tenant.id };
      if (filters.status && filters.status !== 'ALL') where.status = filters.status;
      if (filters.category && filters.category !== 'ALL') where.category = filters.category;
      if (filters.priority && filters.priority !== 'ALL') where.priority = filters.priority;
      if (filters.assignedUserId) where.assignedUserId = filters.assignedUserId;
      if (filters.roomId) where.roomId = filters.roomId;

      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim();
        where.OR = [
          { referenceNumber: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [total, rawWos] = await Promise.all([
        this.db.workOrder.count({ where }),
        this.db.workOrder.findMany({
          where,
          include: {
            room: { select: { roomNumber: true } },
            asset: { select: { name: true } },
            complaint: { select: { referenceNumber: true } },
            assignedUser: { select: { name: true } },
            creator: { select: { name: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      let workOrders = rawWos.map((wo: any) => this.mapWorkOrderToDto(wo, { isStaff }));
      if (filters.overdueOnly) {
        workOrders = workOrders.filter((wo) => wo.isOverdue);
      }

      return { workOrders, total };
    }

    // In-memory fallback
    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));
    const assetMap = new Map<string, string>(this.mockAssets.map((a) => [a.id, a.name]));
    const complaintMap = new Map<string, string>(this.mockComplaints.map((c) => [c.id, c.referenceNumber]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));

    let filtered = this.mockWorkOrders.filter((wo) => wo.tenantId === tenant.id);

    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((wo) => wo.status === filters.status);
    }
    if (filters.category && filters.category !== 'ALL') {
      filtered = filtered.filter((wo) => wo.category === filters.category);
    }
    if (filters.priority && filters.priority !== 'ALL') {
      filtered = filtered.filter((wo) => wo.priority === filters.priority);
    }
    if (filters.assignedUserId) {
      filtered = filtered.filter((wo) => wo.assignedUserId === filters.assignedUserId);
    }
    if (filters.roomId) {
      filtered = filtered.filter((wo) => wo.roomId === filters.roomId);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (wo) =>
          wo.referenceNumber.toLowerCase().includes(q) ||
          wo.title.toLowerCase().includes(q) ||
          wo.description.toLowerCase().includes(q)
      );
    }

    let dtoList = filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((wo) =>
        this.mapWorkOrderToDto(wo, {
          isStaff,
          roomMap,
          assetMap,
          complaintMap,
          userMap,
        })
      );

    if (filters.overdueOnly) {
      dtoList = dtoList.filter((wo) => wo.isOverdue);
    }

    const total = dtoList.length;
    const workOrders = dtoList.slice(offset, offset + limit);

    return { workOrders, total };
  }

  async getWorkOrderById(
    tenantSlug: string,
    workOrderId: string,
    isStaff = true
  ): Promise<WorkOrderDto & { statusHistory: WorkOrderStatusHistoryDto[]; tasks: OperationalTaskDto[] }> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const wo = await this.db.workOrder.findFirst({
        where: { id: workOrderId, tenantId: tenant.id },
        include: {
          room: { select: { roomNumber: true } },
          asset: { select: { name: true } },
          complaint: { select: { referenceNumber: true } },
          assignedUser: { select: { name: true } },
          creator: { select: { name: true } },
          statusHistory: {
            include: { changedBy: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
          },
          tasks: {
            include: { assignedUser: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!wo) {
        throw new NotFoundError('Work order not found.');
      }

      const dto = this.mapWorkOrderToDto(wo, { isStaff });
      const statusHistory = wo.statusHistory.map((h: any) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedById: h.changedByUserId,
        changedByName: h.changedBy?.name || 'Staff',
        reason: h.reason,
        createdAt: h.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(h.createdAt),
      }));

      const tasks = wo.tasks.map((t: any) => this.mapTaskToDto(t));

      return {
        ...dto,
        statusHistory,
        tasks,
      };
    }

    // In-memory fallback
    const wo = this.mockWorkOrders.find((w) => w.id === workOrderId && w.tenantId === tenant.id);
    if (!wo) {
      throw new NotFoundError('Work order not found.');
    }

    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));
    const assetMap = new Map<string, string>(this.mockAssets.map((a) => [a.id, a.name]));
    const complaintMap = new Map<string, string>(this.mockComplaints.map((c) => [c.id, c.referenceNumber]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));

    const statusHistory = this.mockHistory
      .filter((h) => h.workOrderId === wo.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedById: h.changedByUserId,
        changedByName: userMap.get(h.changedByUserId) || 'Staff',
        reason: h.reason,
        createdAt: h.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(h.createdAt),
      }));

    const tasks = this.mockTasks
      .filter((t) => t.workOrderId === wo.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((t) => this.mapTaskToDto(t, { userMap }));

    return {
      ...this.mapWorkOrderToDto(wo, {
        isStaff,
        roomMap,
        assetMap,
        complaintMap,
        userMap,
      }),
      statusHistory,
      tasks,
    };
  }

  async createWorkOrder(
    tenantSlug: string,
    userId: string,
    input: CreateWorkOrderInput
  ): Promise<WorkOrderDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (!input.title || !input.title.trim()) {
      throw new ValidationError('Work order title is required.');
    }
    if (!input.description || !input.description.trim()) {
      throw new ValidationError('Work order description is required.');
    }

    // Verify room reference belongs to the same tenant
    if (input.roomId) {
      if (this.isDbConfigured()) {
        const room = await this.db.room.findFirst({
          where: { id: input.roomId, tenantId: tenant.id },
        });
        if (!room) {
          throw new ValidationError(`Room '${input.roomId}' does not exist in this mess.`);
        }
      } else {
        const room = this.mockRooms.find((r) => r.id === input.roomId && r.tenantId === tenant.id);
        if (!room) {
          throw new ValidationError(`Room '${input.roomId}' does not exist in this mess.`);
        }
      }
    }

    // Verify asset reference belongs to the same tenant
    if (input.assetId) {
      if (this.isDbConfigured()) {
        const asset = await this.db.inventoryItem.findFirst({
          where: { id: input.assetId, tenantId: tenant.id },
        });
        if (!asset) {
          throw new ValidationError(`Inventory asset '${input.assetId}' does not exist in this mess.`);
        }
      } else {
        const asset = this.mockAssets.find((a) => a.id === input.assetId && a.tenantId === tenant.id);
        if (!asset) {
          throw new ValidationError(`Inventory asset '${input.assetId}' does not exist in this mess.`);
        }
      }
    }

    // Verify complaint reference belongs to the same tenant
    if (input.complaintId) {
      if (this.isDbConfigured()) {
        const cmp = await this.db.complaint.findFirst({
          where: { id: input.complaintId, tenantId: tenant.id },
        });
        if (!cmp) {
          throw new ValidationError(`Complaint '${input.complaintId}' does not exist in this mess.`);
        }
      } else {
        const cmp = this.mockComplaints.find((c) => c.id === input.complaintId && c.tenantId === tenant.id);
        if (!cmp) {
          throw new ValidationError(`Complaint '${input.complaintId}' does not exist in this mess.`);
        }
      }
    }

    const refNumber = `WO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const initialStatus: WorkOrderStatus = input.assignedUserId || input.assignedVendorName ? 'ASSIGNED' : 'OPEN';
    const estPoisha = toPoisha(input.estimatedCostTaka);

    const now = new Date();
    const expStart = input.expectedStartDate ? new Date(input.expectedStartDate) : null;
    const due = input.dueDate ? new Date(input.dueDate) : null;

    if (this.isDbConfigured()) {
      const created = await this.db.workOrder.create({
        data: {
          referenceNumber: refNumber,
          tenantId: tenant.id,
          title: input.title.trim(),
          description: input.description.trim(),
          category: input.category || 'OTHER',
          priority: input.priority || 'MEDIUM',
          status: initialStatus,
          roomId: input.roomId || null,
          assetId: input.assetId || null,
          complaintId: input.complaintId || null,
          assignedUserId: input.assignedUserId || null,
          assignedVendorName: input.assignedVendorName?.trim() || null,
          assignedVendorContact: input.assignedVendorContact?.trim() || null,
          expectedStartDate: expStart,
          dueDate: due,
          estimatedCostPoisha: estPoisha,
          internalNotes: input.internalNotes?.trim() || null,
          memberUpdates: input.memberUpdates?.trim() || null,
          attachmentUrl: input.attachmentUrl?.trim() || null,
          createdById: userId,
        },
        include: {
          room: { select: { roomNumber: true } },
          asset: { select: { name: true } },
          complaint: { select: { referenceNumber: true } },
          assignedUser: { select: { name: true } },
          creator: { select: { name: true } },
        },
      });

      // Log initial status
      await this.db.workOrderStatusHistory.create({
        data: {
          workOrderId: created.id,
          fromStatus: 'DRAFT',
          toStatus: initialStatus,
          changedByUserId: userId,
          reason: 'Initial creation',
        },
      });

      // Trigger notification if assigned to a user
      if (input.assignedUserId) {
        await this.notifyAssignee(tenantSlug, input.assignedUserId, created);
      }

      return this.mapWorkOrderToDto(created, { isStaff: true });
    }

    // In-memory fallback
    const newWo = {
      id: `wo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      referenceNumber: refNumber,
      tenantId: tenant.id,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category || 'OTHER',
      priority: input.priority || 'MEDIUM',
      status: initialStatus,
      roomId: input.roomId || null,
      assetId: input.assetId || null,
      complaintId: input.complaintId || null,
      assignedUserId: input.assignedUserId || null,
      assignedVendorName: input.assignedVendorName?.trim() || null,
      assignedVendorContact: input.assignedVendorContact?.trim() || null,
      expectedStartDate: expStart,
      dueDate: due,
      completedAt: null,
      verifiedAt: null,
      estimatedCostPoisha: estPoisha,
      actualCostPoisha: BigInt(0),
      internalNotes: input.internalNotes?.trim() || null,
      memberUpdates: input.memberUpdates?.trim() || null,
      completionNotes: null,
      attachmentUrl: input.attachmentUrl?.trim() || null,
      createdById: userId,
      closedById: null,
      createdAt: now,
      updatedAt: now,
    };

    this.mockWorkOrders.unshift(newWo);

    this.mockHistory.unshift({
      id: `hist_${Date.now()}`,
      workOrderId: newWo.id,
      fromStatus: 'DRAFT',
      toStatus: initialStatus,
      changedByUserId: userId,
      reason: 'Initial creation',
      createdAt: now,
    });

    if (input.assignedUserId) {
      await this.notifyAssignee(tenantSlug, input.assignedUserId, newWo);
    }

    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));
    const assetMap = new Map<string, string>(this.mockAssets.map((a) => [a.id, a.name]));
    const complaintMap = new Map<string, string>(this.mockComplaints.map((c) => [c.id, c.referenceNumber]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));

    return this.mapWorkOrderToDto(newWo, {
      isStaff: true,
      roomMap,
      assetMap,
      complaintMap,
      userMap,
    });
  }

  /**
   * Converts or links an existing member complaint to a new formal work order.
   */
  async convertComplaintToWorkOrder(
    tenantSlug: string,
    userId: string,
    complaintId: string,
    overrides: Partial<CreateWorkOrderInput> = {}
  ): Promise<WorkOrderDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    let complaint: any = null;
    if (this.isDbConfigured()) {
      complaint = await this.db.complaint.findFirst({
        where: { id: complaintId, tenantId: tenant.id },
      });
    } else {
      complaint = this.mockComplaints.find((c) => c.id === complaintId && c.tenantId === tenant.id);
    }

    if (!complaint) {
      throw new NotFoundError(`Complaint '${complaintId}' not found.`);
    }

    const woInput: CreateWorkOrderInput = {
      title: overrides.title || `Fix: ${complaint.title}`,
      description: overrides.description || complaint.description,
      category: overrides.category || (complaint.category === 'MAINTENANCE' ? 'BUILDING_REPAIR' : complaint.category),
      priority: overrides.priority || 'HIGH',
      roomId: overrides.roomId || null,
      assetId: overrides.assetId || null,
      complaintId: complaint.id,
      assignedUserId: overrides.assignedUserId || null,
      assignedVendorName: overrides.assignedVendorName || null,
      dueDate: overrides.dueDate || null,
      estimatedCostTaka: overrides.estimatedCostTaka || null,
      internalNotes: overrides.internalNotes || `Created from member complaint ${complaint.referenceNumber}`,
      memberUpdates: overrides.memberUpdates || 'A maintenance work order has been created for your complaint.',
    };

    const workOrder = await this.createWorkOrder(tenantSlug, userId, woInput);

    // Update complaint status to IN_PROGRESS
    if (this.isDbConfigured()) {
      await this.db.complaint.update({
        where: { id: complaint.id },
        data: {
          status: 'IN_PROGRESS',
          adminResponse: `Converted to work order ${workOrder.referenceNumber}`,
          reviewedByUserId: userId,
          reviewedAt: new Date(),
        },
      });
    } else {
      complaint.status = 'IN_PROGRESS';
      complaint.adminResponse = `Converted to work order ${workOrder.referenceNumber}`;
      complaint.reviewedByUserId = userId;
      complaint.reviewedAt = new Date();
    }

    return workOrder;
  }

  /**
   * Updates a work order with status transition validation, audit tracking, and completion checks.
   */
  async updateWorkOrder(
    tenantSlug: string,
    userId: string,
    workOrderId: string,
    input: UpdateWorkOrderInput,
    isAssigneeOnly = false
  ): Promise<WorkOrderDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const wo = await this.db.workOrder.findFirst({
        where: { id: workOrderId, tenantId: tenant.id },
      });
      if (!wo) {
        throw new NotFoundError('Work order not found.');
      }

      // Assignee permission bounds
      if (isAssigneeOnly) {
        if (input.title || input.description || input.category || input.assignedUserId !== undefined) {
          throw new ForbiddenError('Assignee can only update status, completion notes, and attachments.');
        }
      }

      const updateData: any = {};
      const now = new Date();

      if (input.title) updateData.title = input.title.trim();
      if (input.description) updateData.description = input.description.trim();
      if (input.category) updateData.category = input.category;
      if (input.priority) updateData.priority = input.priority;
      if (input.assignedUserId !== undefined) updateData.assignedUserId = input.assignedUserId || null;
      if (input.assignedVendorName !== undefined) updateData.assignedVendorName = input.assignedVendorName?.trim() || null;
      if (input.assignedVendorContact !== undefined) updateData.assignedVendorContact = input.assignedVendorContact?.trim() || null;
      if (input.expectedStartDate !== undefined) updateData.expectedStartDate = input.expectedStartDate ? new Date(input.expectedStartDate) : null;
      if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
      if (input.actualCostTaka !== undefined) updateData.actualCostPoisha = toPoisha(input.actualCostTaka);
      if (input.internalNotes !== undefined) updateData.internalNotes = input.internalNotes?.trim() || null;
      if (input.memberUpdates !== undefined) updateData.memberUpdates = input.memberUpdates?.trim() || null;
      if (input.completionNotes !== undefined) updateData.completionNotes = input.completionNotes?.trim() || null;
      if (input.attachmentUrl !== undefined) updateData.attachmentUrl = input.attachmentUrl?.trim() || null;

      // Status transition validation
      if (input.status && input.status !== wo.status) {
        const currentStatus = wo.status as WorkOrderStatus;
        const targetStatus = input.status as WorkOrderStatus;
        const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

        if (!allowed.includes(targetStatus)) {
          throw new ValidationError(
            `Invalid status transition from '${currentStatus}' to '${targetStatus}'.`
          );
        }

        updateData.status = targetStatus;

        if (targetStatus === 'COMPLETED') {
          updateData.completedAt = now;
        } else if (targetStatus === 'VERIFIED') {
          updateData.verifiedAt = now;
          updateData.closedById = userId;
        }

        // Record history
        await this.db.workOrderStatusHistory.create({
          data: {
            workOrderId: wo.id,
            fromStatus: currentStatus,
            toStatus: targetStatus,
            changedByUserId: userId,
            reason: input.statusChangeReason || null,
          },
        });
      }

      const updated = await this.db.workOrder.update({
        where: { id: wo.id },
        data: updateData,
        include: {
          room: { select: { roomNumber: true } },
          asset: { select: { name: true } },
          complaint: { select: { referenceNumber: true } },
          assignedUser: { select: { name: true } },
          creator: { select: { name: true } },
        },
      });

      return this.mapWorkOrderToDto(updated, { isStaff: true });
    }

    // In-memory fallback
    const wo = this.mockWorkOrders.find((w) => w.id === workOrderId && w.tenantId === tenant.id);
    if (!wo) {
      throw new NotFoundError('Work order not found.');
    }

    if (isAssigneeOnly) {
      if (input.title || input.description || input.category || input.assignedUserId !== undefined) {
        throw new ForbiddenError('Assignee can only update status, completion notes, and attachments.');
      }
    }

    const now = new Date();

    if (input.title) wo.title = input.title.trim();
    if (input.description) wo.description = input.description.trim();
    if (input.category) wo.category = input.category;
    if (input.priority) wo.priority = input.priority;
    if (input.assignedUserId !== undefined) wo.assignedUserId = input.assignedUserId || null;
    if (input.assignedVendorName !== undefined) wo.assignedVendorName = input.assignedVendorName?.trim() || null;
    if (input.assignedVendorContact !== undefined) wo.assignedVendorContact = input.assignedVendorContact?.trim() || null;
    if (input.expectedStartDate !== undefined) wo.expectedStartDate = input.expectedStartDate ? new Date(input.expectedStartDate) : null;
    if (input.dueDate !== undefined) wo.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (input.actualCostTaka !== undefined) wo.actualCostPoisha = toPoisha(input.actualCostTaka);
    if (input.internalNotes !== undefined) wo.internalNotes = input.internalNotes?.trim() || null;
    if (input.memberUpdates !== undefined) wo.memberUpdates = input.memberUpdates?.trim() || null;
    if (input.completionNotes !== undefined) wo.completionNotes = input.completionNotes?.trim() || null;
    if (input.attachmentUrl !== undefined) wo.attachmentUrl = input.attachmentUrl?.trim() || null;

    if (input.status && input.status !== wo.status) {
      const currentStatus = wo.status as WorkOrderStatus;
      const targetStatus = input.status as WorkOrderStatus;
      const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

      if (!allowed.includes(targetStatus)) {
        throw new ValidationError(
          `Invalid status transition from '${currentStatus}' to '${targetStatus}'.`
        );
      }

      wo.status = targetStatus;

      if (targetStatus === 'COMPLETED') {
        wo.completedAt = now;
      } else if (targetStatus === 'VERIFIED') {
        wo.verifiedAt = now;
        wo.closedById = userId;
      }

      this.mockHistory.unshift({
        id: `hist_${Date.now()}`,
        workOrderId: wo.id,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        changedByUserId: userId,
        reason: input.statusChangeReason || null,
        createdAt: now,
      });
    }

    wo.updatedAt = now;

    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));
    const assetMap = new Map<string, string>(this.mockAssets.map((a) => [a.id, a.name]));
    const complaintMap = new Map<string, string>(this.mockComplaints.map((c) => [c.id, c.referenceNumber]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));

    return this.mapWorkOrderToDto(wo, {
      isStaff: true,
      roomMap,
      assetMap,
      complaintMap,
      userMap,
    });
  }

  /**
   * Assigns or reassigns a work order to a staff member or vendor.
   */
  async assignWorkOrder(
    tenantSlug: string,
    userId: string,
    workOrderId: string,
    assignInput: {
      assignedUserId?: string | null;
      assignedVendorName?: string | null;
      assignedVendorContact?: string | null;
      reason?: string | null;
    }
  ): Promise<WorkOrderDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    // Validate that assignee is not from an invalid/cross-tenant context
    if (assignInput.assignedUserId) {
      if (this.isDbConfigured()) {
        const member = await this.db.membership.findFirst({
          where: { tenantId: tenant.id, userId: assignInput.assignedUserId },
        });
        if (!member) {
          throw new ValidationError(
            `Assigned user '${assignInput.assignedUserId}' does not belong to this mess tenant.`
          );
        }
      } else {
        const user = this.mockUsers.find((u) => u.id === assignInput.assignedUserId);
        if (!user) {
          throw new ValidationError(
            `Assigned user '${assignInput.assignedUserId}' not found in tenant system.`
          );
        }
      }
    }

    const currentWo = await this.getWorkOrderById(tenantSlug, workOrderId, true);
    const targetStatus: WorkOrderStatus = currentWo.status === 'OPEN' ? 'ASSIGNED' : (currentWo.status as WorkOrderStatus);

    return this.updateWorkOrder(
      tenantSlug,
      userId,
      workOrderId,
      {
        assignedUserId: assignInput.assignedUserId,
        assignedVendorName: assignInput.assignedVendorName,
        assignedVendorContact: assignInput.assignedVendorContact,
        status: targetStatus,
        statusChangeReason: assignInput.reason || 'Staff assignment updated',
      }
    );
  }

  /**
   * Links inventory item consumption to a work order.
   * Decrements stock via InventoryService and adds exact cost to work order actualCost.
   */
  async linkInventoryItemToWorkOrder(
    tenantSlug: string,
    userId: string,
    workOrderId: string,
    input: {
      itemId: string;
      quantity: number;
      notes?: string;
    }
  ): Promise<{ workOrder: WorkOrderDto; movementId: string }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const wo = await this.getWorkOrderById(tenantSlug, workOrderId, true);

    // Record consumption movement
    const movement = await inventoryService.recordStockMovement(tenantSlug, userId, {
      itemId: input.itemId,
      movementType: 'CONSUMPTION',
      quantity: input.quantity,
      referenceNumber: `WO_CONSUME_${wo.referenceNumber}`,
      notes: input.notes || `Used for Work Order ${wo.referenceNumber}: ${wo.title}`,
    });

    // Add cost to work order actualCost
    const consumedPoisha = movement.totalCostPoisha ? BigInt(movement.totalCostPoisha) : BigInt(0);
    const currentActualPoisha = BigInt(wo.actualCostPoisha);
    const newActualPoisha = currentActualPoisha + consumedPoisha;
    const newActualTaka = fromPoisha(newActualPoisha);

    const updatedWo = await this.updateWorkOrder(tenantSlug, userId, workOrderId, {
      actualCostTaka: newActualTaka,
    });

    return {
      workOrder: updatedWo,
      movementId: movement.id,
    };
  }

  // ---------------------------------------------------------------------------
  // OPERATIONAL TASKS
  // ---------------------------------------------------------------------------

  async listOperationalTasks(
    tenantSlug: string,
    filters: {
      status?: string;
      category?: string;
      priority?: string;
      assignedUserId?: string;
      workOrderId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ tasks: OperationalTaskDto[]; total: number }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
    const offset = Math.max(filters.offset || 0, 0);

    if (this.isDbConfigured()) {
      const where: any = { tenantId: tenant.id };
      if (filters.status && filters.status !== 'ALL') where.status = filters.status;
      if (filters.category && filters.category !== 'ALL') where.category = filters.category;
      if (filters.priority && filters.priority !== 'ALL') where.priority = filters.priority;
      if (filters.assignedUserId) where.assignedUserId = filters.assignedUserId;
      if (filters.workOrderId) where.workOrderId = filters.workOrderId;

      const [total, rawTasks] = await Promise.all([
        this.db.operationalTask.count({ where }),
        this.db.operationalTask.findMany({
          where,
          include: {
            assignedUser: { select: { name: true } },
            workOrder: { select: { referenceNumber: true } },
            creator: { select: { name: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const tasks = rawTasks.map((t: any) => this.mapTaskToDto(t));
      return { tasks, total };
    }

    // In-memory fallback
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const workOrderMap = new Map<string, string>(this.mockWorkOrders.map((w) => [w.id, w.referenceNumber]));

    let filtered = this.mockTasks.filter((t) => t.tenantId === tenant.id);

    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    if (filters.category && filters.category !== 'ALL') {
      filtered = filtered.filter((t) => t.category === filters.category);
    }
    if (filters.priority && filters.priority !== 'ALL') {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }
    if (filters.assignedUserId) {
      filtered = filtered.filter((t) => t.assignedUserId === filters.assignedUserId);
    }
    if (filters.workOrderId) {
      filtered = filtered.filter((t) => t.workOrderId === filters.workOrderId);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    const tasks = paginated.map((t) => this.mapTaskToDto(t, { userMap, workOrderMap }));

    return { tasks, total };
  }

  async createOperationalTask(
    tenantSlug: string,
    userId: string,
    input: CreateOperationalTaskInput
  ): Promise<OperationalTaskDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (!input.title || !input.title.trim()) {
      throw new ValidationError('Task title is required.');
    }

    // Prevent duplicate recurring task generation
    if (input.recurrenceRule && input.recurrenceRule !== 'NONE') {
      const cleanTitle = input.title.trim().toLowerCase();
      const existing = this.isDbConfigured()
        ? await this.db.operationalTask.findFirst({
            where: {
              tenantId: tenant.id,
              title: { equals: input.title.trim(), mode: 'insensitive' },
              recurrenceRule: input.recurrenceRule,
              status: { in: ['TODO', 'IN_PROGRESS'] },
            },
          })
        : this.mockTasks.find(
            (t) =>
              t.tenantId === tenant.id &&
              t.title.toLowerCase() === cleanTitle &&
              t.recurrenceRule === input.recurrenceRule &&
              (t.status === 'TODO' || t.status === 'IN_PROGRESS')
          );

      if (existing) {
        throw new ValidationError(
          `An active recurring task for '${input.title}' (${input.recurrenceRule}) is already open.`
        );
      }
    }

    const refNumber = `TASK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const due = input.dueDate ? new Date(input.dueDate) : null;
    const checklistJson = input.checklist ? JSON.stringify(input.checklist) : null;

    if (this.isDbConfigured()) {
      const created = await this.db.operationalTask.create({
        data: {
          referenceNumber: refNumber,
          tenantId: tenant.id,
          workOrderId: input.workOrderId || null,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          category: input.category || 'OTHER',
          priority: input.priority || 'MEDIUM',
          status: 'TODO',
          assignedUserId: input.assignedUserId || null,
          recurrenceRule: input.recurrenceRule || 'NONE',
          dueDate: due,
          checklistJson,
          createdById: userId,
        },
        include: {
          assignedUser: { select: { name: true } },
          workOrder: { select: { referenceNumber: true } },
          creator: { select: { name: true } },
        },
      });

      return this.mapTaskToDto(created);
    }

    // In-memory fallback
    const now = new Date();
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      referenceNumber: refNumber,
      tenantId: tenant.id,
      workOrderId: input.workOrderId || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category || 'OTHER',
      priority: input.priority || 'MEDIUM',
      status: 'TODO',
      assignedUserId: input.assignedUserId || null,
      recurrenceRule: input.recurrenceRule || 'NONE',
      dueDate: due,
      completedAt: null,
      checklistJson,
      completionNotes: null,
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    };

    this.mockTasks.unshift(newTask);

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const workOrderMap = new Map<string, string>(this.mockWorkOrders.map((w) => [w.id, w.referenceNumber]));

    return this.mapTaskToDto(newTask, { userMap, workOrderMap });
  }

  async updateOperationalTask(
    tenantSlug: string,
    _userId: string,
    taskId: string,
    input: UpdateOperationalTaskInput
  ): Promise<OperationalTaskDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const now = new Date();

    if (this.isDbConfigured()) {
      const task = await this.db.operationalTask.findFirst({
        where: { id: taskId, tenantId: tenant.id },
      });
      if (!task) {
        throw new NotFoundError('Operational task not found.');
      }

      const updateData: any = {};
      if (input.title) updateData.title = input.title.trim();
      if (input.description !== undefined) updateData.description = input.description?.trim() || null;
      if (input.category) updateData.category = input.category;
      if (input.priority) updateData.priority = input.priority;
      if (input.assignedUserId !== undefined) updateData.assignedUserId = input.assignedUserId || null;
      if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
      if (input.completionNotes !== undefined) updateData.completionNotes = input.completionNotes?.trim() || null;
      if (input.checklist) updateData.checklistJson = JSON.stringify(input.checklist);

      if (input.status) {
        updateData.status = input.status;
        if (input.status === 'COMPLETED') {
          updateData.completedAt = now;
        }
      }

      const updated = await this.db.operationalTask.update({
        where: { id: task.id },
        data: updateData,
        include: {
          assignedUser: { select: { name: true } },
          workOrder: { select: { referenceNumber: true } },
          creator: { select: { name: true } },
        },
      });

      return this.mapTaskToDto(updated);
    }

    // In-memory fallback
    const task = this.mockTasks.find((t) => t.id === taskId && t.tenantId === tenant.id);
    if (!task) {
      throw new NotFoundError('Operational task not found.');
    }

    if (input.title) task.title = input.title.trim();
    if (input.description !== undefined) task.description = input.description?.trim() || null;
    if (input.category) task.category = input.category;
    if (input.priority) task.priority = input.priority;
    if (input.assignedUserId !== undefined) task.assignedUserId = input.assignedUserId || null;
    if (input.dueDate !== undefined) task.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (input.completionNotes !== undefined) task.completionNotes = input.completionNotes?.trim() || null;
    if (input.checklist) task.checklistJson = JSON.stringify(input.checklist);

    if (input.status) {
      task.status = input.status;
      if (input.status === 'COMPLETED') {
        task.completedAt = now;
      }
    }
    task.updatedAt = now;

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const workOrderMap = new Map<string, string>(this.mockWorkOrders.map((w) => [w.id, w.referenceNumber]));

    return this.mapTaskToDto(task, { userMap, workOrderMap });
  }

  // ---------------------------------------------------------------------------
  // REPORTS
  // ---------------------------------------------------------------------------

  async getMaintenanceReports(tenantSlug: string): Promise<{
    statusDistribution: Array<{ status: string; count: number }>;
    categoryDistribution: Array<{ category: string; count: number; costPoisha: string; formattedCost: string }>;
    staffWorkload: Array<{ staffId: string; staffName: string; openOrders: number; completedOrders: number }>;
    overdueAnalysis: Array<{ id: string; referenceNumber: string; title: string; dueDate: string; daysOverdue: number }>;
  }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const { workOrders } = await this.listWorkOrders(tenantSlug, { limit: 100 }, true);

    const statusMap = new Map<string, number>();
    const catMap = new Map<string, { count: number; costPoisha: bigint }>();
    const staffMap = new Map<string, { name: string; open: number; completed: number }>();
    const overdueList: any[] = [];
    const now = new Date();

    for (const wo of workOrders) {
      // Status
      statusMap.set(wo.status, (statusMap.get(wo.status) || 0) + 1);

      // Category
      const curCat = catMap.get(wo.category) || { count: 0, costPoisha: BigInt(0) };
      curCat.count++;
      curCat.costPoisha += BigInt(wo.actualCostPoisha);
      catMap.set(wo.category, curCat);

      // Staff Workload
      if (wo.assignedUserId) {
        const staff = staffMap.get(wo.assignedUserId) || {
          name: wo.assignedUserName || 'Staff Member',
          open: 0,
          completed: 0,
        };
        if (wo.status === 'COMPLETED' || wo.status === 'VERIFIED') {
          staff.completed++;
        } else {
          staff.open++;
        }
        staffMap.set(wo.assignedUserId, staff);
      }

      // Overdue
      if (wo.dueDate && new Date(wo.dueDate).getTime() < now.getTime() && wo.status !== 'COMPLETED' && wo.status !== 'VERIFIED') {
        const diffMs = now.getTime() - new Date(wo.dueDate).getTime();
        const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        overdueList.push({
          id: wo.id,
          referenceNumber: wo.referenceNumber,
          title: wo.title,
          dueDate: wo.dueDate,
          daysOverdue,
        });
      }
    }

    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    const categoryDistribution = Array.from(catMap.entries()).map(([category, d]) => ({
      category,
      count: d.count,
      costPoisha: d.costPoisha.toString(),
      formattedCost: formatBdtCurrency(d.costPoisha),
    }));

    const staffWorkload = Array.from(staffMap.entries()).map(([staffId, d]) => ({
      staffId,
      staffName: d.name,
      openOrders: d.open,
      completedOrders: d.completed,
    }));

    return {
      statusDistribution,
      categoryDistribution,
      staffWorkload,
      overdueAnalysis: overdueList,
    };
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATION TRIGGER HELPER
  // ---------------------------------------------------------------------------

  private async notifyAssignee(tenantSlug: string, assigneeUserId: string, workOrder: any) {
    try {
      await tenantNotificationService.createNotification({
        tenantSlug,
        userId: assigneeUserId,
        category: 'MAINTENANCE',
        title: `Task Assigned: ${workOrder.title}`,
        message: `You have been assigned to Work Order ${workOrder.referenceNumber} (${workOrder.priority} priority).`,
        link: `/mess/${tenantSlug}/maintenance`,
        eventReference: `WO_ASSIGN_${workOrder.id}_${assigneeUserId}`,
      });
    } catch (err: any) {
      console.warn('[MaintenanceService] Notify assignee warning:', err?.message || err);
    }
  }
}

export const maintenanceService = new MaintenanceService();
