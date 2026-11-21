# MessMate — Super Admin Panel Foundation & Dashboard Architecture (Task 24)

## 1. Executive Summary & Purpose
MessMate is a multi-tenant SaaS application supporting student messes, bachelor flats, hostels, and shared accommodation businesses across Bangladesh. 

The **Central Super Admin Panel** (`/super-admin`) is exclusively designed for platform operators, customer support, and finance administrators to govern the SaaS infrastructure, inspect tenant health, oversee user identities, and monitor growth metrics across all organizations.

It operates under strict separation from individual **Mess Admin Dashboards** (`/app/:tenantSlug`):
- A normal Mess Owner or Tenant Admin never receives platform-level access.
- Tenant-scoped roles (`Role` junctioned to `Membership`) grant zero platform capabilities.
- Platform capabilities are governed by a platform-level role (`PlatformRole`) on the global `User` identity.

---

## 2. Platform Authorization Architecture

### 2.1 Database Schema Extension
The smallest non-breaking extension was applied to `prisma/schema.prisma`:
```prisma
enum PlatformRole {
  PLATFORM_OWNER
  PLATFORM_ADMIN
  SUPPORT_STAFF
  FINANCE_STAFF
}

model User {
  // ...
  platformRole  PlatformRole?
  @@index([platformRole])
}
```

- Normal users (99.99% of registered members and mess owners) have `platformRole: null`.
- Only designated accounts possess a non-null `PlatformRole`.

### 2.2 Granular Platform Capabilities
Platform capabilities are cataloged in `server/platform/platform-roles.ts`:
- `tenants.view`: View all registered messes and aggregate operational metrics.
- `tenants.manage`: Suspend, activate, verify, or configure messes.
- `users.view`: Inspect global user profiles and multi-tenant memberships.
- `users.manage`: Manage platform administrator roles and identities.
- `subscriptions.view`: Inspect subscription tiers, trial statuses, and license countdowns.
- `subscriptions.manage`: Create, update, or archive pricing packages.
- `revenue.view`: Access financial summaries, collected MRR, and payment logs.
- `support.view`: Read tenant support inquiries and dispute escalations.
- `support.manage`: Respond to and resolve platform support tickets.
- `audit.view`: Read platform-wide immutable compliance logs.
- `settings.manage`: Update platform parameters, maintenance toggles, and security gates.

### 2.3 Role-to-Permission Mapping
| Platform Role | Allowed Capabilities |
|---|---|
| **PLATFORM_OWNER** | Full capabilities across all 11 platform permissions. |
| **PLATFORM_ADMIN** | Operations, tenants, users, subscriptions, support, audit (excluding platform owner role changes). |
| **SUPPORT_STAFF** | `tenants.view`, `users.view`, `support.view`, `support.manage`, `audit.view`. |
| **FINANCE_STAFF** | `tenants.view`, `subscriptions.view`, `subscriptions.manage`, `revenue.view`. |

### 2.4 Server-Side Guards
1. **`PlatformAuthService.resolvePlatformContext(userId)`**:
   - Fetches the user record from PostgreSQL.
   - Rejects missing identities with `PlatformUnauthenticatedError` (401).
   - Rejects suspended or inactive accounts with `PlatformUserInactiveError` (403).
   - Rejects accounts with `platformRole === null` (such as normal Mess Owners) with `PlatformAccessDeniedError` (403).
2. **`withPlatformAuth(options, handler)`**:
   - Higher-order route wrapper for API routes under `/api/v1/super-admin/*`.
   - Protects endpoints by enforcing specific platform capabilities and sanitizing error responses.
3. **`getPlatformSession()`**:
   - Server Component resolver for Next.js App Router layouts and pages.
   - Redirects unauthorized users to `/super-admin/access-denied`.

---

## 3. Super Admin Navigation & Route Structure

```
app/super-admin/
├── layout.tsx                # Admin layout shell (Responsive sidebar + sticky header)
├── page.tsx                  # Overview Dashboard (KPI cards, charts, activity, shortcuts)
├── access-denied/page.tsx    # Dedicated security boundary explanation screen
├── tenants/page.tsx          # Mess & Tenant Management (Task 25 upcoming)
├── subscriptions/page.tsx    # SaaS Subscriptions (Phase 3 pending)
├── plans/page.tsx            # Plans & Pricing (Phase 3 pending)
├── domains/page.tsx          # Subdomains & Custom Domains (Phase 3 pending)
├── users/page.tsx            # Platform Users & Directory (Phase 3 pending)
├── support/page.tsx          # Support Helpdesk (Phase 3 pending)
├── verification/page.tsx     # Tenant Manager Verification (Phase 3 pending)
├── analytics/page.tsx        # In-depth Analytics & Reports (Phase 3 pending)
├── audit-logs/page.tsx       # Live Platform Audit Ledger (Integrated with AuditLog)
└── settings/page.tsx         # Platform Settings & Maintenance (Phase 3 pending)
```

---

## 4. Overview Dashboard Data & KPI Cards

### 4.1 Tenant Metrics (Live DB Aggregations)
- **Total Tenants**: Live `prisma.tenant.count()`
- **Active Tenants**: Live `prisma.tenant.count({ where: { status: 'ACTIVE' } })`
- **Pending Approval**: Live `prisma.tenant.count({ where: { status: 'PENDING' } })`
- **Suspended Tenants**: Live `prisma.tenant.count({ where: { status: 'SUSPENDED' } })`

### 4.2 Member Metrics (Live DB Aggregations)
- **Total Platform Members**: Live `prisma.membership.count()`
- **Active Members**: Live `prisma.membership.count({ where: { status: 'ACTIVE' } })`

### 4.3 Subscription & Revenue Metrics (Honest Zero Policy)
Because subscription billing and payment gateways are explicitly scheduled for Phase 3, the backend returns real values of `0` with explicit status indicators:
- `isLive: false`
- `moduleStatus: 'UNAVAILABLE_PHASE3_PENDING'`
- Zero fabricated numbers are displayed.

---

## 5. Analytics Visualizations
1. **Tenant Growth Over Time**:
   - Lightweight, accessible SVG Area & Line chart plotting tenant registrations over time.
   - Dynamically re-aggregates based on selected date filter (`today`, `7d`, `30d`, `90d`, `this_year`, `all`).
   - Includes interactive hover tooltips and empty states.
2. **Tenant Status Distribution**:
   - Segmented bar and legend breakdown showing operational proportions across Active, Pending, Suspended, and Inactive messes.
3. **Monthly Revenue & Plan Distribution**:
   - Render clean, informative empty-state cards explaining that billing integration will connect in Phase 3.

---

## 6. Quick Governance Shortcuts
Six high-priority administrative shortcuts navigating directly to real application routes:
1. **View All Tenants** (`/super-admin/tenants`)
2. **Review Pending Tenants** (`/super-admin/tenants?status=PENDING`)
3. **Manage Plans** (`/super-admin/plans`)
4. **Review Subscriptions** (`/super-admin/subscriptions`)
5. **Review Domain Requests** (`/super-admin/domains`)
6. **Open Support Center** (`/super-admin/support`)

---

## 7. Quality Assurance & Verification
- **Automated Tests**: Run with `npx tsx --test server/platform/platform-auth.test.ts`. 10/10 scenarios passing.
- **Full Suite**: 84 tests passing across all suites (`server/`, `lib/`, `data/`).
- **TypeScript**: 0 compiler errors (`npx tsc --noEmit`).
- **ESLint**: 0 lint errors, 0 warnings (`npm run lint`).
- **Public Website Intact**: Marketing pages, hero section, and rental explorer remain completely untouched.
