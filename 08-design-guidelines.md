# 08 — Design Guidelines

> ⚠️ **Note on scope:** The source SRS does not define an actual visual identity — no finalized color palette, typography, or component library. This document is a **framework of design principles** derived from the nature of the product (interactive real estate, bilingual AR/EN with RTL/LTR, and three distinct device/experience tiers), meant to guide decisions until an actual brand/UI kit is produced. Treat every "example" below as illustrative direction, not a final spec. Once real brand assets exist, this file should be updated (or a `08a-visual-identity.md` added) with the finalized tokens.

## 1. Design Principles

These follow directly from the product's competitive differentiators ([`01-overview.md`](./01-overview.md)) and NFRs ([`07-non-functional-requirements.md`](./07-non-functional-requirements.md)):

1. **Clarity over decoration.** The core job of the UI is to help someone make a large financial decision. Every screen should reduce ambiguity about price, availability, and location — not compete with that information visually.
2. **Status is sacred.** Availability color-coding (available/reserved/sold/unavailable) is a live data signal, not a stylistic choice (FR-08). It must remain visually distinct and consistent everywhere it appears — Masterplan, unit card, unit details, comparison table.
3. **Progressive immersion, not forced immersion.** The product deliberately offers a fast 2D mode and a heavier 3D/360° mode. Design should make the "lighter" path the default and the immersive path an explicit, opt-in upgrade — never block a user behind a heavy load just to see basic info.
4. **One visual system, three densities.** The same components must scale down gracefully from a sales-center presentation screen to a customer's phone, without becoming a different product (see §4, Responsive Breakpoints).
5. **Design for both reading directions equally.** Arabic/RTL is not a "translation" of the English/LTR layout — see §3.
6. **Accessible by default.** WCAG 2.1 AA (contrast, keyboard nav, alt text) is a baseline constraint on every design decision, not a later pass.

## 2. Color & Typography Direction (Framework, Not Final Palette)

No final palette or typeface has been chosen. Until brand assets are delivered, use this framework to keep early builds coherent:

| Token category | Guidance | Why |
|---|---|---|
| **Status colors** | Reserve a distinct hue family for each of the four unit states (available / reserved / sold / unavailable) that reads clearly even for color-blind users — pair color with an icon or label, never color alone | FR-08 depends on unambiguous status signaling; WCAG requires non-color-only indicators |
| **Primary/brand color** | Placeholder only until the developer's/tenant's branding is supplied (`Developer.branding` in the data model, Phase 4 white-label) | Multi-tenant roadmap means brand color may eventually be per-developer, not platform-wide |
| **Neutral scale** | A wide neutral gray scale (not pure black/white) for backgrounds, borders, and text hierarchy, since large amounts of real photography and 3D renders need a quiet frame around them | Photos/3D content should be the visual focus, not chrome |
| **Typography — Latin** | A high-legibility, modern sans-serif for English UI and numerals | Matches SSR/SEO-facing marketing pages and dashboard density |
| **Typography — Arabic** | A dedicated Arabic-optimized typeface (not a Latin font faux-rendering Arabic glyphs), matched in weight/x-height to the Latin choice | Poor Arabic type support is one of the most common RTL failures |
| **Numerals & currency** | Respect locale: Arabic-indic vs. Western numerals, and currency symbol placement, follow the user's `locale` setting (see `User.locale`, FR-46) | Financial data (price, installments) must never look "off" in either language |

## 3. RTL / LTR Handling Rules

Full Arabic/English support with proper direction switching is a **Must** requirement (FR-46). Rules of thumb:

- **Mirror the layout, not just the text.** Navigation order, form field alignment, icons implying direction (arrows, "next" chevrons), and the Masterplan's UI chrome (not the map/3D content itself) should flip with `dir="rtl"` vs `dir="ltr"`.
- **Don't mirror inherently spatial content.** Maps, Masterplans, 3D scenes, and floor plans represent real physical space — they should **not** be mirrored; only the surrounding UI (buttons, labels, filters panel) follows text direction.
- **Numbers and prices stay logically ordered** even in RTL paragraphs (e.g., a price range "500,000 – 750,000 EGP" reads left-to-right for the numerals regardless of surrounding RTL text).
- **Test bilingual switching mid-session**, not just at first load — a buyer or agent may switch language without restarting their flow (e.g., mid-comparison, mid-installment-calculator).
- **Component library choice should have first-class RTL support** (Tailwind + shadcn/ui, per the recommended stack, support logical CSS properties — use `margin-inline-start` style patterns rather than hardcoded `left`/`right`).

## 4. Responsive Breakpoints & Experience Tiers

The product explicitly targets **three experience levels**, not just three screen sizes (FR-47):

| Tier | Typical Device | Experience Level | Design Implication |
|---|---|---|---|
| **Desktop** | Laptop/desktop, sales-center large screens | Full experience — 3D Masterplan, full 360° tours, side-by-side comparison, dashboards | Design the richest version here first; large-screen Presentation Mode (FR-48) is a variant of this tier, optimized for a "reset between customers" flow |
| **Tablet** | iPad-class devices, used heavily by agents in showrooms | Presentation view — a guided, agent-facing layout that emphasizes showing a customer information cleanly, touch-first | Larger tap targets, fewer simultaneous panels than desktop, but still shows imagery/3D at good fidelity |
| **Mobile** | Phones | Simplified, lightweight experience | Prioritize 2D over 3D by default, progressive disclosure of filters, single-column layouts, and deliberately deferred/optional loading of heavy 360°/3D assets |

Suggested breakpoint philosophy (finalize with real device data): treat these as **experience-mode thresholds**, not just CSS breakpoints — i.e., crossing from tablet to mobile width should be allowed to change *what* is shown, not just how it reflows.

## 5. Component Conventions

General conventions to apply as the component library is built out (exact tokens TBD with a UI kit):

- **Unit Card** — the atomic, most-reused component (grid views, favorites, comparison, search results). Must always show: thumbnail, unit number/type, price, area, status badge. Treat this as the single template for "a unit, summarized" everywhere it appears, consistent with the Single Source of Truth principle ([`02-architecture.md`](./02-architecture.md)).
- **Status Badge** — a small, reusable component pairing color + icon + text label for the four unit states; never render status as color alone.
- **Filter Panel** — collapsible/drawer on mobile, persistent sidebar on desktop/tablet; changes should update results and the Masterplan simultaneously (FR-09), so loading states need to cover both at once.
- **Comparison Table** — must remain legible at up to 4 columns on desktop, and gracefully degrade to a stacked/swipeable layout on mobile.
- **Installment Calculator** — an inline, live-recalculating widget (FR-54); avoid page reloads or multi-step forms for something meant to feel exploratory.
- **Notification indicator** — a persistent, low-friction affordance (e.g., a bell icon with count) so agents/admins notice new-Lead and status-change alerts without a page reload.

## Related Documents

- [`07-non-functional-requirements.md`](./07-non-functional-requirements.md) — accessibility, performance, and compatibility constraints these guidelines must satisfy
- [`01-overview.md`](./01-overview.md) — the personas and differentiators these design principles serve
- [`05-functional-requirements.md`](./05-functional-requirements.md) — FR-46/FR-47/FR-08/FR-54 referenced above
