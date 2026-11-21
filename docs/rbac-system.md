# MessMate — Role-Based Access Control (RBAC) System Reference (Task 21)

## 1. Executive Summary & Authorization Architecture

MessMate employs a strict, server-enforced **Role-Based Access Control (RBAC)** model with **multi-tenant scoping**.

Authorization in MessMate answers six fundamental questions for every incoming request:
1. **Who is making the request?** (`userId` — global platform identity)
2. **Which mess/tenant does the request target?** (`tenantId` — organization scope)
3. **What is their membership status?** (`membership.status === 'ACTIVE'`)
4. **Which role is assigned to that membership?** (`membership.role`)
5. **Which granular permissions are granted by that role?** (`role.rolePermissions`)
6. **Is the requested operation permitted?** (Evaluated against the 44-capability catalog using a **Secure Default-Deny** approach)

```
Incoming Request
       │
       ▼
[Resolve Actor userId & Target tenantId]
       │
       ▼
[Lookup Membership(userId, tenantId)] ─── Not found or Status !== ACTIVE ──► DENY (403)
       │
       ▼
[Load Assigned Role & rolePermissions] ── Cross-tenant role or missing ──► DENY (403)
       │
       ▼
[Check Requested PermissionKey]
       ├── Permission NOT granted ──────────────────────────────────────► DENY (ForbiddenError 403)
       └── Permission granted ──────────────────────────────────────────► ALLOW & Return VerifiedTenantAccess
```

---

## 2. Granular Permission Catalog (44 Permissions across 10 Modules)

| Module | Permission Key | Human Name | Description |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `dashboard.view` | View Dashboard | Access mess overview dashboard, quick stats, and daily summary widgets |
| **Members** | `members.view` | View Members | View active and historical member roster and public profile cards |
| | `members.create` | Create Members | Register and onboard new member profiles directly into the mess |
| | `members.update` | Update Members | Edit member details, contact numbers, and profile details |
| | `members.delete` | Delete Members | Permanently remove or archive member records from the mess |
| | `members.manage_status` | Manage Member Status | Change membership lifecycle state (Pending, Active, Suspended, Left) |
| | `members.invite` | Invite Members | Generate invitations and share join codes for new residents |
| **Rooms** | `rooms.view` | View Rooms | View room allocations, seat occupancies, and vacancies |
| | `rooms.create` | Create Rooms | Add new rooms and configure bed capacity within the mess |
| | `rooms.update` | Update Rooms | Edit room numbers, seat configurations, and monthly seat rents |
| | `rooms.delete` | Delete Rooms | Remove empty rooms or archive unused accommodation spaces |
| | `rooms.manage_allocation` | Manage Allocation | Assign residents to specific beds and process room seat transfers |
| **Meals** | `meals.view` | View Meals | View daily breakfast, lunch, and dinner meal logs and counts |
| | `meals.create` | Create Meals | Book and enter daily meal counts for residents |
| | `meals.update` | Update Meals | Edit recorded meal counts before daily cutoff times |
| | `meals.delete` | Delete Meals | Cancel or remove meal bookings |
| | `meals.manage_settings` | Manage Meal Settings | Configure meal booking cutoff hours, guest multipliers, and dining rules |
| **Bazar** | `bazar.view` | View Bazar | View itemized daily grocery purchases and scheduled shopping duties |
| | `bazar.create` | Create Bazar Entry | Record grocery purchases, costs, item names, and receipt vouchers |
| | `bazar.update` | Update Bazar Entry | Edit grocery item entries and update provisional shopping expenses |
| | `bazar.delete` | Delete Bazar Entry | Remove erroneous grocery purchase entries |
| | `bazar.verify` | Verify Bazar Expenses | Audit and officially approve grocery expenses submitted by members |
| **Finance** | `finance.view` | View Finance | View mess balance sheets, monthly fund tallies, and overall financial health |
| | `finance.manage` | Manage Finance | Perform monthly account closures, meal rate calculations, and adjustments |
| | `finance.manage_bills` | Manage Common Bills | Record and split cook bills, gas, electricity, water, and internet bills |
| | `finance.view_reports` | View Financial Reports | Access detailed financial calculation sheets and monthly ledger audits |
| **Payments** | `payments.view` | View Payments | View payment transactions, deposit histories, and member dues |
| | `payments.create` | Create Payments | Record cash deposits or initiate payment transactions |
| | `payments.confirm` | Confirm Payments | Verify and approve bKash, Nagad, bank, or cash payments |
| | `payments.reject` | Reject Payments | Reject invalid or unverified deposit and payment submissions |
| | `payments.refund` | Refund Payments | Process and issue balance refunds to departing members |
| **Notices** | `notices.view` | View Notices | Read mess notices, announcement boards, and community updates |
| | `notices.create` | Create Notices | Post new announcements and messages to the mess notice board |
| | `notices.update` | Update Notices | Edit existing notices and toggle pinned priority |
| | `notices.delete` | Delete Notices | Remove notices from the notice board |
| | `events.manage` | Manage Events | Organize feasts, mess meetings, elections, and cleaning drives |
| | `complaints.manage` | Manage Complaints | Review resident complaints, resolve disputes, and respond to issues |
| **Reports** | `reports.view` | View Reports | View monthly mess performance, meal consumption charts, and graphs |
| | `reports.export` | Export Reports | Download PDF and spreadsheet exports of monthly mess accounts |
| **Settings** | `settings.view` | View Settings | View mess profile, general rules, and operational configurations |
| | `settings.manage` | Manage Settings | Edit mess metadata, operational rules, address, and billing configurations |
| | `roles.view` | View Roles | View tenant roles, assigned permissions, and role rosters |
| | `roles.manage` | Manage Roles | Create custom roles, edit role permissions, and assign roles to members |
| | `audit_logs.view` | View Audit Logs | Inspect administrative audit trails and security activity logs |

---

## 3. Standard System Role Templates

MessMate defines 6 system role templates with distinct functional domains:

1. **Owner (`owner`):**
   * **Scope:** 100% of all 44 permissions.
   * **Responsibilities:** Full tenant-level governance, financial authority, role creation, and ownership succession.
2. **Admin (`admin`):**
   * **Scope:** 36 operational permissions.
   * **Restrictions:** Cannot edit core tenant settings (`settings.manage`), cannot modify Owner role, cannot grant permissions beyond their scope.
3. **Moderator (`moderator`):**
   * **Scope:** 15 community and member coordination permissions.
   * **Responsibilities:** Member onboarding, notices, community feasts/events, and resident complaints.
4. **Accountant (`accountant`):**
   * **Scope:** 17 financial and auditing permissions.
   * **Responsibilities:** Grocery purchase audits (`bazar.verify`), payment approvals (`payments.confirm`), utility bills (`finance.manage_bills`), and monthly ledger closures (`finance.manage`).
5. **Meal Manager (`meal-manager`):**
   * **Scope:** 11 dining and grocery management permissions.
   * **Responsibilities:** Meal counts, meal schedules, dining rules/cutoff hours (`meals.manage_settings`), and shopping entries (`bazar.create`).
6. **Member (`member`):**
   * **Scope:** 7 view-only permissions.
   * **Responsibilities:** Standard resident view of personal dues, notice board, meal schedule, and shared accommodation info.

---

## 4. Server-Side Authorization Service API

Located in [`server/rbac/authorization-service.ts`](file:///d:/messmate/server/rbac/authorization-service.ts):

```typescript
import { authService } from '@/server/rbac';

// 1. Boolean capability checks
const canEditMeals = await authService.hasPermission(userId, tenantId, 'meals.update');

// 2. Multi-permission checks
const canAudit = await authService.hasAnyPermission(userId, tenantId, [
  'finance.manage',
  'finance.manage_bills'
]);

// 3. Strict guard (throws ForbiddenError or TenantAccessDeniedError on failure)
const access = await authService.requirePermission(userId, tenantId, 'roles.manage');
console.log(`Authorized actor: ${access.userId}, Role: ${access.roleName}`);
```

---

## 5. Role Management Rules & Security Invariants

Located in [`server/rbac/role-management-service.ts`](file:///d:/messmate/server/rbac/role-management-service.ts):

1. **Anti-Privilege Escalation:**
   An administrator can never grant a permission they do not personally hold (`PrivilegeEscalationError`).
2. **Anti-Self-Promotion:**
   A member cannot modify or elevate their own role (`ForbiddenError`).
3. **Sole Owner Protection:**
   The last active Owner of a mess can never be demoted or removed (`OwnerProtectionError`). A replacement Owner must be assigned first.
4. **Cross-Tenant Shield:**
   Assigning a role belonging to Tenant B to a membership in Tenant A is rejected on the server and prevented by PostgreSQL compound foreign keys (`CrossTenantError`).
5. **System Role Guard:**
   System-defined role names (e.g., `Owner`) cannot be destructively renamed.

---

## 6. Structured Error Hierarchy

All authorization failures emit sanitized error classes from [`server/rbac/errors.ts`](file:///d:/messmate/server/rbac/errors.ts):
* `TenantAccessDeniedError` (403)
* `InactiveMembershipError` (403)
* `ForbiddenError` (403)
* `PrivilegeEscalationError` (403)
* `OwnerProtectionError` (400)
* `CrossTenantError` (400)

**Security Note:** These errors never expose connection strings, database table names, or raw SQL details to the client.
