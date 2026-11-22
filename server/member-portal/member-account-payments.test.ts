import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  MemberPortalService,
  toPoisha,
  fromPoisha,
  formatBdtCurrency,
  type MemberAccountOverviewDto,
  type MemberPaymentRecordDto,
} from './member-portal-service';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../api/errors';

describe('Task 40 — My Account, Monthly Statements, Billing & Payments', () => {
  let service: MemberPortalService;

  beforeEach(() => {
    // Instantiate fresh service with seeded mock data
    service = new MemberPortalService(null as any);
  });

  describe('Account Overview & Monthly Statement (getMemberAccountOverview)', () => {
    it('retrieves the authenticated member account statement with zero-drift totals', async () => {
      const overview = await service.getMemberAccountOverview('usr_resident_1', 'prince-mess', '2026-11');

      assert.ok(overview);
      assert.strictEqual(overview.statementMetadata.memberName, 'Tanvir Ahmed');
      assert.strictEqual(overview.statementMetadata.memberCode, 'PR-101');
      assert.strictEqual(overview.statementMetadata.tenantSlug, 'prince-mess');
      assert.strictEqual(overview.period.monthString, '2026-11');

      // Check itemized charges
      assert.strictEqual(overview.totals.openingDueTaka, 0);
      assert.strictEqual(overview.totals.rentChargesTaka, 4500);
      assert.strictEqual(overview.totals.utilityChargesTaka, 750);
      assert.strictEqual(overview.totals.mealChargesTaka, 3000);
      assert.strictEqual(overview.totals.totalNewChargesTaka, 8250);
      assert.strictEqual(overview.totals.totalBilledTaka, 8250);

      // Check confirmed payments vs closing balance
      assert.strictEqual(overview.totals.confirmedPaidTaka, 5000);
      assert.strictEqual(overview.totals.closingBalanceTaka, 3250); // 8250 - 5000
      assert.strictEqual(overview.totals.dueStatus, 'DUE');
      assert.strictEqual(overview.totals.isZeroDrift, true);

      // Check itemized line items
      assert.ok(overview.items.length >= 3);
      assert.ok(overview.items.some((it) => it.categoryName === 'Room Rent' && it.amountTaka === 4500));
    });

    it('enforces that closing balance follows authoritative formula: Opening + Charges - Confirmed Payments - Credits', async () => {
      const overview = await service.getMemberAccountOverview('usr_resident_1', 'prince-mess', '2026-11');
      const { openingDueTaka, totalNewChargesTaka, confirmedPaidTaka, creditAdjustmentTaka, closingBalanceTaka } = overview.totals;

      const expectedClosing = openingDueTaka + totalNewChargesTaka - confirmedPaidTaka - creditAdjustmentTaka;
      assert.strictEqual(closingBalanceTaka, expectedClosing);
    });

    it('distinguishes pending payments from confirmed payments (pending does NOT reduce confirmed due)', async () => {
      const overview = await service.getMemberAccountOverview('usr_resident_1', 'prince-mess', '2026-11');

      // Member has a pending payment (pay_2: ৳2,000)
      assert.strictEqual(overview.totals.pendingPaidTaka, 2000);
      // Confirmed paid is strictly ৳5,000 (pay_1)
      assert.strictEqual(overview.totals.confirmedPaidTaka, 5000);
      // Closing balance must remain ৳3,250 (8250 - 5000), unaffected by the ৳2,000 pending payment
      assert.strictEqual(overview.totals.closingBalanceTaka, 3250);
    });

    it('retrieves fully settled past period statement with zero due', async () => {
      const overview = await service.getMemberAccountOverview('usr_resident_1', 'prince-mess', '2026-10');

      assert.strictEqual(overview.period.monthString, '2026-10');
      assert.strictEqual(overview.totals.totalNewChargesTaka, 8050);
      assert.strictEqual(overview.totals.confirmedPaidTaka, 8050);
      assert.strictEqual(overview.totals.closingBalanceTaka, 0);
      assert.strictEqual(overview.totals.dueStatus, 'PAID');
    });

    it('provides available billing periods for selector navigation', async () => {
      const overview = await service.getMemberAccountOverview('usr_resident_1', 'prince-mess');

      assert.ok(overview.availablePeriods.length >= 2);
      assert.ok(overview.availablePeriods.some((p) => p.monthString === '2026-11'));
      assert.ok(overview.availablePeriods.some((p) => p.monthString === '2026-10'));
    });

    it('strictly isolates statements: user from another mess cannot view this statement', async () => {
      await assert.rejects(
        async () => {
          // usr_resident_1 belongs only to prince-mess, not green-villa-mess
          await service.getMemberAccountOverview('usr_resident_1', 'green-villa-mess', '2026-11');
        },
        (err: any) => err instanceof ForbiddenError || err instanceof NotFoundError
      );
    });

    it('rejects malformed month formats with ValidationError', async () => {
      await assert.rejects(
        async () => {
          await service.getMemberAccountOverview('usr_resident_1', 'prince-mess', 'invalid-month');
        },
        (err: any) => err instanceof ValidationError && err.message.includes('Invalid month format')
      );
    });
  });

  describe('Payment History (listMemberPayments)', () => {
    it('lists only payments belonging to the authenticated member (Anti-IDOR)', async () => {
      const payments = await service.listMemberPayments('usr_resident_1', 'prince-mess');

      assert.ok(payments.length >= 2);
      assert.ok(payments.every((p) => typeof p.amountTaka === 'number' && p.amountTaka > 0));

      // Checks confirmed pay_1
      const pay1 = payments.find((p) => p.id === 'pay_1');
      assert.ok(pay1);
      assert.strictEqual(pay1.status, 'CONFIRMED');
      assert.strictEqual(pay1.amountTaka, 5000);
      assert.strictEqual(pay1.isOfficialReceiptAvailable, true);
      assert.ok(pay1.receiptNumber?.startsWith('RCP-'));

      // Checks pending pay_2
      const pay2 = payments.find((p) => p.id === 'pay_2');
      assert.ok(pay2);
      assert.strictEqual(pay2.status, 'PENDING');
      assert.strictEqual(pay2.amountTaka, 2000);
      assert.strictEqual(pay2.isOfficialReceiptAvailable, false);
      assert.strictEqual(pay2.receiptNumber, null);
    });

    it('filters payments by status', async () => {
      const confirmedOnly = await service.listMemberPayments('usr_resident_1', 'prince-mess', { status: 'CONFIRMED' });
      assert.ok(confirmedOnly.every((p) => p.status === 'CONFIRMED'));

      const pendingOnly = await service.listMemberPayments('usr_resident_1', 'prince-mess', { status: 'PENDING' });
      assert.ok(pendingOnly.every((p) => p.status === 'PENDING'));
    });

    it('never leaks payment history across tenants', async () => {
      await assert.rejects(
        async () => {
          await service.listMemberPayments('usr_resident_1', 'green-villa-mess');
        },
        (err: any) => err instanceof ForbiddenError || err instanceof NotFoundError
      );
    });
  });

  describe('Manual Payment Submission (submitMemberPayment)', () => {
    it('submits a manual mobile banking payment voucher with status PENDING', async () => {
      const payment = await service.submitMemberPayment('usr_resident_1', 'prince-mess', {
        amountTaka: 1500,
        paymentMethod: 'BKASH',
        transactionId: 'TRX-BKASH-NEW999',
        paymentDate: '2026-11-21',
        notes: 'Room electricity share',
      });

      assert.ok(payment);
      assert.strictEqual(payment.amountTaka, 1500);
      assert.strictEqual(payment.paymentMethod, 'BKASH');
      assert.strictEqual(payment.transactionId, 'TRX-BKASH-NEW999');
      assert.strictEqual(payment.status, 'PENDING');
      assert.strictEqual(payment.isOfficialReceiptAvailable, false);
      assert.strictEqual(payment.receiptNumber, null);
    });

    it('submits a cash payment voucher without requiring transaction ID', async () => {
      const payment = await service.submitMemberPayment('usr_resident_1', 'prince-mess', {
        amountTaka: 500,
        paymentMethod: 'CASH',
        paymentDate: '2026-11-21',
        notes: 'Handed over cash to manager',
      });

      assert.ok(payment);
      assert.strictEqual(payment.amountTaka, 500);
      assert.strictEqual(payment.paymentMethod, 'CASH');
      assert.strictEqual(payment.status, 'PENDING');
    });

    it('rejects digital payments (bKash/Nagad/Rocket/Bank) missing transaction ID', async () => {
      await assert.rejects(
        async () => {
          await service.submitMemberPayment('usr_resident_1', 'prince-mess', {
            amountTaka: 1000,
            paymentMethod: 'BKASH',
            transactionId: '', // missing
            paymentDate: '2026-11-21',
          });
        },
        (err: any) => err instanceof ValidationError && err.message.includes('Transaction/Reference ID is required')
      );
    });

    it('rejects duplicate transaction ID in the same mess with ConflictError', async () => {
      await assert.rejects(
        async () => {
          await service.submitMemberPayment('usr_resident_1', 'prince-mess', {
            amountTaka: 3000,
            paymentMethod: 'BKASH',
            transactionId: 'TRX-BKASH-78901', // Already recorded in pay_1
            paymentDate: '2026-11-21',
          });
        },
        (err: any) => err instanceof ConflictError && err.message.includes('has already been recorded')
      );
    });

    it('rejects zero or negative payment amounts', async () => {
      await assert.rejects(
        async () => {
          await service.submitMemberPayment('usr_resident_1', 'prince-mess', {
            amountTaka: 0,
            paymentMethod: 'BKASH',
            transactionId: 'TRX-VALID-1234',
            paymentDate: '2026-11-21',
          });
        },
        (err: any) => err instanceof ValidationError && err.message.includes('greater than zero')
      );

      await assert.rejects(
        async () => {
          await service.submitMemberPayment('usr_resident_1', 'prince-mess', {
            amountTaka: -500,
            paymentMethod: 'BKASH',
            transactionId: 'TRX-VALID-1234',
            paymentDate: '2026-11-21',
          });
        },
        (err: any) => err instanceof ValidationError && err.message.includes('greater than zero')
      );
    });

    it('rejects payment dates in the future', async () => {
      await assert.rejects(
        async () => {
          await service.submitMemberPayment('usr_resident_1', 'prince-mess', {
            amountTaka: 1000,
            paymentMethod: 'BKASH',
            transactionId: 'TRX-VALID-9999',
            paymentDate: '2030-01-01', // Far future
          });
        },
        (err: any) => err instanceof ValidationError && err.message.includes('future')
      );
    });

    it('rejects ONLINE_GATEWAY as unavailable when direct provider is not active', async () => {
      await assert.rejects(
        async () => {
          await service.submitMemberPayment('usr_resident_1', 'prince-mess', {
            amountTaka: 1000,
            paymentMethod: 'ONLINE_GATEWAY' as any,
            paymentDate: '2026-11-21',
          });
        },
        (err: any) => err instanceof ValidationError && err.message.includes('gateway is currently not active')
      );
    });
  });

  describe('Official Payment Receipt (getMemberPaymentReceipt)', () => {
    it('generates an official verified payment receipt for CONFIRMED payment', async () => {
      const receipt = await service.getMemberPaymentReceipt('usr_resident_1', 'prince-mess', 'pay_1');

      assert.ok(receipt);
      assert.strictEqual(receipt.status, 'CONFIRMED');
      assert.strictEqual(receipt.paymentId, 'pay_1');
      assert.strictEqual(receipt.amountTaka, 5000);
      assert.strictEqual(receipt.paymentMethod, 'BKASH');
      assert.strictEqual(receipt.transactionId, 'TRX-BKASH-78901');
      assert.strictEqual(receipt.memberName, 'Tanvir Ahmed');
      assert.strictEqual(receipt.memberCode, 'PR-101');
      assert.strictEqual(receipt.tenantName, 'Prince Mess');
      assert.ok(receipt.receiptNumber.startsWith('RCP-'));
      assert.strictEqual(receipt.amountInWords, 'Five Thousand Taka Only');
    });

    it('strictly forbids generating an official receipt for PENDING payment', async () => {
      await assert.rejects(
        async () => {
          // pay_2 is PENDING
          await service.getMemberPaymentReceipt('usr_resident_1', 'prince-mess', 'pay_2');
        },
        (err: any) => err instanceof ConflictError && err.message.includes('only issued for confirmed')
      );
    });

    it('enforces Anti-IDOR: resident cannot view receipt of another member', async () => {
      // Seed payment belonging to another member
      service.mockPayments.push({
        id: 'pay_other_user',
        membershipId: 'mem_other_user',
        tenantId: 'tenant_prince_mess',
        amountPoisha: BigInt(300000),
        paymentMethod: 'CASH',
        status: 'CONFIRMED',
        createdAt: new Date(),
      });

      await assert.rejects(
        async () => {
          await service.getMemberPaymentReceipt('usr_resident_1', 'prince-mess', 'pay_other_user');
        },
        (err: any) => err instanceof ForbiddenError
      );
    });
  });
});
