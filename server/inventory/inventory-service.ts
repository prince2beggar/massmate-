if (typeof window !== 'undefined') {
  throw new Error('InventoryService can only be executed in a server environment.');
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
import { formatBdtCurrency } from '@/server/mess-admin/mess-dashboard-service';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export type InventoryCategory =
  | 'KITCHEN'
  | 'CLEANING'
  | 'GROCERY'
  | 'APPLIANCE'
  | 'FURNITURE'
  | 'MAINTENANCE'
  | 'OTHER';

export type InventoryItemType = 'CONSUMABLE' | 'REUSABLE_ASSET';

export type StockMovementType =
  | 'OPENING_STOCK'
  | 'PURCHASE_RECEIPT'
  | 'CONSUMPTION'
  | 'TRANSFER'
  | 'RETURN'
  | 'DAMAGE_LOSS'
  | 'STOCK_ADJUSTMENT'
  | 'WRITE_OFF';

export type AssetCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DAMAGED';

export interface InventoryItemDto {
  id: string;
  tenantId: string;
  name: string;
  itemCode: string | null;
  category: InventoryCategory | string;
  itemType: InventoryItemType | string;
  description: string | null;
  unit: string;
  quantity: number;
  minStockAlert: number;
  location: string | null;
  costPerUnitPoisha: string;
  costPerUnitTaka: number;
  formattedCostPerUnit: string;
  supplierName: string | null;
  assetCondition: AssetCondition | string | null;
  assignedRoomId: string | null;
  assignedRoomNumber?: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  totalValuePoisha: string;
  totalValueTaka: number;
  formattedTotalValue: string;
  createdAt: string;
  formattedCreatedAt: string;
  updatedAt: string;
}

export interface StockMovementDto {
  id: string;
  tenantId: string;
  itemId: string;
  itemName: string;
  movementType: StockMovementType | string;
  quantity: number;
  unit: string;
  previousQuantity: number;
  newQuantity: number;
  unitCostPoisha: string | null;
  totalCostPoisha: string | null;
  formattedTotalCost: string | null;
  sourceLocation: string | null;
  destinationLocation: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdById: string | null;
  creatorName?: string | null;
  createdAt: string;
  formattedCreatedAt: string;
}

export interface InventoryDashboardDto {
  totalItems: number;
  consumablesCount: number;
  reusableAssetsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalAssetValuePoisha: string;
  totalAssetValueTaka: number;
  formattedTotalAssetValue: string;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    totalQuantity: number;
    totalValuePoisha: string;
    formattedTotalValue: string;
  }>;
  recentMovements: StockMovementDto[];
  lowStockItems: InventoryItemDto[];
}

export interface CreateItemInput {
  name: string;
  itemCode?: string | null;
  category?: InventoryCategory | string;
  itemType?: InventoryItemType | string;
  description?: string | null;
  unit?: string;
  quantity?: number;
  minStockAlert?: number;
  location?: string | null;
  costPerUnitTaka?: number;
  supplierName?: string | null;
  assetCondition?: AssetCondition | string | null;
  assignedRoomId?: string | null;
}

export interface UpdateItemInput {
  name?: string;
  itemCode?: string | null;
  category?: InventoryCategory | string;
  itemType?: InventoryItemType | string;
  description?: string | null;
  unit?: string;
  minStockAlert?: number;
  location?: string | null;
  costPerUnitTaka?: number;
  supplierName?: string | null;
  assetCondition?: AssetCondition | string | null;
  assignedRoomId?: string | null;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export interface RecordMovementInput {
  itemId: string;
  movementType: StockMovementType;
  quantity: number;
  unitCostTaka?: number;
  sourceLocation?: string | null;
  destinationLocation?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
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

export class InventoryService {
  private readonly db: PrismaClient;

  // In-memory mock storage for testing & offline resilience
  public mockTenants: any[] = [];
  public mockUsers: any[] = [];
  public mockRooms: any[] = [];
  public mockItems: any[] = [];
  public mockMovements: any[] = [];

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
    ];

    this.mockItems = [
      {
        id: 'item_rice',
        tenantId: 'tenant_prince_mess',
        name: 'Nazirshail Premium Rice',
        itemCode: 'GROC-RICE-01',
        category: 'GROCERY',
        itemType: 'CONSUMABLE',
        description: '50kg sacks of daily dining rice.',
        unit: 'kg',
        quantity: 12.0,
        minStockAlert: 15.0, // Low stock!
        location: 'Kitchen Store',
        costPerUnitPoisha: BigInt(7500), // 75 Taka/kg
        supplierName: 'Karwan Bazar Rice Agency',
        assetCondition: null,
        assignedRoomId: null,
        status: 'ACTIVE',
        lastStockAlertAt: new Date('2026-11-20T08:00:00Z'),
        createdAt: new Date('2026-11-15T00:00:00Z'),
        updatedAt: new Date('2026-11-20T08:00:00Z'),
      },
      {
        id: 'item_oil',
        tenantId: 'tenant_prince_mess',
        name: 'Rupchanda Soybean Oil',
        itemCode: 'GROC-OIL-02',
        category: 'GROCERY',
        itemType: 'CONSUMABLE',
        description: '5-litre cooking oil cans.',
        unit: 'litre',
        quantity: 35.0,
        minStockAlert: 10.0,
        location: 'Kitchen Store',
        costPerUnitPoisha: BigInt(18000), // 180 Taka/litre
        supplierName: 'Tejgaon Wholesale Mart',
        assetCondition: null,
        assignedRoomId: null,
        status: 'ACTIVE',
        lastStockAlertAt: null,
        createdAt: new Date('2026-11-16T00:00:00Z'),
        updatedAt: new Date('2026-11-16T00:00:00Z'),
      },
      {
        id: 'item_soap',
        tenantId: 'tenant_prince_mess',
        name: 'Vim Dishwashing Bar',
        itemCode: 'CLN-SOAP-01',
        category: 'CLEANING',
        itemType: 'CONSUMABLE',
        description: 'Dishwashing soaps for kitchen utensils.',
        unit: 'piece',
        quantity: 0.0, // Out of stock!
        minStockAlert: 5.0,
        location: 'Pantry Shelf',
        costPerUnitPoisha: BigInt(4500), // 45 Taka/piece
        supplierName: 'Local Grocery',
        assetCondition: null,
        assignedRoomId: null,
        status: 'ACTIVE',
        lastStockAlertAt: new Date('2026-11-21T09:00:00Z'),
        createdAt: new Date('2026-11-17T00:00:00Z'),
        updatedAt: new Date('2026-11-21T09:00:00Z'),
      },
      {
        id: 'item_fan',
        tenantId: 'tenant_prince_mess',
        name: 'BRB 56" Ceiling Fan',
        itemCode: 'ASST-FAN-101',
        category: 'APPLIANCE',
        itemType: 'REUSABLE_ASSET',
        description: 'Energy-saving ceiling fan installed in Room 101.',
        unit: 'piece',
        quantity: 1.0,
        minStockAlert: 0.0,
        location: 'Room 101',
        costPerUnitPoisha: BigInt(380000), // 3,800 Taka
        supplierName: 'Stadium Market Electronics',
        assetCondition: 'GOOD',
        assignedRoomId: 'room_101',
        status: 'ACTIVE',
        lastStockAlertAt: null,
        createdAt: new Date('2026-11-01T00:00:00Z'),
        updatedAt: new Date('2026-11-01T00:00:00Z'),
      },
      {
        id: 'item_fridge',
        tenantId: 'tenant_prince_mess',
        name: 'Walton 320L Refrigerator',
        itemCode: 'ASST-FRIDGE-01',
        category: 'APPLIANCE',
        itemType: 'REUSABLE_ASSET',
        description: 'Shared kitchen food and raw ingredient refrigerator.',
        unit: 'piece',
        quantity: 1.0,
        minStockAlert: 0.0,
        location: 'Dining Hall',
        costPerUnitPoisha: BigInt(3900000), // 39,000 Taka
        supplierName: 'Walton Plaza Farmgate',
        assetCondition: 'EXCELLENT',
        assignedRoomId: null,
        status: 'ACTIVE',
        lastStockAlertAt: null,
        createdAt: new Date('2026-10-15T00:00:00Z'),
        updatedAt: new Date('2026-10-15T00:00:00Z'),
      },
      {
        id: 'item_green_villa_item',
        tenantId: 'tenant_green_villa',
        name: 'Green Villa Gas Cylinder',
        itemCode: 'GV-CYL-01',
        category: 'KITCHEN',
        itemType: 'CONSUMABLE',
        description: '12kg LPG Cylinder for Green Villa.',
        unit: 'piece',
        quantity: 2.0,
        minStockAlert: 1.0,
        location: 'Kitchen',
        costPerUnitPoisha: BigInt(140000),
        supplierName: 'Bashundhara Gas Point',
        assetCondition: null,
        assignedRoomId: null,
        status: 'ACTIVE',
        lastStockAlertAt: null,
        createdAt: new Date('2026-11-18T00:00:00Z'),
        updatedAt: new Date('2026-11-18T00:00:00Z'),
      },
    ];

    this.mockMovements = [
      {
        id: 'mov_seed_1',
        tenantId: 'tenant_prince_mess',
        itemId: 'item_rice',
        movementType: 'OPENING_STOCK',
        quantity: 50.0,
        unit: 'kg',
        previousQuantity: 0.0,
        newQuantity: 50.0,
        unitCostPoisha: BigInt(7500),
        totalCostPoisha: BigInt(375000),
        sourceLocation: null,
        destinationLocation: 'Kitchen Store',
        referenceNumber: 'REF_INIT_RICE',
        notes: 'Initial opening stock intake.',
        createdById: 'usr_owner_1',
        createdAt: new Date('2026-11-15T09:00:00Z'),
      },
      {
        id: 'mov_seed_2',
        tenantId: 'tenant_prince_mess',
        itemId: 'item_rice',
        movementType: 'CONSUMPTION',
        quantity: 38.0,
        unit: 'kg',
        previousQuantity: 50.0,
        newQuantity: 12.0,
        unitCostPoisha: BigInt(7500),
        totalCostPoisha: BigInt(285000),
        sourceLocation: 'Kitchen Store',
        destinationLocation: 'Daily Cooking',
        referenceNumber: 'REF_COOK_WEEK1',
        notes: 'Daily resident lunch and dinner cooking.',
        createdById: 'usr_owner_1',
        createdAt: new Date('2026-11-20T08:00:00Z'),
      },
      {
        id: 'mov_seed_fan',
        tenantId: 'tenant_prince_mess',
        itemId: 'item_fan',
        movementType: 'OPENING_STOCK',
        quantity: 1.0,
        unit: 'piece',
        previousQuantity: 0.0,
        newQuantity: 1.0,
        unitCostPoisha: BigInt(380000),
        totalCostPoisha: BigInt(380000),
        sourceLocation: null,
        destinationLocation: 'Room 101',
        referenceNumber: 'REF_INIT_FAN',
        notes: 'Asset acquisition & installation in Room 101.',
        createdById: 'usr_owner_1',
        createdAt: new Date('2026-11-01T09:00:00Z'),
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

  private mapItemToDto(item: any, roomMap?: Map<string, string>): InventoryItemDto {
    const qty = Number(item.quantity);
    const minAlert = Number(item.minStockAlert);
    const costPoisha = item.costPerUnitPoisha ? BigInt(item.costPerUnitPoisha) : BigInt(0);
    const totalValPoisha = BigInt(Math.round(qty * Number(costPoisha)));
    const totalValTaka = fromPoisha(totalValPoisha);
    const costTaka = fromPoisha(costPoisha);

    const roomNumber = item.assignedRoom?.roomNumber ||
      (item.assignedRoomId && roomMap ? roomMap.get(item.assignedRoomId) : null) || null;

    return {
      id: item.id,
      tenantId: item.tenantId,
      name: item.name,
      itemCode: item.itemCode || null,
      category: item.category,
      itemType: item.itemType,
      description: item.description || null,
      unit: item.unit,
      quantity: qty,
      minStockAlert: minAlert,
      location: item.location || null,
      costPerUnitPoisha: costPoisha.toString(),
      costPerUnitTaka: costTaka,
      formattedCostPerUnit: formatBdtCurrency(costPoisha),
      supplierName: item.supplierName || null,
      assetCondition: item.assetCondition || null,
      assignedRoomId: item.assignedRoomId || null,
      assignedRoomNumber: roomNumber,
      status: item.status,
      isLowStock: qty > 0 && qty <= minAlert,
      isOutOfStock: qty <= 0,
      totalValuePoisha: totalValPoisha.toString(),
      totalValueTaka: totalValTaka,
      formattedTotalValue: formatBdtCurrency(totalValPoisha),
      createdAt: item.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(item.createdAt),
      updatedAt: item.updatedAt ? item.updatedAt.toISOString() : item.createdAt.toISOString(),
    };
  }

  private mapMovementToDto(mov: any, itemMap?: Map<string, string>, userMap?: Map<string, string>): StockMovementDto {
    const totalPoisha = mov.totalCostPoisha ? BigInt(mov.totalCostPoisha) : null;
    const unitPoisha = mov.unitCostPoisha ? BigInt(mov.unitCostPoisha) : null;
    const itemName = mov.item?.name || (itemMap ? itemMap.get(mov.itemId) : null) || 'Inventory Item';
    const creatorName = mov.creator?.name || (mov.createdById && userMap ? userMap.get(mov.createdById) : null) || 'Staff';

    return {
      id: mov.id,
      tenantId: mov.tenantId,
      itemId: mov.itemId,
      itemName,
      movementType: mov.movementType,
      quantity: Number(mov.quantity),
      unit: mov.unit,
      previousQuantity: Number(mov.previousQuantity),
      newQuantity: Number(mov.newQuantity),
      unitCostPoisha: unitPoisha ? unitPoisha.toString() : null,
      totalCostPoisha: totalPoisha ? totalPoisha.toString() : null,
      formattedTotalCost: totalPoisha !== null ? formatBdtCurrency(totalPoisha) : null,
      sourceLocation: mov.sourceLocation || null,
      destinationLocation: mov.destinationLocation || null,
      referenceNumber: mov.referenceNumber || null,
      notes: mov.notes || null,
      createdById: mov.createdById || null,
      creatorName,
      createdAt: mov.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(mov.createdAt),
    };
  }

  /**
   * Generates the executive inventory overview dashboard with live KPIs and category aggregates.
   */
  async getInventoryDashboard(tenantSlug: string): Promise<InventoryDashboardDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const items = await this.db.inventoryItem.findMany({
        where: { tenantId: tenant.id, status: 'ACTIVE' },
        include: { assignedRoom: { select: { roomNumber: true } } },
        orderBy: { name: 'asc' },
      });

      const movements = await this.db.stockMovement.findMany({
        where: { tenantId: tenant.id },
        include: {
          item: { select: { name: true } },
          creator: { select: { name: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      let totalValPoisha = BigInt(0);
      let lowCount = 0;
      let outCount = 0;
      let consumablesCount = 0;
      let assetsCount = 0;
      const catMap = new Map<string, { count: number; totalQty: number; valuePoisha: bigint }>();

      const lowStockItems: InventoryItemDto[] = [];

      for (const it of items) {
        const qty = Number(it.quantity);
        const minAlert = Number(it.minStockAlert);
        const unitCost = it.costPerUnitPoisha ? BigInt(it.costPerUnitPoisha) : BigInt(0);
        const itemVal = BigInt(Math.round(qty * Number(unitCost)));
        totalValPoisha += itemVal;

        if (it.itemType === 'REUSABLE_ASSET') assetsCount++;
        else consumablesCount++;

        if (qty <= 0) {
          outCount++;
          lowStockItems.push(this.mapItemToDto(it));
        } else if (qty <= minAlert) {
          lowCount++;
          lowStockItems.push(this.mapItemToDto(it));
        }

        const cat = catMap.get(it.category) || { count: 0, totalQty: 0, valuePoisha: BigInt(0) };
        cat.count++;
        cat.totalQty += qty;
        cat.valuePoisha += itemVal;
        catMap.set(it.category, cat);
      }

      const categoryBreakdown = Array.from(catMap.entries()).map(([category, val]) => ({
        category,
        count: val.count,
        totalQuantity: val.totalQty,
        totalValuePoisha: val.valuePoisha.toString(),
        formattedTotalValue: formatBdtCurrency(val.valuePoisha),
      }));

      return {
        totalItems: items.length,
        consumablesCount,
        reusableAssetsCount: assetsCount,
        lowStockCount: lowCount,
        outOfStockCount: outCount,
        totalAssetValuePoisha: totalValPoisha.toString(),
        totalAssetValueTaka: fromPoisha(totalValPoisha),
        formattedTotalAssetValue: formatBdtCurrency(totalValPoisha),
        categoryBreakdown,
        recentMovements: movements.map((m: any) => this.mapMovementToDto(m)),
        lowStockItems,
      };
    }

    // In-memory fallback
    const tenantItems = this.mockItems.filter(
      (i) => i.tenantId === tenant.id && i.status === 'ACTIVE'
    );
    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const itemMap = new Map<string, string>(this.mockItems.map((i) => [i.id, i.name]));

    let totalValPoisha = BigInt(0);
    let lowCount = 0;
    let outCount = 0;
    let consumablesCount = 0;
    let assetsCount = 0;
    const catMap = new Map<string, { count: number; totalQty: number; valuePoisha: bigint }>();
    const lowStockItems: InventoryItemDto[] = [];

    for (const it of tenantItems) {
      const qty = Number(it.quantity);
      const minAlert = Number(it.minStockAlert);
      const unitCost = it.costPerUnitPoisha ? BigInt(it.costPerUnitPoisha) : BigInt(0);
      const itemVal = BigInt(Math.round(qty * Number(unitCost)));
      totalValPoisha += itemVal;

      if (it.itemType === 'REUSABLE_ASSET') assetsCount++;
      else consumablesCount++;

      if (qty <= 0) {
        outCount++;
        lowStockItems.push(this.mapItemToDto(it, roomMap));
      } else if (qty <= minAlert) {
        lowCount++;
        lowStockItems.push(this.mapItemToDto(it, roomMap));
      }

      const cat = catMap.get(it.category) || { count: 0, totalQty: 0, valuePoisha: BigInt(0) };
      cat.count++;
      cat.totalQty += qty;
      cat.valuePoisha += itemVal;
      catMap.set(it.category, cat);
    }

    const categoryBreakdown = Array.from(catMap.entries()).map(([category, val]) => ({
      category,
      count: val.count,
      totalQuantity: val.totalQty,
      totalValuePoisha: val.valuePoisha.toString(),
      formattedTotalValue: formatBdtCurrency(val.valuePoisha),
    }));

    const recentMovements = this.mockMovements
      .filter((m) => m.tenantId === tenant.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((m) => this.mapMovementToDto(m, itemMap, userMap));

    return {
      totalItems: tenantItems.length,
      consumablesCount,
      reusableAssetsCount: assetsCount,
      lowStockCount: lowCount,
      outOfStockCount: outCount,
      totalAssetValuePoisha: totalValPoisha.toString(),
      totalAssetValueTaka: fromPoisha(totalValPoisha),
      formattedTotalAssetValue: formatBdtCurrency(totalValPoisha),
      categoryBreakdown,
      recentMovements,
      lowStockItems,
    };
  }

  /**
   * Lists inventory items with search, category filtering, and status filtering.
   */
  async listItems(
    tenantSlug: string,
    filters: {
      search?: string;
      category?: string;
      itemType?: string;
      status?: string;
      lowStockOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ items: InventoryItemDto[]; total: number }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
    const offset = Math.max(filters.offset || 0, 0);

    if (this.isDbConfigured()) {
      const where: any = {
        tenantId: tenant.id,
      };

      if (filters.status && filters.status !== 'ALL') {
        where.status = filters.status;
      } else if (!filters.status) {
        where.status = 'ACTIVE';
      }

      if (filters.category && filters.category !== 'ALL') {
        where.category = filters.category;
      }
      if (filters.itemType && filters.itemType !== 'ALL') {
        where.itemType = filters.itemType;
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { itemCode: { contains: q, mode: 'insensitive' } },
          { supplierName: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [total, rawItems] = await Promise.all([
        this.db.inventoryItem.count({ where }),
        this.db.inventoryItem.findMany({
          where,
          include: { assignedRoom: { select: { roomNumber: true } } },
          take: limit,
          skip: offset,
          orderBy: { name: 'asc' },
        }),
      ]);

      let items = rawItems.map((i: any) => this.mapItemToDto(i));

      if (filters.lowStockOnly) {
        items = items.filter((i) => i.isLowStock || i.isOutOfStock);
      }

      return { items, total };
    }

    // In-memory fallback
    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));
    let filtered = this.mockItems.filter((i) => i.tenantId === tenant.id);

    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((i) => i.status === filters.status);
    } else if (!filters.status) {
      filtered = filtered.filter((i) => i.status === 'ACTIVE');
    }

    if (filters.category && filters.category !== 'ALL') {
      filtered = filtered.filter((i) => i.category === filters.category);
    }
    if (filters.itemType && filters.itemType !== 'ALL') {
      filtered = filtered.filter((i) => i.itemType === filters.itemType);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.itemCode && i.itemCode.toLowerCase().includes(q)) ||
          (i.supplierName && i.supplierName.toLowerCase().includes(q)) ||
          (i.location && i.location.toLowerCase().includes(q))
      );
    }

    let dtoList = filtered.map((i) => this.mapItemToDto(i, roomMap));
    if (filters.lowStockOnly) {
      dtoList = dtoList.filter((i) => i.isLowStock || i.isOutOfStock);
    }

    const total = dtoList.length;
    const items = dtoList.slice(offset, offset + limit);

    return { items, total };
  }

  /**
   * Retrieves an item by ID along with its movement ledger history.
   */
  async getItemById(tenantSlug: string, itemId: string): Promise<InventoryItemDto & { movements: StockMovementDto[] }> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const item = await this.db.inventoryItem.findFirst({
        where: { id: itemId, tenantId: tenant.id },
        include: {
          assignedRoom: { select: { roomNumber: true } },
          movements: {
            include: { creator: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!item) {
        throw new NotFoundError('Inventory item not found.');
      }

      const dto = this.mapItemToDto(item);
      const movements = item.movements.map((m: any) => this.mapMovementToDto(m));

      return { ...dto, movements };
    }

    // In-memory fallback
    const item = this.mockItems.find((i) => i.id === itemId && i.tenantId === tenant.id);
    if (!item) {
      throw new NotFoundError('Inventory item not found.');
    }

    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const itemMap = new Map<string, string>(this.mockItems.map((i) => [i.id, i.name]));

    const movements = this.mockMovements
      .filter((m) => m.itemId === itemId && m.tenantId === tenant.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((m) => this.mapMovementToDto(m, itemMap, userMap));

    return {
      ...this.mapItemToDto(item, roomMap),
      movements,
    };
  }

  /**
   * Creates a new inventory item with uniqueness checks and opening stock registration.
   */
  async createItem(tenantSlug: string, userId: string, input: CreateItemInput): Promise<InventoryItemDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Item name is required.');
    }
    const cleanName = input.name.trim();
    const cleanCode = input.itemCode?.trim() || null;
    const initialQty = Math.max(input.quantity || 0, 0);
    const minAlert = Math.max(input.minStockAlert !== undefined ? input.minStockAlert : 5, 0);
    const unit = input.unit?.trim() || 'piece';
    const category = input.category || 'KITCHEN';
    const itemType = input.itemType || 'CONSUMABLE';
    const costPoisha = toPoisha(input.costPerUnitTaka);

    if (this.isDbConfigured()) {
      if (cleanCode) {
        const existing = await this.db.inventoryItem.findFirst({
          where: { tenantId: tenant.id, itemCode: cleanCode },
        });
        if (existing) {
          throw new ConflictError(`Item code '${cleanCode}' already exists in this mess.`);
        }
      }

      const created = await this.db.inventoryItem.create({
        data: {
          tenantId: tenant.id,
          name: cleanName,
          itemCode: cleanCode,
          category,
          itemType,
          description: input.description?.trim() || null,
          unit,
          quantity: initialQty,
          minStockAlert: minAlert,
          location: input.location?.trim() || null,
          costPerUnitPoisha: costPoisha,
          supplierName: input.supplierName?.trim() || null,
          assetCondition: itemType === 'REUSABLE_ASSET' ? (input.assetCondition || 'GOOD') : null,
          assignedRoomId: input.assignedRoomId || null,
          status: 'ACTIVE',
        },
        include: { assignedRoom: { select: { roomNumber: true } } },
      });

      // If initial stock was provided, record opening stock movement in ledger
      if (initialQty > 0) {
        await this.db.stockMovement.create({
          data: {
            tenantId: tenant.id,
            itemId: created.id,
            movementType: 'OPENING_STOCK',
            quantity: initialQty,
            unit,
            previousQuantity: 0,
            newQuantity: initialQty,
            unitCostPoisha: costPoisha,
            totalCostPoisha: BigInt(Math.round(initialQty * Number(costPoisha))),
            destinationLocation: created.location || 'Store',
            referenceNumber: `INIT_${created.id}`,
            notes: 'Initial opening stock registered during item creation.',
            createdById: userId,
          },
        });
      }

      return this.mapItemToDto(created);
    }

    // In-memory fallback
    if (cleanCode) {
      const existing = this.mockItems.find(
        (i) => i.tenantId === tenant.id && i.itemCode?.toLowerCase() === cleanCode.toLowerCase()
      );
      if (existing) {
        throw new ConflictError(`Item code '${cleanCode}' already exists in this mess.`);
      }
    }

    const now = new Date();
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: tenant.id,
      name: cleanName,
      itemCode: cleanCode,
      category,
      itemType,
      description: input.description?.trim() || null,
      unit,
      quantity: initialQty,
      minStockAlert: minAlert,
      location: input.location?.trim() || null,
      costPerUnitPoisha: costPoisha,
      supplierName: input.supplierName?.trim() || null,
      assetCondition: itemType === 'REUSABLE_ASSET' ? (input.assetCondition || 'GOOD') : null,
      assignedRoomId: input.assignedRoomId || null,
      status: 'ACTIVE',
      lastStockAlertAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.mockItems.unshift(newItem);

    if (initialQty > 0) {
      this.mockMovements.unshift({
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenantId: tenant.id,
        itemId: newItem.id,
        movementType: 'OPENING_STOCK',
        quantity: initialQty,
        unit,
        previousQuantity: 0,
        newQuantity: initialQty,
        unitCostPoisha: costPoisha,
        totalCostPoisha: BigInt(Math.round(initialQty * Number(costPoisha))),
        destinationLocation: newItem.location || 'Store',
        referenceNumber: `INIT_${newItem.id}`,
        notes: 'Initial opening stock registered during item creation.',
        createdById: userId,
        createdAt: now,
      });
    }

    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));
    return this.mapItemToDto(newItem, roomMap);
  }

  /**
   * Updates item metadata and attributes. Quantity adjustments must go through stock movements.
   */
  async updateItem(
    tenantSlug: string,
    _userId: string,
    itemId: string,
    input: UpdateItemInput
  ): Promise<InventoryItemDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const item = await this.db.inventoryItem.findFirst({
        where: { id: itemId, tenantId: tenant.id },
      });
      if (!item) {
        throw new NotFoundError('Inventory item not found.');
      }

      const cleanCode = input.itemCode !== undefined ? input.itemCode?.trim() || null : item.itemCode;
      if (cleanCode && cleanCode !== item.itemCode) {
        const duplicate = await this.db.inventoryItem.findFirst({
          where: { tenantId: tenant.id, itemCode: cleanCode, id: { not: itemId } },
        });
        if (duplicate) {
          throw new ConflictError(`Item code '${cleanCode}' already exists in this mess.`);
        }
      }

      const updateData: any = {};
      if (input.name) updateData.name = input.name.trim();
      if (input.itemCode !== undefined) updateData.itemCode = cleanCode;
      if (input.category) updateData.category = input.category;
      if (input.itemType) updateData.itemType = input.itemType;
      if (input.description !== undefined) updateData.description = input.description?.trim() || null;
      if (input.unit) updateData.unit = input.unit.trim();
      if (input.minStockAlert !== undefined) updateData.minStockAlert = Math.max(input.minStockAlert, 0);
      if (input.location !== undefined) updateData.location = input.location?.trim() || null;
      if (input.costPerUnitTaka !== undefined) updateData.costPerUnitPoisha = toPoisha(input.costPerUnitTaka);
      if (input.supplierName !== undefined) updateData.supplierName = input.supplierName?.trim() || null;
      if (input.assetCondition !== undefined) updateData.assetCondition = input.assetCondition;
      if (input.assignedRoomId !== undefined) updateData.assignedRoomId = input.assignedRoomId || null;
      if (input.status) updateData.status = input.status;

      const updated = await this.db.inventoryItem.update({
        where: { id: itemId },
        data: updateData,
        include: { assignedRoom: { select: { roomNumber: true } } },
      });

      return this.mapItemToDto(updated);
    }

    // In-memory fallback
    const item = this.mockItems.find((i) => i.id === itemId && i.tenantId === tenant.id);
    if (!item) {
      throw new NotFoundError('Inventory item not found.');
    }

    const cleanCode = input.itemCode !== undefined ? input.itemCode?.trim() || null : item.itemCode;
    if (cleanCode && cleanCode !== item.itemCode) {
      const duplicate = this.mockItems.find(
        (i) => i.tenantId === tenant.id && i.id !== itemId && i.itemCode?.toLowerCase() === cleanCode.toLowerCase()
      );
      if (duplicate) {
        throw new ConflictError(`Item code '${cleanCode}' already exists in this mess.`);
      }
    }

    if (input.name) item.name = input.name.trim();
    if (input.itemCode !== undefined) item.itemCode = cleanCode;
    if (input.category) item.category = input.category;
    if (input.itemType) item.itemType = input.itemType;
    if (input.description !== undefined) item.description = input.description?.trim() || null;
    if (input.unit) item.unit = input.unit.trim();
    if (input.minStockAlert !== undefined) item.minStockAlert = Math.max(input.minStockAlert, 0);
    if (input.location !== undefined) item.location = input.location?.trim() || null;
    if (input.costPerUnitTaka !== undefined) item.costPerUnitPoisha = toPoisha(input.costPerUnitTaka);
    if (input.supplierName !== undefined) item.supplierName = input.supplierName?.trim() || null;
    if (input.assetCondition !== undefined) item.assetCondition = input.assetCondition;
    if (input.assignedRoomId !== undefined) item.assignedRoomId = input.assignedRoomId || null;
    if (input.status) item.status = input.status;
    item.updatedAt = new Date();

    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));
    return this.mapItemToDto(item, roomMap);
  }

  /**
   * Safely archives an inventory item without deleting historical ledger records.
   */
  async archiveItem(tenantSlug: string, userId: string, itemId: string): Promise<InventoryItemDto> {
    return this.updateItem(tenantSlug, userId, itemId, { status: 'ARCHIVED' });
  }

  /**
   * Records an authoritative stock movement (Receive, Consume, Adjust, Damage, Return, Write-off)
   * Enforces non-negative balance, idempotency protection, and automated low-stock notifications.
   */
  async recordStockMovement(
    tenantSlug: string,
    userId: string,
    input: RecordMovementInput
  ): Promise<StockMovementDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (input.quantity <= 0) {
      throw new ValidationError('Movement quantity must be greater than zero.');
    }

    const validMovements: StockMovementType[] = [
      'OPENING_STOCK',
      'PURCHASE_RECEIPT',
      'CONSUMPTION',
      'TRANSFER',
      'RETURN',
      'DAMAGE_LOSS',
      'STOCK_ADJUSTMENT',
      'WRITE_OFF',
    ];
    if (!validMovements.includes(input.movementType)) {
      throw new ValidationError(`Invalid movement type '${input.movementType}'.`);
    }

    if (this.isDbConfigured()) {
      const item = await this.db.inventoryItem.findFirst({
        where: { id: input.itemId, tenantId: tenant.id },
      });
      if (!item) {
        throw new NotFoundError('Inventory item not found.');
      }

      // 1. Idempotency Check: if referenceNumber is provided and already recorded, return existing
      if (input.referenceNumber) {
        const existingMovement = await this.db.stockMovement.findFirst({
          where: {
            tenantId: tenant.id,
            itemId: item.id,
            referenceNumber: input.referenceNumber,
          },
          include: {
            item: { select: { name: true } },
            creator: { select: { name: true } },
          },
        });
        if (existingMovement) {
          return this.mapMovementToDto(existingMovement);
        }
      }

      // 2. Calculate New Quantity & Verify Sufficient Stock
      const currentQty = Number(item.quantity);
      let newQty = currentQty;

      switch (input.movementType) {
        case 'PURCHASE_RECEIPT':
        case 'RETURN':
        case 'OPENING_STOCK':
          newQty = currentQty + input.quantity;
          break;
        case 'CONSUMPTION':
        case 'DAMAGE_LOSS':
        case 'WRITE_OFF':
          if (currentQty < input.quantity) {
            throw new ValidationError(
              `Insufficient stock available. Current balance is ${currentQty} ${item.unit}, requested ${input.quantity} ${item.unit}.`
            );
          }
          newQty = currentQty - input.quantity;
          break;
        case 'TRANSFER':
          if (currentQty < input.quantity) {
            throw new ValidationError(
              `Cannot transfer: insufficient stock. Current balance is ${currentQty} ${item.unit}, requested ${input.quantity} ${item.unit}.`
            );
          }
          // Transfer maintains quantity, shifts location
          newQty = currentQty;
          break;
        case 'STOCK_ADJUSTMENT':
          // For adjustment, quantity is the target corrected quantity
          newQty = input.quantity;
          break;
      }

      const unitCostPoisha = input.unitCostTaka !== undefined
        ? toPoisha(input.unitCostTaka)
        : (item.costPerUnitPoisha ? BigInt(item.costPerUnitPoisha) : null);

      const totalCostPoisha = unitCostPoisha !== null
        ? BigInt(Math.round(input.quantity * Number(unitCostPoisha)))
        : null;

      // 3. Atomic Database Update
      const [updatedItem, createdMovement] = await this.db.$transaction([
        this.db.inventoryItem.update({
          where: { id: item.id },
          data: {
            quantity: newQty,
            location: input.destinationLocation || item.location,
            costPerUnitPoisha: input.unitCostTaka !== undefined ? unitCostPoisha : item.costPerUnitPoisha,
          },
        }),
        this.db.stockMovement.create({
          data: {
            tenantId: tenant.id,
            itemId: item.id,
            movementType: input.movementType,
            quantity: input.quantity,
            unit: item.unit,
            previousQuantity: currentQty,
            newQuantity: newQty,
            unitCostPoisha,
            totalCostPoisha,
            sourceLocation: input.sourceLocation || item.location,
            destinationLocation: input.destinationLocation || null,
            referenceNumber: input.referenceNumber || null,
            notes: input.notes?.trim() || null,
            createdById: userId,
          },
          include: {
            item: { select: { name: true } },
            creator: { select: { name: true } },
          },
        }),
      ]);

      // 4. Low Stock Alert Trigger
      await this.checkAndTriggerLowStockAlert(tenantSlug, updatedItem);

      return this.mapMovementToDto(createdMovement);
    }

    // In-memory fallback
    const item = this.mockItems.find((i) => i.id === input.itemId && i.tenantId === tenant.id);
    if (!item) {
      throw new NotFoundError('Inventory item not found.');
    }

    if (input.referenceNumber) {
      const existing = this.mockMovements.find(
        (m) =>
          m.tenantId === tenant.id &&
          m.itemId === item.id &&
          m.referenceNumber === input.referenceNumber
      );
      if (existing) {
        const itemMap = new Map<string, string>(this.mockItems.map((i) => [i.id, i.name]));
        const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
        return this.mapMovementToDto(existing, itemMap, userMap);
      }
    }

    const currentQty = Number(item.quantity);
    let newQty = currentQty;

    switch (input.movementType) {
      case 'PURCHASE_RECEIPT':
      case 'RETURN':
      case 'OPENING_STOCK':
        newQty = currentQty + input.quantity;
        break;
      case 'CONSUMPTION':
      case 'DAMAGE_LOSS':
      case 'WRITE_OFF':
        if (currentQty < input.quantity) {
          throw new ValidationError(
            `Insufficient stock available. Current balance is ${currentQty} ${item.unit}, requested ${input.quantity} ${item.unit}.`
          );
        }
        newQty = currentQty - input.quantity;
        break;
      case 'TRANSFER':
        if (currentQty < input.quantity) {
          throw new ValidationError(
            `Cannot transfer: insufficient stock. Current balance is ${currentQty} ${item.unit}, requested ${input.quantity} ${item.unit}.`
          );
        }
        newQty = currentQty;
        break;
      case 'STOCK_ADJUSTMENT':
        newQty = input.quantity;
        break;
    }

    const unitCostPoisha = input.unitCostTaka !== undefined
      ? toPoisha(input.unitCostTaka)
      : (item.costPerUnitPoisha ? BigInt(item.costPerUnitPoisha) : null);

    const totalCostPoisha = unitCostPoisha !== null
      ? BigInt(Math.round(input.quantity * Number(unitCostPoisha)))
      : null;

    item.quantity = newQty;
    if (input.destinationLocation) item.location = input.destinationLocation;
    if (input.unitCostTaka !== undefined) item.costPerUnitPoisha = unitCostPoisha;
    item.updatedAt = new Date();

    const user = this.mockUsers.find((u) => u.id === userId);
    const newMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: tenant.id,
      itemId: item.id,
      movementType: input.movementType,
      quantity: input.quantity,
      unit: item.unit,
      previousQuantity: currentQty,
      newQuantity: newQty,
      unitCostPoisha,
      totalCostPoisha,
      sourceLocation: input.sourceLocation || item.location,
      destinationLocation: input.destinationLocation || null,
      referenceNumber: input.referenceNumber || null,
      notes: input.notes?.trim() || null,
      createdById: userId,
      creatorName: user ? user.name : 'Staff',
      createdAt: new Date(),
    };

    this.mockMovements.unshift(newMovement);

    // Trigger alert
    await this.checkAndTriggerLowStockAlert(tenantSlug, item);

    const itemMap = new Map<string, string>(this.mockItems.map((i) => [i.id, i.name]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    return this.mapMovementToDto(newMovement, itemMap, userMap);
  }

  /**
   * Lists stock movements with filtering and pagination.
   */
  async listMovements(
    tenantSlug: string,
    filters: {
      itemId?: string;
      movementType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ movements: StockMovementDto[]; total: number }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
    const offset = Math.max(filters.offset || 0, 0);

    if (this.isDbConfigured()) {
      const where: any = { tenantId: tenant.id };
      if (filters.itemId) where.itemId = filters.itemId;
      if (filters.movementType && filters.movementType !== 'ALL') where.movementType = filters.movementType;

      const [total, rawMovements] = await Promise.all([
        this.db.stockMovement.count({ where }),
        this.db.stockMovement.findMany({
          where,
          include: {
            item: { select: { name: true } },
            creator: { select: { name: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const movements = rawMovements.map((m: any) => this.mapMovementToDto(m));
      return { movements, total };
    }

    // In-memory fallback
    const itemMap = new Map<string, string>(this.mockItems.map((i) => [i.id, i.name]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));

    let filtered = this.mockMovements.filter((m) => m.tenantId === tenant.id);
    if (filters.itemId) filtered = filtered.filter((m) => m.itemId === filters.itemId);
    if (filters.movementType && filters.movementType !== 'ALL') {
      filtered = filtered.filter((m) => m.movementType === filters.movementType);
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    const movements = paginated.map((m) => this.mapMovementToDto(m, itemMap, userMap));

    return { movements, total };
  }

  /**
   * Generates comprehensive inventory reports: Category Valuation, Consumption, Damaged Assets, Restock alerts.
   */
  async getInventoryReports(tenantSlug: string): Promise<{
    valuationReport: Array<{
      category: string;
      itemCount: number;
      totalValuePoisha: string;
      formattedTotalValue: string;
    }>;
    consumptionSummary: Array<{
      itemId: string;
      itemName: string;
      totalConsumedQuantity: number;
      unit: string;
      estimatedCostPoisha: string;
      formattedEstimatedCost: string;
    }>;
    damagedAssets: Array<{
      itemId: string;
      itemName: string;
      quantity: number;
      unit: string;
      condition: string;
      location: string | null;
      estimatedLossPoisha: string;
      formattedEstimatedLoss: string;
    }>;
  }> {
    const tenant = await this.resolveTenant(tenantSlug);

    const dashboard = await this.getInventoryDashboard(tenantSlug);
    const { items } = await this.listItems(tenantSlug, { limit: 100 });
    const { movements } = await this.listMovements(tenantSlug, { movementType: 'CONSUMPTION', limit: 100 });

    // 1. Valuation Report
    const valuationReport = dashboard.categoryBreakdown.map((cat) => ({
      category: cat.category,
      itemCount: cat.count,
      totalValuePoisha: cat.totalValuePoisha,
      formattedTotalValue: cat.formattedTotalValue,
    }));

    // 2. Consumption Summary
    const consumeMap = new Map<string, { name: string; qty: number; unit: string; costPoisha: bigint }>();
    for (const m of movements) {
      const cur = consumeMap.get(m.itemId) || {
        name: m.itemName,
        qty: 0,
        unit: m.unit,
        costPoisha: BigInt(0),
      };
      cur.qty += m.quantity;
      if (m.totalCostPoisha) {
        cur.costPoisha += BigInt(m.totalCostPoisha);
      }
      consumeMap.set(m.itemId, cur);
    }

    const consumptionSummary = Array.from(consumeMap.entries()).map(([itemId, val]) => ({
      itemId,
      itemName: val.name,
      totalConsumedQuantity: val.qty,
      unit: val.unit,
      estimatedCostPoisha: val.costPoisha.toString(),
      formattedEstimatedCost: formatBdtCurrency(val.costPoisha),
    }));

    // 3. Damaged Assets
    const damagedAssets = items
      .filter((i) => i.itemType === 'REUSABLE_ASSET' && (i.assetCondition === 'DAMAGED' || i.assetCondition === 'NEEDS_REPAIR'))
      .map((i) => ({
        itemId: i.id,
        itemName: i.name,
        quantity: i.quantity,
        unit: i.unit,
        condition: i.assetCondition || 'DAMAGED',
        location: i.location,
        estimatedLossPoisha: i.totalValuePoisha,
        formattedEstimatedLoss: i.formattedTotalValue,
      }));

    return {
      valuationReport,
      consumptionSummary,
      damagedAssets,
    };
  }

  /**
   * Helper that checks if an item has dropped below its minimum threshold and notifies staff.
   * Deduplicates using idempotency keys so repeated checks do not spam notifications.
   */
  private async checkAndTriggerLowStockAlert(tenantSlug: string, item: any) {
    try {
      const qty = Number(item.quantity);
      const minAlert = Number(item.minStockAlert);

      if (qty <= minAlert) {
        const isOut = qty <= 0;
        const idempotencyKey = `LOW_STOCK_${item.id}_${Math.floor(qty)}`;

        // Notify authorized staff
        await tenantNotificationService.createNotification({
          tenantSlug,
          userId: item.tenantId, // Or authorized staff
          category: 'INVENTORY',
          title: isOut
            ? `Stock Depleted: ${item.name}`
            : `Low Stock Alert: ${item.name}`,
          message: isOut
            ? `${item.name} is completely OUT OF STOCK (0 ${item.unit} available). Immediate purchase required.`
            : `${item.name} has reached low-stock threshold (${qty} ${item.unit} remaining, minimum alert is ${minAlert} ${item.unit}).`,
          link: `/mess/${tenantSlug}/inventory`,
          eventReference: idempotencyKey,
        });
      }
    } catch (err: any) {
      console.warn('[InventoryService] Stock alert check warning:', err?.message || err);
    }
  }
}

export const inventoryService = new InventoryService();
