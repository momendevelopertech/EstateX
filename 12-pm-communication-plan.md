# 12 — Project Management: Communication & Change Management

> Source: `EstateX_SRS_Backlog_DB_PMP_EN.md` (Sections 9.11 and 9.12). How the team communicates daily, weekly, and per-phase, plus how we handle scope changes.

## Communication Plan

| Activity | Frequency | Audience | Owner |
|---|---|---|---|
| Daily stand-up | Daily | Dev/Design/QA team | Project Manager / Scrum Master |
| Sprint planning | Every 2 weeks | Full delivery team | Project Manager |
| Sprint review/demo | Every 2 weeks | Delivery team + Product Owner | Project Manager |
| Phase-end stakeholder demo | End of each phase | Product Owner, Sales Manager, key stakeholders | Project Manager |
| Status report | Weekly | Product Owner / Client | Project Manager |
| Risk review | Bi-weekly, or on trigger | Project Manager + relevant owners from Section 9.7 | Project Manager |

## Change Management Process

1. Any new requirement or change to an existing one (scope, priority, or acceptance criteria) is logged as a Change Request against this document.
2. The Project Manager assesses impact on timeline (Section 9.3), risk (Section 9.7), and the current sprint's committed scope.
3. Requests that fit within an already-"Should/Could" backlog item can be absorbed at the next sprint planning without formal approval.
4. Requests that add net-new scope or change a "Must" item require Product Owner approval and a version bump to this document (see Version History).
5. Approved changes are reflected in Section 5 (Functional Requirements) and Section 7 (Backlog) with a new/updated code, so traceability (Section 1.2) is never lost.

## Success Metrics / KPIs (Reviewed Monthly)

| Metric | Target | Measured Via |
|---|---|---|
| Homepage load time | Under 2.5s (Section 6) | APM / observability tooling |
| Clicks from Masterplan to unit details | ≤ 3 clicks (Section 6, FR-user story #5) | Usability testing / analytics funnel |
| Lead conversion rate (visits → Lead submitted) | Baseline established in Phase 1, improved in Phase 3 | AnalyticsEvent + Lead tables (Section 8.4) |
| Sales agent adoption of shareable unit links (FR-33) | ≥ 50% of active agents using deep links within 1 month of Phase 3 release | Link analytics / agent survey |
| Uptime | ≥ 99.5% (Section 6) | Infrastructure monitoring |
| 360° tour completion rate (started vs. finished) | Established after Phase 2 launch, then improved | AnalyticsEvent |
| Time-to-update inventory (status change to reflection on live site) | Near-instant, no redeploy (FR-42) | Manual QA + monitoring |

## Definition of Done (per Phase)

A phase is not considered complete unless **all** of the following are true, in addition to each item's individual acceptance criteria (Section 7):

- All "Must" priority requirements for that phase (Section 5) are implemented and pass QA.
- All "Must" priority User Stories for that phase (Section 7) have passed UAT with a real stakeholder (Sales Manager or Product Owner), not only the QA engineer.
- Arabic and English (RTL/LTR) have both been verified on every new screen (FR-46).
- Desktop, tablet, and mobile responsive behavior has been verified (FR-47).
- No open Critical or High severity bugs; Medium/Low bugs are logged and triaged for the next sprint.
- Relevant Non-Functional Requirements (Section 6) for that phase — performance, security, accessibility — have been checked, not only functional behavior.
- Documentation is updated: API docs for any new/changed endpoint, and this SRS document itself if scope changed.
- The Product Owner has formally signed off on the release.

## QA & Testing Strategy (Summary)

| Test Type | Scope | When |
|---|---|---|
| Unit Testing | Business logic (pricing, availability rules, recommendation matching) | Continuous, part of each Pull Request |
| Integration Testing | API endpoints against the database schema (Section 8) | Continuous, part of CI pipeline |
| Cross-browser / Cross-device Testing | Latest 2 versions of Chrome/Safari/Edge/Firefox; modern iOS/Android (Section 6) | Before every phase release |
| Performance Testing | Homepage load, 3D/360° frame rate on mid-range devices | Before Phase 2 and Phase 3 releases, then spot-checked |
| Localization Testing | Arabic/English RTL-LTR correctness, number/currency formatting (FR-46) | Every new screen, before merge |
| Accessibility Testing | WCAG 2.1 AA basics: contrast, keyboard nav, alt text (Section 6) | Before every phase release |
| Security Testing | Auth (JWT/RBAC), input validation, rate limiting, basic penetration checks | Before Phase 1 release, then before Phase 4 (multi-tenant) release |
| User Acceptance Testing (UAT) | Real Sales Manager/Agent walks through the acceptance criteria in Section 7 | End of every phase, before Product Owner sign-off |

## Related Documents

- [`09-pm-stakeholders-raci.md`](./09-pm-stakeholders-raci.md) — who attends which meetings
- [`10-pm-roadmap-milestones.md`](./10-pm-roadmap-milestones.md) — the timeline these communications track against
- [`11-pm-risk-register.md`](./11-pm-risk-register.md) — risks reviewed in the bi-weekly risk review