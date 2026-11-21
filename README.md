# MessMate

> **Smart, Transparent, Multi-Tenant Mess & Shared Living Management SaaS Platform**

MessMate is a modern SaaS web platform designed for **students, bachelors, job holders, shared apartments, student hostels, boarding houses, co-living spaces, and multi-property accommodation operators**—with first-class bilingual support (**English & বাংলা**) and Bangladesh-native operational standards (`BDT / ৳`, `Asia/Dhaka` timezone).

---

## 1. Project Overview & Main Objectives

Shared living and mess operations commonly suffer from scattered spreadsheets, unclear meal-rate math, manual bazar logs, payment disputes, and disorganized room availability tracking. MessMate solves this by unifying:

- **Daily Mess Operations:** Members, daily meals, bazar shopping, rent, utilities, and monthly settlements.
- **Financial Transparency:** Clear, auditable monthly billing and exact currency accounting.
- **Room & Seat Discovery:** Organized room/seat rental listings and prospective resident inquiries.
- **Emergency & Safety Readiness:** Quick access to verified Bangladesh national emergency hotlines (`999`, `102`, `16263`), mess-specific contact directories, and private member guardian contacts.
- **Multi-Tenant SaaS Scale:** A shared central platform supporting independent messes (Starter Plan) and multi-property accommodation operators (Customized Business Plan), each with its own Mess Admin Dashboard, Member Portal, and Public Mess Website.

### Subscription & Pricing Model (Established Business Rule)

MessMate follows a simple **two-option subscription model** (defined in `lib/pricing-config.ts`):

1. **Starter Plan:** Exact **7-day free trial**, followed by **৳99/month** for one mess (all standard features). **No automatic payment or automatic renewal without explicit customer consent.**
2. **Customized Business Plan:** **Custom Pricing — Contact Us**, designed for multi-mess, student/bachelor hostels, shared apartments, boarding houses, co-living spaces, and multi-property operators.

---

## 2. Technology Stack

### Currently Installed & Active (Public Website MVP + DB Foundation)

| Layer | Technology | Version (Verified from `package.json`) |
| --- | --- | --- |
| **Framework** | Next.js (App Router, `output: 'standalone'`) | `15.4.9` |
| **UI Runtime** | React & React DOM | `19.2.1` |
| **Language** | TypeScript (`strict: true`) | `5.9.3` |
| **Styling** | Tailwind CSS v4 + `@tailwindcss/postcss` + `tw-animate-css` | `4.1.11` |
| **Component Primitives** | shadcn/ui (`style: base-nova`, `@base-ui/react`) | `4.23.0` / `1.9.0` |
| **Icons & Motion** | `lucide-react`, `motion` (`motion/react`) | `0.553.0` / `12.23.24` |
| **Database Tooling (Partially Prepared)** | `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `dotenv`, `server-only` | Prisma `7.10.1`, `pg ^8.23.1` |
| **Testing** | Node built-in `node:test` + `tsx` | 46 passing unit tests |

### Planned Backend Stack (See `docs/backend-architecture.md`)

- **Database:** Neon PostgreSQL (shared schema + `tenant_id` + PostgreSQL Row-Level Security)
- **ORM:** Prisma 7 (`@prisma/adapter-pg`)
- **Validation:** Zod (to be installed when backend APIs begin)
- **Authentication:** Better Auth recommended (pending final approval vs Auth.js v5)
- **File Storage:** S3-compatible private object storage (Cloudflare R2 or AWS S3)
- **Timezone:** `Asia/Dhaka` (`UTC+06:00`)

---

## 3. Main Features (Current Public Website MVP)

- **13-Section Responsive Homepage (`/`):** Sticky Navigation (`SiteHeader`), Hero with Interactive Product Preview, Trust Indicators, 8-Module Features Overview with detail drawer/modal, 4-Step How It Works, Interactive Demo Room Rental Showcase (with search/filter & inquiry modal), Two-Option Subscription & Pricing Section (with Custom Business Plan inquiry form), Emergency & Safety Section (verified Bangladesh hotlines + DEMO mess directory + safety guides), About Us, Contact Section (validated preview form), Categorized Interactive FAQ Accordion (12 Q&As), Final CTA, and Responsive Footer (`SiteFooter`).
- **Dedicated Public Pages:** `/about`, `/features`, `/how-it-works`, `/room-rental`, `/pricing`, `/emergency-safety`, `/faq`, `/contact`, `/privacy-policy`, `/terms`, `/refund-policy`, `/design-system`.
- **Upcoming Portal Placeholders:** `/mess-admin-login` and `/member-portal` (honest placeholders awaiting authentication & backend implementation).
- **Full Bilingual Support:** Instant English ↔ বাংলা switching persisted via `LanguageContext`.
- **Cross-Device Optimization:** Verified at `320px`, `375px`, `390px`, `430px`, `768px`, `1024px`, `1280px`, `1440px`, and `1920px` in both English and Bangla with zero horizontal overflow.

---

## 4. Current Project Structure

```text
messmate/
├── app/                        # Next.js 15 App Router pages (15 routes) + layout.tsx + globals.css
├── components/                 # Modular React components (home/, layout/, pricing/, rental/, safety/, ui/, etc.)
├── context/                    # LanguageContext.tsx (English / বাংলা state)
├── data/                       # Typed static marketing, FAQ, safety, footer & demo datasets + unit tests
├── docs/                       # Architecture & technical handoff documentation
│   ├── backend-architecture.md # Full Task 16 backend & multi-tenant architecture blueprint
│   ├── neon-database-setup.md  # Neon PostgreSQL + Prisma 7 setup & connection handoff guide
│   ├── project-overview.md     # Product scope, target users & business model
│   └── database-plan.md        # Task 19 multi-tenant database schema planning reference
├── hooks/                      # Custom hooks (use-active-section.ts, use-mobile.ts)
├── lib/                        # Pure domain helpers, i18n dictionaries, validators & unit tests
├── prisma/
│   └── schema.prisma           # Connection-only Prisma 7 bootstrap (ZERO business tables yet)
├── public/images/              # Static local marketing & demo room images
├── server/
│   └── db/                     # Pure Neon env/URL validator (config.ts + config.test.ts)
├── types/                      # Shared TypeScript interfaces
├── prisma.config.ts            # Prisma 7 CLI configuration (DIRECT_URL / DATABASE_URL)
├── next.config.ts              # Next.js 15 configuration
├── tsconfig.json               # Strict TypeScript configuration (@/* -> ./*)
├── eslint.config.mjs           # ESLint flat config (ignores generated/**)
├── components.json             # shadcn/ui configuration (base-nova, @base-ui/react)
├── .env.example                # Safe environment variable template (no secrets)
├── .gitignore                  # Excludes node_modules, .next, .env* (except .env.example)
├── package.json                # Dependencies & scripts
├── README.md                   # This file
├── ANTIGRAVITY_GUIDE.md        # Handoff & continuation instructions for Google Antigravity
├── PROJECT_STATUS.md           # Honest source-verified task & implementation status
└── DEVELOPMENT_ROADMAP.md      # Complete 7-phase, 50-task SaaS development roadmap
```

---

## 5. Installation & Local Setup

### Prerequisites

- **Node.js** `20+` (verified on Node `v22`)
- **Package Manager:** `npm` or `bun` (`bun.lock` is included)

### Step-by-Step Setup

```bash
# 1. Extract the project archive and enter the project folder
cd messmate

# 2. Install dependencies
npm install
# or: bun install

# 3. Create your local environment file (never commit .env)
cp .env.example .env

# 4. Generate the Prisma 7 client from the bootstrap schema
npx prisma generate

# 5. Start the development server (runs on http://localhost:3000)
npm run dev
```

---

## 6. Development & Verification Commands

```bash
npm run dev          # Start Next.js development server on port 3000
npm run build        # Production build (runs Next.js + TypeScript check)
npm run start        # Start production build locally
npm run lint         # Run ESLint across the repository
npx tsc --noEmit     # Standalone strict TypeScript check
npx prisma generate  # Generate Prisma 7 client into ./generated/prisma

# Run all 46 unit tests (lib/, data/, server/db/)
npx --yes tsx --test $(find lib data server -name '*.test.ts' | sort)
```

---

## 7. Environment Setup

Copy `.env.example` to `.env` and populate real values locally (never commit `.env` or prefix database credentials with `NEXT_PUBLIC_`):

```env
APP_URL="http://localhost:3000"
DATABASE_URL="YOUR_NEON_DATABASE_URL"
DIRECT_URL="YOUR_NEON_DIRECT_DATABASE_URL"
```

See `docs/neon-database-setup.md` for full instructions on creating a Neon PostgreSQL project and obtaining pooled vs. direct connection strings.

---

## 8. Database Setup & Current Development Status

| Area | Current Status |
| --- | --- |
| **Public Website MVP (Tasks 1–14)** | **Completed & Verified** across all 13 homepage sections and 15 routes (EN & বাংলা). |
| **Backend Architecture Blueprint (Task 16)** | **Completed** (`docs/backend-architecture.md`). |
| **Neon PostgreSQL & Prisma Bootstrap (Task 17–18)** | **Partially Completed** — Prisma `7.10.1`, `@prisma/adapter-pg`, `pg`, `prisma.config.ts`, connection-only `prisma/schema.prisma`, `.env.example`, and `server/db/config.ts` (+ 8 unit tests) are in place. Real Neon credentials in `.env`, the singleton Prisma runtime client (`server/db/prisma.ts`), and live Neon connection verification are still pending. |
| **Business Tables, Auth, APIs, Dashboards** | **Not Implemented Yet** — zero business tables, zero `/api/*` routes, no authentication. |

For exact task-by-task findings, see **`PROJECT_STATUS.md`**.  
For AI agent continuation instructions in Google Antigravity, read **`ANTIGRAVITY_GUIDE.md`** first.
