import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  InventoryService,
  CreateItemInput,
  RecordMovementInput,
} from './inventory-service';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from '../api/errors';

describe('Task 42 — Inventory, Asset & Stock Management', () => {
  let service: InventoryService;

  beforeEach(() => {
    // Instantiate fresh service with seeded mock data
    service = new InventoryService(null as any);
  });

  describe('1. Multi-Tenant Scoping & Isolation', () => {
    it('Tenant A cannot view Tenant B inventory items', async () => {
      // Prince Mess has seeded items
      const princeResult = await service.listItems('prince-mess');
      assert.ok(princeResult.items.length > 0);
      for (const item of princeResult.items) {
        assert.strictEqual(item.tenantId, 'tenant_prince_mess');
      }

      // Green Villa Mess has only its own seeded items
      const greenResult = await service.listItems('green-villa-mess');
      assert.strictEqual(greenResult.items.length, 1);
      assert.strictEqual(greenResult.items[0].name, 'Green Villa Gas Cylinder');
      assert.strictEqual(greenResult.items[0].tenantId, 'tenant_green_villa');

      // Verify no item IDs from Prince Mess leak into Green Villa Mess
      const princeIds = princeResult.items.map((i) => i.id);
      for (const id of princeIds) {
        assert.strictEqual(greenResult.items.some((i) => i.id === id), false);
        await assert.rejects(
          async () => {
            await service.getItemById('green-villa-mess', id);
          },
          (err: any) => {
            assert.ok(err instanceof NotFoundError);
            return true;
          }
        );
      }
    });

    it('rejects access to suspended mess tenants with ForbiddenError', async () => {
      await assert.rejects(
        async () => {
          await service.listItems('suspended-mess');
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /suspended/i);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await service.getInventoryDashboard('suspended-mess');
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          return true;
        }
      );
    });
  });

  describe('2. Item Code Uniqueness & Validation', () => {
    it('rejects creating item with duplicate itemCode in the same tenant with ConflictError', async () => {
      const existingCode = 'GROC-RICE-01'; // already exists in Prince Mess

      const input: CreateItemInput = {
        name: 'Another Rice Sack',
        itemCode: existingCode,
        category: 'GROCERY',
        itemType: 'CONSUMABLE',
        unit: 'kg',
        quantity: 20,
      };

      await assert.rejects(
        async () => {
          await service.createItem('prince-mess', 'usr_owner_1', input);
        },
        (err: any) => {
          assert.ok(err instanceof ConflictError);
          assert.match(err.message, /already exists/i);
          return true;
        }
      );
    });

    it('permits identical itemCode in a different tenant (isolated namespace)', async () => {
      const input: CreateItemInput = {
        name: 'Green Villa Rice',
        itemCode: 'GROC-RICE-01', // same code, different tenant
        category: 'GROCERY',
        itemType: 'CONSUMABLE',
        unit: 'kg',
        quantity: 25,
      };

      const created = await service.createItem('green-villa-mess', 'usr_owner_1', input);
      assert.ok(created.id);
      assert.strictEqual(created.itemCode, 'GROC-RICE-01');
      assert.strictEqual(created.tenantId, 'tenant_green_villa');
    });

    it('rejects item creation when required name is missing', async () => {
      await assert.rejects(
        async () => {
          await service.createItem('prince-mess', 'usr_owner_1', {
            name: '   ',
            unit: 'kg',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /name is required/i);
          return true;
        }
      );
    });
  });

  describe('3. Stock Movements: Receipts & Increases', () => {
    it('PURCHASE_RECEIPT increases item stock and creates an immutable ledger entry', async () => {
      const itemBefore = await service.getItemById('prince-mess', 'item_oil');
      const startingQty = itemBefore.quantity; // 35 litres

      const movementInput: RecordMovementInput = {
        itemId: 'item_oil',
        movementType: 'PURCHASE_RECEIPT',
        quantity: 15,
        unitCostTaka: 190,
        referenceNumber: 'PO-2026-NOV-991',
        notes: 'Purchased 3 x 5L cans from Tejgaon Mart',
      };

      const mov = await service.recordStockMovement('prince-mess', 'usr_owner_1', movementInput);

      assert.ok(mov.id);
      assert.strictEqual(mov.previousQuantity, startingQty);
      assert.strictEqual(mov.newQuantity, startingQty + 15);
      assert.strictEqual(mov.quantity, 15);
      assert.strictEqual(mov.referenceNumber, 'PO-2026-NOV-991');

      // Verify item updated in store
      const itemAfter = await service.getItemById('prince-mess', 'item_oil');
      assert.strictEqual(itemAfter.quantity, startingQty + 15);
      assert.strictEqual(itemAfter.costPerUnitTaka, 190);
    });
  });

  describe('4. Stock Movements: Consumption & Stock-Out', () => {
    it('CONSUMPTION decreases item stock and updates movement ledger', async () => {
      const itemBefore = await service.getItemById('prince-mess', 'item_oil');
      const startingQty = itemBefore.quantity; // 35 litres

      const mov = await service.recordStockMovement('prince-mess', 'usr_owner_1', {
        itemId: 'item_oil',
        movementType: 'CONSUMPTION',
        quantity: 5,
        notes: 'Used 5L oil for Friday Biryani dinner',
      });

      assert.strictEqual(mov.previousQuantity, startingQty);
      assert.strictEqual(mov.newQuantity, startingQty - 5);

      const itemAfter = await service.getItemById('prince-mess', 'item_oil');
      assert.strictEqual(itemAfter.quantity, startingQty - 5);
    });

    it('rejects CONSUMPTION when requested quantity exceeds available stock', async () => {
      const itemBefore = await service.getItemById('prince-mess', 'item_rice');
      const available = itemBefore.quantity; // 12 kg

      await assert.rejects(
        async () => {
          await service.recordStockMovement('prince-mess', 'usr_owner_1', {
            itemId: 'item_rice',
            movementType: 'CONSUMPTION',
            quantity: available + 10, // 22 kg requested
            notes: 'Over-consumption attempt',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /insufficient stock/i);
          return true;
        }
      );

      // Verify stock was not deducted
      const itemAfter = await service.getItemById('prince-mess', 'item_rice');
      assert.strictEqual(itemAfter.quantity, available);
    });
  });

  describe('5. Stock Movements: Location Transfers & Adjustments', () => {
    it('TRANSFER updates location and validates quantity without changing total stock', async () => {
      const fanBefore = await service.getItemById('prince-mess', 'item_fan');
      const initialQty = fanBefore.quantity;

      const mov = await service.recordStockMovement('prince-mess', 'usr_owner_1', {
        itemId: 'item_fan',
        movementType: 'TRANSFER',
        quantity: 1,
        sourceLocation: 'Storage Room 3',
        destinationLocation: 'Room 101 South Corner',
        notes: 'Transferred fan to Room 101 for summer comfort',
      });

      assert.strictEqual(mov.movementType, 'TRANSFER');
      assert.strictEqual(mov.previousQuantity, initialQty);
      assert.strictEqual(mov.newQuantity, initialQty); // Total quantity unchanged
      assert.strictEqual(mov.destinationLocation, 'Room 101 South Corner');

      const fanAfter = await service.getItemById('prince-mess', 'item_fan');
      assert.strictEqual(fanAfter.quantity, initialQty);
      assert.strictEqual(fanAfter.location, 'Room 101 South Corner');
    });

    it('STOCK_ADJUSTMENT adjusts stock count to audited physical inventory', async () => {
      const mov = await service.recordStockMovement('prince-mess', 'usr_owner_1', {
        itemId: 'item_rice',
        movementType: 'STOCK_ADJUSTMENT',
        quantity: 14.5, // physical audit found 14.5 kg
        notes: 'Monthly physical stock audit correction',
      });

      assert.strictEqual(mov.newQuantity, 14.5);

      const itemAfter = await service.getItemById('prince-mess', 'item_rice');
      assert.strictEqual(itemAfter.quantity, 14.5);
    });
  });

  describe('6. Idempotency & Safe Duplicate Submissions', () => {
    it('duplicate referenceNumber returns existing movement without double-counting stock', async () => {
      const itemBefore = await service.getItemById('prince-mess', 'item_oil');
      const startQty = itemBefore.quantity;

      const receiptPayload: RecordMovementInput = {
        itemId: 'item_oil',
        movementType: 'PURCHASE_RECEIPT',
        quantity: 10,
        unitCostTaka: 185,
        referenceNumber: 'INVOICE-OIL-UNIQUE-777',
        notes: 'First submission of invoice 777',
      };

      // 1st invocation
      const mov1 = await service.recordStockMovement('prince-mess', 'usr_owner_1', receiptPayload);
      assert.strictEqual(mov1.newQuantity, startQty + 10);

      // 2nd duplicate invocation with same referenceNumber
      const mov2 = await service.recordStockMovement('prince-mess', 'usr_owner_1', receiptPayload);
      assert.strictEqual(mov2.id, mov1.id);
      assert.strictEqual(mov2.newQuantity, mov1.newQuantity);

      // Stock should have only increased once (+10, not +20)
      const itemAfter = await service.getItemById('prince-mess', 'item_oil');
      assert.strictEqual(itemAfter.quantity, startQty + 10);
    });
  });

  describe('7. Low-Stock Alerts & Notification Triggers', () => {
    it('triggers low-stock alert when item falls below minStockAlert threshold', async () => {
      // item_oil has minStockAlert = 10, current quantity = 35
      const mov = await service.recordStockMovement('prince-mess', 'usr_owner_1', {
        itemId: 'item_oil',
        movementType: 'CONSUMPTION',
        quantity: 28, // 35 - 28 = 7 (which is <= 10)
        notes: 'Heavy festival week cooking',
      });

      assert.strictEqual(mov.newQuantity, 7);

      const item = await service.getItemById('prince-mess', 'item_oil');
      assert.strictEqual(item.isLowStock, true);
      assert.strictEqual(item.isOutOfStock, false);

      const dashboard = await service.getInventoryDashboard('prince-mess');
      const lowStockIds = dashboard.lowStockItems.map((i) => i.id);
      assert.ok(lowStockIds.includes('item_oil'));
    });

    it('identifies OUT OF STOCK items when quantity reaches 0', async () => {
      // item_soap was seeded with quantity 0
      const soap = await service.getItemById('prince-mess', 'item_soap');
      assert.strictEqual(soap.quantity, 0);
      assert.strictEqual(soap.isOutOfStock, true);

      const dashboard = await service.getInventoryDashboard('prince-mess');
      assert.ok(dashboard.outOfStockCount >= 1);
    });
  });

  describe('8. Non-Destructive Archiving', () => {
    it('archiveItem marks status as ARCHIVED while preserving historical ledger movements', async () => {
      const archived = await service.archiveItem('prince-mess', 'usr_owner_1', 'item_fan');
      assert.strictEqual(archived.status, 'ARCHIVED');

      // Active items filter does not list it
      const activeList = await service.listItems('prince-mess', { status: 'ACTIVE' });
      assert.strictEqual(activeList.items.some((i) => i.id === 'item_fan'), false);

      // Explicit ALL or ARCHIVED filter retrieves it
      const allList = await service.listItems('prince-mess', { status: 'ALL' });
      assert.ok(allList.items.some((i) => i.id === 'item_fan'));

      // Detailed ledger history remains fully intact
      const itemWithHistory = await service.getItemById('prince-mess', 'item_fan');
      assert.ok(itemWithHistory.movements.length > 0);
      assert.strictEqual(itemWithHistory.status, 'ARCHIVED');
    });
  });

  describe('9. Reusable Asset Tracking & Condition Management', () => {
    it('tracks reusable assets with condition, room assignment, and valuation', async () => {
      const newAsset = await service.createItem('prince-mess', 'usr_owner_1', {
        name: 'Singer Microwave Oven 25L',
        itemCode: 'ASSET-MIC-01',
        category: 'APPLIANCE',
        itemType: 'REUSABLE_ASSET',
        unit: 'piece',
        quantity: 1,
        costPerUnitTaka: 14500,
        assetCondition: 'EXCELLENT',
        assignedRoomId: 'room_101',
        location: 'Kitchen Counter',
      });

      assert.strictEqual(newAsset.itemType, 'REUSABLE_ASSET');
      assert.strictEqual(newAsset.assetCondition, 'EXCELLENT');
      assert.strictEqual(newAsset.assignedRoomNumber, '101');
      assert.strictEqual(newAsset.costPerUnitTaka, 14500);

      // Update condition to NEEDS_REPAIR
      const updated = await service.updateItem('prince-mess', 'usr_owner_1', newAsset.id, {
        assetCondition: 'NEEDS_REPAIR',
      });
      assert.strictEqual(updated.assetCondition, 'NEEDS_REPAIR');
    });
  });

  describe('10. Inventory Reports & Exact Poisha Valuation', () => {
    it('calculates category valuation and consumption reports accurately in integer poisha', async () => {
      const reports = await service.getInventoryReports('prince-mess');

      assert.ok(reports.valuationReport.length > 0);
      assert.ok(reports.consumptionSummary.length > 0);

      // Check valuation has valid poisha strings and formatted BDT
      for (const val of reports.valuationReport) {
        assert.ok(typeof val.category === 'string');
        assert.ok(typeof val.totalValuePoisha === 'string');
        assert.match(val.formattedTotalValue, /৳/);
      }

      // Check dashboard total asset valuation
      const dashboard = await service.getInventoryDashboard('prince-mess');
      assert.ok(Number(dashboard.totalAssetValuePoisha) > 0);
      assert.match(dashboard.formattedTotalAssetValue, /৳/);
      assert.strictEqual(dashboard.totalAssetValueTaka, Number(dashboard.totalAssetValuePoisha) / 100);
    });
  });
});
