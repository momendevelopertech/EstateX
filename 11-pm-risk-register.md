# 11 — Project Management: Risk Register

> Source: `EstateX_SRS_Backlog_DB_PMP_EN.md` (Section 9.7). Track these risks bi-weekly with the team. Every risk must have a named owner and a clear mitigation strategy.

| # | Risk | Category | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R1 | Client content (photos, 360° captures, accurate unit data) arrives late or incomplete | Content/Schedule | High | High | Lock a content-delivery schedule per phase; start Phase 2 development against placeholder/sample assets so the pipeline isn't blocked | Project Manager / Content Coordinator |
| R2 | 3D/360° performance is poor on mid-range or older mobile devices | Technical | Medium | High | Early device-lab testing from Phase 2 sprint 1; hybrid 2D/3D fallback already defined as a differentiator (Section 2.4) | 3D Engineer / QA |
| R3 | Real-time inventory status (FR-08/FR-42) shows stale data under concurrent admin edits | Technical | Medium | High | Define a clear cache-invalidation strategy in the API layer; add integration tests around status updates | Backend Engineer |
| R4 | Retrofitting multi-tenancy in Phase 4 requires reworking Phase 1–3 data model | Architectural | Medium | High | Design core tables (Section 8) with a nullable `developerId`/tenant scoping from Phase 1, even if unused until Phase 4 | Backend Engineer / PM |
| R5 | Scope creep from sales team requesting Phase 3/4 features during Phase 1 | Scope | High | Medium | Enforce the change-management process (Section 9.12); maintain a visible "Later" backlog | Project Manager |
| R6 | Bulk import (FR-43) introduces bad data (duplicate units, invalid prices) into production | Data Quality | Medium | Medium | Mandatory validate → preview → confirm steps (already specified in FR-43); dry-run mode before commit | Backend Engineer / Admin |
| R7 | RTL/Arabic layout bugs discovered late, close to a release | Quality | Medium | Medium | Add Arabic/English toggle to every UAT checklist from Phase 1, not as a final pass | QA Engineer |
| R8 | Sales team does not adopt the analytics dashboard (Phase 3) because it doesn't match their workflow | Adoption | Medium | Medium | Involve 1–2 sales agents in dashboard UAT before general rollout; iterate on real feedback | Sales Manager |
| R9 | Third-party CRM (Phase 4) has an unstable or undocumented API | Integration | Low (until a CRM is named) | Medium | Confirm the target CRM early once known, and time-box a technical spike before committing a sprint estimate | Backend Engineer |
| R10 | Notification delivery fails (email/SMS provider downtime) | Technical | Medium | Medium | Implement a retry mechanism (exponential backoff) and a dead-letter queue for failed notifications; monitor delivery rates | DevOps / Backend |

## Related Documents

- [`10-pm-roadmap-milestones.md`](./10-pm-roadmap-milestones.md) — timeline impact if these risks materialize
- [`09-pm-stakeholders-raci.md`](./09-pm-stakeholders-raci.md) — owners listed above are drawn from this structure