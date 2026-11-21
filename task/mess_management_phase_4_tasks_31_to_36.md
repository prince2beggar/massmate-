# Mess Management SaaS — Phase 4 Remaining Tasks (31–36)

**Project:** Multi-tenant Mess Management SaaS  
**Completed in this phase:** Combined Task 29–30 — Mess Admin Dashboard foundation, overview, analytics, recent activities and quick actions.  
**How to use:** Complete Tasks 31–36 sequentially in Google AI Studio Build Mode. Paste one task prompt at a time. Do not ask the AI to implement the entire phase in one run.

---

## Global Instructions — Apply to Every Task

Before implementing each task:

1. Inspect the existing project structure, database schema, Prisma models, authentication, authorization, tenant resolution, API conventions, UI components and previous task implementation.
2. Reuse existing models, services, components and APIs. Do not create duplicate models or parallel systems.
3. Preserve all completed work, especially Super Admin, tenant management, subscription logic, domain management and Mess Admin Dashboard.
4. Implement only the task requested. Do not start later tasks.
5. Use the existing technology stack and design system.
6. Resolve the active tenant on the server from the authenticated user's authorized membership. Never trust a client-supplied `tenant_id`.
7. Enforce permissions on the server for every protected read/write operation. Hiding a button is not authorization.
8. Use `Asia/Dhaka` for application-local dates and times.
9. Use integer poisha or exact Decimal arithmetic for money. Never use floating-point money calculations.
10. Validate all inputs on the server. Do not expose secrets or private records.
11. Provide loading, empty, success and error states. Make pages responsive and accessible.
12. Never present fake records as real data. Use empty/unavailable states when backend data is not available.
13. Do not run destructive migrations, drop tables or delete existing records.
14. Add tests for important business rules, tenant isolation and permission checks.
15. Run linting, TypeScript checks, relevant tests and a production build where supported.
16. At the end, report files created/modified, schema/API changes, tests/results, limitations and manual configuration.

**Security baseline:** A user from Mess A must never read or change Mess B's records, even by changing a URL, request body, query parameter or record ID.

---

# Task 31 — Member Management System

## Objective
Build the tenant-side Member Management module for onboarding, profiles, membership status, member history and privacy-aware records.

## Prompt

Inspect the existing project before coding. Review user, tenant, membership, role, room assignment, audit-log and notification models/services. Reuse existing authentication identities; do not create a second login system or duplicate models.

### 1. Member Directory
Create a responsive Members page with:
- Member list in table/card layout.
- Search by name, phone, email or member code where available.
- Filters for active, inactive, pending, suspended and archived states, aligned with the existing data model.
- Sorting by name, join date and status.
- Pagination.
- Member count and status summary.
- Empty and no-results states.

Only display fields the current user is authorized to see.

### 2. Add Member Workflow
Create an Add Member flow with appropriate fields:
- Full name.
- Phone number.
- Email, if applicable.
- Optional profile image.
- Emergency contact name and phone, with privacy safeguards.
- Join date.
- Membership status.
- Member code, generated safely if supported.
- Staff-only notes.

Allow an admin to invite an existing registered user or create an invitation for a new user, according to the current authentication architecture. Never create a password and send it in plain text. Use a secure invitation/activation flow if configured. If email/SMS delivery is unavailable, show a pending-invitation state and document the missing configuration.

### 3. Member Profile
Create a member detail page with sections/tabs:
- Personal information.
- Membership information.
- Current room/bed assignment, if available.
- Meal summary, if available.
- Financial summary, only for authorized roles.
- Payment history, only for authorized roles.
- Relevant notices/activity, if available.
- Secure documents, only if storage is configured.
- Member history.

A member must not see another member's private financial information.

### 4. Member Actions
Support permission-controlled actions:
- Edit member information.
- Activate/deactivate membership.
- Suspend/reactivate, if supported by business rules.
- Send/resend invitation, if configured.
- View details.
- Initiate room assignment using an existing workflow, if available.
- Archive a member safely.

Avoid hard-deleting members with financial, meal, payment, room or audit history. Prefer status changes or archival.

### 5. Lifecycle and Audit
Track member creation, profile updates, status changes, invitation sent/accepted, room assignment changes when integrated, and archival/reactivation. Use the existing audit log. Record actor, tenant, timestamp, action and relevant before/after values without copying unnecessary sensitive personal data into logs.

### 6. Permissions
Use the existing role system. Suggested capabilities:
- `members.view`
- `members.create`
- `members.update`
- `members.change_status`
- `members.invite`
- `members.view_private`
- `members.archive`

Do not automatically grant every capability to every admin.

### 7. Backend and Validation
Implement tenant-scoped endpoints/server actions using existing conventions. Validate fields, prevent duplicate memberships according to the current model, use safe pagination, verify tenant and permissions on every operation, and never return password hashes, tokens or private document contents.

### 8. UI/UX
Match the Mess Admin Dashboard. Include a clear Add Member action, readable status indicators, confirmation for sensitive changes, mobile-friendly forms and helpful validation messages.

### 9. Tests
Test tenant isolation, unauthorized access, duplicate membership handling, validation, server-side permissions, archive history preservation, privacy of member financial data, search/filter/pagination and existing dashboard routes.

**Scope boundary:** Complete only Task 31. Do not build the full Rooms, Meals, Bazar or Finance modules.

---

# Task 32 — Room Management and Rental Management

## Objective
Build room inventory, room/bed assignment and rental listing workflows. Keep long-term member accommodation separate from short-term guest bookings.

## Prompt

Inspect existing tenant, member, room, rental, booking, permissions, audit and file-storage models. Reuse existing entities and avoid duplicate room or booking systems.

### 1. Room Directory
Create a Rooms page showing:
- Room name/number.
- Building/floor, if applicable.
- Capacity.
- Current occupancy and available beds.
- Monthly rent or configured rent basis.
- Facilities.
- Status: available, occupied, maintenance or inactive.
- Search, filters and pagination.

Do not assume every room has the same rent or capacity.

### 2. Create and Edit Rooms
Allow authorized users to manage:
- Room name/number and description.
- Building/floor.
- Capacity.
- Facilities.
- Default rent, if applicable.
- Status and internal notes.

Validate capacity. Do not reduce capacity below current active occupancy without a safe resolution workflow.

### 3. Member Room/Bed Assignment
Create a workflow to select a member and available room/bed, set start date and agreed rent/rule, add notes and confirm.

Support transfer and move-out. Prevent capacity overflow and overlapping active assignments for the same bed. Preserve assignment history. Record rent changes with effective dates. Do not silently rewrite previous bills when rent changes. Audit assignment, transfer, move-out and rent changes.

### 4. Room Detail
Show room information, occupancy, assigned members subject to permissions, assignment history, rent configuration, maintenance status and related rental listings.

Do not expose private member data publicly.

### 5. Rental Listings
Create a separate Rental Management area for spaces the tenant is authorized to offer. Listing fields:
- Title and description.
- Room/bed reference.
- Photos.
- Facilities.
- Occupancy/capacity.
- House rules.
- Daily and/or monthly rate.
- Availability.
- Public/private visibility.
- Contact method.
- Status: draft, published, paused or archived.

### 6. Booking Requests
Support guest name/contact, listing, requested check-in/check-out, duration, message and status (pending, approved, rejected, cancelled or completed).

Authorized staff can review and decide. Prevent overlapping confirmed bookings. Validate dates. Protect guest information. Never mark a booking paid unless a verified payment record exists. If payment processing is unavailable, show unpaid/manual-pending status. Keep guest bookings separate from long-term member assignments.

### 7. Availability Calendar
Show available periods, confirmed bookings, pending requests, long-term assignments and maintenance blocks. Availability must be checked server-side and prevent race-condition double booking using database transactions/constraints where appropriate.

### 8. Images and Documents
Use configured object storage. Validate file type, size and content where supported. Protect private documents and generate access links only after authorization. If storage is not configured, show an unavailable state and document required configuration.

### 9. Permissions and Audit
Suggested capabilities:
- `rooms.view`
- `rooms.create`
- `rooms.update`
- `rooms.assign`
- `rooms.transfer`
- `rooms.move_out`
- `rental.view`
- `rental.manage_listings`
- `rental.review_bookings`

Audit assignments, rent changes, listing publication and booking decisions.

### 10. Tests
Test tenant isolation, room capacity, bed conflicts, assignment history, effective-dated rent changes, overlapping bookings, guest privacy, public listing visibility, approval permissions and mobile layouts.

**Scope boundary:** Do not build a full public rental marketplace or live payment gateway. Complete only tenant-side room and rental management.

---

# Task 33 — Meal Management System

## Objective
Build a configurable meal module supporting fixed and flexible systems, meal schedules, daily entries, meal-off requests, guest meals and monthly summaries.

## Prompt

Inspect existing tenant, member, meal, expense and finance models, settings, billing periods and date/time handling. Reuse existing services and avoid duplicate meal entities.

### 1. Meal Settings
Allow authorized staff to configure:
- Meal system: fixed, flexible or both.
- Meal types: breakfast, lunch, dinner and optional custom meals.
- Daily schedule.
- Meal-off cutoff.
- Meal-off request rules.
- Guest meal policy.
- Flexible meal weights/rates.
- Expense categories eligible for meal cost.
- Month closing behavior.

Use Asia/Dhaka for cutoff and date handling.

### 2. Meal Calendar
Create daily/monthly calendar showing date, meal type, menu if configured, member meal counts, meal-off status, guest meal count and daily status. Include month navigation and filters.

### 3. Member Meal Entries
Authorized staff can record/update member meal counts.

**Fixed mode:** Record whether the member receives the configured fixed meal entitlement, with authorized exceptions.

**Flexible mode:** Record counts by meal type and apply tenant-configured weights if enabled.

Do not assume a universal weight or price. Show the active rules to authorized users.

### 4. Meal-Off Workflow
Members may request meal-off for eligible dates before the configured cutoff. Validate cutoff using server time in Asia/Dhaka. Show request status. Allow authorized review of exceptions where policy permits. Record approver/rejector. Do not silently change locked historical records.

If member self-service is not ready, implement admin-side workflows and clearly document the member-side integration as pending.

### 5. Guest Meals
Record guest reference/name (minimize personal data), date, meal type/count, configured rate/policy, recorder and notes. Keep guest meals separate from regular member meal counts and apply the tenant's configured financial treatment.

### 6. Meal Rate Calculation
Support a configurable calculation such as:

`Meal Rate = Eligible Meal Expenses / Total Chargeable Meal Units`

The implementation must:
- Include only categories marked meal-eligible.
- Apply tenant-configured weights.
- Handle zero meal units safely.
- Define guest meal treatment.
- Prevent duplicate expense inclusion.
- Use exact Decimal/integer poisha arithmetic.
- Show calculation breakdown to authorized users.
- Respect monthly closing/locking.

Do not automatically include every expense in meal cost.

### 7. Reports
Create daily meal report, member-wise monthly count, meal-off report, guest meal report, meal expense summary and monthly meal-rate summary. Add export only if existing infrastructure supports it.

### 8. Permissions and Audit
Suggested capabilities:
- `meals.view`
- `meals.settings.manage`
- `meals.record`
- `meals.update`
- `meals.meal_off.review`
- `meals.guest.manage`
- `meals.reports.view`

Audit meal count changes, meal-off decisions, guest meals and meal-rate settings.

### 9. Tests
Test tenant isolation, fixed/flexible modes, Dhaka cutoff, late meal-off requests, configurable weights, separate guest meals, eligible expense filtering, zero-unit handling, exact arithmetic, locked-period behavior, permissions and responsive calendar.

**Scope boundary:** Do not build the complete Bazar or Finance modules. Integrate only with existing data models.

---

# Task 34 — Bazar and Expense Management

## Objective
Build a Bazar/expense module for recording, reviewing and reporting purchases and operational expenses, including secure receipts and auditable approvals.

## Prompt

Inspect existing expense, payment, user, member, file-storage and audit models. Reuse the Finance ledger/category architecture if present. Do not create a competing expense ledger.

### 1. Expense Categories
Support configurable categories such as Bazar/groceries, electricity, gas, water, WiFi, cleaning/Bua, maintenance, transport and other. Allow authorized category creation/deactivation. Do not delete categories used by historical records.

### 2. Record a Purchase
Create an expense form with purchase date, purchaser, category, vendor (optional), description, payment method, total, notes and optional receipt.

Support itemized purchases:
- Item name.
- Quantity and unit.
- Unit price.
- Line total.

Calculate and validate totals server-side. Never trust client-calculated totals.

### 3. Bazar Assignment/Schedule
If the tenant wants a rota, support member/date assignment, upcoming schedule, completion status, actual purchaser and assignment history. Keep rota assignment separate from expense approval.

### 4. Review Workflow
Use statuses aligned with the existing finance model, such as draft, submitted, pending review, approved/verified, rejected and corrected/reversed.

Authorized reviewers can inspect details/receipts, approve or reject with a reason, and request corrections if supported. Enforce any policy that prohibits self-approval.

### 5. Receipt Uploads
Use configured object storage. Validate MIME type, size and file content where supported. Store receipts privately. Enforce tenant/role access before generating download links. Do not expose private receipt URLs publicly. If storage is unavailable, make receipt optional and document the missing configuration.

### 6. Reports
Provide filters by date, month, category, purchaser and status. Show approved spending, pending review amount, member-wise purchase count/total and item-level history. Reports must remain neutral and factual.

### 7. Finance Integration
Approved expenses must be available to Finance through the existing ledger architecture. Exclude pending/rejected expenses from approved totals. Prevent duplicate ledger posting. Use traceable adjustments/reversals for corrections. Respect the Meal module's configurable eligible-expense setting.

### 8. Permissions and Audit
Suggested capabilities:
- `expenses.view`
- `expenses.create`
- `expenses.update_own`
- `expenses.submit`
- `expenses.review`
- `expenses.approve`
- `expenses.reject`
- `expenses.view_reports`
- `expenses.manage_categories`

Audit creation, edits, submissions, approvals, rejections and corrections.

### 9. Tests
Test tenant isolation, server-side item totals, invalid amount rejection, receipt access, status-based totals, duplicate ledger prevention, approval permissions, audit history, correction history, report accuracy and mobile usability.

**Scope boundary:** Do not implement the full member billing engine or live payment gateway.

---

# Task 35 — Finance, Billing and Payment Management

## Objective
Build the tenant-side finance system for charges, member statements, balances, manual payment recording, verification and financial reporting. Preserve a traceable financial history.

## Prompt

Inspect existing financial, payment, expense, rent, meal and subscription models. Keep platform SaaS subscription billing separate from each mess's internal member billing. Reuse existing ledger architecture and monthly closing rules. Do not create duplicate payment or ledger models.

### 1. Financial Categories
Support tenant-level categories such as room rent, electricity, gas, water, WiFi, cleaning/Bua, maintenance, meal charges, guest meal charges and custom charges. Each category needs a clear name, active status and allocation rule.

### 2. Monthly Billing
Allow authorized staff to select a billing period, review eligible members, add charges, preview member-wise bills and confirm/publish bills.

Support allocation:
- Equal per member.
- Per room.
- Fixed amount.
- Custom amount per member.
- Custom ratio/weight, if configured.

Do not assume every charge is divided equally.

### 3. Member Statement
Show:
- Opening/previous due.
- New rent charges.
- Utility charges.
- Meal charges.
- Other charges.
- Payments received.
- Credits/adjustments.
- Closing balance.

Use:

`Closing Balance = Opening Due + New Charges - Confirmed Payments - Credits`

Keep payments and credits as distinct transaction types. Restrict all-member financial views to authorized roles. A member may view only their own statement.

### 4. Manual Payment Recording
Support member, payment date/time, amount, method (cash, bKash, Nagad, Rocket, bank or other), optional transaction/reference ID, received by, related billing period/charge allocation, optional proof and notes.

Statuses may include pending, confirmed, rejected, partial or refunded, aligned with the existing model. Prevent duplicate transaction references where applicable. Do not reject legitimate cash payments because they have no transaction ID.

### 5. Payment Verification
Authorized staff can review pending payments, inspect details/proof, confirm/reject with reason, record partial payments and record refunds/reversals through traceable entries.

A submitted proof image is not proof that money was actually received. Do not claim online payment success without a verified provider callback.

### 6. Online Payment Readiness
If no gateway is configured:
- Do not simulate success.
- Do not put secret keys in frontend code.
- Do not create fake callback responses.
- Document the integration boundary and required configuration.

A future real gateway integration must include server-side signature/callback verification, idempotency and reconciliation.

### 7. Monthly Closing and Corrections
If supported by the existing architecture, allow authorized staff to preview totals, identify pending payments/expenses and close a period. Record who closed it and when. Prevent ordinary users from silently changing locked historical totals. Use adjustment/reversal entries for corrections. Do not rewrite old statements when rent or meal settings change later.

### 8. Reports
Create monthly charges, confirmed payments, outstanding dues, expenses, member balances, payment-method summary, pending verification queue, income/expense trend and member statement history. Define metrics clearly. Never mix platform subscription revenue with mess-level finances.

### 9. Financial Safety
- Use integer poisha or exact Decimal arithmetic.
- Never use floating-point money calculations.
- Use BDT consistently unless multi-currency is explicitly supported.
- Validate amounts.
- Prevent duplicate payment processing.
- Use database transactions for multi-record operations.
- Keep confirmed payment and ledger history immutable to ordinary roles.
- Use reversal/adjustment entries rather than destructive edits.
- Audit actor, tenant, timestamp, reason and references.
- Tenant-scope every query and enforce permissions.

### 10. Permissions
Suggested capabilities:
- `finance.view`
- `finance.view_all_members`
- `finance.manage_categories`
- `finance.create_bills`
- `finance.publish_bills`
- `finance.record_payment`
- `finance.verify_payment`
- `finance.reject_payment`
- `finance.refund_payment`
- `finance.adjust_balance`
- `finance.close_month`
- `finance.view_reports`

Map to existing role conventions. Do not grant sensitive permissions automatically.

### 11. Tests
Test tenant isolation, exact arithmetic, opening/closing balance, payment status inclusion, duplicate transaction handling, partial payments, verification permissions, reversal history, locked-period rules, member statement privacy, no fake online success and reconciliation of reports.

**Scope boundary:** Build internal mess finance only. Keep it separate from SaaS subscription billing. Do not integrate a live gateway without provider documentation, credentials and explicit scope.

---

# Task 36 — Mess Settings, Roles & Permissions, Audit Logs

## Objective
Complete the tenant-level control center with settings, configurable roles/permissions and an audit-log viewer. Integrate with existing Super Admin and tenant authorization architecture.

## Prompt

Inspect existing tenant settings, role/permission models, audit-log service, authentication, tenant membership, branding, domain and subscription entitlements. Reuse existing systems. Do not create a second authorization engine or audit log.

### 1. Mess Settings

Create settings sections:

**General**
- Mess name and description.
- Logo.
- Contact phone/email.
- Address.
- Timezone, default Asia/Dhaka.
- Preferred language: Bangla or English.

**Appearance**
- Logo and cover image.
- Theme colors within supported design tokens.
- Public website visibility.
- Homepage/menu visibility, if supported by the existing website system.

**Operational Defaults**
- Default billing period.
- Meal settings shortcut.
- Currency default BDT.
- Rental preferences, if module exists.
- Notification preferences.

**Privacy and Visibility**
- Public/member-only/private options for supported information.
- Member directory visibility.
- Contact visibility.
- Rental listing visibility.
- Emergency contact visibility.

Do not expose private member or emergency contact details publicly by default.

### 2. Roles and Permissions
Build role management using the existing permission model.

Suggested default roles:
- Owner.
- Admin.
- Moderator.
- Accountant.
- Meal Manager.
- Member.

Support custom roles if the architecture supports them. Group permissions by Members, Rooms, Meals, Expenses, Finance, Payments, Rental, Notices, Events, Reports, Settings and Audit Logs. Provide a clear permission matrix or grouped controls.

### 3. Permission Safety
- Tenant Owner retains control of their mess, subject to platform safeguards.
- A user cannot grant permissions they do not possess unless explicitly allowed.
- Only authorized users can appoint/change roles.
- Users cannot grant themselves higher privileges.
- Do not allow removal of the last active Owner without a safe ownership-transfer workflow.
- Platform Super Admin and tenant Owner remain distinct.
- Tenant roles must never grant platform Super Admin access.
- Audit every sensitive role change.

All permission checks must happen server-side.

### 4. Audit Log Viewer
Create an Audit Logs page showing:
- Actor and actor role.
- Action and module.
- Record reference.
- Date/time.
- Before/after summary where safe.
- Reason, if supplied.
- Result/status.

Filters: date range, actor, module, action type and result/status. Add pagination and sensible query limits.

Never expose secrets, password hashes, access tokens, full private documents or unnecessary personal data.

### 5. Append-Only Audit History
Reuse the existing audit service. Ordinary admins/moderators must not edit or delete audit entries. Do not provide an audit-delete button. Record actor, tenant, timestamp, action and relevant before/after values. Never log credentials or secret values.

If tamper-evident storage is not implemented, document that limitation. Do not claim the logs are tamper-proof without evidence.

### 6. Settings Change Safety
Validate settings on the server. Preview branding changes where practical. Confirm high-impact changes. Audit important setting changes. Tenant settings must not modify platform-wide configuration. Custom domain and SaaS subscription settings remain in their platform workflows.

### 7. Localization
Support Bangla and English using the existing localization system. Keep translation strings organized, preserve date/currency formatting and use tenant language where supported.

### 8. Permissions
Suggested capabilities:
- `settings.view`
- `settings.update_general`
- `settings.update_appearance`
- `settings.update_privacy`
- `roles.view`
- `roles.create`
- `roles.update`
- `roles.assign`
- `audit.view`
- `audit.export` only if secure export exists.

Use existing permission naming and role hierarchy.

### 9. Tests
Test tenant settings isolation, platform-setting protection, server-side authorization, prevention of self-escalation, separation of tenant roles from Super Admin, last-Owner protection, audit creation and immutability, filters/pagination, sensitive-value redaction, public/private visibility and localization.

**Scope boundary:** Complete only Task 36. Do not start the Member Portal phase.

---

# Phase 4 Completion Checklist

After Tasks 31–36, verify:

- [ ] Task 29–30 dashboard still works.
- [ ] Member records are tenant-isolated.
- [ ] Room capacity and assignments prevent conflicts.
- [ ] Short-term bookings are separate from long-term assignments.
- [ ] Meal settings support fixed and flexible modes.
- [ ] Meal-off cutoff uses Asia/Dhaka.
- [ ] Guest meals are separately tracked.
- [ ] Bazar expenses have review/approval workflow.
- [ ] Receipts are private and permission-protected.
- [ ] Approved expenses integrate correctly with finance.
- [ ] Member bills and balances reconcile.
- [ ] Confirmed payments are not duplicated.
- [ ] Financial corrections use traceable adjustments.
- [ ] Monthly closing does not silently rewrite history.
- [ ] Mess settings cannot modify platform-wide settings.
- [ ] Custom roles cannot bypass server-side authorization.
- [ ] Audit history is protected from ordinary modification/deletion.
- [ ] No cross-tenant data leakage exists.
- [ ] Mobile and desktop layouts are usable.
- [ ] TypeScript, lint, tests and production build pass, or failures are documented.

## Important

Complete each task sequentially and inspect the AI Studio completion report before moving on. If a task reveals a missing dependency from an earlier task, stop and report it instead of creating a duplicate or insecure workaround.

**End of Phase 4 remaining prompts (Tasks 31–36).**
