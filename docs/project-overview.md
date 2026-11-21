# MessMate — Project Overview

## Product Vision

MessMate brings everyday mess and shared-living operations into one organized, transparent, multi-tenant SaaS platform—replacing scattered notebooks, spreadsheets, and chat threads with structured workflows.

## Target Users & Property Types

MessMate is designed for:
1. Students
2. Bachelors
3. Job holders
4. Shared apartments
5. Student hostels
6. Accommodation businesses (boarding houses, staff housing, co-living spaces)
7. Multi-property operators

## Core Problems Solved

- Disorganized daily meal tracking and unclear meal-rate calculations
- Confusing shared bazar expenses and utility bill splits
- Manual rent tracking, previous dues, and payment disputes
- Scattered room/seat availability and prospective resident inquiries
- Fragmented resident notices and maintenance complaints
- Hard-to-find emergency numbers and poorly scoped contact privacy

## Platform Surfaces (Target Multi-Tenant SaaS)

1. **MessMate Public Website** *(MVP Completed)* — Bilingual (English & বাংলা) marketing website, feature explorer, demo room rental showcase, pricing & custom inquiry previews, safety directory, FAQ, and contact workflows.
2. **Platform Super Admin** *(Planned — Phase 3)* — Global SaaS tenant governance, manual billing/contract management, custom domain approvals, and audit oversight.
3. **Mess Admin Dashboard** *(Planned — Phase 4)* — Tenant workspace for managing members, rooms, meals, bazar, rent/utilities, immutable financial ledger, notices, and public website settings.
4. **Member Portal** *(Planned — Phase 5)* — Resident self-service portal for personal meals, monthly bills, payment receipts, notices, complaints, and private family emergency contacts.
5. **Public Mess Website** *(Planned — Phase 6)* — Per-tenant customizable public website on `{slug}.messmate.app` or a verified custom domain.

## Established Business & Content Rules

- **Subscription Model (`lib/pricing-config.ts`):**
  - **Starter Plan:** Exact 7-day free trial → `৳99/month` for one mess; **no automatic payment or automatic renewal without explicit customer consent**.
  - **Customized Business Plan:** Custom Pricing (`Contact Us`) for multi-mess, hostel, and multi-property operators.
- **Locale & Regional Standards:** English (`en`) and Bangla (`bn`), currency in `BDT (৳)`, operational timezone `Asia/Dhaka` (`UTC+06:00`).
- **Truthfulness Standard:** Zero fake user counts or invented contact details; explicit `DEMO DATA` badges on sample rentals and sample mess directories; verified Bangladesh national emergency numbers (`999`, `102`, `16263`) with clear verification notes.
