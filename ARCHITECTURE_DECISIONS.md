# EstateX — Architecture Decisions

This file records the architectural choices that govern the EstateX codebase, and the
reasoning behind them, so later decisions stay consistent. It is the single place to look
for "why is it structured this way?" beyond what `02-architecture.md` specifies.

## Decision 1 — Repo layout: single monorepo, two apps

**Choice:** One git repository (this one) containing two deployable apps inside a
`apps/` folder, managed with a root npm workspace:

```
apps/
  api/     -> NestJS backend (REST API + Prisma against PostgreSQL)
  web/     -> Next.js frontend (App Router, next-intl, consumes the API over HTTP)
```

**Reasoning:** `02-architecture.md` mandates NestJS for the backend and Next.js for the
frontend as separate concerns. Keeping both in one repo makes cross-cutting changes
(schema, API contracts, RTL/i18n) traceable in a single history and reviewable in one PR,
which fits the project's strict traceability requirement. A `workspaces` config lets the
web app depend on shared Prisma types if needed while keeping each app independently
buildable and deployable.

**Backend split (flag):** The original MVP was an all-in-one Next.js app with raw-SQL Neon
route handlers. Per the executive prompt's mandate ("Backend: NestJS"), and the confirmed
decision, business logic — auth/RBAC, unit-status concurrency, payment-plan math,
notifications — lives in `apps/api` (NestJS). `apps/web` talks to it over HTTP. The old
`app/api/*` route handlers and raw `neon()`/`lib/schema.ts` are retired in favor of Prisma
in `apps/api`. This is the spec-literal reading of the stack and was explicitly confirmed.

## Decision 2 — ORM: Prisma

**Choice:** Prisma (Postgres provider).

**Reasoning:** Prisma gives strongly-typed, introspection-safe access to PostgreSQL with
a first-class migration story (real, versioned `migrations/*.sql` files, not just schema
definitions), and it makes the concurrency-critical fields (`Unit.statusVersion`,
`Unit.holdExpiresAt`) and the nullable tenant-scoping columns (`developerId`) explicit and
type-safe. It also supports interactive transactions, which we need for the FR-42 atomic
status transition.

## Decision 3 — i18n: next-intl

**Choice:** `next-intl` with `en` (LTR) and `ar` (RTL) locales.

**Reasoning:** next-intl is purpose-built for the Next.js App Router, drives `dir`/`lang`
attributes and RTL mirroring from the locale, and provides per-locale number/currency
formatting (Western vs. Arabic-Indic numerals, FR-46). Wiring it from the first page is the
explicit mitigation for Risk R7 (late RTL bugs).

## Decision 4 — Visual design source of truth

The Stitch project referenced in the executive prompt
(`https://stitch.withgoogle.com/projects/1520195418730042747`) is not programmatically
accessible (it is a client-side-only interactive app; a plain fetch returns only the app
shell). The repository carries a local export of the earlier Stitch project
(`Design/`, project `15015285934878213590`), which has EN and AR screens for most flows.

The authoring model for this environment **cannot render images**, so a pixel-level visual
diff against the Stitch exports is not possible. Per `08-design-guidelines.md` (and the
executive prompt's own fallback clause), **`08-design-guidelines.md` is the authoritative
design spec** for status colors, RTL/LTR mirroring rules, the three responsive tiers, and
the component conventions (single Unit Card, single Status Badge). Any visual contradiction
between a numbered doc and a design image is resolved in favor of the numbered doc.

## Decision 5 — Multi-tenancy readiness (Risk R4)

`Developer` is a first-class entity and project-scoping columns are present from Phase 1.
All tenant-sensitive tables carry a nullable `developerId` where the schema calls for it,
so Phase 4 SaaS onboarding does not require a data-model retrofit.

## Decision 6 — Notifications are event-driven (R3/R10)

The Notification module is triggered by domain events (new Lead, status change, import
completion, booking confirmation) emitted by business logic and dispatched asynchronously
through a queue abstraction. Business logic never calls a mailer/SMS client inline. In
Phase 1 the queue adapter is a simple in-process emitter with retry/logging; an eventual
BullMQ/Redis adapter can be swapped in behind the same interface without touching callers.

## Related

- `02-architecture.md` — the technical north star this file implements
- `08-design-guidelines.md` — the authoritative visual/design rules (Decision 4)
- `11-pm-risk-register.md` — R3 (stale inventory), R4 (multi-tenant), R7 (RTL), R10 (notifications)
