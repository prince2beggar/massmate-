import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DocumentService,
  CreateDocumentInput,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../documents/document-service';
import {
  BudgetService,
  CreateBudgetInput,
  UpdateBudgetInput,
  ReviewBudgetInput,
} from '../budget/budget-service';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from '../api/errors';

describe('Task 46 — Document Vault & Budget Management System', () => {
  let docService: DocumentService;
  let budgetService: BudgetService;

  beforeEach(() => {
    // Fresh service instances with seeded mock data
    docService = new DocumentService(null as any);
    budgetService = new BudgetService(null as any);
  });

  // ===========================================================================
  // PART A: DOCUMENT VAULT
  // ===========================================================================
  describe('Part A — Document Vault', () => {
    describe('1. Tenant Isolation & Access Boundaries', () => {
      it('Prince Mess cannot access Green Villa documents', async () => {
        const princeDocs = await docService.listDocuments('prince-mess', {}, true);
        assert.ok(princeDocs.documents.length >= 3);
        for (const doc of princeDocs.documents) {
          assert.strictEqual(doc.tenantId, 'tenant_prince_mess');
        }

        // Green Villa has only its own document (doc_green_1)
        const greenDocs = await docService.listDocuments('green-villa-mess', {}, true);
        assert.strictEqual(greenDocs.documents.length, 1);
        assert.strictEqual(greenDocs.documents[0].tenantId, 'tenant_green_villa');

        // Accessing Prince Mess doc from Green Villa slug throws NotFoundError
        await assert.rejects(
          async () => {
            await docService.getDocumentById('green-villa-mess', 'doc_seed_1', true);
          },
          (err: any) => {
            assert.ok(err instanceof NotFoundError);
            return true;
          }
        );
      });

      it('rejects vault operations on suspended mess tenants with ForbiddenError', async () => {
        await assert.rejects(
          async () => {
            await docService.listDocuments('suspended-mess', {}, true);
          },
          (err: any) => {
            assert.ok(err instanceof ForbiddenError);
            assert.match(err.message, /suspended/i);
            return true;
          }
        );
      });
    });

    describe('2. Client & Server File Type and Size Validation', () => {
      it('accepts all allowed file extensions (pdf, jpg, jpeg, png, doc, docx, xls, xlsx)', async () => {
        for (const ext of ALLOWED_FILE_TYPES) {
          const doc = await docService.createDocument('prince-mess', 'usr_owner_1', {
            title: `Valid Test File ${ext.toUpperCase()}`,
            categoryId: 'cat_seed_1',
            fileName: `sample_contract.${ext}`,
            fileType: ext,
            fileSizeBytes: 50000,
            visibility: 'OWNER_ADMIN',
          });
          assert.ok(doc.id);
          assert.strictEqual(doc.fileType, ext);
        }
      });

      it('rejects dangerous and unsupported file types with ValidationError', async () => {
        const dangerousExts = ['exe', 'bat', 'sh', 'js', 'py', 'php', 'zip'];
        for (const ext of dangerousExts) {
          await assert.rejects(
            async () => {
              await docService.createDocument('prince-mess', 'usr_owner_1', {
                title: 'Malicious Payload',
                categoryId: 'cat_seed_1',
                fileName: `script.${ext}`,
                fileType: ext,
                fileSizeBytes: 1000,
              });
            },
            (err: any) => {
              assert.ok(err instanceof ValidationError);
              assert.match(err.message, /unsupported file type/i);
              return true;
            }
          );
        }
      });

      it('rejects files exceeding 15MB with ValidationError', async () => {
        const oversizeBytes = MAX_FILE_SIZE_BYTES + 1024; // > 15MB
        await assert.rejects(
          async () => {
            await docService.createDocument('prince-mess', 'usr_owner_1', {
              title: 'Huge Video File',
              categoryId: 'cat_seed_1',
              fileName: 'huge_document.pdf',
              fileType: 'pdf',
              fileSizeBytes: oversizeBytes,
            });
          },
          (err: any) => {
            assert.ok(err instanceof ValidationError);
            assert.match(err.message, /maximum allowed limit of 15 MB/i);
            return true;
          }
        );
      });
    });

    describe('3. Secure HMAC-SHA256 Signed URLs (Never Exposing Private URLs)', () => {
      it('generates valid HMAC-SHA256 signed access URLs', async () => {
        const doc = await docService.getDocumentById('prince-mess', 'doc_seed_1', true);
        assert.ok(doc.signedUrl);
        assert.match(doc.signedUrl, /\/documents\/doc_seed_1\/file\?token=/);
        assert.match(doc.signedUrl, /&expires=/);

        const url = new URL(doc.signedUrl, 'https://messmate.dev');
        const token = url.searchParams.get('token')!;
        const expires = parseInt(url.searchParams.get('expires')!, 10);

        assert.strictEqual(docService.verifySignedToken(doc.id, token, expires), true);
      });

      it('rejects expired or tampered signed URL tokens', () => {
        const docId = 'doc_seed_1';
        const futureExpires = Date.now() + 3600000;
        const validToken = docService.generateSignedToken(docId, futureExpires);

        // Tampered token
        const tamperedToken = validToken.substring(0, validToken.length - 2) + 'aa';
        assert.strictEqual(docService.verifySignedToken(docId, tamperedToken, futureExpires), false);

        // Expired timestamp
        const pastExpires = Date.now() - 1000;
        const expiredToken = docService.generateSignedToken(docId, pastExpires);
        assert.strictEqual(docService.verifySignedToken(docId, expiredToken, pastExpires), false);
      });
    });

    describe('4. Member Portal Privacy & IDOR Prevention', () => {
      it('allows resident to view MEMBER_VISIBLE documents', async () => {
        // doc_seed_2 is visibility: MEMBER_VISIBLE
        const result = await docService.listDocuments('prince-mess', {}, false, 'usr_resident_1');
        const visibleIds = result.documents.map((d) => d.id);
        assert.ok(visibleIds.includes('doc_seed_2'));
      });

      it('allows resident to view their own private contract (relatedMemberId match)', async () => {
        // doc_seed_3 has relatedMemberId: 'mem_resident_1' (linked to usr_resident_1)
        const result = await docService.listDocuments('prince-mess', {}, false, 'usr_resident_1');
        const visibleIds = result.documents.map((d) => d.id);
        assert.ok(visibleIds.includes('doc_seed_3'));
      });

      it('strictly hides another resident private document from unpermitted members', async () => {
        // Resident 2 (usr_resident_2) attempts to view Resident 1 private tenancy contract (doc_seed_3)
        const result = await docService.listDocuments('prince-mess', {}, false, 'usr_resident_2');
        const visibleIds = result.documents.map((d) => d.id);
        assert.strictEqual(visibleIds.includes('doc_seed_3'), false);

        // Direct getDocumentById throws NotFoundError
        await assert.rejects(
          async () => {
            await docService.getDocumentById('prince-mess', 'doc_seed_3', false, 'usr_resident_2');
          },
          (err: any) => {
            assert.ok(err instanceof NotFoundError);
            return true;
          }
        );
      });

      it('strictly hides OWNER_ADMIN internal documents from normal residents', async () => {
        // doc_seed_1 is OWNER_ADMIN
        const result = await docService.listDocuments('prince-mess', {}, false, 'usr_resident_1');
        const visibleIds = result.documents.map((d) => d.id);
        assert.strictEqual(visibleIds.includes('doc_seed_1'), false);

        await assert.rejects(
          async () => {
            await docService.getDocumentById('prince-mess', 'doc_seed_1', false, 'usr_resident_1');
          },
          (err: any) => {
            assert.ok(err instanceof NotFoundError);
            return true;
          }
        );
      });
    });

    describe('5. Configurable Categories & Lifecycle Management', () => {
      it('provides 11 standard seeded categories for mess administration', async () => {
        const categories = await docService.listCategories('prince-mess');
        assert.ok(categories.length >= 11);
        const slugs = categories.map((c) => c.slug);
        assert.ok(slugs.includes('rental-agreements'));
        assert.ok(slugs.includes('member-documents'));
        assert.ok(slugs.includes('utility-bills'));
        assert.ok(slugs.includes('bills-and-invoices'));
        assert.ok(slugs.includes('emergency-safety'));
      });

      it('allows creating custom categories and prevents duplicate slugs', async () => {
        const customCat = await docService.createCategory('prince-mess', {
          name: 'Cook Background Verification',
          description: 'Police clearance and health cards for kitchen staff',
        });
        assert.ok(customCat.id);
        assert.strictEqual(customCat.slug, 'cook-background-verification');

        await assert.rejects(
          async () => {
            await docService.createCategory('prince-mess', {
              name: 'Cook Background Verification',
            });
          },
          (err: any) => {
            assert.ok(err instanceof ConflictError);
            return true;
          }
        );
      });

      it('supports archiving documents non-destructively and permanent deletion', async () => {
        const doc = await docService.createDocument('prince-mess', 'usr_owner_1', {
          title: 'Temporary Fire Drill Certificate',
          categoryId: 'cat_seed_10',
          fileName: 'drill_cert.pdf',
          fileType: 'pdf',
          fileSizeBytes: 20000,
        });

        // Archive
        const archived = await docService.archiveDocument('prince-mess', doc.id, 'usr_owner_1');
        assert.strictEqual(archived.isArchived, true);

        // Excluded from standard listing
        const activeList = await docService.listDocuments('prince-mess', { includeArchived: false }, true);
        assert.strictEqual(activeList.documents.some((d) => d.id === doc.id), false);

        // Delete permanently
        const delRes = await docService.deleteDocument('prince-mess', doc.id, 'usr_owner_1');
        assert.strictEqual(delRes.success, true);

        await assert.rejects(
          async () => {
            await docService.getDocumentById('prince-mess', doc.id, true);
          },
          (err: any) => {
            assert.ok(err instanceof NotFoundError);
            return true;
          }
        );
      });
    });

    describe('6. Expiry Tracking & Notifications', () => {
      it('correctly tracks expiring soon and expired document statuses', async () => {
        const dashboard = await docService.getDocumentDashboard('prince-mess', 'usr_owner_1', true);
        assert.ok(dashboard.totalDocuments >= 3);
        assert.ok(dashboard.totalStorageBytes > 0);
        assert.ok(dashboard.formattedStorageUsed.includes('MB') || dashboard.formattedStorageUsed.includes('KB'));
        // doc_seed_2 is expiring within 7 days
        assert.ok(dashboard.expiringSoonCount >= 1);
      });

      it('dispatches deduplicated notifications for expiring documents', async () => {
        const sent = await docService.checkAndDispatchExpiryReminders('prince-mess');
        assert.ok(Array.isArray(sent));
        // Calling again should deduplicate
        const secondRun = await docService.checkAndDispatchExpiryReminders('prince-mess');
        assert.strictEqual(secondRun.length, 0);
      });
    });
  });

  // ===========================================================================
  // PART B: BUDGET MANAGEMENT
  // ===========================================================================
  describe('Part B — Budget Management', () => {
    describe('7. Tenant Isolation & Integer Poisha Financial Accuracy', () => {
      it('Prince Mess cannot view or modify Green Villa budgets', async () => {
        const princeBudgets = await budgetService.listBudgets('prince-mess');
        assert.ok(princeBudgets.items.length >= 1);
        for (const b of princeBudgets.items) {
          assert.strictEqual(b.tenantId, 'tenant_prince_mess');
        }

        const greenBudgets = await budgetService.listBudgets('green-villa-mess');
        assert.strictEqual(greenBudgets.items.length, 0);

        await assert.rejects(
          async () => {
            await budgetService.getBudgetById('green-villa-mess', 'bdg_seed_nov_2026');
          },
          (err: any) => {
            assert.ok(err instanceof NotFoundError);
            return true;
          }
        );
      });

      it('performs exact integer poisha arithmetic without floating-point artifacts', () => {
        const taka = 12500.75;
        const poisha = budgetService.takaToPoisha(taka);
        assert.strictEqual(poisha, BigInt(1250075));
        assert.strictEqual(budgetService.poishaToTaka(poisha), 12500.75);

        // Rejects negative amounts
        assert.throws(() => {
          budgetService.takaToPoisha(-100);
        }, ValidationError);
      });
    });

    describe('8. Budget Creation & Category Allocations', () => {
      it('creates monthly budget with valid category allocations', async () => {
        const newBudget = await budgetService.createBudget(
          'prince-mess',
          {
            name: 'December 2026 Mess Budget',
            periodType: 'MONTHLY',
            startDate: '2026-12-01',
            endDate: '2026-12-31',
            totalAmountTaka: 60000,
            description: 'Year-end dining and maintenance budget',
            approvalRequired: true,
            allocations: [
              { categoryName: 'Food and Groceries', allocatedAmountTaka: 30000 },
              { categoryName: 'Rent', allocatedAmountTaka: 15000 },
              { categoryName: 'Electricity', allocatedAmountTaka: 5000 },
              { categoryName: 'Internet', allocatedAmountTaka: 1000 },
              { categoryName: 'Maintenance', allocatedAmountTaka: 4000 },
            ],
          },
          'usr_accountant_1'
        );

        assert.ok(newBudget.id);
        assert.strictEqual(newBudget.totalAmountTaka, 60000);
        assert.strictEqual(newBudget.status, 'PENDING_APPROVAL');
        assert.strictEqual(newBudget.allocations.length, 5);
      });

      it('rejects budget creation when category allocations exceed total amount', async () => {
        await assert.rejects(
          async () => {
            await budgetService.createBudget(
              'prince-mess',
              {
                name: 'Exceeding Budget Plan',
                periodType: 'MONTHLY',
                startDate: '2026-12-01',
                endDate: '2026-12-31',
                totalAmountTaka: 10000,
                allocations: [
                  { categoryName: 'Food and Groceries', allocatedAmountTaka: 8000 },
                  { categoryName: 'Rent', allocatedAmountTaka: 5000 }, // 8k + 5k = 13k > 10k
                ],
              },
              'usr_accountant_1'
            );
          },
          (err: any) => {
            assert.ok(err instanceof ValidationError);
            assert.match(err.message, /cannot exceed total budget/i);
            return true;
          }
        );
      });
    });

    describe('9. Actual Expense Integration & Formulas', () => {
      it('calculates actual expenses strictly from approved eligible expenses', async () => {
        // Prince Mess has seeded Nov 2026 budget of 50,000 BDT
        // Seeded approved expenses: exp_1 (12,000 BDT Food) + exp_2 (3,500 BDT Elec) = 15,500 BDT
        // Seeded rejected/pending expenses (5,000 BDT + 2,000 BDT) MUST BE EXCLUDED!
        const budget = await budgetService.getBudgetById('prince-mess', 'bdg_seed_nov_2026');

        assert.strictEqual(budget.totalAmountTaka, 50000);
        assert.strictEqual(budget.actualSpentTaka, 15500); // 12000 + 3500
        assert.strictEqual(budget.remainingAmountTaka, 34500); // 50000 - 15500
        
        // Utilization = (15500 / 50000) * 100 = 31.00%
        assert.strictEqual(budget.utilizationPercent, 31);
      });

      it('category allocations accurately compute actual spent, remaining, and utilization', async () => {
        const budget = await budgetService.getBudgetById('prince-mess', 'bdg_seed_nov_2026');
        
        const foodAlloc = budget.allocations.find((a) => a.categoryName === 'Food and Groceries');
        assert.ok(foodAlloc);
        assert.strictEqual(foodAlloc.allocatedAmountTaka, 25000);
        assert.strictEqual(foodAlloc.actualSpentTaka, 12000);
        assert.strictEqual(foodAlloc.remainingAmountTaka, 13000);
        // (12000 / 25000) * 100 = 48.00%
        assert.strictEqual(foodAlloc.utilizationPercent, 48);
        assert.strictEqual(foodAlloc.isOverBudget, false);

        const elecAlloc = budget.allocations.find((a) => a.categoryName === 'Electricity');
        assert.ok(elecAlloc);
        assert.strictEqual(elecAlloc.allocatedAmountTaka, 4000);
        assert.strictEqual(elecAlloc.actualSpentTaka, 3500);
        assert.strictEqual(elecAlloc.remainingAmountTaka, 500);
        // (3500 / 4000) * 100 = 87.50%
        assert.strictEqual(elecAlloc.utilizationPercent, 87.5);
      });
    });

    describe('10. Approval Workflow & Self-Approval Prevention', () => {
      it('strictly prevents budget creator from approving their own budget', async () => {
        // Create budget by usr_accountant_1
        const budget = await budgetService.createBudget(
          'prince-mess',
          {
            name: 'Pending Review Budget',
            periodType: 'MONTHLY',
            startDate: '2026-12-01',
            endDate: '2026-12-31',
            totalAmountTaka: 40000,
            approvalRequired: true,
            allocations: [{ categoryName: 'Food and Groceries', allocatedAmountTaka: 20000 }],
          },
          'usr_accountant_1'
        );

        // usr_accountant_1 attempts self-approval
        await assert.rejects(
          async () => {
            await budgetService.reviewBudget(
              'prince-mess',
              budget.id,
              { decision: 'APPROVE' },
              'usr_accountant_1' // Creator self-approving!
            );
          },
          (err: any) => {
            assert.ok(err instanceof ForbiddenError);
            assert.match(err.message, /strictly prohibited from approving their own budget/i);
            return true;
          }
        );
      });

      it('allows authorized mess owner/manager to approve or reject budget', async () => {
        const budget = await budgetService.createBudget(
          'prince-mess',
          {
            name: 'Manager Reviewable Budget',
            periodType: 'MONTHLY',
            startDate: '2026-12-01',
            endDate: '2026-12-31',
            totalAmountTaka: 40000,
            approvalRequired: true,
            allocations: [{ categoryName: 'Food and Groceries', allocatedAmountTaka: 20000 }],
          },
          'usr_accountant_1'
        );

        // usr_owner_1 approves
        const approved = await budgetService.reviewBudget(
          'prince-mess',
          budget.id,
          { decision: 'APPROVE' },
          'usr_owner_1'
        );
        assert.strictEqual(approved.status, 'APPROVED');
        assert.strictEqual(approved.approvedById, 'usr_owner_1');
      });
    });

    describe('11. Mandatory Audit Reason on Financial Revisions', () => {
      it('requires a mandatory justification reason when updating a budget', async () => {
        await assert.rejects(
          async () => {
            await budgetService.updateBudget(
              'prince-mess',
              'bdg_seed_nov_2026',
              {
                totalAmountTaka: 55000,
                reason: '', // Missing mandatory reason!
              },
              'usr_accountant_1'
            );
          },
          (err: any) => {
            assert.ok(err instanceof ValidationError);
            assert.match(err.message, /reason is mandatory/i);
            return true;
          }
        );
      });

      it('records previous amount, new amount, and reason in BudgetChangeHistory', async () => {
        const updated = await budgetService.updateBudget(
          'prince-mess',
          'bdg_seed_nov_2026',
          {
            totalAmountTaka: 52000,
            reason: 'Added 2,000 BDT buffer for winter vegetable cost increase',
          },
          'usr_accountant_1'
        );

        assert.strictEqual(updated.totalAmountTaka, 52000);
        assert.ok(updated.changeHistories && updated.changeHistories.length >= 2);
        const latestHist = updated.changeHistories[0];
        assert.strictEqual(latestHist.previousAmountTaka, 50000);
        assert.strictEqual(latestHist.newAmountTaka, 52000);
        assert.strictEqual(latestHist.reason, 'Added 2,000 BDT buffer for winter vegetable cost increase');
      });
    });

    describe('12. Budget Threshold Alerts (75%, 90%, 100%, >100%)', () => {
      it('triggers threshold alerts and prevents duplicate alerts', async () => {
        // Seeded budget is 50,000 BDT with 15,500 BDT spent (31%)
        // Let's add an expense to push it past 75% (37,500 BDT):
        // Add 25,000 BDT expense -> total spent = 40,500 BDT (81%)
        budgetService.mockExpenses.push({
          id: 'exp_threshold_test',
          tenantId: 'tenant_prince_mess',
          categoryId: 'exp_cat_food',
          totalAmountPoisha: BigInt(2500000), // 25,000 BDT
          status: 'APPROVED',
          dateString: '2026-11-20',
          purchaseDate: new Date('2026-11-20T10:00:00Z'),
          description: 'Special Feast Grocery',
        });

        const triggered = await budgetService.checkThresholdAlerts('prince-mess', 'bdg_seed_nov_2026');
        assert.ok(triggered.includes(75));

        // Re-checking should not duplicate alert for 75%
        const secondCheck = await budgetService.checkThresholdAlerts('prince-mess', 'bdg_seed_nov_2026');
        assert.strictEqual(secondCheck.includes(75), false);
      });
    });

    describe('13. Budget Analytics Reports & CSV Export', () => {
      it('generates category breakdown, planned vs actual trends, and CSV content', async () => {
        const reports = await budgetService.getBudgetReports('prince-mess');
        assert.ok(reports.totalPlannedTaka > 0);
        assert.ok(reports.totalActualSpentTaka > 0);
        assert.ok(reports.categoryBreakdown.length > 0);
        assert.ok(reports.csvExportContent.includes('Category Name,Allocated (BDT),Actual Spent (BDT)'));
        assert.ok(reports.csvExportContent.includes('Total Planned'));
      });
    });
  });
});
