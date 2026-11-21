# Super Admin Tenant & Mess Management System

## Overview

The MessMate Super Admin Tenant & Mess Management System provides centralized administration, oversight, verification, and governance for all registered messes, hostels, bachelor flats, and accommodation businesses across the platform.

Operating under the Central Platform Super Admin tier, this module enforces strict data privacy, multi-tenant security boundaries, immutable audit logging, and structured verification lifecycles.

---

## Architecture & Data Model

### 1. Extended Database Models

#### `Tenant` Model Extensions
- `verificationStatus`: `VerificationStatus` (`NOT_SUBMITTED`, `PENDING_REVIEW`, `ADDITIONAL_INFO_REQUIRED`, `APPROVED`, `REJECTED`)
- `verifiedAt`: `DateTime?`
- `verification`: Relation to `TenantVerification` (`1:1`)

#### `TenantVerification` Model
```prisma
model TenantVerification {
  id                 String                     @id @default(uuid())
  tenantId           String                     @unique @map("tenant_id")
  status             VerificationStatus         @default(NOT_SUBMITTED)
  documentType       VerificationDocumentType?  @map("document_type")
  documentNumberMasked String?                 @map("document_number_masked")
  documentFileUrl    String?                    @map("document_file_url")
  reviewerNotes      String?                    @map("reviewer_notes")
  reviewedAt         DateTime?                  @map("reviewed_at")
  reviewedByUserId   String?                    @map("reviewed_by_user_id")
  createdAt          DateTime                   @default(now()) @map("created_at")
  updatedAt          DateTime                   @updatedAt @map("updated_at")

  tenant             Tenant                     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  reviewer           User?                      @relation("ReviewedVerifications", fields: [reviewedByUserId], references: [id], onDelete: SetNull)

  @@index([status])
  @@map("tenant_verifications")
}
```

---

## Functional Capabilities

### 1. Central Tenant Directory (`/super-admin/tenants`)
- **Server-Side Pagination:** Supports high-scale directories with configurable page size (default 10, max 100).
- **Search Capabilities:** Search across mess name, slug, tenant ID, or owner email (for authorized platform staff).
- **Multi-Criteria Filtering:**
  - Operational Status: `ACTIVE`, `PENDING`, `SUSPENDED`, `INACTIVE`
  - Verification Status: `NOT_SUBMITTED`, `PENDING_REVIEW`, `ADDITIONAL_INFO_REQUIRED`, `APPROVED`, `REJECTED`
  - Tenant Type: `STUDENT_MESS`, `BACHELOR_MESS`, `JOB_HOLDER_MESS`, `HOSTEL`, `COMMERCIAL_MESS`, etc.
  - City / Location: Exact or prefix filter.
- **Table Metrics:** Displays mess name, unique ID, type, owner contact, total active members, subscription tier, verification badge, account status badge, and quick actions.

### 2. Tenant Profile & Details Hub (`/super-admin/tenants/[id]`)
Organized into 6 dedicated, modular tabs:
1. **Overview:** Core metadata, registration date, system status, quick stats (members, roles, verification status).
2. **Owner & Contact:** Full owner profile (name, email, phone, avatar), physical mess address, city, and primary contact phone/email.
3. **Members & Staff:** Complete membership table displaying users, roles, join dates, and membership status.
4. **Subscription & Billing:** Current subscription tier, billing period, and explicit `UNAVAILABLE_PHASE3_PENDING` badge indicating Phase 3 pending billing module (no fake data).
5. **Custom Domain:** Subdomain routing status (`<slug>.messmate.app`), custom domain records, and SSL/DNS provisioning indicators.
6. **Audit Activity:** Real-time event stream tracking administrative actions, status transitions, role grants, and verification reviews.

### 3. Administrative Tenant Registration Modal
- Validates mess name, auto-generates slug with availability checks.
- Enforces owner credentials (name, email, phone) with validation.
- Atomically provisions:
  1. Tenant entity.
  2. Owner user (or links existing user).
  3. Default system roles from `SYSTEM_ROLE_TEMPLATES` (`Owner`, `Admin`, `Moderator`, `Accountant`, `Manager`, `Member`, `Cook`).
  4. Active Owner Membership linking user and tenant.
  5. Initial `TenantVerification` record (`NOT_SUBMITTED`).
  6. Platform-level audit log entry (`tenant.created`).

### 4. Tenant Operational Status Management Modal
- Transition states: `ACTIVE`, `PENDING`, `SUSPENDED`, `INACTIVE`.
- **Mandatory Reason:** Reason input required for every status transition (min 5 characters).
- **Suspension Safety:** Warning banner and explicit confirmation checkbox before suspending an active mess.
- **Context Isolation:** When a tenant is suspended, tenant context resolution (`requireTenantContext`) immediately rejects any member access with `TenantSuspendedError` (HTTP 403).

### 5. Tenant Verification Workflow Modal
- Formal verification pipeline with review actions:
  - `APPROVE`: Transitions verification to `APPROVED`, updates `Tenant.verifiedAt` timestamp.
  - `REJECT`: Transitions to `REJECTED`, requires rejection reason.
  - `NEED_INFO`: Transitions to `ADDITIONAL_INFO_REQUIRED`, prompting tenant owner for clearer documentation.
- Reviewer tracking: Logs reviewer user ID and timestamp.
- **Document Masking:** NID / Trade license numbers are strictly masked (`*********6789`).
- **Private Storage:** Document file URLs reference secure, private, non-public object storage paths.

---

## Security & Privacy Controls

1. **Platform RBAC Guarding:**
   - Viewing directory or details requires `tenants.view` platform permission.
   - Status updates, verification reviews, and tenant creation require `tenants.manage` platform permission.
2. **Non-Destructive Lifecycle:**
   - Permanent tenant deletion is strictly disabled. Messes with historical financial, bazar, and meal records cannot be arbitrarily destroyed.
3. **Sensitive Document Protection:**
   - No raw verification documents are served over unauthenticated or public CDNs.
   - All document IDs are masked in the UI and API responses.
4. **Audit Trail Completeness:**
   - All modifications create immutable entries in `AuditLog` with before/after state diffs, operator IP, and user-agent metadata.

---

## API Endpoints

| Method | Path | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/super-admin/tenants` | `tenants.view` | Paginated tenant directory with search & filters |
| `POST` | `/api/v1/super-admin/tenants` | `tenants.manage` | Administrative creation of a new mess tenant |
| `GET` | `/api/v1/super-admin/tenants/[id]` | `tenants.view` | Comprehensive 6-tab tenant profile |
| `PATCH` | `/api/v1/super-admin/tenants/[id]` | `tenants.manage` | Update tenant profile details |
| `POST` | `/api/v1/super-admin/tenants/[id]/status` | `tenants.manage` | Update tenant operational status (with reason) |
| `POST` | `/api/v1/super-admin/tenants/[id]/verify` | `tenants.manage` | Review and decide tenant verification |

---

## Test Verification

The module is verified with 15 unit and integration tests in `server/platform/platform-tenant-service.test.ts`:
- Scenario 1: Tenant directory pagination
- Scenario 2: Tenant directory search by name
- Scenario 3: Tenant directory search by slug
- Scenario 4: Tenant directory filter by status
- Scenario 5: Tenant directory filter by verification status
- Scenario 6: Detailed tenant profile resolution
- Scenario 7: Administrative tenant creation with default roles & owner membership
- Scenario 8: Tenant creation slug conflict rejection
- Scenario 9: Tenant profile update
- Scenario 10: Tenant status transition to SUSPENDED with mandatory reason
- Scenario 11: Rejection of status transition when reason is missing
- Scenario 12: Tenant verification approval
- Scenario 13: Tenant verification rejection with notes
- Scenario 14: Tenant verification request for additional info
- Scenario 15: Document number masking invariant
