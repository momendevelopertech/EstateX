# 10 — Project Management: Roadmap & Milestones

> Source: `EstateX_SRS_Backlog_DB_PMP_EN.md` (Section 9.3). Durations are planning estimates in weeks, assuming the team sizes in [`09-pm-stakeholders-raci.md`](./09-pm-stakeholders-raci.md) and 1–2 week sprints; they must be re-validated with the actual assigned team before commitment to the client.

## Phase-by-Phase Timeline

| Phase | Estimated Duration | Key Milestone | Exit Criteria |
|---|---|---|---|
| **Phase 1 — Foundation & Core Experience** | 8–10 weeks | MVP Launch | All Phase 1 "Must" items (Section 5) pass UAT; admin can manage live inventory; at least one Lead can be captured end-to-end |
| **Phase 2 — Immersive Experience** | 8–12 weeks | Immersive Release | 360° tour works on desktop + mobile for at least one pilot unit; 3D Masterplan runs at target frame rate (Section 7.2) |
| **Phase 3 — Sales Intelligence** | 6–8 weeks | Sales Intelligence Release | Comparison, favorites, recommendation engine, and analytics dashboard are live and used by at least one sales agent in a real deal |
| **Phase 4 — Enterprise / SaaS** | 8–12 weeks | SaaS-Ready Release | A second, isolated developer tenant can be onboarded without engineering involvement |

**Suggested cadence:** 2-week sprints, sprint review + retrospective at the end of each sprint, and a stakeholder demo at the end of every phase (not every sprint) to avoid over-reporting to the client while still keeping the internal team accountable.

## Assumptions

- The client can provide accurate, phase-appropriate content (unit data, pricing, photos, floor plans, 360° captures) at least one sprint ahead of when it is needed for development/testing.
- A pilot project/building is identified early for the first 360° tour and 3D Masterplan (Phase 2), since these depend on real assets, not placeholders.
- The client has (or will procure) storage/CDN and hosting accounts, or approves the ones proposed in Section 4.3.
- No firm CRM system is mandated for Phase 4 until a real integration target is named by the client.
- Pricing and availability changes are the responsibility of the Sales Manager / Admin role and are expected to happen frequently (daily), which is why FR-42 requires immediate reflection without a redeploy.

## Constraints

- Full Arabic/English RTL-LTR support (FR-46) constrains UI component choice and testing time — every screen needs to be verified in both directions before sign-off.
- 3D/360° features (Phase 2) are constrained by the availability of real photography/3D capture equipment and by client site access for on-location 360° shoots.
- Multi-tenant architecture (Phase 4) is significantly cheaper to build in if planned for from Phase 1's database design (Section 8) — retrofitting it later is a real risk (see [11-pm-risk-register.md](./11-pm-risk-register.md)).
- Budget and exact team size are not fixed in this document; the roadmap above assumes the team in Section 9.2 and must be re-costed once resourcing is confirmed.

## Out of Scope

To keep expectations explicit, the following are **not** included in Phases 1–4 unless a change request is raised (see [12-pm-communication-plan.md](./12-pm-communication-plan.md)):

- Online payment processing or e-signature of sale contracts.
- Native mobile apps (iOS/Android) — the platform is responsive web only (FR-47).
- Support for VR headsets is explicitly "Won't" for this roadmap (FR-29) and only revisited if a client specifically funds it.
- Legal/contract management, mortgage calculators, or bank-integration tools.
- Marketing automation (email campaigns, ad retargeting) beyond passing Lead data to a CRM (FR-51).

## Related Documents

- [`09-pm-stakeholders-raci.md`](./09-pm-stakeholders-raci.md) — who is executing this roadmap
- [`11-pm-risk-register.md`](./11-pm-risk-register.md) — risks that could delay these milestones
- [`12-pm-communication-plan.md`](./12-pm-communication-plan.md) — how progress is reported against these milestones
