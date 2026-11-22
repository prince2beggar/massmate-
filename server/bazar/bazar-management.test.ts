import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ExpenseService } from './expense-service';
import { ValidationError, ConflictError, ForbiddenError, NotFoundError } from '@/server/api/errors';

describe('Task 34: Bazar & Expense Management System Tests', () => {
  let expenseService: ExpenseService;

  const tenantA = { id: 'tenant_a', slug: 'green-mess', name: 'Green Bachelor Mess' };
  const tenantB = { id: 'tenant_b', slug: 'blue-mess', name: 'Blue Bachelor Mess' };

  const memberA1 = {
    id: 'mem_a1',
    tenantId: tenantA.id,
    userId: 'user_a1',
    user: { name: 'Rahim Shopper', email: 'rahim@test.com', phone: '+8801700000001' },
    status: 'ACTIVE',
    memberCode: 'GRN-001',
    roleName: 'Member',
  };

  const memberA2 = {
    id: 'mem_a2',
    tenantId: tenantA.id,
    userId: 'user_a2',
    user: { name: 'Karim Manager', email: 'karim@test.com', phone: '+8801700000002' },
    status: 'ACTIVE',
    memberCode: 'GRN-002',
    roleName: 'Admin',
  };

  const memberB1 = {
    id: 'mem_b1',
    tenantId: tenantB.id,
    userId: 'user_b1',
    user: { name: 'Shafiqul Blue', email: 'shafiq@test.com', phone: '+8801700000003' },
    status: 'ACTIVE',
    memberCode: 'BLU-001',
    roleName: 'Member',
  };

  beforeEach(() => {
    ExpenseService.resetInMemoryStorage();
    ExpenseService.seedMockTenant(tenantA);
    ExpenseService.seedMockTenant(tenantB);
    ExpenseService.seedMockMembership(memberA1);
    ExpenseService.seedMockMembership(memberA2);
    ExpenseService.seedMockMembership(memberB1);

    expenseService = new ExpenseService();
  });

  // 1. Category listing and default seeding
  test('1. Category listing auto-seeds standard defaults and creates custom categories', async () => {
    const categories = await expenseService.listCategories(tenantA.slug);
    assert.ok(categories.length >= 10);

    const bazarCat = categories.find((c: any) => c.code === 'BAZAR');
    assert.ok(bazarCat);
    assert.equal(bazarCat.isMealEligible, true);

    const wifiCat = categories.find((c: any) => c.code === 'WIFI');
    assert.ok(wifiCat);
    assert.equal(wifiCat.isMealEligible, false);

    // Create custom category
    const custom = await expenseService.createCategory(
      tenantA.slug,
      {
        name: 'Special Feast Spices',
        code: 'SPICES',
        isMealEligible: true,
        description: 'Exotic spices and dry fruits',
      },
      memberA2.userId
    );

    assert.equal(custom.code, 'SPICES');
    assert.equal(custom.isMealEligible, true);

    // Duplicate code prevention
    await assert.rejects(
      async () => {
        await expenseService.createCategory(
          tenantA.slug,
          { name: 'Spices Duplicate', code: 'SPICES' },
          memberA2.userId
        );
      },
      (err: any) => err instanceof ConflictError && err.message.includes('already exists')
    );
  });

  // 2. Category deactivation without deletion
  test('2. Updating categories supports deactivation without deleting records', async () => {
    const categories = await expenseService.listCategories(tenantA.slug);
    const transportCat = categories.find((c: any) => c.code === 'TRANSPORT');
    assert.ok(transportCat);

    const deactivated = await expenseService.updateCategory(
      tenantA.slug,
      transportCat.id,
      { isActive: false },
      memberA2.userId
    );

    assert.equal(deactivated.isActive, false);

    // Active list excludes deactivated category
    const activeList = await expenseService.listCategories(tenantA.slug, false);
    assert.equal(activeList.some((c: any) => c.code === 'TRANSPORT'), false);

    // Full list includes deactivated category
    const fullList = await expenseService.listCategories(tenantA.slug, true);
    assert.equal(fullList.some((c: any) => c.code === 'TRANSPORT'), true);
  });

  // 3. Itemized expense creation & server-side exact calculation
  test('3. Server calculates line item totals and total expense amount accurately', async () => {
    const categories = await expenseService.listCategories(tenantA.slug);
    const bazarCat = categories.find((c: any) => c.code === 'BAZAR');

    // 2.5 kg fish @ ৳400/kg = ৳1,000.00 (100,000 poisha)
    // 5 kg rice @ ৳70/kg = ৳350.00 (35,000 poisha)
    // 2 liters oil @ ৳180/liter = ৳360.00 (36,000 poisha)
    // Total = ৳1,710.00 (171,000 poisha)
    const expense = await expenseService.createExpense(
      tenantA.slug,
      {
        categoryId: bazarCat.id,
        purchaserMembershipId: memberA1.id,
        purchaseDate: '2026-11-20',
        description: 'Morning Bazar - Fish, Rice and Oil',
        vendor: 'Karwan Bazar',
        paymentMethod: 'CASH',
        items: [
          { itemName: 'Rui Fish', quantity: 2.5, unit: 'kg', unitPriceTaka: 400.0 },
          { itemName: 'Miniket Rice', quantity: 5.0, unit: 'kg', unitPriceTaka: 70.0 },
          { itemName: 'Soybean Oil', quantity: 2.0, unit: 'liter', unitPriceTaka: 180.0 },
        ],
      },
      memberA1.userId
    );

    assert.equal(expense.totalAmount, 1710.0);
    assert.equal(expense.totalAmountPoisha, '171000');
    assert.equal(expense.status, 'PENDING_REVIEW');
    assert.equal(expense.isMealEligible, true);
    assert.equal(expense.items.length, 3);

    // Check itemized line totals
    const fishItem = expense.items.find((i: any) => i.itemName === 'Rui Fish');
    assert.equal(fishItem.lineTotal, 1000.0);
    assert.equal(fishItem.lineTotalPoisha, '100000');
  });

  // 4. Input validation: rejects negative prices, zero quantities, empty descriptions
  test('4. Validation rejects invalid quantities, negative prices, and empty items', async () => {
    const categories = await expenseService.listCategories(tenantA.slug);
    const bazarCat = categories.find((c: any) => c.code === 'BAZAR');

    // Zero quantity
    await assert.rejects(
      async () => {
        await expenseService.createExpense(
          tenantA.slug,
          {
            categoryId: bazarCat.id,
            purchaserMembershipId: memberA1.id,
            purchaseDate: '2026-11-20',
            description: 'Invalid item',
            items: [{ itemName: 'Salt', quantity: 0, unitPriceTaka: 35.0 }],
          },
          memberA1.userId
        );
      },
      (err: any) => err instanceof ValidationError && err.message.includes('Invalid quantity')
    );

    // Negative unit price
    await assert.rejects(
      async () => {
        await expenseService.createExpense(
          tenantA.slug,
          {
            categoryId: bazarCat.id,
            purchaserMembershipId: memberA1.id,
            purchaseDate: '2026-11-20',
            description: 'Negative price',
            items: [{ itemName: 'Sugar', quantity: 1, unitPriceTaka: -50.0 }],
          },
          memberA1.userId
        );
      },
      (err: any) => err instanceof ValidationError && err.message.includes('negative')
    );

    // Empty items array
    await assert.rejects(
      async () => {
        await expenseService.createExpense(
          tenantA.slug,
          {
            categoryId: bazarCat.id,
            purchaserMembershipId: memberA1.id,
            purchaseDate: '2026-11-20',
            description: 'No items',
            items: [],
          },
          memberA1.userId
        );
      },
      (err: any) => err instanceof ValidationError && err.message.includes('line item is required')
    );
  });

  // 5. Review workflow: Approval
  test('5. Review workflow: authorized manager can approve expense', async () => {
    const categories = await expenseService.listCategories(tenantA.slug);
    const bazarCat = categories.find((c: any) => c.code === 'BAZAR');

    const expense = await expenseService.createExpense(
      tenantA.slug,
      {
        categoryId: bazarCat.id,
        purchaserMembershipId: memberA1.id,
        purchaseDate: '2026-11-21',
        description: 'Vegetables & Eggs',
        items: [{ itemName: 'Eggs', quantity: 30, unit: 'piece', unitPriceTaka: 12.0 }],
      },
      memberA1.userId
    );

    assert.equal(expense.status, 'PENDING_REVIEW');

    const approved = await expenseService.reviewExpense(
      tenantA.slug,
      expense.id,
      'APPROVE',
      undefined,
      memberA2.userId,
      memberA2.id // Reviewer is memberA2, purchaser is memberA1
    );

    assert.equal(approved.status, 'APPROVED');
    assert.equal(approved.reviewedByUserId, memberA2.userId);
    assert.ok(approved.reviewedAt);
  });

  // 6. Review workflow: Rejection requires mandatory reason
  test('6. Review workflow: rejection requires mandatory explanation note', async () => {
    const categories = await expenseService.listCategories(tenantA.slug);
    const bazarCat = categories.find((c: any) => c.code === 'BAZAR');

    const expense = await expenseService.createExpense(
      tenantA.slug,
      {
        categoryId: bazarCat.id,
        purchaserMembershipId: memberA1.id,
        purchaseDate: '2026-11-21',
        description: 'Overpriced shopping',
        items: [{ itemName: 'Beef', quantity: 2, unit: 'kg', unitPriceTaka: 950.0 }],
      },
      memberA1.userId
    );

    // Rejection without note fails
    await assert.rejects(
      async () => {
        await expenseService.reviewExpense(
          tenantA.slug,
          expense.id,
          'REJECT',
          '',
          memberA2.userId,
          memberA2.id
        );
      },
      (err: any) => err instanceof ValidationError && err.message.includes('rejection reason')
    );

    // Rejection with note succeeds
    const rejected = await expenseService.reviewExpense(
      tenantA.slug,
      expense.id,
      'REJECT',
      'Missing receipt voucher and price exceeds agreed rate',
      memberA2.userId,
      memberA2.id
    );

    assert.equal(rejected.status, 'REJECTED');
    assert.equal(rejected.rejectionReason, 'Missing receipt voucher and price exceeds agreed rate');
  });

  // 7. Self-approval policy guard
  test('7. Self-approval policy guard blocks purchaser from approving their own expense', async () => {
    const categories = await expenseService.listCategories(tenantA.slug);
    const bazarCat = categories.find((c: any) => c.code === 'BAZAR');

    const expense = await expenseService.createExpense(
      tenantA.slug,
      {
        categoryId: bazarCat.id,
        purchaserMembershipId: memberA1.id,
        purchaseDate: '2026-11-21',
        description: 'My own shopping',
        items: [{ itemName: 'Bread', quantity: 2, unit: 'packet', unitPriceTaka: 60.0 }],
      },
      memberA1.userId
    );

    // Rahim (memberA1) tries to approve his own expense
    await assert.rejects(
      async () => {
        await expenseService.reviewExpense(
          tenantA.slug,
          expense.id,
          'APPROVE',
          undefined,
          memberA1.userId,
          memberA1.id // Reviewer is memberA1
        );
      },
      (err: any) => err instanceof ForbiddenError && err.message.includes('self-approve')
    );
  });

  // 8. Reversal workflow
  test('8. Reversing an approved expense requires mandatory reason without deleting history', async () => {
    const categories = await expenseService.listCategories(tenantA.slug);
    const bazarCat = categories.find((c: any) => c.code === 'BAZAR');

    const expense = await expenseService.createExpense(
      tenantA.slug,
      {
        categoryId: bazarCat.id,
        purchaserMembershipId: memberA1.id,
        purchaseDate: '2026-11-21',
        description: 'Mistaken duplicate entry',
        items: [{ itemName: 'Lentils', quantity: 2, unit: 'kg', unitPriceTaka: 140.0 }],
      },
      memberA1.userId,
      true // autoApprove
    );

    assert.equal(expense.status, 'APPROVED');

    // Reversing without reason fails
    await assert.rejects(
      async () => {
        await expenseService.reverseExpense(tenantA.slug, expense.id, '', memberA2.userId);
      },
      (err: any) => err instanceof ValidationError && err.message.includes('mandatory reason')
    );

    // Reversing with valid reason succeeds
    const reversed = await expenseService.reverseExpense(
      tenantA.slug,
      expense.id,
      'Duplicate voucher found entered by Rahim and Karim',
      memberA2.userId
    );

    assert.equal(reversed.status, 'REVERSED');
    assert.ok(reversed.notes.includes('REVERSED: Duplicate voucher found'));
  });

  // 9. Bazar Schedule (Rota) management
  test('9. Bazar schedule assigns resident duty and completes upon purchase linking', async () => {
    const today = '2026-11-22';

    const schedule = await expenseService.createBazarSchedule(
      tenantA.slug,
      {
        dateString: today,
        assignedMembershipId: memberA1.id,
        notes: 'Special Friday Bazar duty',
      },
      memberA2.userId
    );

    assert.equal(schedule.assignedMembershipId, memberA1.id);
    assert.equal(schedule.status, 'SCHEDULED');

    // Link expense to schedule
    const categories = await expenseService.listCategories(tenantA.slug);
    const bazarCat = categories.find((c: any) => c.code === 'BAZAR');

    await expenseService.createExpense(
      tenantA.slug,
      {
        categoryId: bazarCat.id,
        purchaserMembershipId: memberA1.id,
        purchaseDate: today,
        description: 'Friday Bazar completed',
        bazarScheduleId: schedule.id,
        items: [{ itemName: 'Chicken', quantity: 4, unit: 'kg', unitPriceTaka: 220.0 }],
      },
      memberA1.userId
    );

    // Check that schedule is updated to COMPLETED
    const schedules = await expenseService.listBazarSchedules(tenantA.slug, {
      monthString: '2026-11',
    });
    const updatedSchedule = schedules.find((s: any) => s.id === schedule.id);
    assert.ok(updatedSchedule);
    assert.equal(updatedSchedule.status, 'COMPLETED');
    assert.equal(updatedSchedule.actualPurchaserMembershipId, memberA1.id);
  });

  // 10. Finance / Meal Rate Integration
  test('10. Approved meal-eligible expenses integrate into meal rate while non-meal/pending are excluded', async () => {
    const categories = await expenseService.listCategories(tenantA.slug);
    const bazarCat = categories.find((c: any) => c.code === 'BAZAR'); // isMealEligible: true
    const wifiCat = categories.find((c: any) => c.code === 'WIFI'); // isMealEligible: false

    // Expense 1: Approved Bazar = ৳5,000 (500,000 poisha) -> Should be included
    await expenseService.createExpense(
      tenantA.slug,
      {
        categoryId: bazarCat.id,
        purchaserMembershipId: memberA1.id,
        purchaseDate: '2026-11-05',
        description: 'Approved Grocery',
        items: [{ itemName: 'Grocery items', quantity: 1, unitPriceTaka: 5000.0 }],
      },
      memberA2.userId,
      true // autoApprove -> APPROVED
    );

    // Expense 2: Approved WiFi = ৳1,000 -> Should be EXCLUDED (not meal eligible)
    await expenseService.createExpense(
      tenantA.slug,
      {
        categoryId: wifiCat.id,
        purchaserMembershipId: memberA1.id,
        purchaseDate: '2026-11-06',
        description: 'WiFi bill',
        items: [{ itemName: 'Broadband', quantity: 1, unitPriceTaka: 1000.0 }],
      },
      memberA2.userId,
      true // autoApprove -> APPROVED
    );

    // Expense 3: Pending Bazar = ৳2,000 -> Should be EXCLUDED (pending review)
    await expenseService.createExpense(
      tenantA.slug,
      {
        categoryId: bazarCat.id,
        purchaserMembershipId: memberA1.id,
        purchaseDate: '2026-11-07',
        description: 'Pending Grocery',
        items: [{ itemName: 'Extra Meat', quantity: 1, unitPriceTaka: 2000.0 }],
      },
      memberA1.userId,
      false // PENDING_REVIEW
    );

    // Query approved meal-eligible expenses for November
    const eligiblePoisha = await expenseService.getApprovedEligibleMealExpenses(
      tenantA.slug,
      '2026-11'
    );

    // Exactly 500,000 poisha (৳5,000.00)
    assert.equal(eligiblePoisha.toString(), '500000');
  });

  // 11. Cross-tenant isolation
  test('11. Tenant B cannot view or modify Tenant A expenses or categories', async () => {
    const categoriesA = await expenseService.listCategories(tenantA.slug);
    const bazarCatA = categoriesA.find((c: any) => c.code === 'BAZAR');

    const expenseA = await expenseService.createExpense(
      tenantA.slug,
      {
        categoryId: bazarCatA.id,
        purchaserMembershipId: memberA1.id,
        purchaseDate: '2026-11-20',
        description: 'Tenant A Secret Shopping',
        items: [{ itemName: 'Item A', quantity: 1, unitPriceTaka: 100.0 }],
      },
      memberA1.userId
    );

    // Tenant B's expense list should be empty
    const listB = await expenseService.listExpenses(tenantB.slug);
    assert.equal(listB.expenses.length, 0);

    // Tenant B trying to review Tenant A's expense directly must be rejected
    await assert.rejects(
      async () => {
        await expenseService.reviewExpense(
          tenantB.slug,
          expenseA.id,
          'APPROVE',
          undefined,
          memberB1.userId,
          memberB1.id
        );
      },
      (err: any) => err instanceof NotFoundError
    );
  });
});
