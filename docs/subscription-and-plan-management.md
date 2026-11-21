# Subscription & Plan Management System

## Overview

The MessMate Subscription & Plan Management module governs SaaS licensing, 7-day free trials, configurable feature entitlements, multi-property custom business quotations, billing history, and subscription analytics for platform administrators.

Built strictly under the Central Super Admin architecture, the system guarantees accurate financial accounting, non-destructive data retention, and strict backend authorization.

---

## 1. Architecture & Data Model

### Relational Entities in Prisma

#### `Plan` (`plans`)
Configurable SaaS subscription packages.
- `id`: Unique identifier (CUID)
- `name`: Human-readable plan name (`Starter`, `Customized Business Plan`, etc.)
- `slug`: Unique slug identifier (`starter`, `custom-business`)
- `description`: Scope and audience description
- `planType`: `PlanType` enum (`STARTER`, `CUSTOM_BUSINESS`, `ENTERPRISE`, `STANDARD`)
- `priceMonthly`: `Decimal(10, 2)` exact representation in BDT
- `currency`: Default `'BDT'`
- `billingInterval`: `BillingInterval` enum (`MONTHLY`, `QUARTERLY`, `YEARLY`, `CUSTOM`)
- `trialEligible`: Boolean indicating free trial support
- `trialDays`: Standard trial duration (7 days)
- `entitlements`: JSON array of enabled feature keys (`PlanFeatureKey[]`)
- `limits`: JSON object of usage quotas (e.g. `{ maxMembers: 50, maxProperties: 1 }`)
- `status`: `PlanStatus` enum (`ACTIVE`, `INACTIVE`, `ARCHIVED`)

#### `Subscription` (`subscriptions`)
Tenant-level active subscription and trial record (1:1 with `Tenant`).
- `tenantId`: Unique foreign key to `Tenant`
- `planId`: Foreign key to `Plan`
- `status`: `SubscriptionStatus` enum (`TRIALING`, `ACTIVE`, `PAST_DUE`, `EXPIRED`, `CANCELLED`, `SUSPENDED`)
- `trialStatus`: `TrialStatus` enum (`NOT_STARTED`, `ACTIVE`, `EXPIRED`, `CONVERTED`)
- `trialStartsAt`, `trialEndsAt`: Timestamps in `Asia/Dhaka` timezone
- `priceLocked`: `Decimal(10, 2)` locked price agreed at subscription time
  > [!IMPORTANT]
  > **Price Lock Invariant:** When a plan definition's price is updated, existing subscriptions retain their `priceLocked` value. Historical billing terms are never silently altered.
- `autoRenewConsent`: Boolean (default `false`)
- `autoRenewConsentAt`: Timestamp of explicit user opt-in

#### `SubscriptionInvoice` (`subscription_invoices`)
Traceable financial invoices and payment records.
- `invoiceNumber`: Unique alphanumeric identifier (e.g. `INV-2026-XXXXX`)
- `amount`: `Decimal(10, 2)`
- `paymentStatus`: `PaymentStatus` (`PENDING`, `CONFIRMED`, `FAILED`, `REJECTED`, `REFUNDED`, `PARTIALLY_PAID`)
- `paymentMethod`: `PaymentMethod` (`CASH`, `BANK_TRANSFER`, `BKASH`, `NAGAD`, `ROCKET`, `ONLINE_GATEWAY`, `OTHER`)
- `transactionReference`: Provider transaction reference (e.g. bKash TrxID)
- `confirmedByUserId`: Platform administrator who verified the funds

#### `CustomPlanInquiry` & `CustomQuotation`
Workflow records for multi-property messes, university hostels, and corporate accommodations.
- Captures property counts, resident capacity, and customized feature requests.
- Quotation tracks negotiated monthly price, validity period, and approver user ID.

---

## 2. Business Model & Lifecycle Rules

### A. 7-Day Free Trial
- **Duration:** Exactly 7 calendar days calculated from activation timestamp.
- **Duplicate Prevention:** A tenant can only receive one trial unless an explicit administrative override is authorized.
- **Trial Statuses:** `NOT_STARTED`, `ACTIVE`, `EXPIRED`, `CONVERTED`.
- **Authorized Extensions:** Platform staff can extend a trial by 1–30 days with a mandatory audit reason (minimum 5 characters).
- **Post-Trial Policy:** Expired trials transition to `EXPIRED`. Tenant data is retained safely (no destructive deletion); non-essential features are gated until a paid subscription is activated.

### B. Starter Plan (৳99 / month)
- Matches public pricing on the MessMate website.
- Standard use: 1 mess / organization unit.
- Standard limit: up to 50 members.
- Configurable entitlements: Public Website, Member Management, Meal Math, Bazar Logs, Treasury & Accounts, Room Management, Community Notices, Monthly Reports.

### C. Customized Business Plan Workflow
1. Prospective client submits an inquiry (via public custom pricing form or administrative intake).
2. Super Admin staff reviews inquiry and prepares a formal `CustomQuotation` with custom monthly price, property quota, and selected modules.
3. Upon client acceptance, platform staff approves the quotation, which provisions or updates the tenant's subscription with custom `priceLocked`, custom limits, and feature entitlements.

### D. Payment Confirmation Rule
> [!WARNING]
> **Zero Phantom Access:** A pending or unconfirmed invoice does NOT grant active subscription status. Paid access and trial-to-paid conversion (`CONVERTED`) occur ONLY upon recording a `CONFIRMED` payment.

### E. Explicit Auto-Renewal Consent
- Auto-renewal and recurring payment authorization default strictly to `false`.
- Automatic charging or silent renewal is prohibited without verifiable explicit consent.

---

## 3. Feature Entitlement Engine

Backend feature gating is managed via `entitlementService.checkPlanEntitlement(tenantId, featureKey, options)`:

- **Universal Safety Invariant:** Platform emergency contacts (`emergency_contacts`), safety information (`safety_info`), and compliance terms (`legal_terms`) are ALWAYS permitted, regardless of subscription status or plan tier.
- **Status Gating:** If a tenant's subscription is `SUSPENDED`, `CANCELLED`, or `EXPIRED`, access to operational modules (meal tracking, bazar logs, room allocations) is denied with structured machine-readable error reasons.
- **Tier Entitlement Checks:** Verifies whether the requested feature key exists in the plan or custom subscription override.
- **Usage Limit Validation:** Checks numerical thresholds (e.g. `maxMembers`, `maxProperties`) against current usage.

---

## 4. API Reference

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/super-admin/plans` | `subscriptions.view` | List SaaS plans and subscriber counts |
| `POST` | `/api/v1/super-admin/plans` | `subscriptions.manage` | Create new plan definition |
| `GET` | `/api/v1/super-admin/plans/[id]` | `subscriptions.view` | Get plan details |
| `PATCH` | `/api/v1/super-admin/plans/[id]` | `subscriptions.manage` | Update plan (preserves historical subscriptions) |
| `GET` | `/api/v1/super-admin/subscriptions` | `subscriptions.view` | Paginated subscription directory |
| `GET` | `/api/v1/super-admin/subscriptions/[id]` | `subscriptions.view` | Full subscription profile & billing history |
| `POST` | `/api/v1/super-admin/subscriptions/[id]/trial` | `subscriptions.manage` | Start or extend 7-day trial |
| `POST` | `/api/v1/super-admin/subscriptions/[id]/payments` | `subscriptions.manage` | Record confirmed/pending payment |
| `POST` | `/api/v1/super-admin/subscriptions/[id]/cancel` | `subscriptions.manage` | Cancel subscription with reason |
| `GET` | `/api/v1/super-admin/custom-inquiries` | `subscriptions.view` | List custom business plan requests |
| `POST` | `/api/v1/super-admin/custom-inquiries` | `subscriptions.manage` | Dispatch custom quotation |
| `POST` | `/api/v1/super-admin/custom-inquiries/[id]/quotations/[quoteId]` | `subscriptions.manage` | Approve quotation & provision subscription |
| `GET` | `/api/v1/super-admin/subscription-analytics` | `subscriptions.view` | Live MRR, revenue, and conversion metrics |
| `POST` | `/api/v1/inquiries/custom-plan` | Public | Public submission of custom business inquiries |

---

## 5. Security & Verification Suite

All 14 specified security and business logic scenarios are verified in `server/subscription/subscription.test.ts`:
1. `Create a Starter plan`
2. `Validate ৳99 monthly price`
3. `Start a 7-day trial (7-day duration, duplicate rejection)`
4. `Verify trial expiration`
5. `Convert a trial to a paid subscription after confirmed payment`
6. `Reject unconfirmed payment from granting paid active access`
7. `Create a custom business proposal`
8. `Approve a custom package & provision subscription`
9. `Update plan entitlements & limits`
10. `Verify backend entitlement checks & emergency safety invariant`
11. `Prevent unauthorized subscription modifications (RBAC)`
12. `Preserve historical billing prices upon plan updates`
13. `Record subscription events in audit logs`
14. `Verify no automatic renewal without explicit consent`
