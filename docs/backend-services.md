# MessMate — Core Backend Services & API Architecture (Task 23)

## 1. Architectural Overview & Folder Structure

MessMate employs a modular, domain-driven backend architecture inside the Next.js App Router workspace on the **D: drive** (`D:\messmate`). Business logic, data access, authorization, and audit logging are strictly decoupled from API route handlers.

```
D:\messmate\
├── app\
│   └── api\
│       └── v1\
│           └── health\route.ts           # System diagnostics & health check
│
├── server\
│   ├── api\
│   │   ├── errors.ts                     # Centralized error mapping & AppError hierarchy
│   │   ├── response.ts                   # Standard API response builders (apiSuccess, apiError)
│   │   ├── validation.ts                 # Zod request body, query, and parameter validators
│   │   └── with-tenant-auth.ts           # Route wrapper uniting Auth, TenantContext, and RBAC
│   │
│   ├── audit\
│   │   └── audit-service.ts              # Append-only audit logging & redaction service
│   │
│   ├── config\
│   │   └── env.ts                        # Centralized Zod environment variable validation
│   │
│   ├── db\
│   │   ├── prisma.ts                     # Server-only singleton Prisma client with pg.Pool
│   │   ├── config.ts                     # Neon connection inspector & credentials sanitizer
│   │   └── check-connection.ts          # CLI connection test script
│   │
│   ├── health\
│   │   └── health-service.ts             # Health check diagnostics service
│   │
│   ├── logging\
│   │   └── logger.ts                     # Structured server-side logger with secret redaction
│   │
│   ├── rbac\                             # Role-Based Access Control (Task 21)
│   │   ├── permissions.ts                # 44-permission catalog
│   │   ├── role-templates.ts             # 6 default system role templates
│   │   ├── authorization-service.ts      # Server-side permission & role check engine
│   │   └── role-management-service.ts    # Anti-escalation & owner protection rules
│   │
│   ├── tenant\                           # Multi-Tenant Data Isolation (Task 22)
│   │   ├── tenant-context.ts             # Server-side tenant context resolver
│   │   ├── tenant-db.ts                  # TenantScopedDb repository wrapper
│   │   ├── tenant-resolution.ts          # Subdomain and routing resolver
│   │   └── rls.ts                        # PostgreSQL RLS transaction runner
│   │
│   └── utils\
│       └── pagination.ts                 # Parameter parsing & PaginationMeta calculation
│
├── prisma\
│   ├── schema.prisma                     # Multi-tenant schema + AuditLog model
│   └── migrations\                       # Versioned PostgreSQL DDL migrations
│
└── types\
    ├── api.ts                            # Standard API contracts and error codes
    └── database.ts                       # Model definitions and composite types
```

---

## 2. Standard API Response Convention

Every API route returns a consistent JSON envelope adhering to [`types/api.ts`](file:///d:/messmate/types/api.ts):

### A. Success Response (`apiSuccess`)
```json
{
  "success": true,
  "message": "Member onboarded successfully",
  "data": {
    "id": "mem_123",
    "name": "Tanvir Hasan",
    "status": "ACTIVE"
  },
  "meta": null
}
```

### B. Error Response (`apiError`)
```json
{
  "success": false,
  "message": "Request validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Please enter a valid email address",
        "code": "invalid_string"
      }
    ]
  }
}
```

### C. Paginated Response (`apiPaginated`)
```json
{
  "success": true,
  "message": "Records retrieved successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 48,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## 3. Request Validation with Zod

Located in [`server/api/validation.ts`](file:///d:/messmate/server/api/validation.ts):

* `validateBody(req, schema)` — Parses and validates JSON payload.
* `validateQuery(req, schema)` — Validates search parameters with type coercion.
* `validateParams(params, schema)` — Validates route segments (e.g., `[tenantSlug]`).

```typescript
const createRoomSchema = z.object({
  roomNumber: z.string().min(1),
  capacity: z.coerce.number().int().min(1).max(20),
  seatRentBdt: z.coerce.number().positive(),
});

const body = await validateBody(req, createRoomSchema);
```

---

## 4. Centralized Error Handling Hierarchy

Located in [`server/api/errors.ts`](file:///d:/messmate/server/api/errors.ts):

| Exception | HTTP Status | API Error Code | Description |
| :--- | :--- | :--- | :--- |
| `ValidationError` | 400 | `VALIDATION_ERROR` | Schema validation rejection with field details |
| `UnauthenticatedError` | 401 | `UNAUTHENTICATED` | Request lacks valid user identity |
| `PermissionDeniedError` | 403 | `PERMISSION_DENIED` | Active user lacks required RBAC capability |
| `TenantAccessDeniedError` | 403 | `TENANT_ACCESS_DENIED` | User is not a member of the requested mess |
| `TenantSuspendedError` | 403 | `TENANT_SUSPENDED` | Mess account is suspended |
| `MembershipInactiveError` | 403 | `MEMBERSHIP_INACTIVE` | Membership is pending, suspended, or left |
| `CrossTenantViolationError` | 400 | `CROSS_TENANT_VIOLATION` | Attempted cross-tenant record reference |
| `NotFoundError` | 404 | `NOT_FOUND` | Target entity does not exist |
| `ConflictError` | 409 | `CONFLICT` | Unique key or state conflict |
| `DatabaseError` | 500 | `DATABASE_ERROR` | Sanitized database connectivity failure |
| Generic Exception | 500 | `INTERNAL_SERVER_ERROR` | Sanitized server error (zero SQL/secrets leaked) |

---

## 5. Audit Logging Foundation

Located in [`server/audit/audit-service.ts`](file:///d:/messmate/server/audit/audit-service.ts):

* **Model:** [`AuditLog`](file:///d:/messmate/prisma/schema.prisma) (`audit_logs` table) with relations to `Tenant` and `User`.
* **Automatic Redaction:** [`server/logging/logger.ts`](file:///d:/messmate/server/logging/logger.ts) redacts passwords, password hashes, auth headers, tokens, and payment credentials before recording.
* **Transaction Awareness:** Accepts optional Prisma transaction clients to commit audit events atomically with business mutations.
* **Mandatory Enforcment:** If `mandatory: true` is passed and the database fails, throws `AuditLogFailedError` rather than silently continuing.
* **Tamper Notice:** Application-level append-only constraints do not prevent direct SQL modification by database superusers.

---

## 6. Health Check Diagnostic Endpoint

Route: `GET /api/v1/health` ([`app/api/v1/health/route.ts`](file:///d:/messmate/app/api/v1/health/route.ts)):
* Safe diagnostics reporting database status and environment health.
* Returns HTTP 200 when healthy (or degraded with informative note if database is unconfigured in development).
* Returns HTTP 503 if the database is disconnected or unreachable.
* **Zero secrets exposed:** Never returns database hostnames, ports, credentials, or internal query text.

---

## 7. How to Build a New Tenant-Scoped Module (Developer Guide)

Future developers building business modules (e.g., `rooms`, `meals`, `bazar`, `finance`) should use the standard `withTenantAuth` pattern:

```typescript
// app/api/v1/tenants/[tenantSlug]/meals/route.ts
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { apiSuccess } from '@/server/api/response';
import { validateBody } from '@/server/api/validation';
import { auditService } from '@/server/audit/audit-service';
import { z } from 'zod';

const logMealSchema = z.object({
  memberId: z.string(),
  mealDate: z.string(),
  count: z.number().int().min(0).max(10),
});

export const POST = withTenantAuth(
  { permission: 'meals.create' },
  async (req, { tenantContext, scopedDb }) => {
    // 1. Validate request body
    const input = await validateBody(req, logMealSchema);

    // 2. Cross-tenant check: ensure target member belongs to this tenant
    await scopedDb.ensureBelongsToTenant('memberships', input.memberId);

    // 3. Perform mutation using scopedDb or transaction
    const meal = /* perform mutation */;

    // 4. Record audit event
    await auditService.recordAuditEvent({
      tenantId: tenantContext.tenantId,
      actorUserId: tenantContext.userId,
      actorMembershipId: tenantContext.membershipId,
      action: 'meal.create',
      entityType: 'meal',
      entityId: meal.id,
      afterData: input,
    });

    return apiSuccess(meal, 'Meal recorded successfully', null, 201);
  }
);
```
