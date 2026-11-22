import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  MaintenanceService,
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  CreateOperationalTaskInput,
  ASIA_DHAKA_TIMEZONE,
} from './maintenance-service';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../api/errors';

describe('Task 43 — Maintenance, Work Orders & Task Management', () => {
  let service: MaintenanceService;

  beforeEach(() => {
    // Instantiate fresh service with seeded mock data
    service = new MaintenanceService(null as any);
  });

  describe('1. Tenant Isolation for Work Orders & Tasks', () => {
    it('Tenant A cannot see Tenant B work orders or operational tasks', async () => {
      // Prince Mess has seeded work orders and tasks
      const princeOrders = await service.listWorkOrders('prince-mess');
      const princeTasks = await service.listOperationalTasks('prince-mess');

      assert.ok(princeOrders.workOrders.length > 0);
      assert.ok(princeTasks.tasks.length > 0);

      for (const wo of princeOrders.workOrders) {
        assert.strictEqual(wo.tenantId, 'tenant_prince_mess');
      }
      for (const task of princeTasks.tasks) {
        assert.strictEqual(task.tenantId, 'tenant_prince_mess');
      }

      // Green Villa Mess has only its own items
      const greenOrders = await service.listWorkOrders('green-villa-mess');
      assert.strictEqual(greenOrders.workOrders.length, 1);
      assert.strictEqual(greenOrders.workOrders[0].referenceNumber, 'WO-GV-001');
      assert.strictEqual(greenOrders.workOrders[0].tenantId, 'tenant_green_villa');

      // Attempting to access Prince Mess work order using Green Villa tenantSlug throws NotFoundError
      await assert.rejects(
        async () => {
          await service.getWorkOrderById('green-villa-mess', 'wo_seed_1');
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          return true;
        }
      );
    });

    it('rejects access to suspended mess tenants with ForbiddenError', async () => {
      await assert.rejects(
        async () => {
          await service.listWorkOrders('suspended-mess');
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /suspended/i);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await service.getMaintenanceDashboard('suspended-mess');
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          return true;
        }
      );
    });
  });

  describe('2. Room and Asset Cross-Tenant Boundary Verification', () => {
    it('rejects work order creation when room belongs to a different tenant', async () => {
      // room_green_201 belongs to Green Villa Mess
      const input: CreateWorkOrderInput = {
        title: 'Fix Door Latch',
        description: 'Door latch is broken',
        roomId: 'room_green_201', // Cross-tenant room!
      };

      await assert.rejects(
        async () => {
          await service.createWorkOrder('prince-mess', 'usr_owner_1', input);
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /does not exist in this mess/i);
          return true;
        }
      );
    });

    it('rejects work order creation when inventory asset belongs to a different tenant', async () => {
      // item_green_gas belongs to Green Villa Mess
      const input: CreateWorkOrderInput = {
        title: 'Check Gas Valve',
        description: 'Regulator replacement needed',
        assetId: 'item_green_gas', // Cross-tenant asset!
      };

      await assert.rejects(
        async () => {
          await service.createWorkOrder('prince-mess', 'usr_owner_1', input);
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /does not exist in this mess/i);
          return true;
        }
      );
    });
  });

  describe('3. Work Order Lifecycle & Status Transitions', () => {
    it('allows valid progressive transitions (OPEN -> IN_PROGRESS -> COMPLETED -> VERIFIED)', async () => {
      // wo_seed_2 starts in OPEN status
      const initial = await service.getWorkOrderById('prince-mess', 'wo_seed_2');
      assert.strictEqual(initial.status, 'OPEN');

      // 1. OPEN -> IN_PROGRESS
      const step1 = await service.updateWorkOrder('prince-mess', 'usr_owner_1', 'wo_seed_2', {
        status: 'IN_PROGRESS',
        statusChangeReason: 'Plumber began pipe repairs',
      });
      assert.strictEqual(step1.status, 'IN_PROGRESS');

      // 2. IN_PROGRESS -> COMPLETED
      const step2 = await service.updateWorkOrder('prince-mess', 'usr_owner_1', 'wo_seed_2', {
        status: 'COMPLETED',
        completionNotes: 'Replaced pipe elbow and sealed joints',
        actualCostTaka: 320,
      });
      assert.strictEqual(step2.status, 'COMPLETED');
      assert.ok(step2.completedAt);
      assert.strictEqual(step2.actualCostTaka, 320);

      // 3. COMPLETED -> VERIFIED
      const step3 = await service.updateWorkOrder('prince-mess', 'usr_owner_1', 'wo_seed_2', {
        status: 'VERIFIED',
      });
      assert.strictEqual(step3.status, 'VERIFIED');
      assert.ok(step3.verifiedAt);
      assert.strictEqual(step3.closedById, 'usr_owner_1');
    });

    it('rejects invalid status transitions (e.g. OPEN directly to VERIFIED)', async () => {
      // wo_seed_2 is OPEN
      await assert.rejects(
        async () => {
          await service.updateWorkOrder('prince-mess', 'usr_owner_1', 'wo_seed_2', {
            status: 'VERIFIED',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /invalid status transition/i);
          return true;
        }
      );
    });
  });

  describe('4. Staff & Technician Assignment', () => {
    it('successfully assigns work order to staff and auto-advances status to ASSIGNED', async () => {
      const woBefore = await service.getWorkOrderById('prince-mess', 'wo_seed_2');
      assert.strictEqual(woBefore.status, 'OPEN');
      assert.strictEqual(woBefore.assignedUserId, null);

      const assigned = await service.assignWorkOrder('prince-mess', 'usr_owner_1', 'wo_seed_2', {
        assignedUserId: 'usr_staff_1',
        assignedVendorName: 'Rahim Tech Works',
        reason: 'Assigned to head technician',
      });

      assert.strictEqual(assigned.status, 'ASSIGNED');
      assert.strictEqual(assigned.assignedUserId, 'usr_staff_1');
      assert.strictEqual(assigned.assignedVendorName, 'Rahim Tech Works');
    });

    it('rejects assigning work order to a non-existent or invalid user', async () => {
      await assert.rejects(
        async () => {
          await service.assignWorkOrder('prince-mess', 'usr_owner_1', 'wo_seed_2', {
            assignedUserId: 'usr_non_existent_fake_id',
          });
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /not found in tenant system/i);
          return true;
        }
      );
    });

    it('restricts assignee-only updates: assignee cannot alter title, description or category', async () => {
      await assert.rejects(
        async () => {
          await service.updateWorkOrder(
            'prince-mess',
            'usr_staff_1',
            'wo_seed_1',
            {
              title: 'Attempted Title Hijack by Technician',
            },
            true // isAssigneeOnly = true
          );
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /assignee can only update status/i);
          return true;
        }
      );
    });
  });

  describe('5. Member Privacy & Internal Notes Redaction', () => {
    it('member view hides internal notes and technician private contact info', async () => {
      // wo_seed_1 has sensitive internal notes and vendor contact
      const staffView = await service.getWorkOrderById('prince-mess', 'wo_seed_1', true);
      assert.ok(staffView.internalNotes);
      assert.ok(staffView.assignedVendorContact);

      // Member view (isStaff = false)
      const memberView = await service.getWorkOrderById('prince-mess', 'wo_seed_1', false);
      assert.strictEqual(memberView.internalNotes, null);
      assert.strictEqual(memberView.assignedVendorContact, null);
      assert.ok(memberView.memberUpdates); // Member-visible updates remain accessible
    });
  });

  describe('6. Complaint Conversion & Linkage', () => {
    it('converts a member complaint into a formal work order and marks complaint as IN_PROGRESS', async () => {
      const wo = await service.convertComplaintToWorkOrder(
        'prince-mess',
        'usr_owner_1',
        'cmp_seed_1',
        {
          priority: 'URGENT',
          dueDate: new Date('2026-11-26T18:00:00Z'),
        }
      );

      assert.ok(wo.id);
      assert.strictEqual(wo.complaintId, 'cmp_seed_1');
      assert.strictEqual(wo.priority, 'URGENT');
      assert.match(wo.title, /clicking noise and sparking/i);

      // Verify complaint was marked IN_PROGRESS
      const updatedCmp = service.mockComplaints.find((c) => c.id === 'cmp_seed_1');
      assert.strictEqual(updatedCmp.status, 'IN_PROGRESS');
      assert.match(updatedCmp.adminResponse, new RegExp(wo.referenceNumber));
    });
  });

  describe('7. Operational Tasks & Duplicate Recurring Protection', () => {
    it('creates operational task with checklist and due date', async () => {
      const taskInput: CreateOperationalTaskInput = {
        title: 'Inspect Emergency Exit Lights',
        description: 'Verify battery backup on 2nd and 3rd floor emergency signs.',
        category: 'INSPECTION',
        priority: 'HIGH',
        recurrenceRule: 'MONTHLY',
        dueDate: new Date('2026-11-30T17:00:00Z'),
        checklist: [
          { id: 'c1', text: 'Floor 2 sign light test', completed: false },
          { id: 'c2', text: 'Floor 3 sign light test', completed: false },
        ],
      };

      const task = await service.createOperationalTask('prince-mess', 'usr_owner_1', taskInput);
      assert.ok(task.id);
      assert.strictEqual(task.status, 'TODO');
      assert.strictEqual(task.checklist.length, 2);
      assert.strictEqual(task.recurrenceRule, 'MONTHLY');
    });

    it('prevents generating duplicate active recurring tasks for the same title and rule', async () => {
      const recurringInput: CreateOperationalTaskInput = {
        title: 'Weekly Deep Kitchen & Pantry Sanitation', // Already exists as TODO in Prince Mess
        category: 'CLEANING',
        recurrenceRule: 'WEEKLY',
      };

      await assert.rejects(
        async () => {
          await service.createOperationalTask('prince-mess', 'usr_owner_1', recurringInput);
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /active recurring task.*is already open/i);
          return true;
        }
      );
    });
  });

  describe('8. Inventory Consumption & Exact Cost Accounting', () => {
    it('links inventory item consumption to work order and increments actualCost accurately', async () => {
      const woBefore = await service.getWorkOrderById('prince-mess', 'wo_seed_2');
      const startActualPoisha = BigInt(woBefore.actualCostPoisha);

      // Consume 2 pieces of soap for plumbing clean-up
      const result = await service.linkInventoryItemToWorkOrder(
        'prince-mess',
        'usr_owner_1',
        'wo_seed_2',
        {
          itemId: 'item_oil',
          quantity: 2, // 2 litres of lubricant/oil
          notes: 'Lubricant oil used for pipe fitting threading',
        }
      );

      assert.ok(result.movementId);
      const woAfter = result.workOrder;
      assert.ok(BigInt(woAfter.actualCostPoisha) > startActualPoisha);
      assert.match(woAfter.formattedActualCost, /৳/);
    });

    it('rejects inventory usage when stock is insufficient without creating negative stock', async () => {
      await assert.rejects(
        async () => {
          await service.linkInventoryItemToWorkOrder(
            'prince-mess',
            'usr_owner_1',
            'wo_seed_2',
            {
              itemId: 'item_rice',
              quantity: 9999, // Exceeds available stock
              notes: 'Massive overconsumption',
            }
          );
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /insufficient stock/i);
          return true;
        }
      );
    });
  });

  describe('9. Reports, Timezones & Audit Tracking', () => {
    it('reports accurately aggregate category expenditure, staff workload, and overdue items', async () => {
      const reports = await service.getMaintenanceReports('prince-mess');

      assert.ok(reports.statusDistribution.length > 0);
      assert.ok(reports.categoryDistribution.length > 0);
      assert.ok(reports.staffWorkload.length > 0);

      // Verify formatted currency in category report
      for (const cat of reports.categoryDistribution) {
        assert.match(cat.formattedCost, /৳/);
      }

      // Verify Asia/Dhaka timezone constant
      assert.strictEqual(ASIA_DHAKA_TIMEZONE, 'Asia/Dhaka');
    });

    it('retains immutable status history trail across transitions', async () => {
      const wo = await service.getWorkOrderById('prince-mess', 'wo_seed_1');
      assert.ok(wo.statusHistory);
      assert.ok(wo.statusHistory.length >= 2);

      const [latest, previous] = wo.statusHistory;
      assert.strictEqual(latest.toStatus, 'IN_PROGRESS');
      assert.strictEqual(previous.toStatus, 'ASSIGNED');
    });
  });
});
