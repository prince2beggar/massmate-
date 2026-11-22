# MessMate SaaS — Development Progress Tracker

> **Project:** Multi-tenant Mess Management SaaS  
> **Repository:** `D:\messmate`  
> **Active Phase:** Phase 5 — Member Portal & Resident Self-Service (Tasks 37–40)  
> **Last Updated:** 2026-11-22  

---

## Phase 5 Roadmap Status (Member Portal & Resident Self-Service)

| Task | Task Name | Status | Completion Date | Main Deliverables | Test Results | Next Step |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Task 37** | Member Portal Foundation, Access Control & Dashboard | **Completed and Verified** | 2026-11-22 | Dedicated `/portal/[tenantSlug]` shell, `withMemberAuth` access control, anti-IDOR validation, 4 KPI cards (Room, Meals, Due Balance, Last Payment), zero-drift financial snapshot via `FinanceService`, today's dining & menus, published notices feed, recent activities stream, quick actions. | 14/14 Automated Tests Passed (106/106 full suite); 0 TS errors, 0 ESLint warnings; Production build passed. | Proceed to Task 38 |
| **Task 38** | Resident Profile, Emergency Contacts & Room Management | **Completed and Verified** | 2026-11-22 | Self-service profile editing (`phone`, `emergencyContactName`, `emergencyContactPhone`, `avatar`), Bangladeshi mobile validation/normalization, anti-mass-assignment guards, approval-required name update workflow (`MemberRequest`), room & bed details with privacy-safe occupancy counts, historical room timeline, room transfer request center with atomic transfer execution. | 18/18 Automated Tests Passed (32/32 Member Portal suite, 124/124 full suite); 0 TS errors, 0 ESLint warnings; Production build passed. | Proceed to Task 39 |
| **Task 39** | Member Meal Calendar, Preferences & Meal-Off Requests | *Upcoming* | — | Monthly meal calendar, daily meal bookings, cutoff-enforced meal-off submissions, dietary notes. | Pending Task 38 signoff | Upcoming |
| **Task 40** | Member Billing, Payments & Statements | *Upcoming* | — | Detailed ledger statement, deposit payment submission (bKash/Nagad/Bank/Cash), printable receipt. | Pending Task 39 signoff | Upcoming |

---

## Phase 4 Roadmap Status (Mess Admin Dashboard & Operations)

| Task | Task Name | Status | Completion Date | Main Deliverables | Test Results | Next Step |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Task 29–30** | Mess Admin Dashboard Foundation + Overview & Analytics | **Completed and Verified** | 2026-11-22 | Master layout, 17-item nav, 6 real KPI cards, poisha financial overview, income/expense chart, audit feed, role-gated quick actions, 16 placeholder views. | 13/13 Unit/Integration Tests Passed; Production build passed. | Proceed to Task 31 |
| **Task 31** | Member Management System | **Completed and Verified** | 2026-11-22 | Member directory, onboarding/invite flow, profile views, lifecycle/status changes, audit trails, tenant isolation. | 12/12 Automated Tests Passed; Production build passed. | Proceed to Task 32 |
| **Task 32** | Room Management & Rental Management | **Completed and Verified** | 2026-11-22 | Room inventory, bed assignments, capacity validation, transfer/move-out workflows, rental listings, booking requests, availability calendar. | 16/16 Automated Tests Passed (41/41 suite); Production build passed. | Proceed to Task 33 |
| **Task 33** | Meal Management System | **Completed and Verified** | 2026-11-22 | Fixed/flexible meal schedules, daily logs, meal-off cutoffs in Asia/Dhaka, guest meals, zero-drift meal rate calculation, period locking. | 15/15 Automated Tests Passed (56/56 suite); Production build passed. | Proceed to Task 34 |
| **Task 34** | Bazar and Expense Management | **Completed and Verified** | 2026-11-22 | Configurable expense categories, itemized purchases, server-side poisha calculations, bazar schedule rota, approval workflow with self-approval guards, reversals, and meal rate integration. | 11/11 Automated Tests Passed (67/67 suite); Production build passed. | Proceed to Task 35 |
| **Task 35** | Finance, Billing and Payment Management | **Completed and Verified** | 2026-11-22 | Tenant financial categories, monthly billing generation with zero-drift integer poisha allocation, rolling opening due, member statements with privacy checks, payment recording & verification with duplicate TrxID guard, period locking. | 11/11 Automated Tests Passed (78/78 suite); Production build passed. | Proceed to Task 36 |
| **Task 36** | Mess Settings, Roles & Permissions, Audit Logs | **Completed and Verified** | 2026-11-22 | Mess settings (general, appearance, operational defaults, privacy & visibility), 6 system roles + custom roles with 44-capability RBAC matrix, anti-privilege escalation, sole active owner protection, append-only immutable audit log explorer. | 14/14 Automated Tests Passed (92/92 Phase 4 suite); Production build passed. | **Phase 4 Complete** — Ready for Phase 5 (Member Portal) |

---

## Detailed Task History

### Combined Task 29–30: Mess Admin Dashboard Foundation + Overview & Analytics
- **Status:** Completed and Verified
- **Date:** 2026-11-22
- **Key Deliverables:**
  - Dedicated `/mess/[tenantSlug]` shell with desktop collapsible sidebar (17 navigation items) and mobile drawer.
  - Context-aware mess switcher, breadcrumbs, search modal, profile menu.
  - Real database KPI integration for members and subscription invoices.
  - Zero-drift `BigInt` poisha financial calculations and income vs. expense chart.
  - Append-only audit activities list with localized `Asia/Dhaka` timestamps.
  - Role-gated quick actions with locked indicators and upcoming modal dialogs.
  - 16 placeholder routes linking to upcoming roadmap tasks.
  - Comprehensive automated test suite (`server/mess-admin/mess-dashboard.test.ts`) covering all 13 required scenarios.
- **Verification:** TypeScript: 0 errors; ESLint: 0 errors, 0 warnings; Production build: 47/47 routes compiled. Commit: `2e6bdd8`.

### Task 31: Member Management System
- **Status:** Completed and Verified
- **Date:** 2026-11-22
- **Key Deliverables:**
  - Database schema extension: optional fields on `Membership` (`memberCode`, `emergencyContactName`, `emergencyContactPhone`, `notes`).
  - Backend `MemberService` (`server/members/member-service.ts`) with robust multi-tenant scoping, pagination, multi-field search, status filtering, and audit logging.
  - Safe lifecycle actions: add/invite member, edit profile, change status (with mandatory reason, `leftAt` tracking, and last-Owner demotion/suspension protection), change role.
  - Strict privacy protections: masks financial statement data if viewer lacks `finance.view` or Admin/Owner permissions.
  - REST API routes: `/api/v1/mess/[tenantSlug]/members` (GET list, POST create), `/api/v1/mess/[tenantSlug]/members/[id]` (GET detail, PATCH update), `/api/v1/mess/[tenantSlug]/members/[id]/status` (PATCH status), `/api/v1/mess/[tenantSlug]/members/[id]/role` (PATCH role).
  - UI components and pages:
    - Member directory (`/mess/[tenantSlug]/members`) with summary counters, search, status filters, sort, responsive table/cards, and empty/no-results states.
    - Member profile view (`/mess/[tenantSlug]/members/[id]`) with tabbed interface (Personal & Contact, Room & Bed placeholder, Meal summary placeholder, Role-gated Financial Statement, Audit timeline).
    - Modals: `AddMemberModal` (with shareable invitation link), `EditMemberModal`, `ChangeStatusModal` (with mandatory reason).
  - Automated tests (`server/members/member-management.test.ts`): 12 comprehensive unit and integration test scenarios, all passing (100%).
- **Verification:** TypeScript: 0 errors; ESLint: 0 errors, 0 warnings; Next.js production build: 47/47 routes compiled cleanly.

### Task 32: Room Management & Rental Management
- **Status:** Completed and Verified
- **Date:** 2026-11-22
- **Key Deliverables:**
  - Prisma Schema expansion: `Room`, `Bed`, `RoomAssignment`, `RentalListing`, `BookingRequest` models with associated enums (`RoomStatus`, `BedStatus`, `AssignmentStatus`, `RentalListingStatus`, `BookingStatus`, `BookingPaymentStatus`).
  - Backend `RoomService` (`server/rooms/room-service.ts`):
    - Full tenant scoping and audit logging integration.
    - Capacity validation: auto-creation of bed slots on room setup, and strictly preventing room capacity reduction below active resident occupancy.
    - Resident bed allocation: checks active status, prevents duplicate active assignments for the same member across rooms.
    - Member transfer workflow: atomically marks previous assignment as `TRANSFERRED`, frees old bed, and occupies destination bed.
    - Member move-out workflow: requires mandatory move-out reason, marks assignment `MOVED_OUT`, frees bed, and updates room status.
    - Historical rent safety: rent updates preserve effective date and reason without rewriting past billing history.
    - Rental management: create/publish/pause vacant space listings.
    - Guest booking requests: server-side date-overlap collision checks against approved reservations, review workflow (Approve vs. Reject with mandatory reason).
    - Availability calendar: daily aggregation of long-term resident occupancy, approved guest bookings, and pending requests.
  - REST API routes (10 endpoints):
    - `/api/v1/mess/[tenantSlug]/rooms` (GET list, POST create)
    - `/api/v1/mess/[tenantSlug]/rooms/[id]` (GET detail, PATCH update)
    - `/api/v1/mess/[tenantSlug]/rooms/[id]/assign` (POST assign resident)
    - `/api/v1/mess/[tenantSlug]/rooms/[id]/assignments/[assignmentId]/transfer` (POST transfer resident)
    - `/api/v1/mess/[tenantSlug]/rooms/[id]/assignments/[assignmentId]/move-out` (POST move-out resident)
    - `/api/v1/mess/[tenantSlug]/rooms/availability` (GET monthly calendar)
    - `/api/v1/mess/[tenantSlug]/rental/listings` (GET list, POST create)
    - `/api/v1/mess/[tenantSlug]/rental/listings/[id]` (PATCH status toggle)
    - `/api/v1/mess/[tenantSlug]/rental/bookings` (GET list, POST create request)
    - `/api/v1/mess/[tenantSlug]/rental/bookings/[id]/review` (PATCH approve/reject)
  - UI components and pages:
    - `/mess/[tenantSlug]/rooms`: Room Directory with KPI summary cards, filter tabs, floor filter, search, room cards/table, and responsive pagination.
    - `/mess/[tenantSlug]/rooms/[id]`: Room Detail view with bed slot grid, occupant profiles, quick assign/transfer/move-out actions, and historical occupancy timeline.
    - `/mess/[tenantSlug]/rental`: Rental Workspace with 3 tabs (Rental Listings, Guest Bookings with review badge, Availability Calendar with visual heatmaps).
    - Modals: `AddRoomModal`, `EditRoomModal`, `AssignBedModal`, `TransferMemberModal`, `MoveOutModal`, `CreateListingModal`, `ReviewBookingModal`.
    - Navigation integration: `rooms` and `rental` marked active (`isImplemented: true`) in sidebar and quick actions.
  - Automated test suite (`server/rooms/room-management.test.ts`): 16 comprehensive unit and integration tests covering all requirements, edge cases, invariants, and multi-tenant isolation.
- **Verification:** TypeScript: 0 errors; ESLint: 0 errors, 0 warnings; 41/41 unit/integration tests passing (100%); Next.js production build: 47/47 routes compiled cleanly.

### Task 33: Meal Management System
- **Status:** Completed and Verified
- **Date:** 2026-11-22
- **Key Deliverables:**
  - Prisma Schema expansion: `MealSetting`, `MealDailyLog`, `MemberMealEntry`, `MealOffRequest`, `GuestMeal`, and `MealPeriodLock` models with enums (`MealSystemType`, `MealType`, `MealOffStatus`, `GuestMealChargeType`).
  - Timezone & Calculation Utility (`server/meals/meal-utils.ts`):
    - `Asia/Dhaka` timezone date/time resolvers.
    - Cutoff validation logic enforcing evening deadlines and meal-specific cutoffs.
    - Zero-drift integer poisha meal rate calculator: $\text{Meal Rate} = \frac{\text{Eligible Expenses}}{\text{Total Chargeable Units}}$.
    - Safe division guard against zero units.
  - Backend `MealService` (`server/meals/meal-service.ts`):
    - Full multi-tenant scoping and audit logging integration.
    - Configuration management for Flexible vs. Fixed models, customizable weights (e.g. 0.5 for breakfast, 1.0 for lunch/dinner), and cutoff schedules.
    - Daily meal sheet management: saves daily menus, records member counts, calculates exact weighted units.
    - Meal-off workflow: cutoff validation, auto-approval rules, zeroing of meal counts for approved date ranges, mandatory reason for rejections.
    - Guest meal tracking: separate from resident meal counts, exact poisha billing, immediate cash payment vs. host resident billing.
    - Transparent meal rate calculation: filters eligible expense categories (e.g. Bazar, Grocery, Cook Salary) and excludes ineligible categories (e.g. rent, wifi).
    - Period locking: freezes monthly calculations, blocks edits to historical meal entries, and supports auditable unlocks with mandatory reasons.
    - Member-by-member monthly meal summary matrix.
  - REST API routes (7 endpoints):
    - `/api/v1/mess/[tenantSlug]/meals/settings` (GET, PATCH)
    - `/api/v1/mess/[tenantSlug]/meals/daily` (GET sheet, POST save entries)
    - `/api/v1/mess/[tenantSlug]/meals/off-requests` (GET list, POST create)
    - `/api/v1/mess/[tenantSlug]/meals/off-requests/[id]/review` (PATCH review)
    - `/api/v1/mess/[tenantSlug]/meals/guest` (GET list, POST record)
    - `/api/v1/mess/[tenantSlug]/meals/rate` (GET calculation, POST lock/unlock)
    - `/api/v1/mess/[tenantSlug]/meals/summary` (GET monthly matrix)
  - UI components and pages:
    - `/mess/[tenantSlug]/meals`: Meals Workspace with 5 dedicated operational tabs:
      - Daily Sheet & Menus (`DailyMealSheetView` with Prev/Next day nav, menu notes, summary counters, responsive member table).
      - Meal-Off Requests (`MealOffRequestsView` with status filters, review badges, and review modal).
      - Guest Meals (`GuestMealsView` with KPI counters, guest ledger, and record modal).
      - Monthly Summary & Meal Rate (`MonthlyMealSummaryView` with prominent formula card, breakdown metrics, period lock action, and printable matrix).
      - Settings & Rules (`MealSettingsView` with system toggles, weights, Dhaka cutoffs, and expense category selectors).
    - Modals: `RecordGuestMealModal`, `CreateMealOffModal`, `ReviewMealOffModal`, `PeriodLockModal`.
    - Navigation integration: `meals` marked active (`isImplemented: true`) in sidebar and quick actions.
  - Automated test suite (`server/meals/meal-management.test.ts`): 15 comprehensive unit and integration tests covering all requirements, edge cases, invariants, and multi-tenant isolation.
- **Verification:** TypeScript: 0 errors; ESLint: 0 errors, 0 warnings; 56/56 total regression tests passing (100%); Next.js production build: 47/47 routes compiled cleanly.

### Task 34: Bazar and Expense Management
- **Status:** Completed and Verified
- **Date:** 2026-11-22
- **Key Deliverables:**
  - Prisma Schema expansion: `ExpenseCategory`, `Expense`, `ExpenseItem`, `BazarSchedule` models with enums (`ExpenseStatus`: `PENDING`, `APPROVED`, `REJECTED`, `REVERSED`; `BazarScheduleStatus`: `SCHEDULED`, `COMPLETED`, `CANCELLED`, `SWAPPED`).
  - Backend `ExpenseService` (`server/bazar/expense-service.ts`):
    - Configurable expense categories with default auto-seeding (`BAZAR`, `COOK`, `GAS`, `WATER`, `ELECTRICITY`, `WIFI`, `MAINTENANCE`, `TRANSPORT`, `OTHER`).
    - Soft deactivation of categories to prevent broken historical expenditure links.
    - Strict server-side integer poisha arithmetic: never trusts client totals; validates positive quantities and unit prices.
    - Self-approval governance guard: blocks purchasers from approving their own submitted expenses.
    - Mandatory explanation note for rejections and reversals.
    - Bazar duty rota (`BazarSchedule`) with status lifecycle and linking to recorded purchases.
    - Meal module integration: `getApprovedEligibleMealExpenses()` feeds approved meal-eligible grocery costs directly into the meal rate formula while strictly excluding general overhead and pending/rejected items.
  - REST API routes (8 endpoints):
    - `/api/v1/mess/[tenantSlug]/expenses/categories` (GET list, POST create)
    - `/api/v1/mess/[tenantSlug]/expenses/categories/[id]` (PATCH update / toggle active)
    - `/api/v1/mess/[tenantSlug]/expenses` (GET list, POST create)
    - `/api/v1/mess/[tenantSlug]/expenses/[id]` (GET detail)
    - `/api/v1/mess/[tenantSlug]/expenses/[id]/review` (PATCH approve/reject)
    - `/api/v1/mess/[tenantSlug]/expenses/[id]/reverse` (POST reverse)
    - `/api/v1/mess/[tenantSlug]/expenses/schedules` (GET list, POST create)
    - `/api/v1/mess/[tenantSlug]/expenses/schedules/[id]` (PATCH status)
  - UI components and pages:
    - `/mess/[tenantSlug]/bazar`: Bazar Workspace with 3 operational tabs:
      - Purchases & Expenses (`ExpensesListView` with KPI summary cards, multi-facet filtering by month, category, purchaser, and status, and itemized table).
      - Bazar Duty Rota (`BazarScheduleView` with upcoming duties, completion toggles, and direct purchase linking).
      - Expense Categories (`CategoriesView` with category creation, meal-eligibility toggles, and deactivation).
    - Modals: `RecordExpenseModal` (itemized dynamic rows, live total preview, optional receipt voucher link), `ReviewExpenseModal` (audit inspection, approval vs. rejection reason), `ReverseExpenseModal` (traceable reversal reason), `ExpenseDetailsModal` (read-only audit view), `AssignBazarModal` (duty scheduling).
    - Navigation integration: `bazar` marked active (`isImplemented: true`) in sidebar and quick actions.
  - Automated test suite (`server/bazar/bazar-management.test.ts`): 11 comprehensive unit and integration tests covering category seeding, deactivation, exact item math, validation, review decisions, self-approval policy guard, reversals, duty rota completion, meal rate integration, and cross-tenant isolation.
- **Verification:** TypeScript: 0 errors; ESLint: 0 errors, 0 warnings; 67/67 total regression tests passing (100%); Next.js production build: 47/47 routes compiled cleanly.

### Task 35: Finance, Billing and Payment Management
- **Status:** Completed and Verified
- **Date:** 2026-11-22
- **Key Deliverables:**
  - Prisma Schema expansion: `FinancialCategory`, `MonthlyBillingPeriod`, `MemberBill`, `BillItem`, `MemberPayment`, `BalanceAdjustment` models with enums (`AllocationRule`, `BillingPeriodStatus`, `BillStatus`, `MemberPaymentStatus`, `AdjustmentType`).
  - Backend `FinanceService` (`server/finance/finance-service.ts`):
    - Configurable financial categories with default auto-seeding (`ROOM_RENT`, `ELECTRICITY`, `GAS`, `WATER`, `WIFI`, `CLEANING_BUA`, `MAINTENANCE`, `MEAL_CHARGES`, `GUEST_MEAL_CHARGES`, `CUSTOM`).
    - Allocation rules: `EQUAL_PER_MEMBER` (with zero-drift integer poisha remainder distribution), `PER_ROOM`, `FIXED_AMOUNT`, `CUSTOM_PER_MEMBER`.
    - Monthly billing generator: aggregates active residents, dynamically links room rent and meal charges, rolls over previous month's uncollected closing balance into opening due, distributes shared overhead without poisha loss, and creates itemized member bills.
    - Bill publishing and closing lifecycle (`DRAFT` -> `PUBLISHED` -> `LOCKED`): once locked, period modifications and bill recalculations are strictly rejected.
    - Member financial statements: calculated dynamically with exact ledger math ($\text{Closing Balance} = \text{Opening Due} + \text{Total Charges} - \text{Confirmed Payments} - \text{Credits}$).
    - Strict privacy enforcement: residents can only access their own statement under `finance.view`; viewing statements across other members requires `finance.view_all_members` or Owner role.
    - Payment recording supporting Cash, bKash, Nagad, Rocket, Bank Transfer, with duplicate digital transaction reference (TrxID) conflict prevention.
    - Two-stage payment verification: review queue with confirmation or rejection (mandatory reason), plus auditable refund/reversal functionality.
    - Balance adjustments & waivers: credit and debit adjustments with mandatory audit reasons.
    - Multi-tenant boundary isolation and audit activity logging.
  - REST API routes (10 endpoints):
    - `/api/v1/mess/[tenantSlug]/finance/categories` (GET list, POST create)
    - `/api/v1/mess/[tenantSlug]/finance/categories/[id]` (PATCH update)
    - `/api/v1/mess/[tenantSlug]/finance/billing` (GET list/overview, POST generate)
    - `/api/v1/mess/[tenantSlug]/finance/billing/publish` (POST publish)
    - `/api/v1/mess/[tenantSlug]/finance/billing/close` (POST close/lock)
    - `/api/v1/mess/[tenantSlug]/finance/statements/[membershipId]` (GET member statement)
    - `/api/v1/mess/[tenantSlug]/finance/adjustments` (POST balance adjustment)
    - `/api/v1/mess/[tenantSlug]/payments` (GET list, POST record)
    - `/api/v1/mess/[tenantSlug]/payments/[id]/verify` (PATCH confirm/reject)
    - `/api/v1/mess/[tenantSlug]/payments/[id]/refund` (POST refund)
  - UI components and pages:
    - `/mess/[tenantSlug]/finance`: Finance Workspace with 3 operational tabs:
      - Monthly Billing (`FinanceWorkspaceView` with billing overview, period selector, status badge, Generate Bills modal, Publish action, Close/Lock action, member bill breakdown table, and statement modal).
      - Financial Categories (`FinancialCategoriesView` with category configuration, allocation rules, default amounts, and active toggles).
      - Adjustments & Waivers (Balance adjustment action with credit/debit options and reason tracking).
    - `/mess/[tenantSlug]/payments`: Payments Workspace (`PaymentsWorkspaceView` with KPI collection counters, method/status filtering, search, Record Payment modal, Verify Payment modal, and Refund modal).
    - Modals: `GenerateBillsModal`, `MemberStatementModal` (printable layout with full ledger breakdown), `RecordPaymentModal`, `VerifyPaymentModal`, `RefundPaymentModal`, `BalanceAdjustmentModal`.
    - Navigation integration: `finance` and `payments` marked active (`isImplemented: true`) in sidebar and quick actions.
  - Automated test suite (`server/finance/finance-management.test.ts`): 11 comprehensive unit and integration tests covering category configuration, zero-drift remainder distribution, rollover of opening due, period locking protection, privacy boundary on member statements, duplicate TrxID conflict detection, payment verification, refunds, adjustments, and cross-tenant isolation.
- **Verification:** TypeScript: 0 errors; ESLint: 0 errors, 0 warnings; 78/78 total regression tests passing (100%); Next.js production build: 49/49 routes compiled cleanly.

### Task 36: Mess Settings, Roles & Permissions, Audit Logs
- **Status:** Completed and Verified
- **Date:** 2026-11-22
- **Key Deliverables:**
  - Database schema extension: `MessSetting` model linked 1-to-1 with `Tenant`, storing General preferences, Appearance tokens, Operational defaults, and Privacy governance rules.
  - Backend `MessSettingsService` (`server/settings/mess-settings-service.ts`):
    - Multi-tenant settings configuration: general mess profile, branding/colors, operational defaults, and strict emergency contact privacy protection (cannot be set to `PUBLIC`).
    - Roles & permissions management: auto-seeds the 6 standard system roles (`Owner`, `Admin`, `Moderator`, `Accountant`, `Meal Manager`, `Member`) and manages custom roles across the 44-capability catalog.
    - Security invariants:
      - Sole active Owner protection: prevents demoting or removing the mess's last active Owner.
      - Anti-privilege escalation: prevents non-owners from delegating capabilities they do not hold.
      - Anti-self-promotion: prevents members from modifying their own roles.
      - System role protection: prevents renaming or deleting system roles.
      - Cross-tenant shield: prevents cross-tenant access to settings, roles, and audit logs.
    - Append-only audit log ledger: tenant-scoped chronological records with Asia/Dhaka timestamps, sanitized diffs (sensitive tokens/passwords automatically redacted), and strict deletion rejection (`deleteAuditLog` throws ForbiddenError).
  - REST API routes (8 endpoints):
    - `/api/v1/mess/[tenantSlug]/settings` (GET full settings)
    - `/api/v1/mess/[tenantSlug]/settings/general` (PATCH general profile)
    - `/api/v1/mess/[tenantSlug]/settings/appearance` (PATCH theme & branding)
    - `/api/v1/mess/[tenantSlug]/settings/operational` (PATCH defaults & modules)
    - `/api/v1/mess/[tenantSlug]/settings/privacy` (PATCH privacy bounds)
    - `/api/v1/mess/[tenantSlug]/roles` (GET list, POST create)
    - `/api/v1/mess/[tenantSlug]/roles/[id]` (PATCH update, DELETE role)
    - `/api/v1/mess/[tenantSlug]/audit-logs` (GET paginated, filtered audit logs)
  - UI components and pages:
    - `/mess/[tenantSlug]/settings`: Tabbed settings view (`MessSettingsView` with General, Appearance, Operational, and Privacy tabs, live theme preview, and bilingual English/Bangla labels).
    - `/mess/[tenantSlug]/roles`: Roles & permissions control center (`RolesManagementView`, `CreateRoleModal`, and `EditRoleModal` with grouped 10-module capability matrix, system badges, member counters, and deletion safety dialogs).
    - `/mess/[tenantSlug]/audit-logs`: Audit log explorer (`AuditLogsWorkspaceView` and `AuditDiffModal` with search, module filtering, Asia/Dhaka timestamps, narrative descriptions, sanitized before/after diffs, and tamper notice banner).
    - Navigation integration: `settings`, `roles`, and `audit-logs` marked active (`isImplemented: true`) in sidebar and quick actions.
  - Automated test suite (`server/settings/mess-settings.test.ts`): 14 comprehensive unit and integration tests covering default settings auto-seeding, general profile updates, appearance validation, operational defaults, emergency contact privacy enforcement, 6 system role templates, custom role creation, anti-privilege escalation, system role protection, owner protection, role deletion safety, audit log filtering and redaction, append-only immutability, and cross-tenant isolation.
- **Verification:** TypeScript: 0 errors; ESLint: 0 errors, 0 warnings; 92/92 total regression tests passing (100%); Next.js production build: 53/53 routes compiled cleanly.

### Task 37: Member Portal Foundation, Access Control & Dashboard
- **Status:** Completed and Verified
- **Date:** 2026-11-22
- **Key Deliverables:**
  - Dedicated Member Portal routing at `/portal/[tenantSlug]` matching tenant-scoping patterns without collision.
  - Server-side access control with `withMemberAuth` (`server/api/with-member-auth.ts`):
    - Authenticates actor user identity (`userId`).
    - Resolves target mess by `tenantSlug`.
    - Enforces active resident membership (`status: 'ACTIVE'`).
    - Blocks unauthenticated callers (401), non-members (403), inactive/suspended members (403), and provides full anti-IDOR protection.
  - Backend `MemberPortalService` (`server/member-portal/member-portal-service.ts`):
    - Member context resolution and data-driven aggregation for dashboard view.
    - Zero financial drift rule: reuses `FinanceService` (`getMemberStatement`) with integer Poisha precision.
    - Today's dining status, meal counts, and menu in `Asia/Dhaka` timezone.
    - Published notices feed filtering drafts and cross-tenant entries.
    - Resident recent activity stream (payments, meal-off, room assignment).
  - Database schema extension: `Notice` model (`prisma/schema.prisma`) with priority, pin, category, and lifecycle statuses.
  - UI components and layout:
    - `MemberPortalLayoutShell`: responsive desktop sidebar and mobile drawer.
    - `MemberPortalNavbar`: mess branding, resident identity, active status badge, and sign-out action.
    - `MemberPortalSidebar`: 10 navigation items with upcoming task badges and encrypted session security badge.
    - `MemberDashboardView`: welcome header with localized Dhaka timestamp, 4 KPI cards (Room, Meals, Current Due, Last Payment), monthly account ledger snapshot, today's dining & menus, published notices, activity stream, and quick action shortcuts.
    - Landing hub at `/member-portal` guiding residents to their mess portals.
  - Automated test suite (`server/member-portal/member-portal.test.ts`): 14 unit and integration tests covering currency/poisha arithmetic, active member resolution, 401 unauthenticated guard, 403 non-member and suspended guards, IDOR prevention, complete dashboard data aggregation, unassigned room empty state, active meal-off status reflection, notice tenant isolation, and `withMemberAuth` API wrapper.
- **Verification:** TypeScript: 0 errors; ESLint: 0 errors, 0 warnings; 106/106 full regression tests passing (100%); Next.js production build: 47/47 routes compiled cleanly.

### Task 38: My Profile, Room Information & Personal Requests
- **Status:** Completed and Verified
- **Date:** 2026-11-22
- **Key Deliverables:**
  - Prisma Schema expansion: `MemberRequest` model with `tenantId`, `membershipId`, `requestType` (`ROOM_CHANGE`, `PROFILE_UPDATE`, `MAINTENANCE`, `GENERAL_QUERY`), `requestedRoomId`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), `adminResponse`, `reviewedByUserId`, `reviewedAt`, and `metadata`.
  - Backend Service (`server/member-portal/member-portal-service.ts`):
    - `getMemberProfile`: returns authoritative member identity, member code, phone, emergency contacts, avatar, and mess details without leaking password hashes or internal ledger items.
    - `normalizeBdPhone`: validates and canonicalizes Bangladeshi mobile numbers into 11-digit `01XXXXXXXXX` format; rejects invalid operators or character tokens.
    - `updateMemberProfile`: enables self-service updates to phone, emergency contacts, and avatar while strictly enforcing anti-mass-assignment protections (rejects/ignores alterations to `role`, `status`, `balancePoisha`, `membershipId`, `tenantId`).
    - Name change security workflow: resident name edits automatically generate a `MemberRequest` (`PROFILE_UPDATE`) for Mess Admin verification rather than directly mutating authoritative records.
    - `getMemberRoomDetails`: displays current room number, floor, building, bed label, monthly rent in BDT, start date, and amenities.
    - Co-resident privacy protection: displays room occupancy strictly as a count (`1 / 2 beds occupied`) without leaking other residents' personal identities.
    - Friendly unassigned room state (`hasAssignment: false`) with quick allocation CTA.
    - Historical room assignment timeline (`TRANSFERRED`, `COMPLETED`, `TERMINATED`) with duration and move-out reasons.
    - Available mess rooms list with capacity and vacant bed counts.
    - `listMemberRequests`: anti-IDOR scoped request listing with status and type filters.
    - `createMemberRequest`: creates pending requests (`status: 'PENDING'`) with minimum 5-character validation and room target verification; does NOT instantly alter room assignments.
    - `cancelMemberRequest`: members can cancel their own `PENDING` tickets; prevents cancelling `APPROVED` or `REJECTED` requests.
    - `reviewMemberRequest`: administrative review action; verifies room capacity and executes atomic room transfer transaction (`RoomAssignment`) upon `APPROVED` decision.
  - REST API Routes:
    - `app/api/v1/portal/[tenantSlug]/profile/route.ts` (GET, PATCH with `withMemberAuth`)
    - `app/api/v1/portal/[tenantSlug]/room/route.ts` (GET with `withMemberAuth`)
    - `app/api/v1/portal/[tenantSlug]/requests/route.ts` (GET, POST with `withMemberAuth`)
    - `app/api/v1/portal/[tenantSlug]/requests/[id]/cancel/route.ts` (PATCH with `withMemberAuth`)
  - UI Components & Server Pages:
    - `/portal/[tenantSlug]/profile`: `MemberProfileView` with resident identity card, self-service contact edit form, emergency contacts, name change admin-approval badge, and security guidance banner.
    - `/portal/[tenantSlug]/room`: `MemberRoomView` with active accommodation banner, bed slot details, privacy-safe occupancy count, facilities chips, room rules, unassigned empty state, available rooms grid, assignment history table, and "Request Room Change" modal.
    - `/portal/[tenantSlug]/requests`: `MemberRequestsView` with status/type filter tabs, request reference tags, color-coded badges, admin response narratives, cancellation action for pending tickets, and "New Request" modal.
    - Navigation updated in `components/member-portal/member-nav-data.ts`: `profile`, `room`, and `requests` enabled (`isImplemented: true`).
  - Automated test suite (`server/member-portal/member-profile-room.test.ts`): 18 comprehensive tests covering Bangladeshi phone normalization, profile security, permitted edits, anti-mass-assignment, name change approval workflow, room details, privacy-safe occupancy counts, unassigned state, history, room transfer request submission, cancellation rules, anti-IDOR cross-tenant isolation, and admin review atomic transfer.
- **Verification:** TypeScript: 0 errors (`npx tsc --noEmit`); ESLint: 0 errors, 0 warnings (`npm run lint`); 32/32 Member Portal tests passing (100%); Next.js production build: 47/47 routes compiled cleanly.





