
# EstateX — Project Documentation

This folder splits the original **`EstateX_SRS_Backlog_DB_PMP_EN.md`** (Version 2.0, Aug 31 2026) into focused, single-responsibility files, so any team member — developer, designer, or PM — can find what they need without digging through the full SRS.

The full original SRS remains the canonical, most detailed source and is still useful for the narrative context (rationale notes, revision history) between v1.0 and v2.0. These files extract and organize its content for day-to-day use.

## Documents

| File | For | Contents |
|---|---|---|
| [`01-overview.md`](./01-overview.md) | Everyone (start here) | Vision, problem statement, personas, competitive differentiators, 4-phase roadmap |
| [`02-architecture.md`](./02-architecture.md) | Engineering | System layers, tech stack, single-source-of-truth principle, booking concurrency strategy, module map |
| [`03-database-schema.md`](./03-database-schema.md) | Engineering (migrations) | All entities, fields, types, relationships, plus an inline Mermaid ERD |
| [`04-api-spec.md`](./04-api-spec.md) | Engineering | Endpoint list per entity, auth flow, conflict/error response conventions (incl. the `409` booking-conflict case) |
| [`05-functional-requirements.md`](./05-functional-requirements.md) | PM / Engineering / QA | Full FR-01…FR-60 table with priority and phase (reordered for logical grouping) |
| [`06-product-backlog.md`](./06-product-backlog.md) | PM (Jira/Linear import) | All Epics and User Stories with acceptance criteria, priority, and **Story Points**, organized by phase |
| [`07-non-functional-requirements.md`](./07-non-functional-requirements.md) | Everyone | Performance, security, scalability, accessibility, SEO, and business KPIs |
| [`08-design-guidelines.md`](./08-design-guidelines.md) | Design / Frontend | Design principles, color/typography direction, spacing, RTL/LTR rules, responsive breakpoints |
| [`09-pm-stakeholders-raci.md`](./09-pm-stakeholders-raci.md) | PM / Product Owner | Stakeholders, RACI matrix, and team structure |
| [`10-pm-roadmap-milestones.md`](./10-pm-roadmap-milestones.md) | PM / Client | Timeline per phase, milestones, assumptions, constraints, and out-of-scope |
| [`11-pm-risk-register.md`](./11-pm-risk-register.md) | PM / Tech Lead | Risk register with likelihood, impact, mitigation, and owners |
| [`12-pm-communication-plan.md`](./12-pm-communication-plan.md) | PM / Team | Communication cadence, change management process, and KPIs |

## How These Fit Together
01-overview ───────────────► gives context to everything below

02-architecture ──┬─► 03-database-schema ─► 04-api-spec
│
└─► 07-non-functional-requirements ─► 08-design-guidelines

05-functional-requirements ◄──► 06-product-backlog
(FR-xx codes trace both ways)

09-pm-* ◄──► 10-pm-* ◄──► 11-pm-* ◄──► 12-pm-*
(Management layer running the entire project)



- **New to the project?** Read `01` end to end.
- **Building a feature?** Check `05` for the requirement, `06` for the ticket/acceptance criteria, `03`/`04` for the data and API shape, and `07` for the quality bar.
- **Designing a screen?** Start from `08`, cross-check `07` for accessibility/responsiveness constraints, and `05`/`06` for what the screen actually needs to do.
- **Running the project day-to-day?** Start from `09` and read through `12` for RACI, timeline, risks, and communication.

## Source

Generated from `EstateX_SRS_Backlog_DB_PMP_EN.md`, Version 2.0, August 31, 2026.