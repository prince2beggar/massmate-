# MessMate — Database Planning Reference (Pre-Task 19)

> **Planning Reference Only:** No business tables or Prisma models exist yet in `prisma/schema.prisma`. Use this reference alongside `docs/backend-architecture.md` when executing **Task 19: Core Database Schema Design — Multi-Tenant Foundation** after Tasks 17–18 are finalized.

---

## 1. Non-Negotiable Database Design Rules

1. **Shared Database + Shared Schema Multi-Tenancy:**
   - Every tenant-scoped table MUST have a non-nullable `tenant_id` (`UUID`) column indexed as the leading column (`@@index([tenantId, ...])`).
   - Enforce composite unique keys `@@unique([tenantId, id])` and composite foreign keys referencing `(tenant_id, id)` on intra-tenant relations so cross-tenant foreign-key references fail at the PostgreSQL constraint layer.
2. **PostgreSQL Row-Level Security (RLS):**
   - Enable `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on all tenant-scoped tables for the non-superuser runtime DB role.
   - Set tenant context inside Prisma transactions via transaction-local `SELECT set_config('app.current_tenant_id', $1, true)` (`SET LOCAL`) for Neon PgBouncer transaction-pooling safety.
3. **Exact Financial Representation (Zero Floats):**
   - Store all monetary columns as integer **paisa** (`BIGINT`, e.g., `৳99.00 = 9900`) or exact PostgreSQL `NUMERIC(14,2)`. Never use `FLOAT` or `DOUBLE PRECISION`.
   - `FinancialLedger` MUST be append-only (corrections via `REVERSAL`/`ADJUSTMENT` rows, never silent overwrites or hard deletes).
4. **Timezone Semantics (`Asia/Dhaka`):**
   - Store event timestamps in UTC `TIMESTAMPTZ` (`createdAt`, `paidAt`, `trialEndsAt`).
   - Store operational calendar days (`mealDate`, `expenseDate`, `startDate`, `endDate`) as PostgreSQL `DATE` and billing periods as `(billingYear, billingMonth)` interpreted strictly in `Asia/Dhaka`.
5. **Super Admin Separation:**
   - Store platform Super Admin privileges in a dedicated global table (`PlatformAdmin` / `systemRole`), completely separate from tenant `Membership` and `Role` tables.

---

## 2. Task 19 Core Foundation Entities (Recommended First Migration Scope)

Start Task 19 cleanly with the **Multi-Tenant Core Foundation** before adding operational tables (rooms, meals, bazar, ledger) in subsequent tasks:

| Entity | Scope | Key Fields & Constraints |
| --- | --- | --- |
| `User` | Global | `id`, `email` (unique), `phone?` (unique), `passwordHash`, `fullName`, `locale` (`en`/`bn`), `emailVerifiedAt?`, `status`, timestamps |
| `PlatformAdmin` | Global | `id`, `userId` (unique FK → `User`), `role` (`SUPER_ADMIN` \| `SUPPORT_READONLY`), `isActive`, `createdAt` |
| `Organization` *(if approved)* | Global/Root | `id`, `name`, `slug` (unique), `ownerUserId`, `status`, timestamps — groups multi-property tenants under Customized Business Plan |
| `Tenant` | Tenant Root | `id`, `organizationId?`, `slug` (unique), `name`, `businessCategory`, `address?`, `timezone` (default `'Asia/Dhaka'`), `status` (`TRIAL` \| `ACTIVE` \| `PAST_DUE` \| `SUSPENDED`), `websiteConfigJson`, timestamps |
| `TenantDomain` | Tenant-Scoped | `id`, `tenantId`, `hostname` (unique), `type` (`SUBDOMAIN` \| `CUSTOM`), `verificationToken`, `verificationStatus`, `sslStatus`, `isPrimary` |
| `Role` | Tenant-Scoped | `id`, `tenantId`, `code`, `name`, `isSystemRole` — unique `(tenantId, code)` |
| `Permission` | Global Catalog | `id`, `code` (unique, e.g. `members:manage`, `finance:close_month`), `module`, `description` |
| `RolePermission` | Tenant-Scoped | Composite PK `(roleId, permissionId)` + `tenantId` |
| `Membership` | Tenant-Scoped | `id`, `tenantId`, `userId`, `roleId`, `status` (`INVITED` \| `ACTIVE` \| `INACTIVE` \| `LEFT`), `joinedAt?`, `leftAt?` — unique `(tenantId, userId)` |
| `Subscription` | Tenant-Scoped | `id`, `tenantId` (unique active), `planCode` (`STARTER` \| `CUSTOM_BUSINESS`), `status` (`TRIALING` \| `ACTIVE` \| `EXPIRED` \| `SUSPENDED`), `trialStartedAt`, `trialEndsAt` (+7 days), `monthlyFeePaisa` (`9900` for Starter; nullable for Custom), `autoRenew` (default `false`), `entitlementsJson` |
| `AuditLog` | Global + Tenant-Scoped | `id`, `tenantId?`, `actorUserId?`, `actorScope` (`SUPER_ADMIN` \| `TENANT_USER` \| `SYSTEM`), `action`, `entityType`, `entityId`, `metadataJson`, `ipHash`, `createdAt` (append-only) |

---

## 3. Operational Entities (Planned for Later Phase 2–4 Migrations)

- **Rooms & Rentals:** `Room`, `RoomAssignment`, `PublicRoomInquiry`
- **Meals & Bazar:** `Meal`, `MealEntry`, `BazarExpense`, `ExpenseItem`
- **Finance:** `Bill`, `Payment`, `FinancialLedger`
- **Community & Safety:** `Notice`, `Complaint`, `MessEmergencyContact`, `MemberEmergencyContact` (strictly private), `NationalEmergencyContact`
- **Platform Support:** `FileAsset` (private S3 metadata), `Notification`, `PublicLeadInquiry`

---

## 4. Verification Checklist for Task 19

- [ ] `npx prisma validate` and `npx prisma generate` pass cleanly with Prisma 7.
- [ ] Migrations run cleanly against Neon `DIRECT_URL`.
- [ ] Seed script creates system `Permission` catalog and default tenant roles idempotently.
- [ ] Dedicated non-superuser runtime DB role tested with PostgreSQL RLS policies confirming Tenant A cannot read or mutate Tenant B rows even if an application `WHERE` clause is omitted.
