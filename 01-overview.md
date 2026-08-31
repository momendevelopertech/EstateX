# 01 — Overview

> Source: `EstateX_SRS_Backlog_DB_PMP_EN.md` (Sections 1–3). Read this first if you're new to the project.

## What is EstateX?

**EstateX** is an interactive digital platform that transforms real estate project discovery from the traditional flow — *image → description → price → contact* — into an integrated journey:

**discover → explore → compare → visualize → decide → convert into a lead**

...while giving the real estate developer and sales team precise management and analytics tools along the way.

## The Problem

The real estate sales journey traditionally relies on static materials — brochures, photos, video, a static Masterplan — that a sales representative manually links together for the customer. This makes the exploration experience slow, unmeasurable, and unable to reflect the customer's actual interests, which weakens the developer's ability to understand demand and improve sales.

## Target Users (Personas)

| Persona | Core Needs | Goal on the Platform |
|---|---|---|
| **Buyer** | Location, services, prices, areas, view, unit layout, available payment/installment options | Make a purchase decision based on complete, clear information |
| **Investor** | Deeper data: expected return, location, unit type, ability to compare multiple units, historical price movement | Evaluate the investment opportunity quickly and accurately |
| **Sales Agent** | Live inventory visibility (Available/Reserved/Sold), shareable unit links, follow-up on interested customers, real-time alerts on new Leads and unit status changes | Close deals quickly with accurate information |
| **Developer / Admin** (Sales Manager / Management) | Managing projects, buildings, units, prices, inventory, permissions, and payment plan templates | Full control over content, data, and reports |
| **Content Manager** | Uploading/updating photos, plans, 360° tours, videos | Keep visual content current without needing full admin permissions |

## Competitive Differentiators

- **Unified Journey** — Map + Masterplan + Building + Unit + 360° tour in one connected experience, instead of separate disconnected tools.
- **Decision Engine** — Doesn't just display units; suggests "the best unit that fits the customer's needs."
- **Real-time Inventory** — Unit status (available/reserved/sold) is directly linked to the live database, not a static list.
- **Sales Intelligence** — Tracks customer interaction (units viewed, compared, filtered) and links it to each Lead.
- **Unit-level Deep Linking** — Every unit has a direct, shareable link and QR code.
- **Hybrid 2D/3D mix** — A fast 2D mode for performance, and an immersive 3D mode for full experience, without forcing heavy scenes on everyone.
- **AI Recommendation** — Matches buyer requirements to actual inventory, not just as a marketing add-on.
- **Flexible Payment Visualization** — Buyers see installment breakdowns per unit directly in the experience, instead of requesting them separately from an agent.

## Product Scope: The 4-Phase Roadmap

To avoid the risk of building "everything at once," scope is split into four progressive phases, each building on the previous one and shipped as an independent, usable increment.

| Phase | Core Focus | Status After Delivery |
|---|---|---|
| **Phase 1 — Foundation & Core Experience** | General location, basic 2D exploration, inventory management, simple Lead capture, payment plans, notifications | A usable MVP for sales and customers |
| **Phase 2 — Immersive Experience** | 3D Masterplan, indoor 360° tours, Balcony View, visual effects | A visually competitive immersive experience |
| **Phase 3 — Sales Intelligence** | Comparison, favorites, smart recommendation, sharing, sales analytics dashboards | A smart sales platform that genuinely supports the sales team |
| **Phase 4 — Enterprise / SaaS** | Multi-tenant, CRM integration, advanced permissions, white-label | A product sellable to multiple real estate developers as a SaaS service |

## Where to Go Next

| I want to... | Go to |
|---|---|
| Understand the technical architecture and stack | [`02-architecture.md`](./02-architecture.md) |
| Look up a database entity/field | [`03-database-schema.md`](./03-database-schema.md) |
| Check an API endpoint or the conflict-response convention | [`04-api-spec.md`](./04-api-spec.md) |
| Look up a specific functional requirement (FR-xx) | [`05-functional-requirements.md`](./05-functional-requirements.md) |
| Pull tickets for sprint planning / Jira import | [`06-product-backlog.md`](./06-product-backlog.md) |
| Check performance, security, or KPI targets | [`07-non-functional-requirements.md`](./07-non-functional-requirements.md) |
| Understand design principles (colors/typography TBD) | [`08-design-guidelines.md`](./08-design-guidelines.md) |
| See who does what and the RACI matrix | [`09-pm-stakeholders-raci.md`](./09-pm-stakeholders-raci.md) |
| Check the timeline, milestones, and assumptions | [`10-pm-roadmap-milestones.md`](./10-pm-roadmap-milestones.md) |
| Review project risks and mitigations | [`11-pm-risk-register.md`](./11-pm-risk-register.md) |
| Understand communication and change management | [`12-pm-communication-plan.md`](./12-pm-communication-plan.md) |