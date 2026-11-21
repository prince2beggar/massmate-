# Neon PostgreSQL Setup & Prisma 7 Connection Guide

> **Handoff Status (Task 17–18):** Prisma `7.10.1`, `@prisma/client@7.10.1`, `@prisma/adapter-pg@7.10.1`, `pg`, `@types/pg`, `server-only`, and `dotenv` are already installed, `.env.example` is updated, `prisma.config.ts` and a connection-only `prisma/schema.prisma` are in place, and `server/db/config.ts` (+ 8 passing unit tests) validates Neon URLs. **Real Neon credentials have NOT been configured yet, no singleton Prisma runtime client (`server/db/prisma.ts`) has been finalized, and no live database connection test has run.**

---

## 1. Create a Neon Account & Project

1. Go to [https://console.neon.tech](https://console.neon.tech) and sign in or create an account.
2. Click **New Project** and configure:
   - **Project Name:** `messmate`
   - **Database Engine:** PostgreSQL (latest stable supported by Neon, e.g. PostgreSQL 16/17)
   - **Region:** Choose the closest available AWS region to Bangladesh — **Asia Pacific (Singapore) — `aws-ap-southeast-1`** is recommended for lowest latency from Dhaka.
3. Create a development database (e.g., `messmate_dev`) or use the default development branch database.

---

## 2. Obtain Pooled & Direct Connection Strings

In the Neon Console → **Connection Details**:

1. **Pooled Connection (`DATABASE_URL`):**
   - Enable **Connection pooling**.
   - Notice the hostname includes **`-pooler`** (e.g., `ep-...-pooler.ap-southeast-1.aws.neon.tech`).
   - Ensure `?sslmode=require` is included.
2. **Direct / Unpooled Connection (`DIRECT_URL`):**
   - Disable **Connection pooling** (or select the direct endpoint).
   - Notice the hostname does **not** include `-pooler`.
   - Ensure `?sslmode=require` is included.

### Why Pooled and Direct URLs Are Not Interchangeable

| Variable | Neon Endpoint | Used By | Why |
| --- | --- | --- | --- |
| `DATABASE_URL` | **Pooled** (`-pooler`, PgBouncer transaction pooling) | Next.js runtime via `@prisma/adapter-pg` + `pg.Pool` | Handles bursty serverless/web connections cleanly without exhausting PostgreSQL max connections. |
| `DIRECT_URL` | **Direct** (unpooled PostgreSQL session) | Prisma CLI (`prisma migrate`, `prisma db push`, `prisma introspect`) via `prisma.config.ts` | Schema migrations and advisory locks require a persistent session, which PgBouncer transaction pooling cannot hold across transactions. |

---

## 3. Configure Local Environment Variables

Copy `.env.example` to `.env` (already excluded by `.gitignore` via `.env*` + `!.env.example`):

```bash
cp .env.example .env
```

Replace the placeholders in your **local `.env` only**:

```env
APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://<user>:<password>@ep-<endpoint>-pooler.ap-southeast-1.aws.neon.tech/<db>?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@ep-<endpoint>.ap-southeast-1.aws.neon.tech/<db>?sslmode=require"
```

### Security Rules
- **Never** commit `.env` or paste real credentials into docs, commits, or source code.
- **Never** prefix database URLs with `NEXT_PUBLIC_`.
- Always require TLS (`?sslmode=require` or `verify-full`).

---

## 4. Already Installed Dependencies & Config

Verified in `package.json`:
- `prisma@7.10.1`
- `@prisma/client@7.10.1`
- `@prisma/adapter-pg@7.10.1`
- `pg@^8.23.1` & `@types/pg@^8.23.1`
- `server-only@^0.0.1`
- `dotenv@^18.0.10`

Existing Prisma 7 files:
- `prisma.config.ts` — Loads `dotenv/config` and sets `datasource.url = process.env.DIRECT_URL || process.env.DATABASE_URL || ''`.
- `prisma/schema.prisma` — Connection-only bootstrap (`generator client` with `provider = "prisma-client"`, `output = "../generated/prisma"`, `datasource db { provider = "postgresql" }`). Contains **zero business tables**.
- `eslint.config.mjs` — Ignores `generated/**`.
- `server/db/config.ts` & `server/db/config.test.ts` — Validates `DATABASE_URL`/`DIRECT_URL`, rejects placeholders, enforces `sslmode=require` on Neon hosts, warns if pooled/direct hosts are swapped, and redacts credentials safely.

---

## 5. Remaining Steps to Complete Before Task 19 (In Google Antigravity)

1. Add real Neon `DATABASE_URL` and `DIRECT_URL` to local `.env`.
2. Run `npx prisma generate` to materialize `./generated/prisma`.
3. Create `server/db/prisma.ts` (starting with `import 'server-only'`) implementing:
   - Lazy `pg.Pool` + `PrismaPg` (`@prisma/adapter-pg`) + `PrismaClient` singleton cached on `globalThis` for Next.js development hot-reload safety.
   - `pool.on('error', ...)` handler so Neon scale-to-zero idle disconnects never crash the Node process.
   - A `checkDatabaseConnection()` helper executing a parameterized `SELECT 1` with sanitized error handling.
4. Run a live connectivity check script (`SELECT 1`, `current_database()`, `version()`) against Neon and confirm PostgreSQL responds cleanly.
5. Proceed to **Task 19: Core Database Schema Design — Multi-Tenant Foundation**.

---

## 6. Common Connection Errors & Solutions

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| `Error: Neon PostgreSQL database is not configured` | `.env` missing or still has `YOUR_NEON_DATABASE_URL` | Copy `.env.example` to `.env` and paste real Neon credentials. |
| `SSL/TLS required` / `no pg_hba.conf entry` | Missing `?sslmode=require` | Append `?sslmode=require` to both `DATABASE_URL` and `DIRECT_URL`. |
| Prisma `migrate` hangs or fails with advisory lock error | `DIRECT_URL` points to `-pooler` host | Switch `DIRECT_URL` to the unpooled Neon host (remove `-pooler`). |
| `Too many clients already` in dev | Creating `new PrismaClient()` on every request/HMR reload | Always import the `globalThis`-cached singleton from `server/db/prisma.ts`. |
| Client Component build error (`server-only`) | Importing `server/db/*` inside a `'use client'` file | Move DB calls into Server Components, Server Actions, or `app/api/v1/*` Route Handlers. |
