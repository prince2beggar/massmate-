# Welcome to MessMate — Start Here

This package is a clean, production-ready handoff of the **MessMate** SaaS project, organized so any developer, teammate, or AI coding agent (**Google Antigravity**) can understand the entire project in under 2 minutes.

---

## 1. Run the Project Locally (4 Steps)

```bash
# 1. Install dependencies (Node.js 20+ required)
npm install

# 2. Copy the safe environment template (never commit .env)
cp .env.example .env

# 3. Generate the Prisma 7 client
npx prisma generate

# 4. Start the development server at http://localhost:3000
npm run dev
```

Verify everything passes before making changes:

```bash
npx tsc --noEmit                                                    # TypeScript check
npm run lint                                                        # ESLint check
npm run build                                                       # Next.js production build
npx --yes tsx --test $(find lib data server -name '*.test.ts' | sort) # 46 unit tests
```

---

## 2. Recommended Reading Order

| Order | File | Purpose |
| :---: | --- | --- |
| **1** | `README.md` | Project overview, tech stack, setup & development commands |
| **2** | `PROJECT_STATUS.md` | Exact source-verified status (what is done, partial, placeholder, or pending) |
| **3** | `ANTIGRAVITY_GUIDE.md` | Strict rules, design/business invariants & 12-step continuation guide for Google Antigravity |
| **4** | `DEVELOPMENT_ROADMAP.md` | Full 7-phase SaaS roadmap (Tasks 1–50) |
| **5** | `docs/INDEX.md` | Architecture, Neon PostgreSQL setup & Task 19 database planning guides |

---

## 3. Clean Folder Map (At a Glance)

```text
messmate/
├── app/                     # Next.js 15 App Router — all 15 public & placeholder pages
├── components/              # Cleanly grouped React UI components
│   ├── home/                # 13 homepage sections (Hero, Features, Pricing, Safety, FAQ, etc.)
│   ├── layout/              # SiteHeader, SiteFooter, PageShell, MotionProvider
│   ├── pricing/             # Starter (7-day trial -> ৳99/mo) & Custom Business Plan UI
│   ├── rental/              # Room Rental Explorer, cards & inquiry modal
│   ├── safety/              # Verified BD emergency hotlines & DEMO mess directory
│   ├── contact/             # Validated contact preview forms
│   └── ui/                  # Shared shadcn/ui (@base-ui/react) primitives
├── context/                 # LanguageContext (English ↔ বাংলা instant toggle)
├── data/                    # Typed static marketing, FAQ, safety, footer & demo datasets
├── docs/                    # Deep technical docs (Backend Architecture, Neon Setup, DB Plan)
├── hooks/                   # Custom hooks (scrollspy, responsive helpers)
├── lib/                     # Pure TypeScript helpers, i18n dictionaries, validators & unit tests
├── prisma/                  # Connection-only Prisma 7 bootstrap schema (no business tables yet)
├── public/images/           # Optimized static images used across the website
├── server/db/               # Pure Neon PostgreSQL URL/env validator + unit tests
└── types/                   # Shared TypeScript interfaces
```

---

## 4. What Is Ready vs. What Comes Next

- **Ready Today:** Complete responsive bilingual (English & বাংলা) Public Website MVP across 15 routes (`320px–1920px+`), 46 passing unit tests, strict TypeScript + ESLint + Next.js build passing, full backend architecture blueprint (`docs/backend-architecture.md`), and Prisma 7.10.1 bootstrap config.
- **Next Steps in Google Antigravity:**
  1. Add your real Neon PostgreSQL `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) to local `.env` (see `docs/neon-database-setup.md`).
  2. Complete the server-only singleton Prisma client (`server/db/prisma.ts`) and live `SELECT 1` connection check.
  3. Confirm the 5 architectural approvals in `ANTIGRAVITY_GUIDE.md` and proceed to **Task 19: Core Database Schema Design — Multi-Tenant Foundation**.
