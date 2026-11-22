import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FinanceService } from './finance-service';
import { ValidationError, ConflictError, ForbiddenError, NotFoundError } from '@/server/api/errors';

describe('Task 35: Finance, Billing & Payment Management System Tests', () => {
  let financeService: FinanceService;

  const tenantA = { id: 'tenant_fin_a', slug: 'dhanmondi-mess', name: 'Dhanmondi Executive Mess' };
  const tenantB = { id: 'tenant_fin_b', slug: 'uttara-mess', name: 'Uttara Student Mess' };

  const memberA1 = {
    id: 'mem_fin_a1',
    tenantId: tenantA.id,
    userId: 'user_fin_a1',
    status: 'ACTIVE',
    memberCode: 'DHN-001',
    user: { name: 'Karim Ahmed', email: 'karim@test.com', phone: '+8801711111111' },
  };

  const memberA2 = {
    id: 'mem_fin_a2',
    tenantId: tenantA.id,
    userId: 'user_fin_a2',
    status: 'ACTIVE',
    memberCode: 'DHN-002',
    user: { name: 'Salam Khan', email: 'salam@test.com', phone: '+8801722222222' },
  };

  const memberB1 = {
    id: 'mem_fin_b1',
    tenantId: tenantB.id,
    userId: 'user_fin_b1',
    status: 'ACTIVE',
    memberCode: 'UTR-001',
    user: { name: 'Tanvir Hossain', email: 'tanvir@test.com', phone: '+8801733333333' },
  };

  beforeEach(() => {
    financeService = new FinanceService();
    financeService.seedMockTenant(tenantA);
    financeService.seedMockTenant(tenantB);
    financeService.seedMockMembership(memberA1);
    financeService.seedMockMembership(memberA2);
    financeService.seedMockMembership(memberB1);
  });

  // 1. Category Auto-Seeding & Creation
  test('1. Category listing auto-seeds standard defaults with allocation rules', async () => {
    const categories = await financeService.listCategories(tenantA.slug);
    assert.ok(categories.length >= 10);

    const roomRent = categories.find((c: any) => c.code === 'ROOM_RENT');
    assert.ok(roomRent);
    assert.equal(roomRent.allocationRule, 'PER_ROOM');
    assert.equal(roomRent.isSystem, true);

    const electricity = categories.find((c: any) => c.code === 'ELECTRICITY');
    assert.ok(electricity);
    assert.equal(electricity.allocationRule, 'EQUAL_PER_MEMBER');

    // Create custom category
    const custom = await financeService.createCategory(
      tenantA.slug,
      {
        name: 'Gym Subscription',
        code: 'GYM_FEE',
        allocationRule: 'FIXED_AMOUNT',
        defaultAmountTaka: 500,
      },
      memberA1.userId
    );

    assert.equal(custom.code, 'GYM_FEE');
    assert.equal(custom.defaultAmountTaka, 500);
    assert.equal(custom.isActive, true);
  });

  // 2. Category Soft Deactivation
  test('2. Updating categories supports deactivation without breaking past records', async () => {
    const categories = await financeService.listCategories(tenantA.slug);
    const wifiCat = categories.find((c: any) => c.code === 'WIFI');
    assert.ok(wifiCat);

    const deactivated = await financeService.updateCategory(
      tenantA.slug,
      wifiCat.id,
      { isActive: false },
      memberA1.userId
    );
    assert.equal(deactivated.isActive, false);

    // Active listing excludes it
    const activeList = await financeService.listCategories(tenantA.slug, false);
    assert.ok(!activeList.some((c: any) => c.id === wifiCat.id));

    // Full listing includes it
    const fullList = await financeService.listCategories(tenantA.slug, true);
    assert.ok(fullList.some((c: any) => c.id === wifiCat.id));
  });

  // 3. Exact Math Allocation without float drift
  test('3. Monthly billing generates exact integer poisha allocations among members', async () => {
    const categories = await financeService.listCategories(tenantA.slug);
    const electricityCat = categories.find((c: any) => c.code === 'ELECTRICITY');
    assert.ok(electricityCat);

    // Total electricity: ৳1500.55 split between 2 members (150055 poisha / 2 = 75027 and 75028)
    const bills = await financeService.generateMonthlyBills(
      tenantA.slug,
      {
        monthString: '2026-11',
        dueDate: '2026-11-10',
        charges: [
          {
            categoryId: electricityCat.id,
            totalAmountTaka: 1500.55,
            allocationRule: 'EQUAL_PER_MEMBER',
          },
        ],
      },
      memberA1.userId
    );

    assert.equal(bills.length, 2);
    const sumTaka = bills[0].utilityChargesTaka + bills[1].utilityChargesTaka;
    assert.equal(sumTaka.toFixed(2), '1500.55');
  });

  // 4. Opening Due Rollover
  test('4. Bill generation rolls over previous month closing balance into opening due', async () => {
    const categories = await financeService.listCategories(tenantA.slug);
    const gasCat = categories.find((c: any) => c.code === 'GAS');
    assert.ok(gasCat);

    // Month 1 (October 2026): ৳1000 per member, unpaid
    await financeService.generateMonthlyBills(
      tenantA.slug,
      {
        monthString: '2026-10',
        charges: [
          {
            categoryId: gasCat.id,
            totalAmountTaka: 2000,
            allocationRule: 'EQUAL_PER_MEMBER',
          },
        ],
      },
      memberA1.userId
    );

    // Month 2 (November 2026): new bill should roll over ৳1000 unpaid October balance as opening due!
    const novBills = await financeService.generateMonthlyBills(
      tenantA.slug,
      {
        monthString: '2026-11',
        charges: [
          {
            categoryId: gasCat.id,
            totalAmountTaka: 1000,
            allocationRule: 'EQUAL_PER_MEMBER',
          },
        ],
      },
      memberA1.userId
    );

    const billA1 = novBills.find((b: any) => b.membershipId === memberA1.id);
    assert.ok(billA1);
    assert.equal(billA1.openingDueTaka, 1000);
    assert.equal(billA1.utilityChargesTaka, 500);
    assert.equal(billA1.closingBalanceTaka, 1500);
  });

  // 5. Closing Balance Invariant
  test('5. Closing Balance strictly satisfies: Opening + Charges - Payments - Credits', async () => {
    const statement = await financeService.getMemberStatement(tenantA.slug, memberA1.id, '2026-11');
    const expectedClosing =
      statement.openingDueTaka +
      statement.totalChargesTaka -
      statement.paidAmountTaka -
      statement.creditAdjustmentTaka;
    assert.equal(statement.closingBalanceTaka, expectedClosing);
  });

  // 6. Period Locking Guards
  test('6. Closing and locking a monthly billing period freezes statements and prevents bill generation', async () => {
    await financeService.closeMonthlyBilling(tenantA.slug, '2026-11', memberA1.userId);

    const categories = await financeService.listCategories(tenantA.slug);
    const gasCat = categories.find((c: any) => c.code === 'GAS');

    // Trying to regenerate bills on locked period must throw ForbiddenError
    await assert.rejects(
      async () => {
        await financeService.generateMonthlyBills(
          tenantA.slug,
          {
            monthString: '2026-11',
            charges: [{ categoryId: gasCat.id, totalAmountTaka: 500 }],
          },
          memberA1.userId
        );
      },
      (err: any) => err instanceof ForbiddenError
    );
  });

  // 7. Duplicate Transaction ID Guard
  test('7. Payment recording prevents duplicate transaction reference ID while permitting multiple cash payments', async () => {
    // 1st digital payment (bKash TrxID: BK123456)
    await financeService.recordPayment(
      tenantA.slug,
      {
        membershipId: memberA1.id,
        paymentDate: '2026-11-05',
        amountTaka: 500,
        paymentMethod: 'BKASH',
        transactionId: 'BK123456',
      },
      memberA1.userId
    );

    // Duplicate submission of same TrxID must be rejected
    await assert.rejects(
      async () => {
        await financeService.recordPayment(
          tenantA.slug,
          {
            membershipId: memberA2.id,
            paymentDate: '2026-11-05',
            amountTaka: 500,
            paymentMethod: 'BKASH',
            transactionId: 'BK123456',
          },
          memberA2.userId
        );
      },
      (err: any) => err instanceof ConflictError
    );

    // Multiple cash payments with no transaction ID are allowed!
    const cash1 = await financeService.recordPayment(
      tenantA.slug,
      {
        membershipId: memberA1.id,
        paymentDate: '2026-11-06',
        amountTaka: 200,
        paymentMethod: 'CASH',
      },
      memberA1.userId
    );
    const cash2 = await financeService.recordPayment(
      tenantA.slug,
      {
        membershipId: memberA2.id,
        paymentDate: '2026-11-06',
        amountTaka: 300,
        paymentMethod: 'CASH',
      },
      memberA2.userId
    );
    assert.ok(cash1.id);
    assert.ok(cash2.id);
  });

  // 8. Payment Verification Workflow
  test('8. Payment verification updates bill paid amount, closing balance, and bill status', async () => {
    // Unfreeze period for test month
    const categories = await financeService.listCategories(tenantA.slug);
    const rentCat = categories.find((c: any) => c.code === 'ROOM_RENT');

    const bills = await financeService.generateMonthlyBills(
      tenantA.slug,
      {
        monthString: '2026-12',
        charges: [{ categoryId: rentCat.id, totalAmountTaka: 4000, allocationRule: 'EQUAL_PER_MEMBER' }],
      },
      memberA1.userId
    );

    const billA1 = bills.find((b: any) => b.membershipId === memberA1.id);
    assert.equal(billA1.closingBalanceTaka, 2000);

    // Record partial payment of ৳1000
    const payment = await financeService.recordPayment(
      tenantA.slug,
      {
        membershipId: memberA1.id,
        billId: billA1.id,
        paymentDate: '2026-12-05',
        amountTaka: 1000,
        paymentMethod: 'NAGAD',
        transactionId: 'NG987654',
      },
      memberA1.userId
    );

    // Verify payment
    const verified = await financeService.verifyPayment(
      tenantA.slug,
      payment.id,
      { decision: 'CONFIRM' },
      memberA1.userId
    );
    assert.equal(verified.status, 'CONFIRMED');

    // Statement now reflects ৳1000 paid and ৳1000 balance
    const statement = await financeService.getMemberStatement(tenantA.slug, memberA1.id, '2026-12');
    assert.equal(statement.paidAmountTaka, 1000);
    assert.equal(statement.closingBalanceTaka, 1000);
    assert.equal(statement.billStatus, 'PARTIALLY_PAID');
  });

  // 9. Rejection Reason Requirement
  test('9. Rejecting a payment requires mandatory explanation reason', async () => {
    const payment = await financeService.recordPayment(
      tenantA.slug,
      {
        membershipId: memberA2.id,
        paymentDate: '2026-12-05',
        amountTaka: 400,
        paymentMethod: 'BKASH',
        transactionId: 'BK_FAKE_01',
      },
      memberA2.userId
    );

    // Reject without reason must fail
    await assert.rejects(
      async () => {
        await financeService.verifyPayment(
          tenantA.slug,
          payment.id,
          { decision: 'REJECT', rejectionReason: '   ' },
          memberA1.userId
        );
      },
      (err: any) => err instanceof ValidationError
    );

    // Reject with reason succeeds
    const rejected = await financeService.verifyPayment(
      tenantA.slug,
      payment.id,
      { decision: 'REJECT', rejectionReason: 'Fake bKash TrxID; no funds credited in mess account' },
      memberA1.userId
    );
    assert.equal(rejected.status, 'REJECTED');
    assert.ok(rejected.rejectionReason);
  });

  // 10. Member Statement Privacy
  test('10. Privacy rule prevents regular member from inspecting other residents statements', async () => {
    const regularMemberContext = {
      isOwner: false,
      permissions: new Set<string>(['members.view']),
      viewerMembershipId: memberA1.id,
    };

    // Member A1 can view their own statement
    const ownStatement = await financeService.getMemberStatement(
      tenantA.slug,
      memberA1.id,
      '2026-11',
      regularMemberContext
    );
    assert.equal(ownStatement.membershipId, memberA1.id);

    // Member A1 trying to view Member A2's statement must be rejected with ForbiddenError!
    await assert.rejects(
      async () => {
        await financeService.getMemberStatement(
          tenantA.slug,
          memberA2.id,
          '2026-11',
          regularMemberContext
        );
      },
      (err: any) => err instanceof ForbiddenError
    );

    // Manager with finance.view_all_members or Owner CAN view Member A2's statement
    const managerContext = {
      isOwner: true,
      permissions: new Set<string>(['finance.view_all_members']),
      viewerMembershipId: memberA1.id,
    };
    const managerView = await financeService.getMemberStatement(
      tenantA.slug,
      memberA2.id,
      '2026-11',
      managerContext
    );
    assert.equal(managerView.membershipId, memberA2.id);
  });

  // 11. Cross-Tenant Isolation
  test('11. Tenant B cannot access or modify Tenant A financial bills or payments', async () => {
    const listB = await financeService.listMemberBills(tenantB.slug, '2026-11');
    assert.equal(listB.length, 0);

    const paymentsB = await financeService.listPayments(tenantB.slug, { month: '2026-11' });
    assert.equal(paymentsB.length, 0);

    // Tenant B cannot access Tenant A's member statement
    await assert.rejects(
      async () => {
        await financeService.getMemberStatement(tenantB.slug, memberA1.id, '2026-11');
      },
      (err: any) => err instanceof NotFoundError
    );
  });
});
