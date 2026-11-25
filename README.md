# 🏠 MessMate (মেসমেট)

<p align="center">
  <strong>Smart, Transparent, Multi-Tenant Mess & Shared Living Management SaaS Platform</strong><br>
  <em>Designed for students, bachelors, hostels, shared apartments, boarding houses, and co-living communities.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.4-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Prisma-7.10-2D3748?style=for-the-badge&logo=prisma" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/PostgreSQL%20%7C%20MySQL-Supported-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL & MySQL" />
  <img src="https://img.shields.io/badge/Language-English%20%7C%20বাংলা-emerald?style=for-the-badge" alt="Bilingual" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [1. 🍱 Interactive 30-Day Meal Register Matrix](#1--interactive-30-day-meal-register-matrix)
  - [2. 🛒 Bazar & Shared Expense Tracking](#2--bazar--shared-expense-tracking)
  - [3. ⚖️ Instant Member Balance & Settlement](#3-️-instant-member-balance--settlement)
  - [4. 👥 Resident Directory & Flexible Roles (1+ Roles)](#4--resident-directory--flexible-roles-1-roles)
  - [5. 🛏️ Room, Bed & Rental Management](#5-️-room-bed--rental-management)
  - [6. 📢 Notices, Complaints & Polls](#6--notices-complaints--polls)
  - [7. 🚨 Safety & Bangladesh National Emergency Hotlines](#7--safety--bangladesh-national-emergency-hotlines)
- [Tech Stack](#-tech-stack)
- [Architecture & Folder Structure](#-architecture--folder-structure)
- [Quick Start Guide](#-quick-start-guide)
- [Live Demo & Test Credentials](#-live-demo--test-credentials)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Subscription & Business Model](#-subscription--business-model)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

Shared living and bachelor mess management in Bangladesh has traditionally suffered from:
- **Scattered Paper Diaries & Excel Sheets:** Prone to calculation mistakes, lost records, and mistrust.
- **Unclear Meal-Rate Math:** Debates over dynamic breakfast/lunch/dinner weights and sudden spikes in grocery costs.
- **Bazar Confusion:** Disagreements when multiple members contribute to bazar shopping across different dates.
- **Billing & Settlement Disputes:** Difficulty calculating whether a member receives money back (`পাবে`) or owes the mess (`দিবে`).

**MessMate (মেসমেট)** transforms this chaos into a seamless, automated, and mathematically exact experience. It features full **Bilingual Support (বাংলা ও English)**, Bangladesh-native operational standards (`BDT / ৳` poisha-exact math, `Asia/Dhaka` cutoff time), and multi-tenant isolation.

---

## ✨ Key Features

### 1. 🍱 Interactive 30-Day Meal Register Matrix
- **Spreadsheet-Grade Matrix Grid:** View every day of the month (1 to 30/31) or custom cycles (e.g., 15th to 15th, or 40-day custom periods).
- **Recent-First Display (`⚡ নতুন/আজ আগে`):** Today's and recent days appear directly adjacent to the resident's name, eliminating endless scrolling.
- **Collapsible Columns (`[-]` & `[+]`):**
  - **🖥️ Screen Fit View (Fit on Screen):** Collapses detailed meal slots into a clean summary of recent days, total meals, bazar, and balance without horizontal scrolling!
  - **📑 Full 30-Day Sheet:** Expands breakfast, lunch, and dinner columns for the full month.
- **Dynamic Meal Weighting:** Configure breakfast as half meal (`0.5`), full meal (`1.0`), or custom (`0.75`), with lunch and dinner independently customizable.
- **Interactive Click-to-Edit:** Admins or Meal Managers can click any cell to update meal counts with quick 1-click presets (`Full Meal`, `Lunch + Dinner`, `Breakfast Only`, `OFF`).
- **Zero Bleed-Through Sticky Columns:** Pinned Member Code and Resident Names stay solid and readable with clear shadow borders while scrolling.

### 2. 🛒 Bazar & Shared Expense Tracking
- **Multi-Member Bazar Logging:** Accommodates messes where one manager shops or different members take turns shopping on different days.
- **Digital Receipts & Vouchers:** Attach receipts, item lists, and dates to verify grocery expenses.
- **Dynamic Meal Rate Engine:**
  $$\text{Current Meal Rate (৳)} = \frac{\text{Total Approved Bazar Expenses}}{\text{Total Chargeable Meal Units}}$$
- Automatically recalculated in real time whenever expenses or meals are updated.

### 3. ⚖️ Instant Member Balance & Settlement
Alongside the meal sheet, every member sees their real-time financial balance:
- **`মোট মিল ও ইউনিট`:** Total plates and calculated weighted units.
- **`বাজার খরচ (৳)`:** Total bazar contribution deposited or purchased by the member.
- **`পাবে বা দিবে (৳)` (Net Settlement):**
  - <span style="color:#059669; font-weight:bold;">● পাবে ৳X (Green):</span> Member contributed more than their meal cost; mess owes them.
  - <span style="color:#d97706; font-weight:bold;">● দিবে ৳X (Amber):</span> Member's meal cost exceeds contribution; member owes the mess.
  - <span style="color:#64748b; font-weight:bold;">ব্যালেন্স ৳০:</span> Account fully settled.

### 4. 👥 Resident Directory & Flexible Roles (1+ Roles)
- **Multi-Role Assignment:** Residents can hold multiple simultaneous responsibilities (e.g., `Co-Admin` + `Meal Manager` + `Accountant`).
- **Standardized Roles:**
  - 👑 **Mess Owner / Admin:** Full mess authority, finances, and member management.
  - 🛡️ **Co-Admin / Manager:** Daily operational management.
  - 🍳 **Meal Manager (মিলের দায়িত্ব):** Daily meal entry, meal cutoffs, and meal rate supervision.
  - 💰 **Finance & Accountant (হিসাবের দায়িত্ব):** Bazar vouchers, payments, deposits, and bill settlements.
  - 🤝 **Moderator / Coordinator:** Notices, complaints, and general mess coordination.
  - 👤 **General Member:** View meals, request meal OFF, review individual bills.
- **Emergency Contacts:** Securely stores private guardian contacts for emergencies.

### 5. 🛏️ Room, Bed & Rental Management
- **Room Capacity & Beds:** Configure room numbers, floor levels, bed slots, and monthly seat rents.
- **Amenities Badges:** Attached Bath, Balcony, High-Speed WiFi, Daily Cleaning, Geyser, Study Desk, etc.
- **Public Room Discovery:** Prospective residents can view available seats and submit rental inquiries directly through the public portal.

### 6. 📢 Notices, Complaints & Polls
- **Notice Board:** Pin announcements with priority badges (`High Alert`, `Urgent`, `General Info`).
- **Digital Complaint Box:** Anonymously or openly report plumbing, WiFi, cleanliness, or noise issues with status progression (`Submitted`, `Under Review`, `Resolved`).
- **Community Polls:** Vote on weekly menu choices, feast arrangements, or house rule updates.

### 7. 🚨 Safety & Bangladesh National Emergency Hotlines
- **Verified National Hotlines:** One-tap dialing for National Emergency (`999`), Fire Service (`102`), Health Helpline (`16263`), and Disaster Alert (`1090`).
- **Local Directory:** Mess emergency contacts, nearby hospital numbers, and police station information.

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | High-performance React framework with server components and standalone output |
| **Language** | TypeScript 5.9 | Strictly typed domain models, zero runtime undefined issues |
| **UI Components** | Tailwind CSS v4 & shadcn/ui | Atomic modern design with `@base-ui/react` and custom animation tokens |
| **Icons & Motion** | Lucide React & Motion (Framer) | Intuitive micro-interactions and iconography |
| **Database ORM** | Prisma 7 (`@prisma/adapter-pg`) | Type-safe queries, migration management, and multi-tenant schema |
| **Database** | PostgreSQL (Neon) / MySQL / MariaDB | Supports `postgresql://`, `mysql://`, `mysql2://`, `mariadb://` + zero-config in-memory demo fallback |
| **Timezone & Locale** | `Asia/Dhaka` / `bn-BD` & `en-US` | Bangladesh-standard financial accounting and time cutoff enforcement |
| **Testing** | Node Native Test Runner (`tsx`) | Comprehensive unit and integration test suites |

---

## 📁 Architecture & Folder Structure

```text
messmate/
├── app/                        # Next.js 15 App Router
│   ├── [tenantSlug]/           # Dynamic Multi-Tenant Portal Routes
│   │   ├── admin/              # Mess Admin Dashboard (meals, members, rooms, bazar, etc.)
│   │   └── portal/             # Resident Member Portal
│   ├── api/v1/                 # RESTful APIs (meals, bazar, members, settings, rooms)
│   ├── (marketing)/            # Public marketing pages (about, features, pricing, etc.)
│   └── layout.tsx              # Root Layout with LanguageProvider & Theme
├── components/                 # Reusable UI & Modular Views
│   ├── home/                   # Marketing Hero, Interactive Showcase, Pricing
│   ├── layout/                 # Site Header, Site Footer, Navigation
│   ├── mess-admin/             # Admin modules (FullPeriodMealGridView, RoomDirectoryView, MemberDirectoryView)
│   └── ui/                     # shadcn/ui base primitives (buttons, modals, badges)
├── context/                    # LanguageContext (Instant English ↔ বাংলা toggle)
├── data/                       # Typed marketing datasets and unit test fixtures
├── docs/                       # Architecture specifications and technical handoff blueprints
├── lib/                        # Pure domain math, validators, currency formatting, i18n
├── prisma/
│   ├── schema.prisma           # Multi-tenant Prisma database schema (PostgreSQL / MySQL)
│   └── seed.ts                 # Realistic Bangladesh mess seed data
├── server/                     # Backend domain services & business logic
│   ├── bazar/                  # Bazar expense recording & verification
│   ├── db/                     # Prisma client instance & connection health check
│   ├── meals/                  # Meal register matrix engine & cutoff validation
│   ├── members/                # Member lifecycle & multi-role permissions
│   └── rbac/                   # Role templates and granular permission checks
├── public/                     # Static assets (images, icons, previews)
└── package.json                # Project dependencies & scripts
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** `v20.x` or higher (verified on Node `v22`)
- **Package Manager:** `npm` or `bun`
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/prince2beggar/massmate-.git
cd massmate-

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env

# 4. Generate the Prisma Client
npm run db:generate

# 5. Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Live Demo & Test Credentials

A complete, pre-configured demo mess (**Prince Mess**) is available for immediate testing:

| Role | Email | Password | Access Portal |
|---|---|---|---|
| **Mess Owner / Co-Admin** | `123@gmail.com` | `12345` | `/prince-mess/admin` |
| **Demo Mess Dashboard** | — | — | `http://localhost:3000/prince-mess/admin/meals` |

*Pre-loaded with 11 active residents, realistic bazar shopping receipts, room allocations, and daily meal sheets.*

---

## 🧪 Testing & Quality Assurance

MessMate maintains high standards of automated testing across financial math, cutoff validation, and access control:

```bash
# Run unit test suites (lib, data, and server services)
npx tsx --test server/meals/meal-management.test.ts lib/meal-math.test.ts

# Run strict TypeScript typechecking
npx tsc --noEmit

# Run Next.js production build verification
npm run build
```

---

## 💳 Subscription & Business Model

MessMate implements an honest, transparent **two-tier pricing model**:

1. **Starter Plan:**
   - **7-Day Full Free Trial**
   - **৳99 / month** per mess (all standard features included)
   - *No automatic card deduction without explicit user authorization.*
2. **Customized Business Plan (Contact Us):**
   - Multi-mess operators, university hostels, shared apartments, and commercial co-living facilities.
   - Dedicated support, custom subdomain/branding, and multi-property oversight.

---

## 🤝 Contributing

Contributions, feedback, and issue reports are warmly welcomed!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<p align="center">
  Crafted with ❤️ for students, bachelors, and shared-living communities across Bangladesh.
</p>
