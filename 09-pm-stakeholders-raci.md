# 09 — Project Management: Stakeholders & RACI

> Source: `EstateX_SRS_Backlog_DB_PMP_EN.md` (Section 9.1). This defines who is involved, their roles, and who is responsible/accountable for key activities.

## Stakeholders

| Stakeholder | Interest / Role | Involvement |
|---|---|---|
| **Product Owner / Client** | Owns the vision, budget, and final sign-off | Approves scope, priorities, and each phase's release |
| **Project Manager** | Runs delivery, tracks scope/schedule/risk | Owns this document, the roadmap, and status reporting |
| **Sales Manager / Sales Team** | End users of the dashboard and analytics | Provides input on FR-38/39 dashboards, UAT for sales flows |
| **Development Team (Frontend/Backend/3D)** | Builds the platform | Executes the Sprint Backlog (Section 7), raises technical risks |
| **Design Team (UI/UX)** | Designs Wireframes and visual identity | Owns Section 9.10 UAT usability criteria and Section 6 accessibility targets |
| **Content Manager** | Uploads/maintains media (photos, 360°, plans) | Data entry, content QA before each release |
| **QA / Test Engineer** | Verifies acceptance criteria | Owns Section 9.11 (test plan, UAT sign-off) |
| **DevOps / Infra** | Environments, CI/CD, backups, uptime | Owns Section 6 (Availability, Security, Observability) |
| **Real Estate Developer (SaaS tenant, Phase 4)** | Future paying customer of the platform | Consulted for Phase 4 multi-tenant/CRM requirements only |

## RACI Matrix

**R = Responsible (does the work), A = Accountable (owns the outcome), C = Consulted, I = Informed**

| Activity | Product Owner | Project Manager | Dev Team | Design Team | QA | Sales Team |
|---|---|---|---|---|---|---|
| Approve scope & priorities | A | R | I | I | I | C |
| Sprint planning | I | A/R | R | C | C | I |
| Wireframes & UI design | C | I | I | A/R | I | C |
| Feature implementation | I | A | R | C | I | I |
| Acceptance testing / UAT | C | A | C | C | R | R |
| Production release go/no-go | A | R | C | I | C | I |
| Analytics/KPI review | C | R | I | I | I | A |

## Team Structure & Required Roles

| Role | Phase Needed From | Notes |
|---|---|---|
| **Project Manager / Scrum Master** | Phase 1 | Runs sprints, removes blockers, owns this document |
| **Frontend Engineer (Next.js/React)** | Phase 1 | 1–2 engineers depending on timeline |
| **Backend Engineer (NestJS/PostgreSQL)** | Phase 1 | Owns API layer and Section 8 schema |
| **3D/WebGL Engineer (Three.js/R3F)** | Phase 2 | Can be a specialist contractor if not needed full-time in Phase 1 |
| **UI/UX Designer** | Phase 1 (Wireframes start immediately) | Also owns the 360°/3D visual direction for Phase 2 |
| **QA Engineer** | Phase 1 | Can start part-time, full-time from Phase 2 onward (3D/360° needs device testing) |
| **DevOps Engineer** | Phase 1 (part-time) | Sets up CI/CD, staging/production, backups |
| **Content/Media Coordinator** | Phase 1–2 | Prepares photos, floor plans, 360° captures — often the actual bottleneck for Phase 2 |
| **Data/Analytics Engineer** | Phase 3 | Builds the dashboards in FR-38/39 |

## Related Documents

- [`10-pm-roadmap-milestones.md`](./10-pm-roadmap-milestones.md) — timeline these roles will execute against
- [`11-pm-risk-register.md`](./11-pm-risk-register.md) — risks owned by these stakeholders