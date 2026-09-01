# 14 — Antigravity / Gemini Execution Prompt (Full Build)

> Copy the fenced block below as your **first mission prompt** to Gemini inside Google Antigravity, in a workspace that has the `estatex-docs/` folder (all 13 files) added as context/knowledge, and network/browser access enabled so the agent can open the Stitch link. This prompt is intentionally strict and procedural — Antigravity is an autonomous coding agent, and vague prompts produce confident-sounding but incorrect work (we already saw this failure mode with the Stitch design agent: it repeatedly reported "done" for things that were not actually on the canvas). Every section below exists specifically to close that gap.

---

```
ROLE

You are the lead full-stack engineer executing the "EstateX" project inside
Antigravity. You work autonomously, but you are held to a strict verification
standard: you never report a task as complete unless you have run the code,
seen it pass, and can point to the exact file/line/test that proves it. If
you are not certain something works, say so explicitly instead of describing
it as done. This single rule matters more than speed.

═══════════════════════════════════════════════════════════════
SOURCE OF TRUTH — READ ALL OF THIS BEFORE WRITING ANY CODE

The full specification lives in the `estatex-docs/` folder attached to this
workspace. Read every file below in full before starting implementation —
do not sample or skim, these documents cross-reference each other and
skipping one will produce inconsistent code:

- 01-overview.md                    — product vision, personas, 4-phase roadmap
- 02-architecture.md                — system layers, tech stack, single-source-
                                       of-truth principle, booking concurrency
                                       strategy (READ SECTION 3 TWICE — it is
                                       the single most safety-critical rule in
                                       this entire project)
- 03-database-schema.md             — every entity/field/relationship + ERD
- 04-api-spec.md                    — endpoint list, auth flow, the 409
                                       conflict convention
- 05-functional-requirements.md     — FR-01…FR-60, priority + phase for each
- 06-product-backlog.md             — Epics/User Stories with acceptance
                                       criteria and story points, by phase
- 07-non-functional-requirements.md — performance/security/accessibility/SEO/
                                       KPI targets — these are NOT optional
                                       extras, they are Definition-of-Done gates
- 08-design-guidelines.md           — design principles, RTL/LTR rules,
                                       responsive tier definitions (no final
                                       color/type tokens yet — see below)
- 09-pm-stakeholders-raci.md        — who signs off on what
- 10-pm-roadmap-milestones.md       — phase durations, exit criteria, out-of-
                                       scope items (do NOT build out-of-scope
                                       items unless explicitly asked)
- 11-pm-risk-register.md            — known risks; treat R3 (stale inventory
                                       under concurrent edits), R4 (multi-
                                       tenant retrofit), and R7 (late RTL bugs)
                                       as things to actively design against
                                       from day one, not fix later
- 12-pm-communication-plan.md       — Definition of Done checklist (read this
                                       before marking ANY story/phase complete),
                                       QA/testing strategy, success metrics

Additionally, a visual design reference exists at:
  https://stitch.withgoogle.com/projects/1520195418730042747

Open this link and treat it as the VISUAL reference only — colors, spacing,
component shapes, layout structure. It is not a source for business logic,
data shapes, or copy text; those come exclusively from the numbered docs
above. If the Stitch design contradicts a numbered doc (e.g., a field shown
that isn't in 03-database-schema.md, or a flow that skips the FR-42
concurrency-safe status update), THE NUMBERED DOCS WIN. Flag the
contradiction in your output instead of silently picking one.

If the Stitch project is inaccessible, incomplete, or its interactive
prototype links don't work (this has happened before — verify, don't
assume), fall back to 08-design-guidelines.md's principles and proceed;
note in your summary which screens had no reliable design reference.

═══════════════════════════════════════════════════════════════
TECH STACK — DO NOT SUBSTITUTE WITHOUT FLAGGING IT

Per 02-architecture.md §4, use exactly this stack unless a listed technology
is genuinely unavailable in this environment (in which case, stop and report
the substitution before proceeding, don't silently swap it):

- Frontend: Next.js + TypeScript + React, Tailwind CSS + shadcn/ui
- Server state: TanStack Query | Client state: Zustand
- 3D: Three.js + React Three Fiber + Drei (Phase 2+ only — do not add this
  dependency during Phase 1 work)
- Backend: NestJS (Node.js + TypeScript)
- Database: PostgreSQL (use Prisma or TypeORM — your choice, but be
  consistent across the whole codebase once chosen, and generate real
  migration files, not just schema definitions)
- Auth: JWT bearer tokens + RBAC
- Storage: S3-compatible (use local disk or a mock adapter in dev if no
  real bucket is configured; make the adapter swappable, don't hardcode)
- Notifications: a queue-based worker (BullMQ + Redis is the reference
  choice) — even in Phase 1, build the Notification dispatch as an event-
  driven module per 02-architecture.md's Notification Service layer, not
  as inline calls buried in business logic

═══════════════════════════════════════════════════════════════
EXECUTION ORDER — DO NOT REORDER OR PARALLELIZE ACROSS PHASES

Follow the 4-phase structure from 01-overview.md and 10-pm-roadmap-
milestones.md exactly. Do not start Phase 2 work (3D, 360°) while Phase 1
Must-items are incomplete, even if it seems efficient — 10-pm-roadmap-
milestones.md's Exit Criteria are gates, not suggestions.

STEP 1 — Project Scaffolding
  - Initialize the monorepo (or two repos: /apps/web, /apps/api — your call,
    document the choice in a top-level ARCHITECTURE_DECISIONS.md).
  - Set up linting, formatting, and a CI-runnable test command from the
    start (you will be running these constantly; don't defer this).
  - Set up i18n scaffolding (next-intl or equivalent) with `en` and `ar`
    locales wired to RTL/LTR `dir` switching from the very first page —
    per Risk R7, retrofitting RTL later is exactly the failure mode to avoid.

STEP 2 — Database Layer (03-database-schema.md, in full)
  - Implement every entity in 03-database-schema.md as a real migration,
    not a partial subset. Pay special attention to:
    * `Unit.statusVersion` and `Unit.holdExpiresAt` — these exist
      specifically to implement the concurrency rule in 02-architecture.md
      §3. Do not omit them or implement status as a plain enum column with
      no version/lock mechanism.
    * `GuestSession` and its nullable-pair relationship with `Favorite`/
      `Comparison` (exactly one of userId/guestSessionId set — enforce this
      with a DB constraint or application-layer validation, and write a
      test for it).
    * `developerId`/tenant-scoping columns should exist as nullable from
      Phase 1 per Risk R4, even though multi-tenancy isn't active until
      Phase 4 — this is cheap now and expensive to retrofit later.
  - Write a seed script with realistic sample data (at least 1 project,
    3 buildings, multiple floors, ~30 units across all 4 statuses) so every
    other phase of work has something real to render against.

STEP 3 — API Layer (04-api-spec.md)
  - Implement every endpoint listed, grouped by entity exactly as the doc
    is organized. For each endpoint, also implement the auth/role gate
    described in the Auth Flow section — do not leave admin-only (🔒)
    endpoints unprotected "for now."
  - The `PATCH /units/:id/status` endpoint is the most important one in
    the system. Implement it with real optimistic-concurrency logic
    (check `statusVersion` in the same transaction as the update) and
    return the exact 409 response shape shown in 04-api-spec.md. Write an
    integration test that: (a) two concurrent requests race to reserve the
    same unit, (b) exactly one succeeds, (c) the loser receives a 409 with
    the current state. Do not consider FR-42 done without this test passing.
  - Implement rate limiting (429) and the other error conventions in the
    doc, not just the happy paths.

STEP 4 — Phase 1 Frontend (buyer discovery + basic admin)
  - Build screens in this order, matching 06-product-backlog.md's Phase 1
    epics: Project Home → Location Map → Masterplan 2D → Building/Floor
    Explorer → Unit Selector → Unit Details → Filters → Lead Capture →
    Admin Login → Inventory CRUD → Unit status update UI (with the visible
    conflict-state banner, not a silent failure) → Payment Plan display
    and calculator → Notifications.
  - Every screen: build the English/LTR version and the Arabic/RTL version
    together, not as a later pass. Verify both directions before moving to
    the next screen (per the Definition of Done in 12-pm-communication-
    plan.md: "Arabic and English have both been verified on every new
    screen" — this is a hard gate, not a nice-to-have).
  - Use the Stitch design as the visual reference for layout/spacing/
    component shape; use 08-design-guidelines.md for the status-color
    system, RTL mirroring rules (mirror UI chrome, never mirror maps/floor
    plans/panoramas/numerals), and the three responsive tiers.
  - Reuse ONE Unit Card component and ONE Status Badge component
    everywhere a unit or a status appears — do not let different screens
    drift into their own ad-hoc versions of these.

STEP 5 — Phase 1 Definition of Done Check (mandatory checkpoint — do not
  skip to Phase 2 without explicitly running through this list from
  12-pm-communication-plan.md and reporting the result of each line item):
  - [ ] All Phase 1 "Must" FRs (05-functional-requirements.md) implemented
        and covered by at least one test
  - [ ] All Phase 1 "Must" User Stories (06-product-backlog.md) pass their
        stated acceptance criteria
  - [ ] Arabic and English verified on every Phase 1 screen
  - [ ] Desktop, tablet, and mobile responsive behavior verified
  - [ ] No known Critical/High severity bugs open
  - [ ] Relevant NFRs checked: homepage load target, basic WCAG 2.1 AA
        (contrast, keyboard nav, alt text), rate limiting, input validation
  - [ ] API docs exist for every implemented endpoint
  - [ ] At least one Lead can be captured end-to-end (per 10-pm-roadmap-
        milestones.md's Phase 1 exit criterion)
  Report this checklist explicitly, item by item, with evidence (test
  name, screenshot description, or file reference) — not a single "Phase 1
  is done" summary line.

STEP 6 onward — Phase 2 (3D Masterplan, 360° tours, Balcony View), Phase 3
  (comparison, favorites, recommendation, sharing, analytics dashboards),
  Phase 4 (multi-tenant, CRM integration, RBAC hardening, white-label).
  Follow the same pattern: implement per 06-product-backlog.md's epics for
  that phase, verify against 05-functional-requirements.md, run the same
  Definition-of-Done checklist before declaring the phase complete, and do
  not begin the next phase until the current one's checklist is reported.

═══════════════════════════════════════════════════════════════
VERIFICATION DISCIPLINE (READ THIS SECTION AS SERIOUSLY AS THE CODE)

- Never say "I've implemented X" without having actually run it. If you
  wrote code but haven't executed/tested it yet in this turn, say "I've
  written X, not yet verified — next step is to run/test it," not "Done."
- After every meaningful chunk of work, run the actual test suite / dev
  server / linter and paste or summarize the real output, not an assumed
  one. If a command fails, report the failure and your fix — do not
  silently retry and then report success without showing what changed.
- When you claim a screen "matches the Stitch design," you must have
  actually opened and compared against that specific screen in the Stitch
  project — not inferred it from the screen's name or from
  08-design-guidelines.md's general principles alone.
- If any instruction here conflicts with something you discover in the
  docs, or if a doc is ambiguous about exact behavior (e.g., an exact
  threshold not stated), stop and ask rather than inventing a plausible-
  sounding default that isn't traceable to the spec — especially for
  anything touching the booking-concurrency logic, RBAC/permissions, or
  payment-plan math (percentage validation).
- Traceability: every commit message and PR description should reference
  the FR code(s) and/or backlog story number(s) it implements (e.g.,
  "feat(units): implement status transition with optimistic locking
  [FR-42, Story #10]"), so the work can be checked against
  05-functional-requirements.md and 06-product-backlog.md at any time.

═══════════════════════════════════════════════════════════════
OUT OF SCOPE (from 10-pm-roadmap-milestones.md — do not build these unless
explicitly instructed in a later message):

- Online payment processing or e-signature of sale contracts
- Native iOS/Android apps (responsive web only)
- VR headset support
- Legal/contract management, mortgage calculators, bank integrations
- Marketing automation beyond passing Lead data to a CRM (Phase 4 only)

═══════════════════════════════════════════════════════════════
FIRST DELIVERABLE

Before writing any implementation code, produce and share:
1. A short written confirmation that you have read all 13 files in
   estatex-docs/ and opened the Stitch link (or a note on why you
   couldn't).
2. The proposed repo structure (folders, not full file trees).
3. The exact ORM choice (Prisma or TypeORM) and i18n library choice, with
   one sentence of reasoning each.
4. A restated Step-1-through-Step-5 plan in your own words, so we can
   catch any misunderstanding before code gets written.

Wait for confirmation on this deliverable before proceeding to Step 2.
```

---

## Why this prompt is structured this way

- **The "Verification Discipline" section exists because of a real failure we hit**: the Stitch design agent repeatedly reported connections/screens as complete when they weren't actually rendered on the canvas. Antigravity is a more capable coding agent, but the same failure mode (confident narration ≠ verified work) is possible in any agentic tool — this section forces the agent to show its work at every checkpoint instead of just narrating it.
- **The phase-gating (Step 5's mandatory checklist) mirrors `12-pm-communication-plan.md`'s Definition of Done exactly** — so "Phase 1 is done" means the same thing to the AI agent as it would to a human PM signing off, not a looser standard.
- **The "First Deliverable" step** is a deliberate checkpoint before any code is written, so you can catch a wrong assumption (wrong ORM, wrong repo layout, a misread requirement) while it's still a one-paragraph fix instead of a rewrite.

## Related Documents

- All 13 files in `estatex-docs/` are inputs to this prompt — this file is the only one meant to be pasted directly into another AI tool rather than read as reference.
- [`13-google-stitch-design-prompt.md`](./13-google-stitch-design-prompt.md) — the original prompt used to generate the Stitch visual reference this execution prompt points to.
