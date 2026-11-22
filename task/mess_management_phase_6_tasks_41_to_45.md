# Mess Management SaaS --- Phase 6 Implementation Prompts

## Advanced Operations & Community Features \| Tasks 41--45

**Execution order:** Task 41 → Task 42 → Task 43 → Task 44 → Task 45.

**Purpose:** This document provides detailed, sequential implementation
prompts for the next five tasks in the existing Mess Management SaaS
project. It is written in English for Antigravity or another coding
agent.

**Important:** This phase extends the existing application. It is not a
request to rebuild the product, replace its architecture, or create
separate applications for each mess.

------------------------------------------------------------------------

# GLOBAL INSTRUCTIONS --- APPLY TO ALL TASKS

## 1. Inspect the existing project before coding

Before implementation:

1.  Read this entire document.
2.  Inspect the current repository, project structure, package
    configuration, framework, routing, database schema, ORM,
    authentication, authorization, tenant resolution, API patterns, UI
    components, and design system.
3.  Review the completed work from previous phases, especially:
    -   Super Admin and tenant management.
    -   Mess Admin Dashboard.
    -   Members, rooms, meals, bazar, expenses, finance, and payments.
    -   Member Portal.
    -   Notices, events, complaints, and request workflows.
    -   Existing notifications, uploads, audit logs, and settings.
4.  Identify existing models and services that can be extended.
5.  Do not create duplicate modules, models, APIs, or components.
6.  Preserve the existing technology stack and coding conventions.
7.  If a feature already exists, audit it and improve or integrate it
    rather than rebuilding it.
8.  Do not claim that previous tasks are complete unless the current
    codebase confirms it.

Create or update `PROJECT_PROGRESS.md` in the project root. Track the
status of Tasks 41--45, decisions, changed files, tests, blockers, and
the next task.

## 2. Product architecture

The platform is a centralized multi-tenant SaaS:

-   One application serves multiple messes, hostels, and shared
    accommodations.
-   Each mess is a separate tenant.
-   Each tenant has its own members, rooms, staff, operations, and
    settings.
-   Platform Super Admin manages the SaaS platform.
-   Tenant Owner/Admin and authorized staff manage their own mess.
-   Members can access only features and information permitted to them.
-   Tenant data must remain isolated.

Use the existing tenant architecture. Never trust a tenant ID supplied
by the browser as the sole authorization check.

## 3. Mandatory engineering and security rules

-   Follow the existing framework, ORM, API, and UI patterns.
-   Use `Asia/Dhaka` as the business timezone.
-   Use BDT (`৳`) where money is displayed.
-   Use integer poisha or exact decimal arithmetic for financial values.
    Never use floating-point arithmetic for money.
-   Validate input on the server, even when client-side validation
    exists.
-   Enforce authentication, role permissions, and tenant isolation on
    every protected server operation.
-   Do not rely only on hidden UI controls or frontend route guards.
-   Use database transactions for operations that change multiple
    related records.
-   Prevent duplicate operations where retries or repeated clicks are
    possible.
-   Use existing audit logging for important actions.
-   Use private, access-controlled storage for private files.
-   Never expose secrets, credentials, private file URLs, or provider
    tokens in client-side code.
-   Do not create fake external integrations or fake delivery/success
    messages.
-   Preserve existing production data. Never reset or delete production
    data.
-   Add pagination, query limits, and appropriate indexes where needed.
-   Provide loading, empty, error, and success states.
-   Keep the interface responsive and accessible.
-   Use existing notification and approval systems where possible.
-   Avoid collecting unnecessary personal information.

## 4. Role and permission principles

The application may have roles such as:

-   Super Admin.
-   Tenant Owner.
-   Tenant Admin.
-   Moderator.
-   Accountant.
-   Meal Manager.
-   Member.
-   Custom tenant roles.

Do not assume every tenant uses the same role configuration. Use the
existing granular permission system.

For every new module:

1.  Define which permissions are required to view, create, update,
    approve, delete/archive, and export records.
2.  Enforce permissions server-side.
3.  Keep tenant Owner authority consistent with the existing system.
4.  Allow custom roles only through the existing role/permission
    mechanism.
5.  Do not grant broad permissions automatically.
6.  Record sensitive administrative actions in the audit log.

## 5. Required workflow for every task

For each task:

1.  Inspect the existing implementation.
2.  Write a concise implementation plan.
3.  Identify required database, API, UI, permission, and integration
    changes.
4.  Implement the working feature, not only a static mockup.
5.  Add migrations only when needed.
6.  Add server-side validation and authorization.
7.  Connect the UI to real application data.
8.  Add loading, empty, error, and success states.
9.  Test normal flows, permission boundaries, tenant isolation, and edge
    cases.
10. Run available type checks, linting, tests, and production build when
    appropriate.
11. Fix issues introduced by the implementation.
12. Update `PROJECT_PROGRESS.md`.
13. Write the required completion report.
14. Only then start the next task.

If a genuine blocker exists, document it honestly. Do not fabricate
provider responses, test results, or completion status.

------------------------------------------------------------------------

# TASK 41 --- NOTIFICATION CENTER, DELIVERY PREFERENCES & REMINDERS

## Objective

Build a centralized notification system for tenant users and members.
Users should be able to receive and manage relevant in-app
notifications, while authorized staff can configure tenant notification
preferences and reminders.

This task must integrate with existing notification logic. Do not create
a second disconnected notification system.

## A. Inspect existing notification architecture

Inspect:

-   Existing notification models and services.
-   In-app notification UI, if any.
-   Email, SMS, push, or messaging integrations, if any.
-   User and member relationships.
-   Tenant notification settings.
-   Event triggers from payments, meals, complaints, notices, events,
    and requests.
-   Background jobs, queues, schedulers, or cron infrastructure.
-   Existing audit logs and delivery logs.

Determine which delivery channels are actually configured. Do not assume
that email, SMS, push notifications, WhatsApp, or any external provider
is available.

## B. In-app notification center

Create or improve a notification center for authenticated tenant users
and members.

Requirements:

1.  Show notifications belonging to the authenticated user and correct
    tenant.
2.  Support unread and read states.
3.  Display title, short message, category, timestamp, and relevant
    action link.
4.  Allow marking one notification as read.
5.  Allow marking all eligible notifications as read.
6.  Support pagination or sensible limits.
7.  Show unread notification count.
8.  Provide empty, loading, and error states.
9.  Do not expose notifications belonging to another user or tenant.
10. Validate notification ownership on the server when marking as read
    or opening protected resources.

Possible notification categories include:

-   General announcement.
-   Meal update.
-   Meal-off request status.
-   Payment submitted/confirmed/rejected.
-   New bill or statement.
-   Complaint/request status.
-   Room change request.
-   Event update or RSVP.
-   Visitor alert.
-   Maintenance/task assignment.
-   Inventory alert.
-   Poll/voting reminder.

Only use categories that correspond to real implemented features.

## C. Notification generation

Create a consistent event-to-notification mechanism using the existing
service architecture.

Where appropriate, generate notifications for:

-   A notice published to a member or role.
-   A member request submitted or reviewed.
-   A meal request approved or rejected.
-   A payment submitted, confirmed, or rejected.
-   A new bill published.
-   A complaint status changed or response added.
-   An event published or updated.
-   A visitor arrival requiring attention.
-   A task assigned or updated.
-   An inventory item reaching a configured threshold.
-   A poll opening or closing.

Rules:

1.  Generate notifications only for the intended recipients.
2.  Respect tenant and audience targeting.
3.  Prevent duplicate notifications when an event is retried.
4.  Use idempotency or a unique event reference where appropriate.
5.  Do not generate a notification before the underlying business
    operation succeeds.
6.  Notification failure must not roll back an otherwise successful
    business operation unless the existing architecture explicitly
    requires transactional outbox behavior.
7.  Prefer a reliable queue/outbox pattern if the project already
    supports it.
8.  Do not create noisy notifications for every minor database update.

## D. Notification preferences

Create a notification preferences page for users/members if the product
supports user-level preferences.

Possible controls:

-   In-app notifications enabled/disabled, where policy permits.
-   Email notifications enabled/disabled, only if email delivery is
    configured.
-   SMS notifications enabled/disabled, only if SMS delivery is
    configured.
-   Category-level preferences.
-   Quiet hours, if supported.
-   Reminder preferences.

Rules:

1.  Respect tenant-required operational notifications.
2.  Do not allow users to disable mandatory security or critical account
    notices if product policy requires them.
3.  Store preferences securely.
4.  Validate preference updates on the server.
5.  Do not display unavailable channels as if they work.
6.  Provide sensible defaults.

## E. Reminder configuration for authorized staff

If the application has scheduling infrastructure, allow authorized
tenant roles to configure reminders such as:

-   Upcoming payment due date.
-   Outstanding balance reminder.
-   Meal selection cutoff reminder.
-   Event reminder.
-   Poll closing reminder.
-   Maintenance task due reminder.

Requirements:

-   Allow only supported reminder types.
-   Configure timing and audience.
-   Prevent duplicate scheduled reminders.
-   Respect tenant timezone (`Asia/Dhaka` by default).
-   Allow authorized staff to pause or cancel a reminder.
-   Record who created or changed reminder settings.
-   Do not send reminders through an unconfigured provider.

If no reliable scheduler exists, implement the configuration/data model
only where useful and document that automatic scheduled delivery
requires a scheduler integration. Do not simulate scheduled delivery.

## F. Delivery logs and failure handling

If external delivery providers exist:

-   Record provider, channel, recipient reference, status, attempt
    count, and timestamps.
-   Never store provider secrets in logs.
-   Retry transient failures safely.
-   Avoid infinite retries.
-   Do not retry permanent failures indefinitely.
-   Do not expose private provider error details to ordinary members.
-   Report delivery as successful only when the provider confirms it.

If no external provider is configured, the in-app notification center
must still work independently.

## G. UI requirements

Create: - Notification bell/indicator in relevant authenticated
layouts. - Notification dropdown or panel. - Full notification center
page. - Read/unread styling with readable labels. - Notification
preferences page. - Reminder configuration page for authorized roles, if
scheduling is supported.

Ensure mobile usability and accessible controls.

## H. Testing requirements

Test at least:

1.  User sees only their own notifications.
2.  Tenant A cannot access Tenant B notifications.
3.  Member cannot mark another user's notification as read.
4.  Unread count is correct.
5.  Mark-one-as-read works.
6.  Mark-all-as-read works.
7.  Duplicate business events do not create duplicate notifications.
8.  Failed notification delivery does not corrupt the business record.
9.  Preferences are saved and enforced.
10. Unconfigured channels are not presented as active.
11. Reminder scheduling respects `Asia/Dhaka`.
12. Unauthorized roles cannot configure reminders.
13. Mobile notification center works.

## Task 41 deliverables

-   Central in-app notification center.
-   Notification generation/service integration.
-   Read/unread management.
-   User notification preferences, where supported.
-   Reminder configuration, if scheduling infrastructure exists.
-   Delivery status/error handling for configured providers.
-   Permission and tenant isolation tests.
-   Updated `PROJECT_PROGRESS.md`.

## Task 41 completion report

Report: 1. Implemented notification features. 2. Event triggers
connected. 3. Delivery channels actually configured. 4.
Reminder/scheduler status. 5. Routes/pages and services changed. 6.
Database changes. 7. Security and permission controls. 8. Files created
and modified. 9. Exact tests executed and results. 10. Known
limitations. 11. Status: `COMPLETE` or `BLOCKED`.

Do not start Task 42 until Task 41 is tested and reported.

------------------------------------------------------------------------

# TASK 42 --- INVENTORY, ASSET & STOCK MANAGEMENT

## Objective

Build a tenant-scoped inventory and asset management module for mess
supplies, kitchen items, cleaning materials, furniture, appliances, and
other shared resources.

The module should help authorized staff track stock, purchases, usage,
transfers, damaged items, and low-stock alerts.

Do not confuse inventory records with member meal expenses or financial
ledger entries. Integrate with existing expense and bazar modules only
through explicit workflows.

## A. Inspect existing modules

Inspect:

-   Bazar and expense management.
-   Purchase records and suppliers, if available.
-   Expense categories.
-   File/receipt uploads.
-   Finance and approval workflows.
-   Tenant roles and permissions.
-   Notifications.
-   Audit logs.

Reuse existing purchase/expense records when possible. Avoid recording
the same purchase twice.

## B. Inventory dashboard

Create an inventory dashboard showing:

-   Total active inventory items.
-   Low-stock items.
-   Out-of-stock items.
-   Recent stock movements.
-   Recent purchases.
-   Damaged or written-off items, if tracked.
-   Inventory categories.

All counts must come from real tenant-scoped records.

## C. Inventory item management

Allow authorized roles to create and manage inventory items.

Suggested fields:

-   Item name.
-   Item code/SKU, if used.
-   Category.
-   Description.
-   Unit of measurement (kg, litre, piece, packet, box, etc.).
-   Current quantity.
-   Minimum stock threshold.
-   Storage location.
-   Purchase/average cost, if authorized and supported.
-   Supplier, if supported.
-   Item type: consumable or reusable asset.
-   Active/inactive status.
-   Image, if supported.

Requirements:

1.  Validate required fields.
2.  Prevent duplicate item codes within the tenant where item codes are
    used.
3.  Use configurable units; do not assume every item uses the same unit.
4.  Store quantities using an appropriate exact numeric type.
5.  Prevent negative stock unless an explicitly authorized adjustment
    workflow permits it.
6.  Keep inventory records tenant-scoped.
7.  Use pagination and search/filtering.
8.  Archive items rather than permanently deleting items with historical
    movements.

## D. Stock movements

Implement a stock movement ledger.

Movement types may include:

-   Opening stock.
-   Purchase/stock received.
-   Consumption/usage.
-   Transfer between locations.
-   Return.
-   Damage/loss.
-   Stock adjustment.
-   Write-off.

For each movement, record:

-   Item.
-   Movement type.
-   Quantity and unit.
-   Date/time.
-   Source/destination, where applicable.
-   Reference to purchase, expense, task, or other record, if
    applicable.
-   Note/reason.
-   Created by.
-   Approval status, if approval is required.

Rules:

1.  Do not overwrite historical movement records silently.
2.  Use a transaction to update stock and create the movement record.
3.  Prevent duplicate movement submissions.
4.  Validate available stock before consumption or transfer.
5.  Require permission for manual stock adjustments and write-offs.
6.  Keep a clear audit trail.
7.  Calculate current stock from the authoritative movement model or
    maintain a transactionally consistent balance according to existing
    architecture.

## E. Purchase and stock receiving

Allow authorized staff to record stock received.

Possible fields:

-   Supplier.
-   Purchase date.
-   Item and quantity.
-   Unit cost.
-   Total cost.
-   Receipt/invoice reference.
-   Receipt image/file.
-   Related expense/bazar record.

Requirements:

1.  Reuse existing expense/purchase records where possible.
2.  Prevent duplicate financial expense entries.
3.  Define whether creating a purchase also creates a stock receipt.
4.  Use a database transaction for linked stock and expense operations.
5.  Do not automatically mark an expense as approved or paid unless the
    existing workflow does so.
6.  Validate quantities and exact money values.
7.  Keep supplier information tenant-scoped.

If the current project has no supplier module, implement a lightweight
supplier reference only if needed. Avoid building an unrelated
procurement platform.

## F. Consumption and usage

Allow authorized roles to record consumption or usage.

Examples:

-   Kitchen ingredients used.
-   Cleaning supplies consumed.
-   Shared household supplies used.
-   Equipment assigned to a room or location.

Requirements:

-   Select item and quantity.
-   Select usage category or destination.
-   Add note/reason where required.
-   Validate available stock.
-   Record who submitted the movement.
-   Require approval where tenant policy requires it.
-   Do not automatically charge a member for inventory usage.

If consumption is linked to meal/bazar costing, use a clearly defined
integration with the existing finance/meal service. Do not create a
duplicate meal expense.

## G. Low-stock alerts

Implement low-stock and out-of-stock indicators based on item
thresholds.

-   Show alerts on the inventory dashboard.
-   Use Task 41 notification infrastructure if available.
-   Prevent repeated alerts from being generated continuously for the
    same unchanged stock condition.
-   Notify only authorized tenant roles.
-   Allow threshold updates by authorized roles.
-   Do not send external notifications unless configured.

## H. Inventory reports

Provide useful filters and reports:

-   Current stock by category.
-   Low-stock and out-of-stock list.
-   Stock movement history.
-   Purchase/receiving history.
-   Consumption/usage history.
-   Damaged/lost/write-off history.
-   Item-level movement report.

Reports must be tenant-scoped and permission-controlled. Export only if
the existing export pattern is secure.

## I. Asset tracking

For reusable assets such as beds, fans, refrigerators, tables, chairs,
and appliances, support an asset record if it fits the existing model.

Possible fields:

-   Asset name/type.
-   Asset tag or code.
-   Purchase date.
-   Current location.
-   Condition.
-   Assigned room/location.
-   Maintenance status.
-   Warranty information, if available.
-   Active/retired status.

Do not collect unnecessary personal data. Do not create fake warranty or
purchase information.

## J. UI requirements

Create: - Inventory overview. - Item list with search/filter. - Item
create/edit form. - Item detail and stock history. - Stock receive
form. - Consumption/stock-out form. - Adjustment/transfer workflow. -
Low-stock view. - Reports. - Asset list/detail if implemented.

Use clear units and quantity formatting. Make the screens
mobile-friendly.

## K. Testing requirements

Test at least:

1.  Tenant A cannot view Tenant B inventory.
2.  Unauthorized role cannot create or adjust stock.
3.  Duplicate item code is rejected where applicable.
4.  Stock receipt increases stock correctly.
5.  Consumption decreases stock correctly.
6.  Insufficient stock is rejected.
7.  Concurrent stock movements do not create an incorrect balance.
8.  Duplicate movement submission is handled safely.
9.  Historical movements remain traceable.
10. Purchase integration does not duplicate expenses.
11. Low-stock alerts trigger at the configured threshold.
12. Repeated low-stock checks do not spam notifications.
13. Archived items retain historical records.
14. Reports show correct tenant-scoped results.
15. Mobile inventory screens work.

## Task 42 deliverables

-   Inventory dashboard.
-   Item/category management.
-   Stock movement ledger.
-   Purchase/receiving integration.
-   Consumption and adjustment workflows.
-   Low-stock alerts.
-   Inventory reports.
-   Asset tracking where appropriate.
-   Permission, tenant isolation, and stock consistency tests.
-   Updated `PROJECT_PROGRESS.md`.

## Task 42 completion report

Report implemented modules, stock movement rules, purchase/expense
integration, alert behavior, database changes, routes/services,
permissions, files changed, exact test results, limitations, and
`COMPLETE` or `BLOCKED` status.

Do not start Task 43 until Task 42 is tested and reported.

------------------------------------------------------------------------

# TASK 43 --- MAINTENANCE, WORK ORDERS & TASK MANAGEMENT

## Objective

Build a maintenance and operational task management module for
mess/hostel operations. Authorized staff should be able to create,
assign, prioritize, track, and close maintenance work and recurring
operational tasks.

Integrate with existing complaints, inventory, notifications, and audit
logs. Do not create duplicate complaint records or duplicate task
systems.

## A. Inspect existing modules

Inspect:

-   Complaints and member requests.
-   Room and asset management.
-   Inventory.
-   Staff/member roles and permissions.
-   Notifications.
-   File uploads.
-   Audit logs.
-   Existing task, workflow, or maintenance models.

Determine whether a complaint can be converted into a maintenance work
order. Prefer linking records instead of copying them.

## B. Maintenance dashboard

Create a dashboard with:

-   Open work orders.
-   Pending review.
-   In progress.
-   Overdue work orders.
-   Completed work orders.
-   Work orders by category.
-   Recent activity.
-   Tasks assigned to the current user, where relevant.

Use real tenant-scoped records.

## C. Maintenance request and work order

Authorized staff should be able to create work orders for issues such
as:

-   Electrical.
-   Plumbing.
-   Internet/network.
-   Furniture.
-   Appliance repair.
-   Cleaning.
-   Pest control.
-   Building/room repair.
-   Other tenant-configured categories.

Possible fields:

-   Work order reference.
-   Title and description.
-   Category.
-   Priority.
-   Location/room/asset reference.
-   Related complaint, if any.
-   Assigned staff/vendor, if supported.
-   Expected start date.
-   Due date.
-   Status.
-   Attachments.
-   Internal notes.
-   Member-visible updates, if applicable.

Rules:

1.  Work orders must belong to one tenant.
2.  Validate room/asset references against the same tenant.
3.  Restrict internal notes to authorized roles.
4.  Members may see only updates explicitly marked member-visible.
5.  Do not expose vendor or staff private contact details to ordinary
    members.
6.  Use existing status conventions where available.
7.  Record who created, assigned, updated, and closed a work order.

## D. Work order lifecycle

Implement a controlled lifecycle based on existing workflow patterns.
Suggested states:

-   Draft.
-   Open.
-   Assigned.
-   In Progress.
-   Waiting for Parts.
-   Completed.
-   Verified.
-   Cancelled.

Do not force all states if the existing system uses a simpler valid
workflow.

Requirements:

-   Validate allowed transitions on the server.
-   Restrict assignment and status changes by permission.
-   Require a completion note where appropriate.
-   Allow verification by an authorized role if tenant policy requires
    it.
-   Keep status history.
-   Do not silently delete completed work orders.
-   Audit important changes.

## E. Staff assignment

Allow authorized users to assign work to tenant staff or configured
vendors.

-   Validate assignee belongs to the same tenant or is an allowed
    vendor.
-   Show assigned tasks to the appropriate user.
-   Prevent unauthorized users from reassigning tasks.
-   Track assignment history.
-   Allow reassignment with a reason if required.
-   Notify the assignee using Task 41 notification infrastructure if
    available.

Do not create staff accounts automatically.

## F. Operational task management

Create a general task board/list for recurring and one-time operational
work.

Examples:

-   Clean kitchen.
-   Check water filter.
-   Inspect fire extinguisher.
-   Collect utility bill.
-   Check common-area lights.
-   Prepare monthly report.
-   Inspect room equipment.

Fields may include:

-   Task title and description.
-   Category.
-   Assignee.
-   Start date and due date.
-   Priority.
-   Recurrence rule, if supported.
-   Status.
-   Checklist/subtasks, if supported.
-   Completion evidence, if required.
-   Created by and updated by.

Requirements:

1.  Only authorized roles can create or assign tasks.
2.  Assignees can update only permitted fields.
3.  Validate due dates and recurrence configuration.
4.  Prevent duplicate recurring task generation.
5.  Store recurrence timezone consistently using `Asia/Dhaka`.
6.  Do not generate future tasks indefinitely without limits.
7.  Keep completion history.

If no scheduler exists, recurring task templates may be implemented
without claiming automatic generation. Document the scheduler
dependency.

## G. Maintenance costs and inventory linkage

If a work order uses inventory items or creates a cost:

-   Link the relevant stock movement or expense record.
-   Do not duplicate expense entries.
-   Require appropriate approval for financial records.
-   Use exact money arithmetic.
-   Keep maintenance operational status separate from payment/expense
    approval status.
-   Do not automatically charge a member unless an explicit tenant
    billing rule and authorized workflow permit it.

## H. Member-facing status

Where appropriate, allow a member to view the status of their own
complaint or related maintenance request.

-   Show only member-visible updates.
-   Do not reveal internal notes, staff-only discussions, or unrelated
    work orders.
-   Notify the member of important status changes using the existing
    notification system.
-   Do not claim work is complete until the authorized workflow marks it
    complete.

## I. Reports

Provide filters/reports for:

-   Work orders by status.
-   Work orders by category.
-   Overdue work orders.
-   Staff workload.
-   Completion time, if data supports it.
-   Maintenance costs, if linked to authoritative expense records.
-   Recurring task completion.

Do not calculate misleading performance metrics from incomplete data.

## J. Testing requirements

Test at least:

1.  Tenant isolation for work orders and tasks.
2.  Unauthorized users cannot create, assign, or close work orders.
3.  Room and asset references must belong to the same tenant.
4.  Valid and invalid status transitions.
5.  Assignment to an unauthorized or cross-tenant user is rejected.
6.  Assignee can update only permitted fields.
7.  Internal notes are hidden from members.
8.  Member sees only their own permitted maintenance updates.
9.  Duplicate recurring task generation is prevented.
10. Due-date and timezone behavior is correct.
11. Inventory usage does not create negative stock.
12. Expense integration does not duplicate costs.
13. Audit history is retained.
14. Mobile task and work-order views work.

## Task 43 deliverables

-   Maintenance dashboard.
-   Work order create/detail/update workflow.
-   Staff assignment.
-   Operational task board/list.
-   Recurring task templates or scheduling, depending on available
    infrastructure.
-   Inventory/expense integration where appropriate.
-   Member-visible status integration.
-   Reports and filters.
-   Security/workflow tests.
-   Updated `PROJECT_PROGRESS.md`.

## Task 43 completion report

Report implemented workflows, statuses, assignment rules, recurring task
behavior, inventory/expense integrations, database/API changes,
permissions, files changed, exact tests, limitations, and `COMPLETE` or
`BLOCKED` status.

Do not start Task 44 until Task 43 is tested and reported.

------------------------------------------------------------------------

# TASK 44 --- VISITOR, GUEST & ENTRY MANAGEMENT

## Objective

Build a tenant-scoped visitor management module to help authorized staff
record and manage visitors entering a mess or hostel. Members may be
able to pre-register expected visitors if the tenant enables it.

Prioritize privacy, safety, minimal data collection, and clear access
permissions.

## A. Inspect existing architecture

Inspect:

-   Tenant settings and privacy rules.
-   Member and room records.
-   Role/permission system.
-   Existing visitor/guest meal records.
-   Guest rental or short-term booking records.
-   Notifications.
-   Audit logs.
-   File storage and any identity verification functionality.

Do not confuse: - A visitor entering for a short visit. - A guest
staying overnight. - A short-term room rental customer. - A guest meal
record.

Link to existing records where appropriate. Do not create duplicate
guest or booking records.

## B. Visitor dashboard

Create a visitor dashboard showing, according to the user's permissions:

-   Expected visitors today.
-   Currently checked-in visitors.
-   Checked-out visitors.
-   Pending approvals.
-   Recent visitor activity.

Do not show visitor personal details to unauthorized users.

## C. Visitor records

Allow authorized staff to register a visitor with only the information
required by tenant policy.

Possible fields:

-   Visitor name.
-   Contact number, if required.
-   Visit purpose.
-   Host member.
-   Expected arrival time.
-   Expected departure time.
-   Actual check-in time.
-   Actual check-out time.
-   Number of visitors.
-   Status.
-   Staff member who recorded the visit.
-   Notes, if necessary.

Data minimization requirements:

1.  Do not require national ID/passport numbers by default.
2.  Do not collect identity document images unless a lawful,
    tenant-approved requirement exists and secure storage is available.
3.  Do not expose visitor phone numbers or personal details to other
    members.
4.  Define retention/deletion rules with tenant settings where
    appropriate.
5.  Do not use visitor data for unrelated purposes.

## D. Visitor pre-registration

If enabled by tenant settings, allow a member to submit an expected
visitor request.

The request may include: - Visitor name. - Visit date. - Expected
time. - Purpose. - Number of visitors. - Optional contact details if
required.

Rules:

1.  A member can create requests only for themselves and their tenant.
2.  A member cannot approve their own visitor request unless tenant
    policy explicitly permits it.
3.  Only authorized staff can approve/reject when approval is required.
4.  Validate visit date and time.
5.  Prevent duplicate or conflicting requests according to tenant
    policy.
6.  Show the member only their own visitor requests.
7.  Notify the host member and authorized staff using Task 41
    notifications, if available.

## E. Check-in and check-out

Implement a controlled visitor lifecycle.

Suggested statuses: - Expected. - Pending Approval. - Approved. -
Checked In. - Checked Out. - Rejected. - Cancelled. - No Show.

Requirements:

-   Only authorized staff can perform official check-in/check-out unless
    a tenant-enabled workflow allows another role.
-   Record actual check-in and check-out timestamps server-side.
-   Prevent check-in for rejected/cancelled requests.
-   Prevent duplicate check-in.
-   Prevent checkout before check-in.
-   Validate tenant ownership.
-   Keep status history.
-   Use server-side time and `Asia/Dhaka`.
-   Provide a clear current visitor list for authorized staff.

## F. Visitor log and search

Provide a paginated visitor log with filters:

-   Date range.
-   Status.
-   Host member.
-   Visit purpose/category.
-   Check-in/check-out state.

Only authorized roles may search detailed visitor records. Members must
see only their own relevant visitor requests, not the full visitor
register.

## G. Visitor safety and emergency handling

If the tenant supports it, provide minimal operational controls:

-   Emergency contact instructions.
-   Visitor check-out status.
-   Alert for visitors who remain checked in beyond an expected time.
-   Authorized staff contact information.

Do not present the visitor module as a security guarantee or substitute
for physical access control. Do not implement facial recognition, covert
tracking, or unnecessary surveillance.

## H. Notifications

Use Task 41 notification infrastructure for: - New visitor request. -
Approval/rejection. - Expected visitor reminder. - Visitor check-in, if
the host member should be informed. - Visitor checkout, if enabled. -
Overdue visitor alert, if a reliable scheduler exists.

Avoid duplicate notifications. Do not claim SMS/email delivery unless
configured and confirmed.

## I. Privacy and audit

-   Restrict detailed visitor logs to authorized roles.
-   Keep tenant isolation on every endpoint.
-   Avoid exposing visitor details in public pages.
-   Log access to sensitive visitor records if supported by the audit
    architecture.
-   Keep data retention aligned with tenant policy and applicable law.
-   Do not create public visitor profile links.
-   Do not store sensitive identity documents in public storage.

## J. Testing requirements

Test at least:

1.  Tenant A cannot access Tenant B visitor records.
2.  Member can submit a visitor request only for themselves.
3.  Member cannot approve their own request unless explicitly permitted.
4.  Unauthorized role cannot check visitors in or out.
5.  Rejected/cancelled request cannot be checked in.
6.  Duplicate check-in is prevented.
7.  Checkout before check-in is rejected.
8.  Actual timestamps are server-generated.
9.  Members cannot view the full visitor log.
10. Visitor personal details are hidden from unauthorized users.
11. Search and date filters are tenant-scoped.
12. Retention/deletion policy is respected where implemented.
13. Notifications do not duplicate.
14. Mobile check-in/check-out interface works.

## Task 44 deliverables

-   Visitor dashboard.
-   Visitor record management.
-   Member visitor pre-registration, if enabled.
-   Approval workflow, if configured.
-   Check-in/check-out workflow.
-   Visitor log and filters.
-   Privacy and audit controls.
-   Notification integration.
-   Tests for access, privacy, and lifecycle rules.
-   Updated `PROJECT_PROGRESS.md`.

## Task 44 completion report

Report implemented visitor workflows, pre-registration/approval
behavior, check-in/check-out rules, privacy controls,
routes/services/database changes, files changed, exact test results,
limitations, and `COMPLETE` or `BLOCKED` status.

Do not start Task 45 until Task 44 is tested and reported.

------------------------------------------------------------------------

# TASK 45 --- POLLS, VOTING & MEMBER COMMUNITY PARTICIPATION

## Objective

Build a tenant-scoped polls and voting module that allows authorized
tenant roles to gather member feedback and make transparent community
decisions.

The module must support privacy settings and prevent duplicate or
unauthorized voting. It must not be represented as a legally binding
election system.

## A. Inspect existing modules

Inspect:

-   Member and tenant models.
-   Role and permission system.
-   Notices and events.
-   Existing survey, poll, or voting models.
-   Notification infrastructure.
-   Audit logs.
-   Tenant privacy settings.

Reuse existing poll/survey functionality if present.

## B. Poll management

Allow authorized roles to create and manage polls.

Possible fields: - Poll title. - Description/instructions. - Poll
type. - Options. - Start date/time. - End date/time. - Eligible
audience. - Anonymous or identified voting mode. - Single-choice or
multiple-choice setting. - Results visibility. - Status. - Created by. -
Published date.

Possible poll types: - General feedback. - Meal preference. - Event
preference. - Shared facility decision. - Community suggestions. - Other
tenant-configured poll.

Do not hardcode these categories if the system already supports
configurable categories.

## C. Poll configuration rules

Support the following options where practical:

1.  Single-choice poll.
2.  Multiple-choice poll.
3.  Start and end date/time.
4.  Eligible members or roles.
5.  Anonymous voting, if supported safely.
6.  Identified voting.
7.  Results visible immediately or only after closing.
8.  Optional result visibility to members.
9.  Draft, Published, Closed, and Cancelled states.

Validate poll configuration on the server.

Rules: - End time must be after start time. - Published polls must
follow controlled editing rules. - Do not change options after votes
exist unless a safe, audited correction workflow is explicitly
implemented. - Closed/cancelled polls must not accept new votes. - Use
`Asia/Dhaka` for business scheduling. - Only authorized roles can
create, publish, close, or cancel polls.

## D. Voting workflow

Members should be able to:

-   View polls for which they are eligible.
-   Read poll instructions and options.
-   Submit a vote.
-   See confirmation that the vote was recorded.
-   View results only when allowed by poll configuration.

Security and integrity requirements:

1.  Resolve the voter from the authenticated session.
2.  Determine eligibility server-side.
3.  Enforce tenant isolation.
4.  Prevent duplicate voting according to the poll's voting rules.
5.  Prevent a member from voting for another member.
6.  Validate option IDs against the selected poll.
7.  Reject votes outside the active voting window.
8.  Use a database transaction to record votes safely.
9.  Make vote submission idempotent where appropriate.
10. Do not trust client-provided voter ID, tenant ID, eligibility, or
    poll status.

### Anonymous voting

If anonymous voting is offered:

-   Do not expose voter identity in result views.
-   Separate eligibility/duplicate-vote enforcement from the displayed
    vote record where feasible.
-   Restrict raw vote data to highly authorized roles.
-   Do not claim cryptographic anonymity unless the implementation
    actually provides it.
-   Clearly explain the privacy behavior to poll creators and voters.
-   Avoid collecting unnecessary metadata.

If the existing architecture cannot support safe anonymous voting,
implement identified voting first and document anonymous voting as
unavailable rather than providing misleading privacy claims.

## E. Results and analytics

Provide results based on the poll configuration.

Possible displays: - Total eligible participants, if available. - Total
votes. - Participation rate, only when denominator is reliable. - Vote
count per option. - Percentage per option. - Results chart.

Rules: 1. Do not reveal results before the configured visibility time.
2. Do not expose voter identities in anonymous result views. 3. Do not
show partial results to ordinary members if results are configured to
remain hidden. 4. Avoid misleading percentages when the vote count is
zero. 5. Use backend-calculated totals. 6. Scope all results to the
correct tenant and poll.

## F. Member suggestions and feedback

If appropriate, provide a simple suggestion submission area linked to
the community participation module.

Members may submit: - Suggestion title. - Description. - Category, if
configured. - Optional anonymous display preference, only if the privacy
behavior is clearly defined. - Submission date. - Status, if reviewed by
admins.

Rules: - Members can view their own submissions. - Public sharing
requires an explicit moderation/publishing action. - Do not publish
private suggestions automatically. - Prevent spam with validation and
rate limiting where supported. - Keep admin-only notes private.

Do not duplicate the existing Complaints module. Complaints remain
operational issue reports; suggestions are community ideas or feedback.

## G. Poll notifications

Use Task 41 notification infrastructure for: - New poll published to
eligible members. - Poll closing reminder. - Poll closed/results
available. - Poll cancelled or materially updated.

Notify only eligible members. Prevent duplicate reminders. Respect
notification preferences and tenant settings.

If a scheduler is unavailable, do not claim automated reminders are
active.

## H. Audit and governance

Record: - Poll creation. - Publication. - Option changes before voting
begins. - Poll closure/cancellation. - Permission-sensitive changes. -
Result visibility changes.

Do not allow silent modification of votes. If a correction process is
necessary, use a documented, permission-controlled, auditable process.

Clearly label the feature as a mess/hostel community poll, not a legally
binding election or official voting system.

## I. UI requirements

Create: - Poll dashboard for authorized staff. - Poll create/edit
form. - Poll detail and publishing workflow. - Member poll list. -
Member voting interface. - Vote confirmation. - Results page with charts
where allowed. - Suggestion submission/list, if implemented.

Ensure mobile-friendly controls, accessible labels, clear deadlines, and
understandable privacy descriptions.

## J. Testing requirements

Test at least:

1.  Tenant A cannot access Tenant B polls or results.
2.  Unauthorized roles cannot create or publish polls.
3.  Only eligible members can vote.
4.  Member cannot vote on behalf of another member.
5.  Duplicate voting is prevented.
6.  Votes outside the voting window are rejected.
7.  Closed/cancelled polls reject votes.
8.  Invalid option IDs are rejected.
9.  Multiple-choice limits are enforced.
10. Anonymous results do not expose voter identity.
11. Results remain hidden until configured visibility time.
12. Zero-vote poll results render correctly.
13. Poll option changes are restricted after voting begins.
14. Notification retries do not create duplicate reminders.
15. Suggestion submissions are not public before moderation.
16. Mobile voting interface works.

## Task 45 deliverables

-   Poll management for authorized staff.
-   Poll publishing and scheduling.
-   Member poll list and voting interface.
-   Duplicate-vote and eligibility enforcement.
-   Results and analytics with visibility controls.
-   Anonymous voting only if safely supported.
-   Member suggestion feature, if implemented.
-   Notification integration.
-   Audit history.
-   Tests for vote integrity, privacy, permissions, and tenant
    isolation.
-   Updated `PROJECT_PROGRESS.md`.

## Task 45 completion report

Report: 1. Poll types and settings implemented. 2. Voting and
eligibility rules. 3. Duplicate-vote prevention approach. 4. Anonymous
voting status and limitations. 5. Results visibility behavior. 6.
Suggestion feature status. 7. Notification/scheduler status. 8. Routes,
services, and database changes. 9. Security and audit controls. 10.
Files created and modified. 11. Exact tests executed and results. 12.
Known limitations. 13. Status: `COMPLETE` or `BLOCKED`.

------------------------------------------------------------------------

# PHASE 6 --- FINAL INTEGRATION & ACCEPTANCE REVIEW (TASKS 41--45)

After Tasks 41--45 are individually completed, perform a final
integration review.

## 1. End-to-end scenarios

Verify these scenarios using realistic test data:

### Notifications

1.  A business event occurs, such as a payment confirmation.
2.  The correct member receives an in-app notification.
3.  The member can mark it as read.
4.  Another member cannot access it.
5.  A retry does not create duplicate notifications.

### Inventory

1.  Authorized staff create an inventory item.
2.  Staff record a stock receipt.
3.  A valid usage movement reduces stock.
4.  Low-stock alert appears at the configured threshold.
5.  Unauthorized users cannot adjust stock.

### Maintenance and tasks

1.  A member complaint can be linked to a work order where supported.
2.  Authorized staff assign the work order.
3.  The assignee updates permitted fields.
4.  An authorized user completes/verifies the work.
5.  The member sees only permitted status updates.

### Visitors

1.  A member submits a visitor pre-registration request if enabled.
2.  Authorized staff approve/reject it.
3.  Staff check the visitor in and out.
4.  Members cannot view the full visitor register.
5.  Visitor records remain tenant-isolated.

### Polls

1.  Authorized staff publish a poll.
2.  Eligible members can vote.
3.  Duplicate votes are rejected.
4.  Ineligible members cannot vote.
5.  Results are shown according to configured visibility.

## 2. Security acceptance review

Verify:

-   Tenant isolation on every protected read/write.
-   Server-side role and permission enforcement.
-   No insecure direct object references.
-   Private visitor and member data remain private.
-   Inventory movements cannot be manipulated by unauthorized users.
-   Maintenance internal notes are not exposed to members.
-   Notification ownership is enforced.
-   Poll eligibility and duplicate-vote rules are enforced server-side.
-   Sensitive data and provider secrets are not exposed in browser code
    or logs.
-   Important operations are auditable.

## 3. Quality checks

Run the checks available in the project:

-   TypeScript/type checking.
-   Linting.
-   Unit tests.
-   Integration tests.
-   End-to-end tests, if configured.
-   Production build.

Do not claim a check passed unless it was actually executed and passed.
If a check cannot run because of missing environment variables, database
access, or provider configuration, state the exact reason.

## 4. Final report

Create `PHASE_6_TASKS_41_TO_45_COMPLETION_REPORT.md` containing:

-   Summary of each task.
-   Implemented features.
-   Routes/pages added or updated.
-   Backend/API services changed.
-   Database migrations/models changed.
-   Permissions and tenant-isolation measures.
-   External providers actually connected.
-   Scheduler/queue status.
-   Tests executed and exact results.
-   Build status.
-   Known limitations and follow-up work.

Update `PROJECT_PROGRESS.md` with the final status of Tasks 41--45.

## 5. Final execution rule

Do not stop after writing plans or generating static UI. Implement
working features connected to the existing backend.

A task is complete only when its required behavior is implemented,
server-side authorization is enforced, relevant tests have actually run,
and its completion report has been written.

If an external provider, scheduler, or queue is unavailable, implement
only the safe parts that can be verified and clearly document the
missing dependency.

**Start with Task 41. Complete, test, and report Task 41 before starting
Task 42. Continue sequentially through Task 45.**
