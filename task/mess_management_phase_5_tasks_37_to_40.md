# Mess Management SaaS --- Phase 5 Implementation Prompts

## Member Portal \| Tasks 37--40

**Execution order:** Task 37 → Task 38 → Task 39 → Task 40.

This document is intended to be provided to Antigravity together with
the existing project. It contains detailed implementation prompts in
English. The coding agent must execute the tasks sequentially, one task
at a time, and report the actual work and test results after each task.

------------------------------------------------------------------------

# GLOBAL INSTRUCTIONS --- APPLY TO EVERY TASK

You are working on an existing multi-tenant Mess Management SaaS
application. Implement the Member Portal in the current codebase. Do not
rebuild the application or replace its technology stack.

## 1. Inspect before coding

Before making changes:

1.  Read this entire document.
2.  Inspect the repository structure, package configuration, framework,
    routing, database schema, ORM, authentication, authorization, API
    patterns, UI components, styling system, and existing admin modules.
3.  Inspect existing member, room, meal, finance, payment, notice,
    event, complaint, notification, and audit-log models/services.
4.  Identify what already exists and what is missing.
5.  Reuse existing models, services, components, and patterns. Do not
    create duplicates.
6.  If the existing stack differs from suggested technologies, preserve
    the existing stack and implement equivalent functionality.

Create or update `PROJECT_PROGRESS.md` in the project root. Track each
task, decisions, changed files, test results, blockers, and next steps.

## 2. Product architecture

The product is a centralized multi-tenant SaaS:

-   One shared application serves multiple messes, hostels, and shared
    accommodations.
-   Each mess is a separate tenant with its own members, rooms, meals,
    finances, notices, and settings.
-   Platform Super Admin manages the SaaS platform.
-   Each tenant has its own Owner/Admin and authorized staff.
-   Members use a dedicated Member Portal.
-   A member belongs to a specific tenant and must never access another
    tenant's private data.

Use the existing tenant and authentication architecture. Do not create a
separate member application.

## 3. Mandatory technical and business rules

-   Follow the existing stack. The project may use Next.js App Router,
    TypeScript, Neon PostgreSQL, Prisma, Auth.js/Better Auth, Tailwind
    CSS, and shadcn/ui, but do not replace a working alternative.
-   Use `Asia/Dhaka` as the business timezone.
-   Use BDT (`৳`) for Bangladeshi Taka.
-   Store money using integer poisha or an exact decimal type. Never use
    floating-point arithmetic for financial calculations.
-   Validate all input on the server.
-   Enforce authentication, authorization, and tenant isolation on the
    server. A hidden button or frontend route guard is not sufficient.
-   Resolve the member from the authenticated server-side session and
    database relationship. Never trust a browser-supplied member ID as
    proof of identity.
-   Members may access only their own private profile, room, meal,
    request, and financial records, plus information explicitly
    published to them.
-   Never expose another member's balance, payment proof, phone number,
    identity documents, or private details.
-   Use pagination or sensible query limits.
-   Use database transactions for multi-record operations.
-   Use existing audit logging for sensitive actions.
-   Never hardcode tenant IDs, member IDs, financial values, or fake
    records.
-   Do not expose secrets, credentials, or private storage URLs in
    client-side code.
-   Do not fake payment success or claim an external notification was
    sent without provider confirmation.
-   Preserve existing data. Never reset or delete production data.
-   Provide loading, empty, error, and success states.
-   Ensure keyboard accessibility, readable validation, and responsive
    layouts.

## 4. Member Portal UX

Build a polished, simple, mobile-first web experience suitable for
members primarily using Android phones.

-   Responsive on mobile, tablet, and desktop.
-   Consistent with the existing design system.
-   Clear navigation and plain language.
-   Support Bangla and English if the project already has an
    internationalization system; do not introduce a conflicting
    translation architecture.
-   Format dates and times for Bangladesh.
-   Use readable status labels; never rely on color alone.
-   Use confirmation dialogs for important actions.
-   Do not show sensitive data in public or shared views.

Suggested navigation (show only implemented features): 1. Dashboard 2.
My Profile 3. My Room 4. My Meals 5. My Account 6. Payments 7. Notices
8. Events 9. Complaints / Requests 10. Settings, if supported

## 5. Required workflow for each task

For every task:

1.  Inspect the relevant implementation.
2.  Write a short implementation plan.
3.  Identify required UI, API, database, and permission changes.
4.  Implement working functionality, not just static mockups.
5.  Add migrations only when needed.
6.  Add server-side validation and authorization.
7.  Connect UI to real application data.
8.  Add loading, empty, error, and success states.
9.  Test primary flows, security boundaries, and edge cases.
10. Run available type checks, linting, tests, and build.
11. Fix issues caused by the changes.
12. Update `PROJECT_PROGRESS.md`.
13. Write the task completion report.
14. Only then move to the next task.

If blocked, explain the exact blocker, document completed work, and do
not claim completion. Do not invent external provider responses.

------------------------------------------------------------------------

# TASK 37 --- MEMBER PORTAL FOUNDATION, ACCESS CONTROL & DASHBOARD

## Objective

Build the secure Member Portal foundation and a data-driven dashboard. A
logged-in member must see a useful overview of their own membership,
room, meals, account summary, notices, and recent activities.

## A. Inspect existing architecture

Inspect:

-   Login/session management.
-   Tenant resolution.
-   User-to-member relationship.
-   Roles and permissions.
-   Member, room, meal, payment, billing, notice, and event models.
-   Existing dashboard layouts and shared components.
-   Existing APIs and server-side service patterns.

Reuse existing services and models. Do not create duplicate entities.

## B. Secure portal access

Create a dedicated member route structure consistent with existing
routing. A route such as `/member` or `/portal` may be used only if it
does not conflict with current routes.

Requirements:

1.  Only authenticated users with a valid member association may access
    the portal.
2.  Admin or staff users are not automatically members unless they also
    have a valid member association.
3.  Resolve the member record from the authenticated server-side session
    and database relationship.
4.  Verify the member belongs to the resolved tenant.
5.  Never trust a client-provided member ID, tenant ID, role, or status.
6.  Apply the existing policy for inactive, suspended, or former
    members.
7.  Protect every API route and server action, not only the page.
8.  Prevent IDOR attacks by changing URL parameters, request bodies, or
    record IDs.
9.  Keep Super Admin and Mess Admin access working.
10. Provide safe sign-out.

If authentication needs a small extension for member access, implement
it without breaking existing user roles or sessions.

## C. Member Portal layout

Create a dedicated responsive layout.

**Desktop:** - Sidebar navigation. - Top header. - Mess name and logo. -
Member name and avatar/initials. - Notification indicator if
supported. - Profile menu and sign-out. - Main content area.

**Mobile:** - Compact header. - Drawer or bottom navigation. -
Touch-friendly controls. - No horizontal overflow. - Responsive cards
and lists.

Show only navigation links for features that actually exist. Do not add
broken placeholder routes.

## D. Member dashboard

All data must belong to the authenticated member and tenant.

### Welcome area

Show: - Welcome message and member display name. - Mess name and logo,
if available. - Membership status. - Current date/month using
`Asia/Dhaka`.

### Summary cards

Where data exists, show: - Current room and bed. - Current month's meal
count/status. - Current month's total payable amount. - Outstanding
due. - Last confirmed payment. - Unread notices or pending requests, if
supported.

Do not invent missing data. Clearly distinguish amount due, submitted
payment, and confirmed payment.

### Monthly account snapshot

Show available values: - Opening balance / previous due. - Rent. -
Utilities and other assigned charges. - Meal charges. - Confirmed
payments and credits. - Current outstanding balance.

Use the authoritative backend finance calculation. Do not independently
calculate a second balance in the frontend.

### Meal snapshot

Show: - Today's meal status. - Current month's meal count, if
available. - Upcoming menu information, if published. - Pending or
approved meal-off requests.

Respect the existing meal settings and rules.

### Recent activity

Show a limited list of the member's own recent activities, such as: -
Payment submitted or confirmed. - Meal request submitted or updated. -
Complaint submitted or updated. - Notice published to the member. - Room
assignment updated, if visible.

Include date, status, and concise description.

### Notices

Show only published notices visible to the member. Respect tenant,
audience, publication, and expiry rules. Never show drafts or admin-only
notices.

### Quick actions

Add shortcuts only for implemented features: - View monthly statement. -
View meal calendar. - Submit meal request. - View or submit payment. -
Submit complaint/request. - View notices.

## E. Dashboard data layer

-   Prefer existing server-side dashboard/service patterns.
-   Fetch only required fields.
-   Avoid repeated unnecessary queries.
-   Scope every query to the authenticated member and tenant.
-   Do not expose full database records unnecessarily.
-   Handle missing room, meal, billing, and payment data gracefully.

## F. UI states and accessibility

Implement loading, empty, error, and success states. Provide useful
empty states for new members. Use accessible navigation, labels,
keyboard controls, and clear status text.

## G. Tests

Test: 1. Active authenticated member can open the portal. 2.
Unauthenticated user is denied or redirected. 3. Admin-only user without
member association cannot enter. 4. Inactive member follows configured
policy. 5. Member A cannot access Member B's dashboard data. 6. Tenant A
member cannot access Tenant B data. 7. Dashboard works with no room
assignment. 8. Dashboard works with no meal/payment history. 9.
Dashboard totals match the authoritative finance service. 10. Mobile
layout has no horizontal overflow. 11. Sign-out works.

## Task 37 deliverables

-   Secure Member Portal routes and layout.
-   Member navigation.
-   Data-driven member dashboard.
-   Server-side access control and tenant scoping.
-   Dashboard data service/API, as appropriate.
-   Relevant tests.
-   Updated `PROJECT_PROGRESS.md`.

## Task 37 completion report

Report: 1. Implemented features. 2. Routes/pages created or updated. 3.
Backend services/APIs changed. 4. Database changes and migrations. 5.
Security and tenant-isolation measures. 6. Files created and modified.
7. Tests actually executed and exact results. 8. Known
limitations/blockers. 9. Status: `COMPLETE` or `BLOCKED`.

Do not start Task 38 until Task 37 is tested and reported.

------------------------------------------------------------------------

# TASK 38 --- MY PROFILE, ROOM INFORMATION & PERSONAL REQUESTS

## Objective

Allow members to view their own profile and current room information,
edit only permitted fields, and submit requests for changes that require
admin approval.

## A. Inspect existing models and workflows

Inspect member, user account, tenant settings, room, bed, room
assignment history, verification/document, request/approval, and
audit-log models/services. Reuse existing patterns.

## B. My Profile page

Display available and member-visible information: - Full name. - Profile
photo or initials. - Email. - Phone number. - Emergency contact, if
collected and visible. - Address, if collected. - Member ID/reference,
if available. - Joining date. - Membership status.

Do not display internal admin notes or private administrative data.

### Account information

Show login email/username and account status where appropriate. Provide
a password/security settings link only if supported by the existing
authentication system. Never display passwords, hashes, tokens, or
secrets.

### Profile editing rules

Allow editing only fields permitted by tenant configuration and product
policy.

Examples: - Profile photo may be editable. - Phone number or address may
be editable if allowed. - Name, membership status, room assignment,
joining date, role, permissions, and billing fields may require admin
approval or be admin-only.

Implement: 1. Clearly identify editable fields. 2. Validate client-side
and server-side. 3. Normalize and validate phone numbers without
assuming every input is valid. 4. Prevent mass assignment of protected
fields. 5. Never let members change tenant ID, role, permissions,
status, balance, or room assignment directly. 6. For approval-required
changes, create a request instead of updating the authoritative record.
7. Show request statuses: Pending, Approved, Rejected, or Cancelled,
according to the existing workflow. 8. Allow cancellation only while
policy permits. 9. Audit important changes.

### Profile photo and documents

Integrate existing upload/storage functionality. If none exists,
implement uploads only if the project's storage architecture is ready.

-   Validate MIME type, file signature where practical, and file size
    server-side.
-   Do not trust file extensions alone.
-   Store private files in access-controlled storage.
-   Do not expose storage credentials or public URLs for private files.
-   Allow a member to replace their own profile photo.
-   Do not collect identity documents unless the existing verification
    feature requires them.

## C. My Room page

Show the authenticated member's current room/bed information where
available: - Mess name. - Building/floor, if configured. - Room
number/name. - Bed number/label. - Room capacity. - Assignment date. -
Member-specific rent, if authorized. - Facilities and room rules. - Room
status.

Do not expose other residents' private details. If occupancy is shown,
respect tenant privacy settings and reveal only permitted information.

### Room assignment history

If the database stores history, show the member's own previous room/bed,
assignment start/end dates, and transfer dates. Never fabricate history.

### Room change request

If enabled, allow a member to request a room change with: - Requested
room or preference, if allowed. - Reason. - Preferred date, if
supported. - Submission timestamp. - Status.

Rules: 1. Submitting a request must not immediately change the
assignment. 2. Only an authorized tenant role may approve/reject. 3.
Recheck availability on the server at approval time. 4. Prevent
over-capacity and conflicting active assignments. 5. Use a database
transaction for an approved transfer. 6. Preserve assignment history. 7.
Notify the member using the existing notification service, if
configured. 8. Use the existing request/approval architecture; do not
create a conflicting workflow.

## D. Personal Requests center

Create a page/section for the member's own requests, supporting only
request types available in the application: - Profile change. - Room
change. - General member request. - Other tenant-configured request
types.

Show reference number, request type, submission date, status,
member-provided details, visible admin response, and last update.

Rules: - Members can view only their own requests. - Members cannot
modify an admin decision. - Approved/rejected requests cannot be edited;
a new request may be required. - Validate all status transitions
server-side. - Record important actions in the audit log.

## E. Notifications

Use the existing notification service for request creation and status
updates. Avoid duplicate notifications. If email/SMS/push is not
configured, show status in the portal and document the missing
integration. Never claim external delivery without provider
confirmation.

## F. Security

-   Resolve member identity from the authenticated session.
-   Enforce tenant isolation on all reads/writes.
-   Prevent requests on behalf of another member.
-   Prevent mass assignment of protected fields.
-   Protect personal details and attachments.
-   Apply tenant privacy rules.
-   Audit sensitive changes.

## G. Tests

Test: 1. Member can view own profile but not another's. 2. Allowed
profile fields can be updated. 3. Protected fields cannot be changed by
request manipulation. 4. Approval-required changes create requests. 5.
Member sees only their own requests. 6. Member cannot alter admin
decisions. 7. Room details match current assignment. 8. No room
assignment produces a useful empty state. 9. Room request does not
immediately change assignment. 10. Approval validates availability and
capacity. 11. Cross-tenant access is rejected. 12. Invalid/oversized
uploads are rejected. 13. Mobile profile and room pages work.

## Task 38 deliverables

-   My Profile page.
-   Controlled profile-editing workflow.
-   My Room page and assignment history, if supported.
-   Room-change request workflow.
-   Personal Requests page.
-   Secure backend services and validation.
-   Relevant tests.
-   Updated `PROJECT_PROGRESS.md`.

## Task 38 completion report

Report implemented features, routes, request workflows, backend/database
changes, privacy/security controls, files changed, exact test results,
limitations, and `COMPLETE` or `BLOCKED` status.

Do not start Task 39 until Task 38 is tested and reported.

------------------------------------------------------------------------

# TASK 39 --- MEAL CENTER, NOTICES, EVENTS & COMPLAINTS

## Objective

Build the member-facing operational and community area. Members must be
able to view their meal schedule and history, submit eligible meal
requests, read published notices, view events and RSVP where supported,
and submit complaints/feedback.

Integrate with existing Mess Admin modules. Do not create duplicate
meal, notice, event, or complaint systems.

## A. Inspect existing modules

Inspect meal settings, fixed/flexible modes, breakfast/lunch/dinner
configuration, meal calendar/menu, member meal records, cutoff rules,
request approvals, guest meals, notices, events, RSVP, complaints,
attachments, notifications, and audit logs.

Reuse existing tenant rules and admin configuration.

## B. My Meals page

### Current meal overview

Show the current date and configured meal periods (for example
breakfast, lunch, dinner), the member's own meal status/quantity,
upcoming meal information, and meal request status.

Use accurate status labels such as Active, Off, Pending, Approved,
Rejected, or Not Configured, only where supported.

### Meal calendar

Create a monthly calendar or date-based list showing the member's own: -
Breakfast status. - Lunch status. - Dinner status. - Special meal
information. - Approved meal-off information. - Published menu
information.

Requirements: 1. Navigate between permitted months. 2. Scope all records
to the member and tenant. 3. Respect tenant meal configuration. 4. Use
`Asia/Dhaka`. 5. Provide a mobile-friendly list alternative. 6. Never
reveal other members' meal selections.

### Meal history

Provide a paginated history of the member's own meal records. Show date,
meal type, status/quantity, permitted guest-meal information associated
with the member, and visible adjustment/approval details. Do not expose
internal admin notes.

## C. Meal-off and meal-change requests

Allow requests only if the tenant has enabled the feature.

-   Display applicable cutoff time/rule before submission.
-   Show whether the requested meal is still eligible for change.
-   Select date and meal type where supported.
-   Collect a reason only if required.
-   Validate date, meal type, duplicate requests, and cutoff on the
    server.
-   Never trust browser clock or client-provided eligibility.
-   Use `Asia/Dhaka` for cutoff calculations.
-   After cutoff, reject or route to an authorized exception workflow
    according to tenant policy.
-   Approval-required requests must not change official meal records
    until approved.
-   Prevent duplicate/conflicting requests.
-   Show request status and visible admin response.
-   Audit important changes.

Do not silently override tenant rules.

## D. Fixed and flexible meal modes

Display the member's applicable mode and explain it in simple language.

**Fixed mode:** show assigned meal arrangement, relevant daily/monthly
information, and approved exceptions.

**Flexible mode:** show the member's recorded meal selections/units,
available options, tenant-configured restrictions, and personal meal
history.

Mandatory: - Do not calculate or change meal rates in the frontend. -
Use the authoritative backend meal/finance service for rates. - Do not
assume every expense is meal-eligible. - Do not assume a fixed number of
meals per day. - Do not create a second meal-rate formula. - Display
backend-calculated values only when available and authorized.

## E. Menu and meal announcements

If an admin has published a menu, show it by date and display special
meal announcements. Respect publication dates and audience restrictions.
If no menu exists, show an empty state, not sample data.

## F. Notices and announcements

Create a Notices page showing only published notices visible to the
authenticated member.

Display available fields: - Title and summary. - Full content. -
Publication date. - Expiry date. - Attachment, if available and safe. -
Priority/category, if supported.

Requirements: 1. Exclude drafts and unpublished records. 2. Exclude
expired notices according to tenant policy. 3. Respect audience
targeting and visibility. 4. Safely render rich text/HTML; prevent XSS.
5. Validate access to attachments. 6. Paginate or limit results. 7. Add
read tracking only if supported or implemented consistently.

Never show admin-only notices.

## G. Events and RSVP

Integrate the existing event module, if present. Show published event
title, description, date/time, location, published image, RSVP deadline,
and the member's RSVP status.

Allow RSVP only if: - Event is published and not cancelled. - Member is
eligible. - RSVP deadline is open. - Tenant settings allow member
responses.

Prevent duplicate RSVP records. Allow update/cancellation only within
configured rules. Do not expose private attendee details unless
explicitly allowed.

If no event module exists, implement only a minimal compatible feature
needed for the portal. Do not create unrelated event functionality.

## H. Complaints and feedback

Allow a member to: - Submit a complaint or maintenance request. - Select
a tenant-configured category, if available. - Enter title and
description. - Attach an allowed image/document if secure storage is
supported. - View their own submissions. - See status and member-visible
admin response. - Add a follow-up message if supported.

Use existing statuses if available. Otherwise, suitable statuses may
include Submitted, In Review, In Progress, Resolved, Rejected, and
Closed.

Rules: 1. Member creates complaints only within their tenant. 2. Member
views only their own complaints unless an explicitly enabled shared
feedback feature exists. 3. Member cannot assign staff, set internal
priority, or change administrative status. 4. Admin-only notes must
never be visible. 5. Validate attachments and prevent unsafe uploads. 6.
Apply rate limiting where the project supports it. 7. Audit important
actions. 8. Never claim resolution until an authorized workflow changes
the status.

## I. Notifications

Use the existing notification service for meal request decisions, new
published notices, event changes/RSVP updates, and complaint status
changes/admin responses.

Notify only intended users. Avoid duplicates. Respect preferences. If
external delivery is not configured, show in-app status and document the
limitation. Notification failure must not corrupt the underlying record.

## J. Tests

Test: 1. Member sees only own meal records. 2. Cross-tenant meal access
is rejected. 3. Calendar respects tenant configuration. 4. Eligible
pre-cutoff meal request succeeds. 5. Post-cutoff request is rejected or
routed correctly. 6. Client clock manipulation cannot bypass cutoff. 7.
Duplicate requests are prevented. 8. Approval-required changes do not
update official records before approval. 9. Fixed and flexible modes
render correctly. 10. Missing meal/menu data shows an empty state. 11.
Draft/restricted notices are hidden. 12. Eligible members see published
notices. 13. RSVP respects eligibility and deadline. 14. Duplicate RSVP
is prevented. 15. Member cannot view another member's complaints. 16.
Member cannot alter complaint status. 17. Private attachments are
protected. 18. Notification failure does not corrupt requests. 19.
Mobile layouts work.

## Task 39 deliverables

-   My Meals page, calendar, and history.
-   Meal-off/change request interface.
-   Fixed/flexible meal presentation.
-   Published menu display.
-   Notices page.
-   Events and RSVP interface where supported.
-   Complaints/feedback interface.
-   Secure backend integration and tests.
-   Updated `PROJECT_PROGRESS.md`.

## Task 39 completion report

Report implemented meal features and cutoff rules, notices/events,
complaint workflow, routes, backend/database changes, security controls,
files changed, exact test results, limitations, and `COMPLETE` or
`BLOCKED` status.

Do not start Task 40 until Task 39 is tested and reported.

------------------------------------------------------------------------

# TASK 40 --- MY ACCOUNT, MONTHLY STATEMENTS, BILLING & PAYMENTS

## Objective

Build the member-facing financial area. Members must be able to view
their own bills, previous due, rent, utilities, meal charges, confirmed
payments, outstanding balance, monthly statements, and available payment
submission options.

Use the existing Finance, Billing, and Payment Management modules. Do
not create a separate financial calculation system.

## A. Inspect the existing financial architecture

Inspect tenant billing settings, member billing records, billing
periods, opening balances, rent, utility/custom charges, meal charges,
credits/adjustments, payment records/statuses, manual payment methods,
online provider integration, monthly closing, statement services, and
private payment-proof storage.

Identify the authoritative backend balance/statement service and reuse
it.

## B. My Account overview

Display, where supported: - Total charges. - Total confirmed payments
and credits. - Outstanding amount due. - Advance/credit balance, if
applicable.

Clearly distinguish charges, submitted payments, confirmed payments, and
amount due.

### Current month breakdown

Show available itemized categories: - Opening balance / previous due. -
Room rent. - Electricity. - Gas. - Water. - WiFi/internet. -
Cleaning/service charges. - Maintenance. - Meal charges. - Other
tenant-configured charges. - Discounts/credits. - Confirmed payments. -
Closing balance/current due.

Show only categories applicable to the member and tenant.

### Billing period selection

-   Default to the current active period.
-   Allow previous periods only where member access is permitted.
-   Respect billing period and publication/closing rules.
-   Do not expose restricted draft financial records.
-   Use `Asia/Dhaka`.

## C. Monthly statement

Create a detailed statement for one billing period, including: 1. Tenant
name and available branding. 2. Member name and membership reference. 3.
Billing period. 4. Opening balance. 5. Itemized charges. 6. Meal
charges/quantities, if available. 7. Payments and credits. 8. Visible
adjustments. 9. Closing balance. 10. Statement generation date.

Requirements: - Show only the authenticated member's statement. - Use
authoritative backend calculations. - Keep financial arithmetic on the
server. - Explain the closing balance formula where useful. -
Distinguish pending payments from confirmed payments. - Do not silently
include unapproved charges. - Do not expose internal finance notes or
other members' data. - Provide a print-friendly layout. - Provide PDF
download only if a reliable PDF approach exists. Otherwise provide
print-friendly output and document PDF as a future enhancement. - Do not
fabricate invoice numbers, tax details, or official receipt information.

## D. Payment history

Create a paginated payment history showing available member-visible
fields: - Payment date. - Amount. - Method. - Transaction/reference
ID. - Billing period/invoice reference. - Status. - Confirmation date,
if confirmed.

Use the existing status model. It may include Pending, Submitted, Under
Review, Confirmed, Rejected, Failed, or Reversed.

Rules: 1. Pending/submitted payments must not reduce confirmed due
unless the existing ledger explicitly defines otherwise. 2. Rejected
payments are not counted as paid. 3. Reversed payments follow
authoritative ledger correction rules. 4. Members view only their own
payment records. 5. Members cannot edit confirmed payments. 6. Do not
expose another member's transaction details.

## E. Manual payment submission

If manual payments are enabled, show only tenant-enabled methods, which
may include Cash, bKash, Nagad, Rocket, Bank Transfer, or Other.

Collect only fields required by the existing workflow: - Amount. -
Payment method. - Transaction/reference ID, if applicable. - Payment
date. - Related billing period/invoice, if applicable. - Payment proof,
if required/allowed. - Optional note.

Validation and security: 1. Amount must be positive and use exact
numeric precision. 2. Validate every field server-side. 3. Derive member
and tenant from authenticated context. 4. Prevent a member from
submitting for another member. 5. Prevent accidental duplicate
submissions using idempotency or duplicate detection. 6. Do not
automatically confirm the payment. 7. Set the correct pending/review
status. 8. Only an authorized tenant role can confirm/reject. 9. Store
proof privately and protect access. 10. Do not log proof contents or
secrets.

After submission, tell the member that the payment was submitted for
review. Do not say that the money has been received or confirmed.

## F. Online payments

Integrate online payments only if a real provider is already configured.

If no provider is configured: - Do not build a fake checkout. - Do not
show fake success. - Do not invent API keys, merchant IDs, callback
URLs, or provider responses. - Hide the option or clearly mark online
payment as unavailable. - Document the required future integration.

If a real integration exists, verify: 1. Initiation occurs server-side.
2. Amount and currency are checked server-side. 3. Member and tenant
ownership are verified. 4. Callback signatures are verified according to
provider documentation. 5. Callback processing is idempotent. 6.
Duplicate callbacks cannot create duplicate ledger entries. 7. Browser
redirect alone cannot confirm payment. 8. Only verified provider
responses update payment status. 9. Pending, failed, cancelled, and
successful states are handled safely. 10. Secrets remain server-side.

Do not change a working provider integration without understanding its
current behavior.

## G. Payment detail and receipt

Provide a detail view showing member-visible amount, method, submission
date, reference, status, review response if visible, and confirmation
date.

If a confirmed receipt is supported, show: - Tenant name. - Member
name/reference. - Amount. - Payment date. - Method. -
Transaction/reference. - Receipt number only if generated by the
backend.

Never create an official-looking receipt for pending or rejected
payments.

## H. Financial calculation rules

Mandatory: 1. Reuse the existing authoritative ledger/balance service.
2. Never calculate a separate balance in the Member Portal. 3. Preserve
the project's actual ledger sign convention. 4. The general relationship
is:

`Closing Balance = Opening Balance + Charge Entries - Confirmed Payments - Credits`

5.  Use integer poisha or exact decimal arithmetic.
6.  Never use JavaScript floating-point arithmetic for money.
7.  Use database transactions for financial updates.
8.  Do not silently edit/delete confirmed financial records.
9.  Corrections must use the existing adjustment/reversal/correction
    process.
10. Keep SaaS subscription billing separate from member mess billing.
11. Do not treat submitted payments as confirmed.
12. Do not assume every expense is chargeable to every member.
13. Respect member-specific rent and charge allocation.
14. Never expose another member's financial data.

## I. Billing notifications

Use existing notifications for new statements, payment submission
acknowledgement, manual payment confirmation/rejection, required billing
adjustments, and due reminders if enabled.

Notify only the intended member. Avoid duplicates. Respect tenant
settings/preferences. Do not claim external delivery without provider
confirmation. Notification failure must not corrupt financial records.

## J. UI and usability

Build: - Due/paid/charges summary. - Billing-period selector. - Itemized
statement. - Payment history. - Manual payment submission, if enabled. -
Payment details and confirmed receipt, if supported. - Clear text status
labels. - Mobile-friendly layouts. - Print-friendly statement.

Provide loading, empty, validation-error, submission-success,
review-pending, and safe error states.

## K. Tests

Test: 1. Member sees only own account summary. 2. Member cannot view
another member's statement. 3. Cross-tenant financial access is
rejected. 4. Balance matches authoritative finance service. 5. Opening
balance and previous due display correctly. 6. Charges, meal costs,
credits, and payments are itemized correctly. 7. Pending payment does
not incorrectly reduce confirmed due. 8. Rejected payment is not counted
as paid. 9. Confirmed payment is reflected correctly. 10. Reversed
payment follows ledger rules. 11. Member cannot edit confirmed payment.
12. Zero, negative, malformed, or excessive amount is rejected. 13.
Member cannot submit for another member. 14. Duplicate submissions are
handled safely. 15. Payment proof is private and access-controlled. 16.
Manual payment stays pending until authorized review. 17. No fake online
payment success is possible. 18. Print view shows correct values. 19.
Money arithmetic uses exact precision. 20. Mobile pages have no
horizontal overflow.

## Task 40 deliverables

-   My Account overview.
-   Billing-period selector.
-   Monthly statement.
-   Payment history.
-   Manual payment submission, if enabled.
-   Payment detail and confirmed receipt, if supported.
-   Real online payment integration only if already configured.
-   Secure finance integration.
-   Tests for balances, payment flows, privacy, and tenant isolation.
-   Updated `PROJECT_PROGRESS.md`.

## Task 40 completion report

Report: 1. Implemented account and statement features. 2. Payment
submission/review behavior. 3. Online payment integration status. 4.
Authoritative finance service reused. 5. Routes/pages created or
updated. 6. Backend/database changes. 7. Security/privacy measures. 8.
Files created and modified. 9. Exact test results. 10. Known
limitations. 11. Status: `COMPLETE` or `BLOCKED`.

------------------------------------------------------------------------

# PHASE 5 --- FINAL INTEGRATION & ACCEPTANCE REVIEW

After Tasks 37--40 have each been completed, perform a final end-to-end
review.

## 1. End-to-end member journey

Verify this journey with realistic test data:

1.  Member signs in.
2.  Member reaches their own dashboard.
3.  Member views their profile.
4.  Member views current room information.
5.  Member submits a permitted profile or room request.
6.  Member views meal calendar and history.
7.  Member submits a meal-off request within tenant rules.
8.  Member reads a published notice.
9.  Member views an event and RSVPs, if enabled.
10. Member submits a complaint.
11. Member opens their monthly statement.
12. Member submits a manual payment, if enabled.
13. Member sees the correct payment review status.
14. An authorized admin updates a request/payment.
15. Member sees the updated status without access to admin-only
    information.

## 2. Security acceptance review

Verify: - Authentication is required. - Member authorization is
server-side. - Tenant isolation is enforced on every member endpoint. -
Members access only their own private records. - Protected profile
fields cannot be modified. - Draft/restricted content and admin-only
notes remain hidden. - Private attachments are access-controlled. -
Financial records cannot be altered by members. - Secrets are not
exposed in browser code or logs.

## 3. Quality checks

Run the checks available in the repository: - TypeScript/type
checking. - Linting. - Unit tests. - Integration tests. - End-to-end
tests, if configured. - Production build.

Do not claim a check passed unless it was actually executed and passed.
If a check cannot run due to missing environment variables, database
access, or provider configuration, state the exact reason.

## 4. Final report

Create `PHASE_5_COMPLETION_REPORT.md` containing: - Summary of Tasks
37--40. - Implemented Member Portal features. - Routes/pages added or
updated. - Backend/API services changed. - Database migrations/models
changed. - Security and tenant-isolation measures. - Tests run and exact
results. - Build status. - Known limitations. - Required environment
variables/external integrations. - Recommended next steps for Phase 6.

Update `PROJECT_PROGRESS.md` with the final status of every task.

## 5. Final execution rule

Do not stop after writing plans or rendering static UI mockups.
Implement working features connected to the existing backend.

A task is complete only when its required behavior is implemented,
server-side authorization is enforced, relevant tests have actually run,
and its completion report has been written.

If a requirement depends on an unavailable external provider, implement
a safe integration boundary and clearly report that the provider is not
connected.

**Begin with Task 37. Complete, test, and report Task 37 before starting
Task 38. Continue sequentially through Task 40.**
