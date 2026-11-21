# DEVELOPMENT_ROADMAP.md — MessMate Full SaaS Roadmap

> **Important Disclaimer:** This roadmap represents the **planned development sequence** for the MessMate SaaS platform across 7 phases (Tasks 1–50). Listing a phase or task here is a **plan, not proof of implementation**. Always check `PROJECT_STATUS.md` and the actual source code to see what is completed, partially completed, or pending.

---

## Phase 1: Public Website MVP (Tasks 1–15)

**Objective:** Establish the MessMate brand identity, design system, responsive marketing website, interactive public previews, bilingual English/বাংলা support, and placeholder portals.

- **Tasks 01–04:** Project architecture, design tokens, typography (`Plus Jakarta Sans`, `DM Sans`, `Hind Siliguri`, `JetBrains Mono`), shadcn/ui setup, sticky bilingual Navbar, and Hero with Product Preview.
- **Tasks 05–07:** Trust Indicators, 8-module Features Overview, 4-step How It Works, and interactive Demo Room Rental Showcase.
- **Task 08:** Two-option Subscription & Pricing model (Starter: 7-day free trial → `৳99/month`, explicit consent only; Customized Business Plan: custom pricing inquiry).
- **Tasks 09–11:** Emergency & Safety (verified Bangladesh hotlines `999`/`102`/`16263`, DEMO mess directory, safety guides), About Us, Contact form preview, categorized FAQ accordion, and Final CTA.
- **Tasks 12–14:** Responsive Footer, full homepage integration, interactive navigation/scrollspy/modals, and cross-device responsive optimization (`320px`–`1920px+`, EN & বাংলা).
- **Task 15:** Public website final QA, SEO polish (`robots.ts`, `sitemap.ts`, custom `not-found.tsx`, social meta polish).

*Current verified state: Tasks 1–14 completed; Task 15 core metadata present with SEO route files still optional/pending.*

---

## Phase 2: Backend & Database Foundation (Tasks 16–23)

**Objective:** Transition from frontend-only MVP to a secure, multi-tenant Next.js App Router modular monolith backed by Neon PostgreSQL, Prisma 7, PostgreSQL RLS, and server-side authentication.

- **Task 16:** Backend architecture & technical planning (`docs/backend-architecture.md`) — *Completed*.
- **Task 17:** Neon PostgreSQL setup & database connection (`prisma.config.ts`, `.env.example`, Prisma 7 + `@prisma/adapter-pg`, singleton client, connectivity check) — *Partially completed; needs real Neon `.env`, `server/db/prisma.ts`, and live connection test*.
- **Task 18:** Server infrastructure layer (`config/env.ts` with Zod, standardized API responses/error handling, `Asia/Dhaka` date utilities, `runInTenantTx` RLS wrapper, and `app/(marketing)/layout.tsx` route-group refactor).
- **Task 19:** **Core Database Schema Design — Multi-Tenant Foundation** (`User`, `Organization`, `Tenant`, `TenantDomain`, `Role`, `Permission`, `RolePermission`, `Membership`, `Subscription`, `AuditLog` + composite `(tenant_id, id)` FKs + PostgreSQL RLS SQL migrations + non-superuser app role).
- **Task 20:** Authentication & session security (Better Auth or approved provider, email/password + Argon2id/`scrypt`, revocable PostgreSQL sessions, password reset, Origin/CSRF checks, replacing `/mess-admin-login` and `/member-portal` placeholders).
- **Task 21:** Server-side authorization & RBAC engine (`requireUser`, `requireTenantPermission`, `requireMemberSelfOrPermission`, `requireSuperAdmin`, role seeding, cross-tenant isolation integration tests).
- **Task 22:** Tenant onboarding & Starter 7-day trial provisioning flow (create mess, assign `MESS_OWNER`, auto-start exact 7-day trial with `autoRenew = false`).
- **Task 23:** Public inquiry APIs & rate limiting (persist Contact, Custom Business Inquiry, and Room Rental Inquiry forms via rate-limited `/api/v1/public/*` routes + private S3/R2 storage adapter foundation).

---

## Phase 3: SaaS Super Admin Dashboard (Tasks 24–28)

**Objective:** Build the isolated Platform Super Admin console (`/super-admin/*`) for global SaaS governance, completely decoupled from tenant-level permissions.

- **Task 24:** Super Admin shell, isolated auth/MFA guard, platform KPI overview (real aggregated counts—no fake metrics).
- **Task 25:** Tenant & Organization directory (inspect status, search/filter, suspend/reactivate tenants, manage multi-property organizations).
- **Task 26:** Subscription & manual billing governance (review Starter plan renewals, manage Customized Business Plan contracts, toggle per-tenant entitlements and property limits).
- **Task 27:** Public lead inbox & Custom Domain approval queue (review Contact/Custom Business inquiries, verify DNS TXT ownership & SSL readiness for custom domains).
- **Task 28:** Global Audit Log explorer & platform-wide verified emergency advisory management.

---

## Phase 4: Mess Admin Dashboard (Tasks 29–36)

**Objective:** Deliver the complete tenant-scoped Mess Admin workspace (`/dashboard/[tenantSlug]/*`) for daily shared-living operations and transparent accounting.

- **Task 29:** Mess Admin shell, tenant switcher (for multi-property operators), overview dashboard, and tenant settings (`Asia/Dhaka` meal cutoffs, billing cycle rules).
- **Task 30:** Member management & role assignment (invite members, approve joins, move-in/move-out dates, assign system/custom roles).
- **Task 31:** Room & seat inventory management (`Room`, `RoomAssignment`, occupancy tracking, base rent, publishing vacant seats to Public Mess Website).
- **Task 32:** Daily Meal Management (`Meal`, `MealEntry`, `Asia/Dhaka` daily cutoff enforcement, guest meals, manager bulk entry, daily locks).
- **Task 33:** Bazar & Shared Expense Management (`BazarExpense`, itemized `ExpenseItem`, private S3 receipt uploads, shopper advances, approval workflow).
- **Task 34:** Financial Engine & Monthly Billing (`Bill`, `Payment`, immutable append-only `FinancialLedger`, exact integer paisa meal-rate math with transparent rounding variance, idempotency keys, month-close locking).
- **Task 35:** Notices, Complaint/Maintenance tracker, and Mess Emergency Contact Directory (local landlord, hospital, pharmacy, utility technicians).
- **Task 36:** Tenant Public Website Builder (basic customization on Starter; advanced branding & multi-location options on Customized Business Plan).

---

## Phase 5: Member Portal (Tasks 37–40)

**Objective:** Empower individual mess residents with a privacy-scoped self-service portal (`/portal/[tenantSlug]/*`).

- **Task 37:** Member Portal shell, personal profile, bilingual preference (`en`/`bn`), and active room/seat assignment summary.
- **Task 38:** Personal meal calendar & daily opt-in/opt-out controls (enforcing `Asia/Dhaka` cutoff windows) plus guest meal requests.
- **Task 39:** Personal monthly bill breakdowns, transparent meal-rate audit view, payment history, downloadable receipts, and due/refund balance tracking.
- **Task 40:** Notices feed, complaint submission/status tracking, mess emergency directory view, and strictly private Member Guardian Emergency Contacts.

---

## Phase 6: Advanced Features & Automation (Tasks 41–46)

**Objective:** Add public tenant websites, custom domain routing, multi-property capabilities, notifications, and billing consent workflows.

- **Task 41:** Public Mess Website runtime (`{slug}.messmate.app` serving tenant info, live vacant room listings, and public rental inquiry submission—zero private member data exposed).
- **Task 42:** Custom Domain routing & DNS verification (Next.js Middleware host resolution with Redis/TTL caching, TXT token verification, SSL status lifecycle).
- **Task 43:** Notification system (in-app notifications + pluggable email/SMS adapters for invites, bill publication, payment receipts, notices, and trial reminders in user's `en`/`bn` locale).
- **Task 44:** Trial expiry & explicit-consent subscription lifecycle (Day 5/Day 7 reminders, graceful read-only grace mode on expiry, explicit opt-in `৳99/month` renewal workflow, exportable records).
- **Task 45:** Multi-property & Organization analytics (cross-branch occupancy, aggregated financials, and custom RBAC roles for Customized Business Plan customers).
- **Task 46:** Exportable monthly statements & financial reports (CSV/PDF statement generation for Mess Admins and Members).

---

## Phase 7: Testing, Security & Deployment (Tasks 47–50)

**Objective:** Verify end-to-end reliability, multi-tenant security, performance, and production readiness before public launch.

- **Task 47:** Automated test suite expansion (unit tests for exact paisa math, RLS cross-tenant isolation integration tests, Playwright E2E journeys for Super Admin, Mess Admin, Member Portal, and Public Sites).
- **Task 48:** Comprehensive security audit & hardening (OWASP checks, IDOR/RLS penetration checks, rate-limit tuning, CSP & security headers, S3 presigned URL expiry audit, dependency audit cleanup).
- **Task 49:** Performance, observability & backup readiness (PostgreSQL index tuning, query profiling, structured server logging, error monitoring, Neon branching & point-in-time recovery drills).
- **Task 50:** Production deployment & launch verification (environment secrets configuration, zero-downtime Prisma migration workflow, SSL/DNS cutover, smoke tests, and operational runbooks).
