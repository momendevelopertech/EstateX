# 02 — Architecture

> Source: `EstateX_SRS_Backlog_DB_EN_v1_1.md` (Section 4). This is the technical north star — consult it before making structural engineering decisions.

## 1. System Layers

The system relies on a clear separation between the **Data Layer** and the **Visualization Layer**, so the same unit data is consumed by regular cards, the Masterplan, and the 3D viewer, without duplicating the source of truth.

| Layer | Responsibility |
|---|---|
| **UI Layer** | Pages and user interfaces (Next.js + React) |
| **Business Logic / API Layer** | Availability rules, pricing, permissions, recommendation, **booking concurrency control** |
| **Data Layer** | Database + cache |
| **Visualization Engine** | Independent sub-modules for 2D, 3D, and 360°, all consuming the same Unit Data Model |
| **Notification Service** | Independent module for dispatching email/SMS/in-app/push notifications, decoupled from core business logic via an event queue |

## 2. Single Source of Truth Principle

Each real estate unit is represented by **one** data record. That same record is consumed by:

- the unit card,
- the unit point on the Masterplan,
- the unit within the 3D scene,
- the unit details page.

Any update in the admin dashboard is immediately reflected across all display points — no duplicated or cached-and-stale copies of unit state.

Example simplified unit record:

```json
{
  "id": "A-302",
  "buildingId": "building-a",
  "floor": 3,
  "area": 165,
  "bedrooms": 3,
  "price": 1850000,
  "currency": "EGP",
  "status": "available"
}
```

## 3. Booking Concurrency & Consistency

Because more than one agent or customer may attempt to reserve the same unit at nearly the same time, the platform **must guarantee** a unit can only move from `available` to `reserved`/`sold` once. Rules:

1. **Atomic, transaction-safe status updates.** The `status` update on a `Unit` must be handled at the database level (row-level locking, or an optimistic concurrency check using a `version`/`updatedAt`-style field) — not merely enforced in application code.
2. **Explicit conflict response.** The API must return a clear conflict (HTTP `409`) when a reservation attempt targets a unit whose status has changed since the client last read it.
3. **Soft hold.** A short-lived, configurable hold (e.g., 10–15 minutes) locks a unit temporarily to one agent/customer while a Lead/Booking is being finalized. It auto-reverts to `available` if not confirmed in time.
4. **Full auditability.** Every status transition must be written to `AuditLog` for traceability.

> See [`03-database-schema.md`](./03-database-schema.md) for the `Unit.statusVersion` / `Unit.holdExpiresAt` fields that implement this, and [`04-api-spec.md`](./04-api-spec.md) for the exact `409` response shape.

## 4. Recommended Tech Stack

| Layer | Suggested Technology | Reason |
|---|---|---|
| Frontend Framework | Next.js + TypeScript + React | High performance, SSR/SSG, suitable for Marketing + Dashboard together |
| Styling | Tailwind CSS + shadcn/ui | Fast development of consistent, professional interfaces |
| State Management (Server State) | TanStack Query | Professional handling of API data (cache/refetch) |
| State Management (Client State) | Zustand | Simpler than Redux for local state (filters, comparison, favorites) |
| 3D Layer | Three.js + React Three Fiber + Drei | Industry standard for web 3D with good React integration |
| Backend | NestJS (Node.js + TypeScript) | Organized architecture that supports growth toward multi-tenant SaaS |
| Database | PostgreSQL | Maturity, complex relationships, geographic extensions (PostGIS when needed) |
| Storage & Media | S3-compatible storage + CDN | Fast loading of images, 3D models, 360° panoramas |
| Authentication | JWT + OAuth2 (optional later) | Flexibility to support multi-channel login |
| Notifications | Message queue (e.g., BullMQ/Redis) + email provider (e.g., SES/SendGrid) + SMS/WhatsApp Business API | Reliable, decoupled async delivery of alerts |

## 5. Architectural Module Map

```
PLATFORM
├─ Discovery        : Projects · Location · Amenities · Search
├─ Experience        : 2D/3D Masterplan · Buildings · Floors · Units · 360° Tours
├─ Decision          : Compare · Favorites · Smart Recommendation
├─ Sales             : Leads · CRM Integration · Agents · Analytics · Payment Plans
├─ Admin             : Inventory Management · Media Management · RBAC · Bulk Import
└─ Platform Services : Notifications · Audit Logging
```

## Related Documents

- [`03-database-schema.md`](./03-database-schema.md) — entities that back these modules
- [`04-api-spec.md`](./04-api-spec.md) — endpoints and the `409` conflict convention
- [`07-non-functional-requirements.md`](./07-non-functional-requirements.md) — performance/security/scalability targets this architecture must meet
