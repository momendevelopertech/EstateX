# EstateX Fixes & Implementation Backlog

This backlog outlines atomic, verifiable tasks to bring `apps/web` into 100% visual and functional alignment with the specification (`01-overview.md` through `14-antigravity-execution-prompt.md`) and the 115 design screens in `design/`.

---

## 🔴 HIGH PRIORITY VISUAL & COMPONENT FIXES (WRONG IMPLEMENTATIONS)

### TASK-001: Refactor ProjectCard Component Media & Typography
**Traces to:** FR-01, FR-08, `design/01-public-discovery-flow/EN/Project_Home_EN_-_Desktop_bf440991.png`
**Status found:** 🔴 WRONG (`ProjectCard.tsx` uses fallback gradient box with text initials instead of real media image, misses JetBrains Mono font for prices, and status badges lack icon indicators)
**What to do:**
Replace gradient box in `apps/web/components/ProjectCard.tsx` with actual image component rendering `project.heroImageUrl`. Add JetBrains Mono font styling for pricing (`{formatPrice(...)}`). Update StatusBadge to include WCAG-compliant status icons (checkmark for available, clock for reserved, cross for sold).
**Acceptance check:**
Inspect home page `http://localhost:3000/en`, verify project cards render real hero thumbnails, status icons, and Mono font pricing matching `design/01-public-discovery-flow/EN/Project_Home_EN_-_Desktop_bf440991.png`.

---

### TASK-002: Refactor ProjectFloorBrowser & StatusBadge Components
**Traces to:** FR-08, FR-12, `design/02-location-masterplan-flow/EN/Building_Floor_Explorer_EN_-_Desktop_6300d177.png`
**Status found:** 🔴 WRONG (`ProjectFloorBrowser.tsx` uses horizontal text tabs instead of vertical floor switcher with availability bars, and status badges lack icons)
**What to do:**
Update `apps/web/components/ProjectFloorBrowser.tsx` to render a vertical floor selector panel showing unit availability progress bars per floor. Add status icons to `StatusBadge.tsx`.
**Acceptance check:**
Open `http://localhost:3000/en/projects/<slug>`, verify floor switcher renders vertical navigator with availability bars matching `design/02-location-masterplan-flow/EN/Building_Floor_Explorer_EN_-_Desktop_6300d177.png`.

---

### TASK-003: Refactor Unit Details Page Media Header & RTL Back Link
**Traces to:** FR-15, FR-17, FR-46, `design/03-unit-details-tour-flow/EN/Unit_Details_EN_-_Desktop_4cb2e218.png`
**Status found:** 🔴 WRONG (`unit/[id]/page.tsx` renders dark gradient box with text number, hardcoded LTR `←` arrow, and lacks price history chart widget)
**What to do:**
Update `apps/web/app/[locale]/units/[id]/page.tsx`:
1. Replace placeholder gradient box with interactive image gallery & floorplan viewer.
2. Replace hardcoded `←` arrow with dynamic locale-aware arrow icon (flips to `→` in RTL).
3. Add Price History Timeline Widget (FR-17a).
**Acceptance check:**
Navigate to `http://localhost:3000/ar/units/<id>`, verify back link arrow flips to `→` and floorplan gallery loads matching `design/03-unit-details-tour-flow/EN/Unit_Details_EN_-_Desktop_4cb2e218.png`.

---

### TASK-004: Refactor InstallmentCalculator to Use Interactive Range Sliders
**Traces to:** FR-54, `design/04-search-filter-comparison-flow/EN/Payment_Calculator_EN_-_Desktop_c2e712b1.png`
**Status found:** 🔴 WRONG (`InstallmentCalculator.tsx` uses text inputs instead of range sliders, missing delivery-linked payment row)
**What to do:**
Update `apps/web/components/InstallmentCalculator.tsx` to use visual range sliders for Down Payment % (10%-90%) and Duration (12-120 months). Add delivery-linked payment percentage breakdown row.
**Acceptance check:**
Open unit page, drag down payment slider, verify instant recalculation matching `design/04-search-filter-comparison-flow/EN/Payment_Calculator_EN_-_Desktop_c2e712b1.png`.

---

### TASK-005: Enhance LeadForm Component with Preferred Channel & Date Scheduler
**Traces to:** FR-35, FR-59, `design/01-public-discovery-flow/EN/Lead_Capture_Form_EN_-_Desktop_b7a2416c.png`
**Status found:** 🔴 WRONG (`LeadForm.tsx` has 3 basic text fields only, missing contact method selector and date picker)
**What to do:**
Update `apps/web/components/LeadForm.tsx` to include Preferred Contact Method radio group (WhatsApp / Call / Email) and Viewing Date/Time picker.
**Acceptance check:**
Submit lead form on unit page, verify contact method and viewing date are sent to API matching `design/01-public-discovery-flow/EN/Lead_Capture_Form_EN_-_Desktop_b7a2416c.png`.

---

### TASK-006: Add Notification Header Dropdown Bell Widget
**Traces to:** FR-57, FR-58, `design/01-public-discovery-flow/EN/Notification_Dropdown_EN_-_Desktop_6e62a054.png`
**Status found:** 🔴 WRONG (`notifications/page.tsx` renders JSON strings; `Header.tsx` lacks notification bell dropdown widget)
**What to do:**
Create `apps/web/components/NotificationDropdown.tsx` and integrate bell icon into `Header.tsx` showing unread badge count and formatted notification list.
**Acceptance check:**
Click notification bell in Header, verify dropdown renders formatted alerts matching `design/01-public-discovery-flow/EN/Notification_Dropdown_EN_-_Desktop_6e62a054.png`.

---

## ❌ MISSING SALES AGENT & BOOKING FLOW TASKS

### TASK-007: Build Sales Agent Login Page
**Traces to:** FR-40, `design/06-agent-sales-center-flow/EN/Agent_Login_EN_-_Desktop_7e937a59.png`
**Status found:** ❌ NOT DONE (`apps/web/app/[locale]/agent/login/page.tsx` missing)
**What to do:**
Create `apps/web/app/[locale]/agent/login/page.tsx` with dedicated agent authentication form and redirect to `/agent/leads`.
**Acceptance check:**
Navigate to `http://localhost:3000/en/agent/login`, verify form renders matching `design/06-agent-sales-center-flow/EN/Agent_Login_EN_-_Desktop_7e937a59.png`.

---

### TASK-008: Build Sales Agent My Leads Dashboard Page
**Traces to:** FR-36, FR-57, `design/06-agent-sales-center-flow/EN/Agent_Home_My_Leads_EN_-_Desktop_4aa30455.png`
**Status found:** ❌ NOT DONE (`apps/web/app/[locale]/agent/leads/page.tsx` missing)
**What to do:**
Create `apps/web/app/[locale]/agent/leads/page.tsx` displaying assigned leads table, lead status filters, and response time metrics.
**Acceptance check:**
Navigate to `http://localhost:3000/en/agent/leads`, verify lead table renders matching `design/06-agent-sales-center-flow/EN/Agent_Home_My_Leads_EN_-_Desktop_4aa30455.png`.

---

### TASK-009: Build Agent Lead Detail & History Inspection View
**Traces to:** FR-36, `design/06-agent-sales-center-flow/EN/Lead_Detail_View_EN_-_Desktop_6e15dd09.png`
**Status found:** ❌ NOT DONE (`apps/web/app/[locale]/agent/leads/[id]/page.tsx` missing)
**What to do:**
Create `apps/web/app/[locale]/agent/leads/[id]/page.tsx` displaying buyer interaction history (units viewed, compared, time spent, budget, notes).
**Acceptance check:**
Navigate to `http://localhost:3000/en/agent/leads/<id>`, verify customer activity timeline renders matching `design/06-agent-sales-center-flow/EN/Lead_Detail_View_EN_-_Desktop_6e15dd09.png`.

---

### TASK-017: Build Standalone Booking & Viewing Scheduler Component/Modal
**Traces to:** FR-35, FR-59, `design/05-lead-capture-booking-flow/EN/Booking_Viewing_Scheduler_EN_-_Desktop_c48b3d01.png`
**Status found:** ❌ NOT DONE (Standalone viewing appointment scheduler component/modal missing in `apps/web`)
**What to do:**
Create `apps/web/components/BookingSchedulerModal.tsx` rendering an interactive calendar date/time slot picker, unit selection summary, contact mode selection, and appointment confirmation workflow.
**Acceptance check:**
Click "Schedule Viewing" on unit details or project page, verify modal opens with date/time picker matching `design/05-lead-capture-booking-flow/EN/Booking_Viewing_Scheduler_EN_-_Desktop_c48b3d01.png`.

---

## ❌ MISSING ADMIN OPERATIONS SUITE TASKS

### TASK-010: Build Admin Media Management Gallery Screen
**Traces to:** FR-44, `design/07-admin-inventory-management-flow/EN/Media_Management_EN_-_Desktop_6ebc9073.png`
**Status found:** ❌ NOT DONE (`apps/web/app/[locale]/admin/media/page.tsx` missing)
**What to do:**
Create `apps/web/app/[locale]/admin/media/page.tsx` for batch media upload, 360° tour asset tagging, and re-ordering gallery.
**Acceptance check:**
Navigate to `http://localhost:3000/en/admin/media`, verify media grid renders matching `design/07-admin-inventory-management-flow/EN/Media_Management_EN_-_Desktop_6ebc9073.png`.

---

### TASK-011: Build Admin Roles & Permissions Management Screen
**Traces to:** FR-45, `design/07-admin-inventory-management-flow/EN/Roles_Permissions_EN_-_Desktop_666c2611.png`
**Status found:** ❌ NOT DONE (`apps/web/app/[locale]/admin/roles/page.tsx` missing)
**What to do:**
Create `apps/web/app/[locale]/admin/roles/page.tsx` for defining role permission matrices (Super Admin, Admin, Sales Manager, Sales Agent, Content Manager).
**Acceptance check:**
Navigate to `http://localhost:3000/en/admin/roles`, verify matrix table renders matching `design/07-admin-inventory-management-flow/EN/Roles_Permissions_EN_-_Desktop_666c2611.png`.

---

### TASK-012: Build Admin Payment Plan Template Builder Screen
**Traces to:** FR-45a, `design/04-search-filter-comparison-flow/EN/Payment_Plan_Builder_EN_-_Desktop_3f30afd7.png`
**Status found:** ❌ NOT DONE (`apps/web/app/[locale]/admin/payment-plans/page.tsx` missing)
**What to do:**
Create `apps/web/app/[locale]/admin/payment-plans/page.tsx` allowing admins to create/attach payment plan templates to projects and units.
**Acceptance check:**
Navigate to `http://localhost:3000/en/admin/payment-plans`, verify template builder form renders matching `design/04-search-filter-comparison-flow/EN/Payment_Plan_Builder_EN_-_Desktop_3f30afd7.png`.

---

### TASK-013: Build Admin Analytics Dashboard Screen
**Traces to:** FR-38, FR-39, FR-39a, `design/07-admin-inventory-management-flow/EN/Analytics_Dashboard_EN_-_Desktop_fff6d92b.png`
**Status found:** ❌ NOT DONE (`apps/web/app/[locale]/admin/analytics/page.tsx` missing)
**What to do:**
Create `apps/web/app/[locale]/admin/analytics/page.tsx` displaying KPI metrics cards, project interaction charts, and conversion funnels.
**Acceptance check:**
Navigate to `http://localhost:3000/en/admin/analytics`, verify charts and KPI cards render matching `design/07-admin-inventory-management-flow/EN/Analytics_Dashboard_EN_-_Desktop_fff6d92b.png`.

---

### TASK-014: Build Admin Audit Log Screen
**Traces to:** FR-42, `design/07-admin-inventory-management-flow/EN/Audit_Log_EN_-_Desktop_9f53eb51.png`
**Status found:** ❌ NOT DONE (`apps/web/app/[locale]/admin/audit/page.tsx` missing)
**What to do:**
Create `apps/web/app/[locale]/admin/audit/page.tsx` displaying system audit logs table with search and action filters.
**Acceptance check:**
Navigate to `http://localhost:3000/en/admin/audit`, verify log table renders matching `design/07-admin-inventory-management-flow/EN/Audit_Log_EN_-_Desktop_9f53eb51.png`.

---

## ❌ PHASE 4 ENTERPRISE & INTEGRATION TASKS (ROADMAP DEFERRED)

### TASK-015: Build Multi-tenant Developer Management & White-Label Preview
**Traces to:** FR-50, `design/01-public-discovery-flow/EN/Developer_Tenant_Management_EN_-_Desktop_d24e3f18.png`
**Status found:** ❌ NOT DONE (Phase 4 Roadmap)
**What to do:** Create `/admin/developers` tenant management portal and white-label theme previewer.

### TASK-016: Build CRM Integration & Webhooks Management Screen
**Traces to:** FR-51, FR-52, `design/07-admin-inventory-management-flow/EN/CRM_Integration_Settings_EN_-_Desktop_61f01f65.png`
**Status found:** ❌ NOT DONE (Phase 4 Roadmap)
**What to do:** Create `/admin/integrations` screen for configuring Salesforce/HubSpot CRM webhooks and API keys.
