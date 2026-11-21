# ANTIGRAVITY_GUIDE.md — Continuation Instructions for Google Antigravity

> **Read This First:** This repository is an **in-progress production SaaS codebase** exported from Google AI Studio Build Mode so development can continue seamlessly in Google Antigravity. **Do not rebuild the frontend or start from scratch.** Preserve all completed UI, branding, bilingual copy, and verified tests.

---

## 1. Mandatory Onboarding Protocol for the Next AI Agent

Before making **any** code edits, execute these 12 steps in order:

1. **Read `README.md`** to understand the project setup, commands, and stack.
2. **Read `ANTIGRAVITY_GUIDE.md`** (this file) to understand constraints, conventions, and architectural boundaries.
3. **Read `PROJECT_STATUS.md`** to verify exact completed, partially completed, placeholder, and pending work.
4. **Read `DEVELOPMENT_ROADMAP.md`** (and `docs/backend-architecture.md` + `docs/neon-database-setup.md`) to understand the 7-phase plan.
5. **Inspect the complete source code** (`app/`, `components/`, `lib/`, `data/`, `prisma/`, `server/`, `package.json`, `next.config.ts`, `tsconfig.json`).
6. **Verify the existing implementation** by running `npm install`, `npx prisma generate`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and the 46 unit tests.
7. **Identify the next incomplete task** based on actual source-code reality (see Section 2 below before jumping straight to Task 19).
8. **Ask the user for clarification** whenever a key architectural or product decision is still unapproved (see Section 6: Pending Architectural Approvals).
9. **Work incrementally, one task at a time.** Never bundle unrelated phases into one massive refactor.
10. **Never rebuild existing completed sections unnecessarily.** Treat the Public Website MVP (`app/`, `components/home/`, `components/pricing/`, `components/safety/`, `components/layout/`, etc.) as stable production work.
11. **Preserve the existing design system and business requirements** (exact 2-option subscription model, bilingual EN/বাংলা support, honest DEMO DATA disclosures, no fake stats).
12. **Test each completed task before moving to the next one** (unit tests + TypeScript + ESLint + Next.js build + functional verification).

---

## 2. Actual Current Handoff Point (Verify Before Starting Task 19)

The target next milestone is **Task 19: Core Database Schema Design — Multi-Tenant Foundation**, **provided Tasks 16–18 are verified ready first**.

Based on the actual source audit at export time (details in `PROJECT_STATUS.md`):
- **Task 16 (Backend Architecture & Technical Planning):** Completed (`docs/backend-architecture.md`).
- **Task 17 (Neon PostgreSQL Setup & Database Connection):** **Partially completed** — Prisma `7.10.1`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `server-only`, and `dotenv` are installed; `.env.example` defines `DATABASE_URL` and `DIRECT_URL`; `prisma.config.ts`, connection-only `prisma/schema.prisma`, and `server/db/config.ts` (+ unit tests) exist. **Still needed:**
  1. Developer supplies real Neon pooled `DATABASE_URL` and unpooled `DIRECT_URL` in local `.env`.
  2. Create the centralized server-only Prisma runtime singleton (`server/db/prisma.ts` using `import 'server-only'`, `pg.Pool`, `@prisma/adapter-pg`, and `globalThis` caching for Next.js HMR).
  3. Run a real `SELECT 1` connectivity verification against Neon PostgreSQL.
- **Task 18 (Database Client / ORM Finalization & Env Validation):** Finish alongside the remaining Task 17 items (e.g., `server/db/prisma.ts`, optional `zod` installation for `config/env.ts`, and `app/(marketing)/layout.tsx` scoping prep) so Neon + Prisma is 100% live and verified **before** writing and migrating **Task 19: Core Database Schema Design — Multi-Tenant Foundation**.

---

## 3. What MessMate Is & Non-Negotiable Business Rules

MessMate is a multi-tenant Mess & Shared Living Management SaaS platform built for Bangladesh and global shared-living communities (students, bachelors, job holders, shared apartments, hostels, boarding houses, co-living spaces, and multi-property operators).

### Non-Negotiable Product & Business Rules

1. **Exact Two-Option Subscription Model (`lib/pricing-config.ts`):**
   - **Starter Plan:** Exact **7-day free trial**, then **৳99/month** for one mess. **Never implement automatic payment or automatic renewal without explicit customer consent.**
   - **Customized Business Plan:** **Custom Pricing — Contact Us** (no invented fixed price; tailored multi-mess/hostel/multi-property entitlements).
   - **Never** re-introduce a 4-tier Free/Basic/Pro/Enterprise pricing model.
2. **Bilingual Support (English & বাংলা):**
   - Every user-facing feature must support `en` and `bn` cleanly (`context/LanguageContext.tsx`, `lib/i18n/*`).
   - Bangla strings are often wider than English—always verify layout width at `320px` and `1024px` in both locales.
3. **Honesty & Data Integrity on Public Pages:**
   - Never fabricate statistics (no "10,000+ users" or fake testimonials).
   - Keep explicit `DEMO DATA` markers on sample room rentals and sample mess emergency contact directories.
   - Keep Bangladesh national emergency numbers (`999`, `102`, `16263`) accurately labeled with their verification notes.
   - Never hardcode or invent real company phone numbers or emails; keep centralized placeholders until real contact details are provided.
4. **Timezone & Currency Standards:**
   - **Timezone:** `Asia/Dhaka` (`UTC+06:00`). Store event instants in UTC `TIMESTAMPTZ`, and store operational calendar dates (meal date, bazar date, billing year/month) explicitly in `Asia/Dhaka` calendar semantics.
   - **Currency:** Bangladeshi Taka (`BDT` / `৳`). **Never use floating-point math for backend financial records or billing.** Store money in exact integer minor units (**paisa**, `BIGINT`, `৳1 = 100 paisa`) or exact `NUMERIC(14,2)`. (Note: `lib/meal-math.ts` is only for the public homepage interactive preview; build a separate exact-integer engine for backend finance.)

---

## 4. Existing Architecture, Stack & Folder Structure

### Existing Stack (Do Not Replace Unnecessarily)
- **Next.js `15.4.9` (App Router)** with React `19.2.1`, TypeScript `5.9.3` (`strict: true`, path alias `@/* -> ./*`).
- **Tailwind CSS `v4.1.11`** configured via `postcss.config.mjs` and `app/globals.css` (do not create `tailwind.config.ts`).
- **shadcn/ui `4.23.0`** configured in `components.json` with **`style: base-nova`** backed by **`@base-ui/react`** (NOT Radix UI — keep `@base-ui/react` conventions when adding new UI components).
- **Icons:** `lucide-react` exclusively (no custom hand-authored SVG icon files).
- **Animations:** `motion` (imported from `motion/react`), respecting `useReducedMotion()`.
- **Prisma `7.10.1`** + `@prisma/client@7.10.1` + `@prisma/adapter-pg@7.10.1` + `pg`. (Note: Prisma 7 uses root `prisma.config.ts`, `provider = "prisma-client"`, `output = "../generated/prisma"`, and driver adapters instead of putting `url` inside `prisma/schema.prisma`.)

### Existing Folder Structure (Preserve Existing Paths!)
The project uses **root-level App Router folders** (`app/`, `components/`, `context/`, `data/`, `hooks/`, `lib/`, `types/`, `prisma/`, `server/`, `docs/`), NOT `src/app/`.
- **Do NOT blindly move existing folders into `src/`** — moving working files risks breaking imports and routes unnecessarily.
- Add new backend code cleanly alongside the existing root structure:
  - `modules/<domain>/` — 15 modular monolith domain services (see `docs/backend-architecture.md`)
  - `server/` — `server-only` infrastructure (`db/`, `auth/`, `storage/`, `rate-limit/`, `http/`, `time/`)
  - `config/` — server-side env validation (`env.ts`) and platform constants
  - `app/api/v1/` — thin REST/JSON Route Handlers
  - `app/(auth)/`, `app/(dashboard)/`, `app/(portal)/`, `app/(super-admin)/`, `app/(tenant-site)/` — future route groups.
- **Important Layout Note:** `app/layout.tsx` currently mounts `SiteHeader`, `SiteFooter`, and `ScrollToTopButton` globally. When building dashboards or tenant websites, move only the public marketing chrome into `app/(marketing)/layout.tsx` (without changing any existing public URL paths).

---

## 5. Design System & Coding Conventions

- **Palette & Aesthetic:** Clean, structured SaaS light theme — deep navy headings (`#172B4D`), slate body text (`#525F7F`), crisp cobalt primary accent (`#324CDD` / `#5E72E4`), soft surface tint (`#F8F9FE`), subtle `1px` borders (`border-slate-200/90`).
- **Typography:** `Plus Jakarta Sans` (display/headings), `DM Sans` (body), `Hind Siliguri` (Bengali), `JetBrains Mono` (numbers, currency, badges) configured via `next/font/google` in `app/layout.tsx`.
- **Responsive Standards:** Fluid `clamp()` headings, `xl:` (`1280px+`) for dense 4-column card rows and the 7-link desktop navbar, `text-base sm:text-sm` on mobile inputs/textareas (prevents iOS Safari zoom), generous mobile tap targets, zero horizontal overflow from `320px` to `1920px+`.
- **Next.js Conventions:**
  - Server Components by default; add `'use client'` only at interactive leaves.
  - Keep database/auth/secret logic strictly in server modules marked with `import 'server-only'`.
  - Keep pure domain logic decoupled in testable TypeScript modules with companion `*.test.ts` files runnable via `node:test` + `tsx`.
- **No Microservices:** Build a clean **Modular Monolith** with strict internal boundaries across the 15 planned modules.

---

## 6. Multi-Tenant, Database & Security Requirements

Every backend task MUST enforce these architectural invariants (full specification in `docs/backend-architecture.md`):

1. **Shared Database + Shared Schema Multi-Tenancy:**
   - Every tenant-scoped table has a non-nullable `tenant_id` indexed as the leading key.
   - Use composite foreign keys `(tenant_id, id)` wherever practical to prevent cross-tenant linking.
   - Use **PostgreSQL Row-Level Security (RLS)** on tenant-scoped tables via transaction-local `set_config('app.current_tenant_id', $1, true)` (`SET LOCAL`) inside Prisma transactions (essential for Neon PgBouncer transaction pooling).
2. **Zero Client Trust:**
   - Never trust `tenantId`, `userId`, `role`, `permissions`, `mealRate`, or `amount` supplied by the browser.
   - Derive tenant access and permissions strictly on the server from verified session + active `Membership`.
   - Return `404` (not `403`) on cross-tenant single-record ID probes to prevent existence enumeration.
3. **Platform Super Admin Separation:**
   - Super Admin authority lives in an isolated platform-level table/scope, completely separate from tenant memberships/roles, under `/super-admin/*` with mandatory `AuditLog` tracking.
4. **Financial Record Protection:**
   - Exact integer paisa (`BIGINT`) or `NUMERIC(14,2)` — never floats.
   - Immutable append-only `FinancialLedger` (corrections via `REVERSAL`/`ADJUSTMENT` entries, never destructive deletes).
   - Idempotency keys on payment creation and billing runs; period closing locks for finalized months.
5. **Private File Storage & Secret Hygiene:**
   - Private S3-compatible bucket (tenant-prefixed UUID keys) with short-lived, permission-checked presigned URLs.
   - Never expose DB/auth/storage secrets via `NEXT_PUBLIC_*` or commit `.env`.
   - Validate all external inputs with Zod; keep Prisma queries parameterized.

### Pending Architectural Decisions to Confirm with the User

Before writing Task 19+ schemas and auth code, confirm these 5 open items (originally flagged in Task 16):
1. **Auth Library:** Better Auth (recommended) vs Auth.js v5.
2. **Money Column Type:** Integer paisa (`BIGINT`, recommended) vs `NUMERIC(14,2)`.
3. **Multi-Property Parent Entity:** Optional `Organization` above `Tenant` for Customized Business Plan operators.
4. **Private Object Storage Provider:** Cloudflare R2 vs AWS S3.
5. **Custom Domain Login Scope:** Central platform domain login (`app.messmate.app`) vs per-custom-domain login.

---

## 7. Quick Reference to Project Documentation

- `README.md` — Installation, commands, stack, and project overview.
- `PROJECT_STATUS.md` — Source-verified completion status, partial work, placeholders, and known issues.
- `DEVELOPMENT_ROADMAP.md` — 7-phase roadmap (Tasks 1–50).
- `docs/backend-architecture.md` — Full multi-tenant backend, security, module, and auth evaluation blueprint.
- `docs/neon-database-setup.md` — Neon PostgreSQL + Prisma 7 setup, pooled vs direct URLs, and remaining Task 17–18 steps.
- `docs/project-overview.md` — Product vision, personas, and business rules.
- `docs/database-plan.md` — Task 19 entity list, isolation classification, and schema constraints checklist.
