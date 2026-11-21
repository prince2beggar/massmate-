import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MealService } from './meal-service';
import {
  isMealCutoffPassed,
  calculateExactMealRate,
  getDhakaDateString,
  getDhakaMonthString,
  getNextDayString,
} from './meal-utils';
import { ValidationError, ConflictError } from '@/server/api/errors';

describe('Task 33: Meal Management System Tests', () => {
  let mealService: MealService;

  const tenantA = { id: 'tenant_a', slug: 'green-mess', name: 'Green Bachelor Mess' };
  const tenantB = { id: 'tenant_b', slug: 'blue-mess', name: 'Blue Bachelor Mess' };

  const memberA1 = {
    id: 'mem_a1',
    tenantId: tenantA.id,
    userId: 'user_a1',
    user: { name: 'Rahim Khan', email: 'rahim@test.com', phone: '+8801700000001' },
    status: 'ACTIVE',
    memberCode: 'GRN-001',
  };

  const memberA2 = {
    id: 'mem_a2',
    tenantId: tenantA.id,
    userId: 'user_a2',
    user: { name: 'Karim Ullah', email: 'karim@test.com', phone: '+8801700000002' },
    status: 'ACTIVE',
    memberCode: 'GRN-002',
  };

  const memberB1 = {
    id: 'mem_b1',
    tenantId: tenantB.id,
    userId: 'user_b1',
    user: { name: 'Shafiqul Islam', email: 'shafiq@test.com', phone: '+8801700000003' },
    status: 'ACTIVE',
    memberCode: 'BLU-001',
  };

  beforeEach(() => {
    MealService.resetInMemoryStorage();
    MealService.seedMockTenant(tenantA);
    MealService.seedMockTenant(tenantB);
    MealService.seedMockMembership(memberA1);
    MealService.seedMockMembership(memberA2);
    MealService.seedMockMembership(memberB1);

    mealService = new MealService();
  });

  // 1. Meal Settings Get & Update
  test('1. Meal settings initializes defaults and updates with validation', async () => {
    const defaultSettings = await mealService.getMealSettings(tenantA.slug);
    assert.equal(defaultSettings.mealSystem, 'FLEXIBLE');
    assert.equal(defaultSettings.breakfastWeight, 0.5);
    assert.equal(defaultSettings.lunchWeight, 1.0);
    assert.equal(defaultSettings.dinnerWeight, 1.0);
    assert.equal(defaultSettings.defaultCutoffTime, '20:00');
    assert.equal(defaultSettings.guestMealFixedRatePoisha, '8000');

    // Update settings
    const updated = await mealService.updateMealSettings(
      tenantA.slug,
      {
        breakfastWeight: 0.6,
        defaultCutoffTime: '21:00',
        guestMealFixedRatePoisha: 9000,
      },
      'admin_user_1'
    );

    assert.equal(updated.breakfastWeight, 0.6);
    assert.equal(updated.defaultCutoffTime, '21:00');
    assert.equal(updated.guestMealFixedRatePoisha, '9000');
    assert.equal(updated.guestMealFixedRateTaka, 90.0);

    // Negative weight validation
    await assert.rejects(
      async () => {
        await mealService.updateMealSettings(
          tenantA.slug,
          { breakfastWeight: -0.5 },
          'admin_user_1'
        );
      },
      (err: any) => err instanceof ValidationError && err.message.includes('negative')
    );
  });

  // 2. Flexible mode daily recording
  test('2. Flexible mode records meal counts and calculates exact weighted units', async () => {
    const today = getDhakaDateString();

    const saveResult = await mealService.saveDailyMealSheet(
      tenantA.slug,
      {
        dateString: today,
        breakfastMenu: 'Dim Khichuri',
        lunchMenu: 'Rui Macher Jhol, Bhat, Dal',
        dinnerMenu: 'Murgir Mangsho, Ruti',
        entries: [
          {
            membershipId: memberA1.id,
            breakfastCount: 1, // 1 * 0.5 = 0.5
            lunchCount: 2, // 2 * 1.0 = 2.0
            dinnerCount: 1, // 1 * 1.0 = 1.0  => total 3.5 units
          },
          {
            membershipId: memberA2.id,
            breakfastCount: 0,
            lunchCount: 1,
            dinnerCount: 1, // => total 2.0 units
          },
        ],
      },
      'admin_user_1',
      true // admin override
    );

    assert.equal(saveResult.success, true);
    assert.equal(saveResult.savedCount, 2);

    const sheet = await mealService.getDailyMealSheet(tenantA.slug, today);
    assert.equal(sheet.summary.totalBreakfast, 1);
    assert.equal(sheet.summary.totalLunch, 3);
    assert.equal(sheet.summary.totalDinner, 2);
    assert.equal(sheet.summary.totalChargeableUnits, 5.5);

    const rahimEntry = sheet.memberEntries.find((m) => m.membershipId === memberA1.id);
    assert.ok(rahimEntry);
    assert.equal(rahimEntry.totalChargeableUnits, 3.5);
  });

  // 3. Fixed mode meal sheet
  test('3. Fixed mode initializes full entitlement for all active members', async () => {
    await mealService.updateMealSettings(
      tenantA.slug,
      { mealSystem: 'FIXED' },
      'admin_user_1'
    );

    const today = getDhakaDateString();
    const sheet = await mealService.getDailyMealSheet(tenantA.slug, today);

    assert.equal(sheet.settings.mealSystem, 'FIXED');
    // Active members without prior entries default to participating (1 for all enabled meals)
    assert.equal(sheet.memberEntries.length, 2);
    for (const m of sheet.memberEntries) {
      assert.equal(m.breakfastCount, 1);
      assert.equal(m.lunchCount, 1);
      assert.equal(m.dinnerCount, 1);
    }
  });

  // 4. Dhaka cutoff time enforcement
  test('4. Dhaka cutoff time blocks non-admin updates for past/late dates', async () => {
    const yesterday = '2026-01-01'; // clearly past date

    await assert.rejects(
      async () => {
        await mealService.saveDailyMealSheet(
          tenantA.slug,
          {
            dateString: yesterday,
            entries: [{ membershipId: memberA1.id, breakfastCount: 1 }],
          },
          'member_user_1',
          false // non-admin
        );
      },
      (err: any) => err instanceof ValidationError && err.message.includes('cutoff')
    );

    // Admin override succeeds even for past dates
    const adminSave = await mealService.saveDailyMealSheet(
      tenantA.slug,
      {
        dateString: yesterday,
        entries: [{ membershipId: memberA1.id, breakfastCount: 1 }],
      },
      'admin_user_1',
      true // admin override
    );
    assert.equal(adminSave.success, true);
  });

  // 5. Meal-off request creation with cutoff validation
  test('5. Meal-off request creation in future dates succeeds and auto-approves', async () => {
    // 5 days in future
    const futureDate = '2026-12-10';
    const futureEnd = '2026-12-12';

    const req = await mealService.createMealOffRequest(
      tenantA.slug,
      {
        membershipId: memberA1.id,
        startDate: futureDate,
        endDate: futureEnd,
        reason: 'Going to village home for family function',
      },
      memberA1.userId
    );

    assert.equal(req.status, 'APPROVED'); // default auto-approve enabled
    assert.equal(req.startDate, futureDate);
    assert.equal(req.endDate, futureEnd);

    // Verify daily meal sheet for that future date reflects meal-off
    const sheet = await mealService.getDailyMealSheet(tenantA.slug, futureDate);
    const rahim = sheet.memberEntries.find((m) => m.membershipId === memberA1.id);
    assert.ok(rahim);
    assert.equal(rahim.hasMealOff, true);
    assert.equal(rahim.totalChargeableUnits, 0);
  });

  // 6. Late meal-off request rejection
  test('6. Late meal-off request rejected when past cutoff without admin privilege', async () => {
    const pastDate = '2026-01-01';

    await assert.rejects(
      async () => {
        await mealService.createMealOffRequest(
          tenantA.slug,
          {
            membershipId: memberA1.id,
            startDate: pastDate,
            endDate: pastDate,
            reason: 'Late notice',
          },
          memberA1.userId,
          false // non-admin
        );
      },
      (err: any) => err instanceof ValidationError && err.message.includes('deadline')
    );
  });

  // 7. Manual review of meal-off request
  test('7. Manual review workflow: approval zeroes meal counts, rejection requires note', async () => {
    // Disable auto-approve
    await mealService.updateMealSettings(
      tenantA.slug,
      { autoApproveMealOff: false },
      'admin_user_1'
    );

    const futureDate = '2026-12-20';
    const req = await mealService.createMealOffRequest(
      tenantA.slug,
      {
        membershipId: memberA2.id,
        startDate: futureDate,
        endDate: futureDate,
        reason: 'Office tour',
      },
      memberA2.userId,
      false
    );

    assert.equal(req.status, 'PENDING');

    // Rejecting without note must fail
    await assert.rejects(
      async () => {
        await mealService.reviewMealOffRequest(
          tenantA.slug,
          req.id,
          'REJECTED',
          '',
          'admin_user_1'
        );
      },
      (err: any) => err instanceof ValidationError && err.message.includes('reason note')
    );

    // Approve the request
    const approved = await mealService.reviewMealOffRequest(
      tenantA.slug,
      req.id,
      'APPROVED',
      'Approved for official tour',
      'admin_user_1'
    );

    assert.equal(approved.status, 'APPROVED');
    assert.equal(approved.reviewedByName, null); // mock id without db user record
  });

  // 8. Guest meal recording & exact poisha math
  test('8. Guest meal recording is separate from member count with exact poisha math', async () => {
    const today = getDhakaDateString();

    const guestMeal = await mealService.recordGuestMeal(
      tenantA.slug,
      {
        hostMembershipId: memberA1.id,
        guestName: 'Friend Tanvir',
        dateString: today,
        mealType: 'LUNCH',
        count: 2,
        unitRatePoisha: 8500, // ৳85
        isPaid: true,
        paymentNote: 'Paid in cash to mess manager',
      },
      'admin_user_1'
    );

    assert.equal(guestMeal.count, 2);
    assert.equal(guestMeal.unitRatePoisha, '8500');
    assert.equal(guestMeal.unitRateTaka, 85.0);
    assert.equal(guestMeal.totalAmountPoisha, '17000'); // 2 * 8500
    assert.equal(guestMeal.totalAmountTaka, 170.0);
    assert.equal(guestMeal.isPaid, true);

    const list = await mealService.listGuestMeals(tenantA.slug, { dateString: today });
    assert.equal(list.length, 1);
    assert.equal(list[0].guestName, 'Friend Tanvir');
  });

  // 9. Exact meal rate formula calculation
  test('9. Meal rate calculation: exact formula = Eligible Expenses / Total Chargeable Units', async () => {
    const month = '2026-11';

    // Seed eligible expenses:
    // Bazar 1: ৳6,000 = 600,000 poisha
    // Bazar 2: ৳4,000 = 400,000 poisha
    // Total eligible expenses = ৳10,000 = 1,000,000 poisha
    MealService.seedMockExpenses(tenantA.id, [
      {
        id: 'exp_1',
        category: 'BAZAR',
        amountPoisha: BigInt(600000),
        dateString: '2026-11-05',
        description: 'Weekly grocery',
      },
      {
        id: 'exp_2',
        category: 'GROCERY',
        amountPoisha: BigInt(400000),
        dateString: '2026-11-12',
        description: 'Rice & Oil sack',
      },
    ]);

    // Save meal entries for November:
    // Rahim: 100 meals = 100 units
    // Karim: 100 meals = 100 units
    // Total chargeable units = 200 units
    await mealService.saveDailyMealSheet(
      tenantA.slug,
      {
        dateString: '2026-11-01',
        entries: [
          { membershipId: memberA1.id, lunchCount: 50, dinnerCount: 50 },
          { membershipId: memberA2.id, lunchCount: 50, dinnerCount: 50 },
        ],
      },
      'admin_user_1',
      true
    );

    const calc = await mealService.getMealRateCalculation(tenantA.slug, month);
    assert.equal(calc.totalChargeableUnits, 200);
    assert.equal(calc.totalEligibleExpensesPoisha, '1000000');
    assert.equal(calc.totalEligibleExpensesTaka, 10000.0);

    // Rate = 1,000,000 poisha / 200 units = 5,000 poisha = ৳50.00
    assert.equal(calc.calculatedMealRatePoisha, '5000');
    assert.equal(calc.calculatedMealRateTaka, 50.0);
  });

  // 10. Safe division when zero meal units
  test('10. Meal rate calculation handles zero meal units safely without NaN or Infinity', async () => {
    const emptyMonth = '2027-05';
    const calc = await mealService.getMealRateCalculation(tenantA.slug, emptyMonth);

    assert.equal(calc.totalChargeableUnits, 0);
    assert.equal(calc.calculatedMealRatePoisha, '0');
    assert.equal(calc.calculatedMealRateTaka, 0);
  });

  // 11. Eligible expense category filtering
  test('11. Eligible expense filtering excludes non-meal expenses (e.g. rent, wifi)', async () => {
    const month = '2026-11';

    MealService.seedMockExpenses(tenantA.id, [
      {
        id: 'exp_bazar',
        category: 'BAZAR',
        amountPoisha: BigInt(500000), // ৳5,000 (Eligible)
        dateString: '2026-11-02',
      },
      {
        id: 'exp_rent',
        category: 'ROOM_RENT',
        amountPoisha: BigInt(2000000), // ৳20,000 (Ineligible)
        dateString: '2026-11-02',
      },
      {
        id: 'exp_wifi',
        category: 'WIFI',
        amountPoisha: BigInt(100000), // ৳1,000 (Ineligible)
        dateString: '2026-11-02',
      },
    ]);

    await mealService.saveDailyMealSheet(
      tenantA.slug,
      {
        dateString: '2026-11-02',
        entries: [{ membershipId: memberA1.id, lunchCount: 50, dinnerCount: 50 }], // 100 units
      },
      'admin_user_1',
      true
    );

    const calc = await mealService.getMealRateCalculation(tenantA.slug, month);
    // Only BAZAR (500,000 poisha) should be included!
    assert.equal(calc.totalEligibleExpensesPoisha, '500000');
    assert.equal(calc.totalEligibleExpensesTaka, 5000.0);
    // Rate = 500,000 / 100 = 5,000 poisha = ৳50.00
    assert.equal(calc.calculatedMealRatePoisha, '5000');
    assert.equal(calc.calculatedMealRateTaka, 50.0);
  });

  // 12. Period locking (Month Close)
  test('12. Monthly period lock freezes calculation and blocks record mutations', async () => {
    const month = '2026-11';

    // Lock the month
    const lockResult = await mealService.lockMealPeriod(
      tenantA.slug,
      month,
      'admin_user_1',
      'November accounts closed'
    );

    assert.equal(lockResult.isLocked, true);

    // Attempting to save meal entries for November must now be rejected
    await assert.rejects(
      async () => {
        await mealService.saveDailyMealSheet(
          tenantA.slug,
          {
            dateString: '2026-11-15',
            entries: [{ membershipId: memberA1.id, lunchCount: 1 }],
          },
          'admin_user_1',
          true
        );
      },
      (err: any) => err instanceof ConflictError && err.message.includes('locked')
    );

    // Attempting to record guest meal for locked month must be rejected
    await assert.rejects(
      async () => {
        await mealService.recordGuestMeal(
          tenantA.slug,
          {
            hostMembershipId: memberA1.id,
            guestName: 'Guest 2',
            dateString: '2026-11-15',
            mealType: 'DINNER',
            count: 1,
          },
          'admin_user_1'
        );
      },
      (err: any) => err instanceof ConflictError && err.message.includes('locked')
    );
  });

  // 13. Period unlocking with mandatory reason
  test('13. Period unlocking requires mandatory reason and restores mutation capability', async () => {
    const month = '2026-11';
    await mealService.lockMealPeriod(tenantA.slug, month, 'admin_user_1');

    // Unlocking without reason must fail
    await assert.rejects(
      async () => {
        await mealService.unlockMealPeriod(tenantA.slug, month, 'admin_user_1', '');
      },
      (err: any) => err instanceof ValidationError && err.message.includes('reason')
    );

    // Unlocking with valid reason succeeds
    const unlockResult = await mealService.unlockMealPeriod(
      tenantA.slug,
      month,
      'admin_user_1',
      'Correcting misplaced meal count for Rahim'
    );

    assert.equal(unlockResult.isLocked, false);

    // Mutations work again
    const saveAfterUnlock = await mealService.saveDailyMealSheet(
      tenantA.slug,
      {
        dateString: '2026-11-15',
        entries: [{ membershipId: memberA1.id, lunchCount: 1 }],
      },
      'admin_user_1',
      true
    );
    assert.equal(saveAfterUnlock.success, true);
  });

  // 14. Monthly meal summary matrix
  test('14. Monthly meal summary aggregates individual member units, meal-offs and estimated bills', async () => {
    const month = '2026-11';

    MealService.seedMockExpenses(tenantA.id, [
      {
        id: 'exp_bazar',
        category: 'BAZAR',
        amountPoisha: BigInt(1000000), // ৳10,000
        dateString: '2026-11-01',
      },
    ]);

    await mealService.saveDailyMealSheet(
      tenantA.slug,
      {
        dateString: '2026-11-01',
        entries: [
          { membershipId: memberA1.id, breakfastCount: 1, lunchCount: 1, dinnerCount: 1 }, // 2.5 units
          { membershipId: memberA2.id, breakfastCount: 0, lunchCount: 1, dinnerCount: 1 }, // 2.0 units
        ],
      },
      'admin_user_1',
      true
    );

    const summary = await mealService.getMonthlyMealSummary(tenantA.slug, month);
    assert.equal(summary.membersSummary.length, 2);

    const rahim = summary.membersSummary.find((m) => m.membershipId === memberA1.id);
    assert.ok(rahim);
    assert.equal(rahim.totalBreakfast, 1);
    assert.equal(rahim.totalLunch, 1);
    assert.equal(rahim.totalDinner, 1);
    assert.equal(rahim.totalChargeableUnits, 2.5);
    assert.ok(rahim.estimatedCostTaka > 0);
  });

  // 15. Cross-tenant isolation
  test('15. Tenant B cannot view or modify Tenant A meal records or settings', async () => {
    // Tenant A customizes settings
    await mealService.updateMealSettings(
      tenantA.slug,
      { breakfastWeight: 0.75, defaultCutoffTime: '22:00' },
      'admin_user_a'
    );

    // Tenant B settings remain completely isolated and default
    const tenantBSettings = await mealService.getMealSettings(tenantB.slug);
    assert.equal(tenantBSettings.breakfastWeight, 0.5);
    assert.equal(tenantBSettings.defaultCutoffTime, '20:00');

    // Tenant A records meal entries
    const today = getDhakaDateString();
    await mealService.saveDailyMealSheet(
      tenantA.slug,
      {
        dateString: today,
        entries: [{ membershipId: memberA1.id, lunchCount: 1 }],
      },
      'admin_user_a',
      true
    );

    // Tenant B's meal sheet has Tenant B's members only, not Tenant A's
    const tenantBSheet = await mealService.getDailyMealSheet(tenantB.slug, today);
    assert.equal(tenantBSheet.memberEntries.length, 1);
    assert.equal(tenantBSheet.memberEntries[0].membershipId, memberB1.id);
  });
});
