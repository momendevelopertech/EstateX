# 07 — Non-Functional Requirements

> Source: `EstateX_SRS_Backlog_DB_EN_v1_1.md` (Section 6). These apply across every Epic and feature — they are not tied to one ticket, and every story in [`06-product-backlog.md`](./06-product-backlog.md) should be checked against them before it's called "done."

## Business KPIs

To ensure the platform is judged on outcomes and not only feature completeness, the following indicators should be tracked from Phase 1 onward and reviewed with the Product Owner at the end of each phase.

| KPI | Target (initial, to be confirmed with stakeholders) |
|---|---|
| Lead-to-booking conversion rate | Baseline established in Phase 1; improvement target set from Phase 3 dashboards |
| Average agent response time to a new Lead | Under 1 hour during business hours (supported by FR-57) |
| Monthly new Leads generated via the platform | Defined jointly with the sales/marketing team per project |
| Homepage-to-unit-details completion rate | Tracked as a funnel metric once Analytics (FR-38) ships |

## SEO & Discoverability

| Requirement |
|---|
| Public-facing project and unit pages must be server-rendered (SSR/SSG via Next.js) to be crawlable by search engines |
| Each project/unit page must expose proper meta tags, Open Graph tags, and structured data (schema.org `RealEstateListing` where applicable) for rich search/social previews |
| Clean, human-readable URLs (via the `slug` field already defined on `Project`) |

## Other Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Initial homepage load in under 2.5 seconds; lazy loading for 3D assets and panoramas; modern image compression (WebP/AVIF) |
| **Scalability** | An architecture able to grow from a single project to dozens of projects and hundreds of thousands of units without a major restructuring |
| **Security** | Encrypted connections (HTTPS), password hashing, protection against SQL injection and XSS/CSRF, input validation, rate limiting |
| **Availability** | A target uptime of at least 99.5% for the production version, with daily database backups |
| **Usability** | A user experience that requires no training for the sales team; a maximum of 3 clicks to go from the general plan to any unit's details |
| **Compatibility** | Support for the latest two versions of major browsers (Chrome, Safari, Edge, Firefox) and modern iOS/Android devices |
| **Maintainability** | A clear separation between the data layer and the presentation layer (see [`02-architecture.md`](./02-architecture.md)), with complete API documentation |
| **Accessibility** | Basic compliance with WCAG 2.1 AA: sufficient color contrast, keyboard support, alt text for images |
| **Observability** | Error logging and performance monitoring (APM) from the first phase |
| **Data Consistency** | Unit status transitions must be atomic and conflict-safe — see [`02-architecture.md §3`](./02-architecture.md#3-booking-concurrency--consistency) |

## Related Documents

- [`02-architecture.md`](./02-architecture.md) — how the concurrency and maintainability requirements are implemented
- [`06-product-backlog.md`](./06-product-backlog.md) — where these NFRs act as an ongoing "Definition of Done" checklist
- [`08-design-guidelines.md`](./08-design-guidelines.md) — how accessibility and responsiveness NFRs translate to design/frontend decisions
