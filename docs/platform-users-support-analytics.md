# Platform Users, Support Center & Analytics

## Overview

The Platform Users, Support Center & Analytics module concludes Phase 3 (*Super Admin Panel*) of the MessMate Multi-Tenant SaaS platform. It establishes central governance over global identities, segregated platform staff administration, a ticket-based tenant helpdesk with strict internal notes isolation, comprehensive multi-tenant analytics, authorized CSV report exports, global search across platform entities, and real-time administrative notifications.

---

## 1. Platform User Management

### Architecture & Multi-Tenant Isolation
- **Global User Directory:** Operates at the platform layer across all tenants, displaying user ID, full name, email, phone, account status, tenant membership counters, platform role, joined date, and last activity timestamp.
- **Tenant Isolation Guarantee:** A user's role in Tenant A (e.g. `Manager`) is completely isolated from their role in Tenant B (e.g. `Member`). Tenant roles are never amalgamated or promoted globally.
- **Account Lifecycle Actions:** Platform administrators with `users.manage` can suspend or reactivate global user accounts. Suspensions require a mandatory reason (&ge; 5 characters) and confirmation prompt. All mutations are recorded in the append-only `AuditLog`.
- **Zero Secret Exposure:** Password hashes, salt rounds, session tokens, and cryptographic secrets are strictly omitted from directory queries and API responses.

---

## 2. Platform Staff Management

Platform administration privileges are strictly decoupled from tenant memberships:
- **Platform Roles:**
  - `PLATFORM_OWNER`: Full root control, including assigning/revoking platform staff roles.
  - `PLATFORM_ADMIN`: Operational administration across tenants, subscriptions, domains, and support.
  - `SUPPORT_STAFF`: Helpdesk dispute mediation, ticket handling, tenant inspection; barred from financial records and role management.
  - `FINANCE_STAFF`: Invoice review, subscription plan management, and revenue analytics; barred from customer support notes and user account suspensions.
- **Assignment Governance:** Only `PLATFORM_OWNER` can assign or revoke platform staff roles (`assignPlatformRole`). A tenant `Owner` never inherits platform administrative capabilities.
- **Safety Invariant:** Demotion or suspension of the last remaining active `PLATFORM_OWNER` is rejected at the service layer.

---

## 3. Customer Support Center & Ticket Workflow

### Ticket Architecture
- **Categories:** `ACCOUNT_LOGIN`, `SUBSCRIPTION_BILLING`, `DOMAIN_WEBSITE`, `TECHNICAL_ISSUE`, `FEATURE_REQUEST`, `GENERAL_INQUIRY`, `OTHER`.
- **Priorities:** `LOW`, `NORMAL`, `HIGH`, `URGENT` (triggers immediate administrative notification alerts).
- **Statuses:** `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_CUSTOMER`, `RESOLVED`, `CLOSED`.
- **Unique Ticket Reference:** Formatted as `TICK-<TIMESTAMP>-<RANDOM>`.

### Segregated Conversation Thread (Internal Notes vs Customer Replies)
- **Customer Replies:** Customer-visible communications (`isInternal = false`). Posting a customer reply moves ticket status to `WAITING_CUSTOMER`.
- **Internal Notes:** Staff-only private notes (`isInternal = true`).
  > [!IMPORTANT]
  > **Internal Note Security Invariant:** Internal notes are visually styled with prominent amber borders and lock icons. Customer-facing queries (`includeInternalNotes = false`) strictly filter out all messages flagged as `isInternal = true`. Unrelated tenants are barred from inspecting tickets belonging to other organizations via tenant scope enforcement.

---

## 4. Platform Analytics & Reports

### Date Range Engine
Supports 8 time presets with consistent `Asia/Dhaka` timezone boundaries:
- `today`, `7d`, `30d`, `90d`, `this_month`, `last_month`, `this_year`, `custom` (custom start and end dates).

### Analytics Categories
1. **Financial & Revenue Analytics:**
   - **Confirmed Revenue Invariant:** Revenue figures are computed strictly from `SubscriptionInvoice` records where `paymentStatus = 'CONFIRMED'`.
   - `totalCollectedRevenue`: Total confirmed funds.
   - `monthlyCollectedRevenue`: Confirmed funds within the selected timeframe.
   - `outstandingInvoices`: Sum of `PENDING` payment invoices.
   - `refunds`: Sum of reversed/refunded invoices (`REFUNDED`).
   - `netCollectedRevenue`: Gross confirmed revenue minus refunds.
   - `revenueByPlan`: Revenue breakdown by plan tier.
2. **Tenant Metrics:** Total organizations, new registrations in period, active/suspended ratios, and tenant type distributions (`BACHELOR_MESS`, `STUDENT_MESS`, `HOSTEL`).
3. **Subscription Metrics:** Active free trials, active starter plans, custom business contracts, expired, cancelled, and calculated **Trial-to-Paid Conversion Rate** (`converted / total trials * 100`).
4. **User Metrics:** Total platform accounts, active users, registrations in range, and resident multi-mess distribution (0, 1, 2+ messes).
5. **Domain Governance:** Platform subdomains, custom domains, verified, pending verification, and failed verification counts.
6. **Support Helpdesk:** Total tickets, open tickets, resolved count, category breakdown, and **Average Resolution Time** (in hours).

---

## 5. Report Export Engine

Authorized administrators can download clean, formatted CSV reports:
- **Available Datasets:** `tenants`, `subscriptions`, `payments`, `users`, `domains`, `tickets`.
- **Access Control:** Requires `reports.export` permission plus specific module permission (e.g. `revenue.view` for payments, `users.view` for users).
- **Sanitization:** Escapes commas, quotes, and newlines; omits password hashes, private tokens, and sensitive credentials.
- **Audit Logging:** Every report export event is logged in `AuditLog` with row count and actor details.

---

## 6. Global Search & Notifications

- **Global Platform Search (`GET /api/v1/super-admin/search?q=...`):** Searches across Tenants, Users, Subscriptions, Tickets, and Domains. Results are permission-filtered, limited to 5 matches per category, and linked directly to their respective detail views.
- **Notification Center (`GET /api/v1/super-admin/notifications`):** Surfaces urgent escalations, new tickets, expiring trials, and pending payments with read/unread tracking and batch mark-read capabilities.
