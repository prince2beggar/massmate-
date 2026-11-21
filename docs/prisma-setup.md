# MessMate — Prisma ORM Setup & Database Client Configuration

> **Documentation Scope (Task 18):** Architecture, setup, configuration, and security guidelines for Prisma ORM (v7.10.1) integrated with Neon PostgreSQL.

---

## 1. Prisma Installation & Dependencies

MessMate uses **Prisma 7.10.1** with driver adapter `@prisma/adapter-pg` and the Node PostgreSQL driver `pg`:

```json
{
  "dependencies": {
    "prisma": "7.10.1",
    "@prisma/client": "7.10.1",
    "@prisma/adapter-pg": "7.10.1",
    "pg": "^8.23.1",
    "@types/pg": "^8.23.1",
    "server-only": "^0.0.1",
    "dotenv": "^18.0.10"
  }
}
```

* **`prisma` (CLI):** Development dependency providing migration, introspection, and code-generation tooling.
* **`@prisma/client`:** Type-safe database query client generated into `./generated/prisma`.
* **`@prisma/adapter-pg`:** Official Prisma 7 driver adapter translating query engine calls to `pg.Pool` connection pooling.
* **`server-only`:** Prevents accidental leakage of database code into browser / client components at build time.

---

## 2. Prisma 7 Configuration (`prisma.config.ts`)

In Prisma 7, connection URLs are declared in `prisma.config.ts` rather than hardcoded in `schema.prisma`:

```typescript
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  },
});
```

### Why DIRECT_URL Is Used for the CLI
* Prisma CLI commands (`prisma migrate`, `prisma db push`, `prisma introspect`) use **advisory locks** and DDL operations that require persistent direct sessions.
* PgBouncer / transaction poolers cannot maintain advisory locks across transactions. Therefore, `prisma.config.ts` targets `DIRECT_URL` (Neon's direct host without `-pooler`).

---

## 3. Schema Foundation (`prisma/schema.prisma`)

The bootstrap schema declares the client generator and datasource provider, with zero business tables prior to Task 19:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

* **`provider = "prisma-client"`:** Prisma 7 client generator.
* **`output = "../generated/prisma"`:** Emits generated TypeScript types into `./generated/prisma` (excluded from ESLint).
* **Zero business models:** Prevents premature schema coupling before Task 19 multi-tenant schema authoring.

---

## 4. Centralized Prisma Client Singleton (`server/db/prisma.ts` & `lib/prisma.ts`)

To avoid connection exhaustion during Next.js development hot-reloads and ensure complete isolation from client-side code:

```typescript
import 'server-only';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { inspectDatabaseConfig } from './config';

declare global {
  var __messmatePrismaPool__: Pool | undefined;
  var __messmatePrismaClient__: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (globalThis.__messmatePrismaClient__) {
    return globalThis.__messmatePrismaClient__;
  }

  const config = inspectDatabaseConfig();
  if (!config.configured || !config.runtimeUrl) {
    throw new Error(
      `Neon PostgreSQL database is not configured. Add DATABASE_URL to .env.`
    );
  }

  const pool =
    globalThis.__messmatePrismaPool__ ??
    new Pool({
      connectionString: config.runtimeUrl,
      max: process.env.NODE_ENV === 'production' ? 20 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

  pool.on('error', (err) => {
    console.error('[Neon PostgreSQL] Unexpected idle pool error:', err.message);
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__messmatePrismaPool__ = pool;
    globalThis.__messmatePrismaClient__ = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return (client as unknown as Record<string, unknown>)[prop as string];
  },
});
```

* **`lib/prisma.ts`:** Canonical re-export pointing to `server/db/prisma.ts` for clean developer import ergonomics.
* **Lazy Initialization:** Proxy-based lazy initialization allows Next.js static page generation and tests to build without requiring active credentials.

---

## 5. Neon PostgreSQL Integration (Pooled vs. Direct)

Neon provides two distinct connection endpoints:

| Endpoint | Environment Variable | Used By | Purpose |
| :--- | :--- | :--- | :--- |
| **Pooled** (`-pooler`) | `DATABASE_URL` | Runtime App (`pg.Pool` + `@prisma/adapter-pg`) | Handles high concurrency / serverless spikes via PgBouncer transaction pooling. |
| **Direct** (unpooled) | `DIRECT_URL` | Prisma CLI (`prisma migrate`, `prisma db push`) | Provides persistent session for migrations, schema DDL, and advisory locks. |

---

## 6. Required Environment Variables

Defined in `.env.example` and configured locally in `.env`:

```env
# Neon Pooled Connection String (host contains "-pooler")
DATABASE_URL="postgresql://user:password@ep-endpoint-pooler.ap-southeast-1.aws.neon.tech/messmate?sslmode=require"

# Neon Direct Connection String (host does NOT contain "-pooler")
DIRECT_URL="postgresql://user:password@ep-endpoint.ap-southeast-1.aws.neon.tech/messmate?sslmode=require"
```

---

## 7. Available Database NPM Scripts

Added to `package.json`:

```bash
npm run db:validate   # Validates prisma/schema.prisma syntax and config
npm run db:generate   # Generates Prisma 7 client into ./generated/prisma
npm run db:studio     # Opens Prisma Studio UI for database inspection
npm run db:check      # Runs standalone Neon PostgreSQL connectivity test
```

---

## 8. Common Connection Errors & Solutions

| Error | Cause | Resolution |
| :--- | :--- | :--- |
| `Neon PostgreSQL database is not configured` | `.env` missing or still has placeholder | Copy `.env.example` to `.env` and paste real connection strings. |
| `SSL/TLS required` / `no pg_hba.conf entry` | Missing `?sslmode=require` | Append `?sslmode=require` to both connection strings in `.env`. |
| `Advisory lock timeout` during migration | `DIRECT_URL` points to `-pooler` | Ensure `DIRECT_URL` uses the direct (unpooled) host without `-pooler`. |
| `Cannot read properties of undefined` | Client component imported `prisma` | Import `prisma` only in Server Components, Server Actions, or Route Handlers. |

---

## 9. Security Best Practices

1. **Server-Only Boundaries:** Always keep database queries behind `import 'server-only'`. Never allow browser clients to execute raw database queries.
2. **Zero Hardcoded Secrets:** Never commit `.env` or paste real passwords in markdown documentation or source files.
3. **No `NEXT_PUBLIC_`:** Never expose database connection strings to the client-side JavaScript bundle.
4. **Credential Masking:** All database errors and status logs pass through `redactDatabaseUrl()` in `server/db/config.ts`.
5. **Exact Integer Paisa:** Store monetary values as `BIGINT` (paisa) or exact `NUMERIC(14,2)` — never use IEEE-754 floating-point numbers.

---

## 10. Next Steps: Future Schema Development (Task 19)

Once real Neon credentials are added to `.env`:
1. Execute `npm run db:check` to confirm live connection.
2. Proceed to **Task 19: Core Database Schema Design — Multi-Tenant Foundation**.
3. Author the multi-tenant core entities (`User`, `Organization`, `Tenant`, `TenantDomain`, `Membership`, `Role`, `Permission`, `AuditLog`).
4. Apply PostgreSQL Row-Level Security (RLS) SQL policies.
