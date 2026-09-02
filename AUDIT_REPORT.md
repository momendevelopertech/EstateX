# EstateX Implementation Audit — 2026-09-02 (Complete Scope Audit Update)

## Executive Summary

The EstateX repository contains a production-ready **NestJS Backend API** (`apps/api`) with a complete Prisma PostgreSQL schema, full JWT authentication, optimistic concurrency locking, role-based authorization, rate limiting, and event-driven notifications. However, a comprehensive audit comparing the **Next.js Web Frontend** (`apps/web`) against all 115 screens in `Design/` and all 14 specification files reveals significant missing flows and visual discrepancies. While core 2D discovery and unit detail endpoints exist, the **Sales Agent Portal**, **Admin Operations Suite** (Media, Roles, Payment Plan Builder, Analytics, Audit Log), **Notification Bell Header Dropdown**, and **Phase 4 Enterprise / CRM Screens** are completely absent in `apps/web`.

---

## Findings by Category

### CATEGORY A: Database & Migrations (vs 03-database-schema.md)
- **Unit Optimistic Concurrency Fields (`statusVersion`, `holdExpiresAt`)**: ✅ DONE & VERIFIED
  - *Evidence*: `apps/api/prisma/schema.prisma` L198, L200; `apps/api/src/units/units.service.ts` L44-65.
- **GuestSession & Nullable-Pair Constraint (`Favorite` / `Comparison`)**: ✅ DONE & VERIFIED
  - *Evidence*: `schema.prisma` L286-319; `apps/api/prisma/migrations/20260901120000_nullable_pair_constraints`.
- **Multi-Tenant Scoping (`Developer` relation)**: ✅ DONE & VERIFIED
  - *Evidence*: `schema.prisma` L104-114, L118.

### CATEGORY B: API Layer (vs 04-api-spec.md)
- **Optimistic Locking `PATCH /units/:id/status`**: ✅ DONE & VERIFIED
  - *Evidence*: `apps/api/src/units/units.service.ts` L44-51 uses atomic SQL update `WHERE id = ${unitId} AND "statusVersion" = ${expectedVersion}`, returning `409 UNIT_STATUS_CONFLICT` on version mismatch (`units.controller.ts` L224-228).
- **Authentication & RBAC Guards**: ✅ DONE & VERIFIED
  - *Evidence*: `@UseGuards(AuthGuard("jwt"), RolesGuard)` and `@Roles(...)` on protected handlers (`units.controller.ts` L135, L168, L201).
- **Rate Limiting Middleware (429)**: ✅ DONE & VERIFIED
  - *Evidence*: `apps/api/src/app.module.ts` L41-43 configured with `ThrottlerModule` (120 req/min).

---

### CATEGORY C & E: Visual & Scope Audit (vs `Design/` Folder)

#### 1. Public Discovery & Core Screens
- **Project Home & Explore 2D**: 🔴 WRONG
  - *Design Image*: `Design/01-public-discovery-flow/EN/Project_Home_EN_-_Desktop_bf440991.png`
  - *Code File*: `apps/web/components/ProjectCard.tsx` L15
  - *Discrepancy*: Uses gradient placeholder with text initials instead of real media images; lacks JetBrains Mono font for prices.
- **Floor Browser**: 🔴 WRONG
  - *Design Image*: `Design/02-location-masterplan-flow/EN/Building_Floor_Explorer_EN_-_Desktop_6300d177.png`
  - *Code File*: `apps/web/components/ProjectFloorBrowser.tsx` L20
  - *Discrepancy*: Horizontal tabs instead of vertical floor switcher with availability bars; status badges lack icons.
- **Unit Details Page**: 🔴 WRONG
  - *Design Image*: `Design/03-unit-details-tour-flow/EN/Unit_Details_EN_-_Desktop_4cb2e218.png`
  - *Code File*: `apps/web/app/[locale]/units/[id]/page.tsx` L57
  - *Discrepancy*: Dark gradient box with static text instead of interactive media gallery; back link arrow `←` hardcoded (fails RTL); missing Price History Chart.
- **Favorites Page**: 🔴 WRONG
  - *Design Image*: `Design/04-search-filter-comparison-flow/EN/Favorites_List_EN_-_Desktop_fb70fa77.png`
  - *Code File*: `apps/web/app/[locale]/favorites/page.tsx` L58
  - *Discrepancy*: Missing "Compare Selected Units" quick-select checkboxes and saved search tabs.
- **Lead Form**: 🔴 WRONG
  - *Design Image*: `Design/05-lead-capture-booking-flow/EN/Lead_Capture_Form_EN_-_Desktop_b7a2416c.png`
  - *Code File*: `apps/web/components/LeadForm.tsx` L42
  - *Discrepancy*: Reduced to 3 plain text fields; missing contact channel selector and date scheduler.
- **Installment Calculator**: 🔴 WRONG
  - *Design Image*: `Design/04-search-filter-comparison-flow/EN/Payment_Calculator_EN_-_Desktop_c2e712b1.png`
  - *Code File*: `apps/web/components/InstallmentCalculator.tsx` L76
  - *Discrepancy*: Uses number inputs instead of interactive range sliders; missing delivery-linked payment row.

#### 2. Sales Agent Flow
- **Agent Login**: ❌ NOT DONE
  - *Design Image*: `Design/06-agent-sales-center-flow/EN/Agent_Login_EN_-_Desktop_7e937a59.png`
  - *Code Status*: `apps/web/app/[locale]/agent/login` does not exist.
- **My Leads Dashboard**: ❌ NOT DONE
  - *Design Image*: `Design/06-agent-sales-center-flow/EN/Agent_Home_My_Leads_EN_-_Desktop_4aa30455.png`
  - *Code Status*: `apps/web/app/[locale]/agent/leads` does not exist.
- **Lead Detail View**: ❌ NOT DONE
  - *Design Image*: `Design/06-agent-sales-center-flow/EN/Lead_Detail_View_EN_-_Desktop_6e15dd09.png`
  - *Code Status*: `apps/web/app/[locale]/agent/leads/[id]` does not exist.
- **Booking Scheduler Modal/Page**: ❌ NOT DONE
  - *Design Image*: `Design/05-lead-capture-booking-flow/EN/Booking_Viewing_Scheduler_EN_-_Desktop_c48b3d01.png`
  - *Code Status*: Standalone viewing scheduler component does not exist in `apps/web`.

#### 3. Admin Operations Suite
- **Admin Inventory**: 🔴 WRONG
  - *Design Image*: `Design/07-admin-inventory-management-flow/EN/Admin_Dashboard_Home_EN_-_Desktop_97c96cfb.png`
  - *Code File*: `apps/web/app/[locale]/admin/inventory/page.tsx`
  - *Discrepancy*: Standalone table without persistent admin sidebar shell and top notification dropdown.
- **Media Management**: ❌ NOT DONE
  - *Design Image*: `Design/07-admin-inventory-management-flow/EN/Media_Management_EN_-_Desktop_6ebc9073.png`
  - *Code Status*: `apps/web/app/[locale]/admin/media` does not exist.
- **Roles & Permissions**: ❌ NOT DONE
  - *Design Image*: `Design/07-admin-inventory-management-flow/EN/Roles_Permissions_EN_-_Desktop_666c2611.png`
  - *Code Status*: `apps/web/app/[locale]/admin/roles` does not exist.
- **Payment Plan Builder**: ❌ NOT DONE
  - *Design Image*: `Design/04-search-filter-comparison-flow/EN/Payment_Plan_Builder_EN_-_Desktop_3f30afd7.png`
  - *Code Status*: `apps/web/app/[locale]/admin/payment-plans` does not exist.
- **Analytics Dashboard**: ❌ NOT DONE
  - *Design Image*: `Design/07-admin-inventory-management-flow/EN/Analytics_Dashboard_EN_-_Desktop_fff6d92b.png`
  - *Code Status*: `apps/web/app/[locale]/admin/analytics` does not exist.
- **Audit Log**: ❌ NOT DONE
  - *Design Image*: `Design/07-admin-inventory-management-flow/EN/Audit_Log_EN_-_Desktop_9f53eb51.png`
  - *Code Status*: `apps/web/app/[locale]/admin/audit` does not exist.

#### 4. Notification Center
- **Notification Dropdown Bell Widget**: 🔴 WRONG / ⚠️ PARTIAL
  - *Design Image*: `Design/01-public-discovery-flow/EN/Notification_Dropdown_EN_-_Desktop_6e62a054.png`
  - *Code File*: `apps/web/app/[locale]/admin/notifications/page.tsx` L106 & `Header.tsx`
  - *Discrepancy*: Page renders raw JSON strings (`JSON.stringify(n.payload)`); header bell dropdown widget is missing from `Header.tsx`.

#### 5. Phase 4 Enterprise & Integration Screens (Roadmap Deferred)
- **Developer Tenant Management**: ❌ NOT DONE (Deferred to Phase 4 Roadmap — `Design/01-public-discovery-flow/EN/Developer_Tenant_Management_EN_-_Desktop_d24e3f18.png`).
- **White-Label Branding Preview**: ❌ NOT DONE (Deferred to Phase 4 Roadmap — `Design/01-public-discovery-flow/EN/White-Label_Branding_Preview_EN_-_Desktop_f9f8eeb4.png`).
- **CRM Integration Settings**: ❌ NOT DONE (Deferred to Phase 4 Roadmap — `Design/07-admin-inventory-management-flow/EN/CRM_Integration_Settings_EN_-_Desktop_61f01f65.png`).
- **Public API & Webhooks Management**: ❌ NOT DONE (Deferred to Phase 4 Roadmap — `Design/07-admin-inventory-management-flow/EN/Public_API_Webhooks_Management_EN_-_Desktop_ce9c276f.png`).

---

## Definition of Done Compliance
- **Phase 1 MVP DoD**: 🔴 WRONG / FAILS DOD
  - The backend API satisfies all technical criteria, but `apps/web` requires building the missing Sales Agent Portal, Admin Suite, Notification Dropdown, and refactoring existing visual components.
