# 04 — API Specification

> The source SRS (Section 9, "Next Steps") explicitly calls for a detailed API design as a follow-up task, and does not itself define endpoints. This document derives a **starting-point REST endpoint list** from the entities in [`03-database-schema.md`](./03-database-schema.md) and the conventions/rules stated in Section 4.3 of the SRS. Treat the endpoint tables below as a draft to review with engineering, not a finalized contract.
>
> **If/when a formal OpenAPI/Swagger YAML is produced, link it here and mark this file as superseded for endpoint details** — keep the Auth Flow and Conflict/Error Conventions sections regardless, since those are cross-cutting rules every endpoint must follow.

## Auth Flow

Per the recommended stack ([`02-architecture.md`](./02-architecture.md)):

- **Scheme:** JWT bearer tokens for all authenticated requests (`Authorization: Bearer <token>`), with OAuth2 as an optional additional login channel.
- **Roles:** Access is gated by RBAC (`Role.permissions`) — Super Admin, Admin, Sales Manager, Sales Agent, Content Manager (FR-40, FR-45).
- **Guests:** Unauthenticated visitors are tracked via a `GuestSession` (cookie/local-storage-held ID), which allows `Favorite` and `Comparison` actions without login (FR-32). On registration, `GuestSession.convertedToUserId` is set and guest data is merged into the new account.
- **Public vs. protected:** Discovery/browsing endpoints (projects, units, masterplan, tours) are public and SSR/SSG-friendly for SEO (see [`07-non-functional-requirements.md`](./07-non-functional-requirements.md)). Admin/CRUD and analytics endpoints require an authenticated session with the appropriate role.

## Conflict & Error Response Conventions

These conventions exist primarily to enforce the booking-concurrency rule in [`02-architecture.md §3`](./02-architecture.md#3-booking-concurrency--consistency).

| Situation | Status Code | Notes |
|---|---|---|
| Unit status update where the unit's `statusVersion` no longer matches the client's last-read version | **409 Conflict** | Response body should include the unit's current `status`, `statusVersion`, and `holdExpiresAt` so the client can refresh state |
| Validation error (e.g., a `PaymentPlan` whose percentages don't sum to 100%) | **422 Unprocessable Entity** | Field-level error messages |
| Missing/invalid auth token | **401 Unauthorized** | |
| Authenticated but insufficient role/permission | **403 Forbidden** | |
| Entity not found | **404 Not Found** | |
| Rate limit exceeded | **429 Too Many Requests** | Required per NFR — see [`07-non-functional-requirements.md`](./07-non-functional-requirements.md) |

Suggested `409` response shape:

```json
{
  "error": "UNIT_STATUS_CONFLICT",
  "message": "This unit's status has changed since you last viewed it.",
  "current": {
    "unitId": "A-302",
    "status": "reserved",
    "statusVersion": 7,
    "holdExpiresAt": "2026-08-31T14:30:00Z"
  }
}
```

## Endpoint List by Entity

Standard CRUD verbs follow REST conventions (`GET` list/detail, `POST` create, `PATCH` update, `DELETE` remove) unless noted otherwise. Admin-only endpoints are marked 🔒.

### Projects & Discovery
| Method | Path | Notes |
|---|---|---|
| GET | `/projects` | List/search projects (FR-02, FR-03) |
| GET | `/projects/:slug` | Project detail page data (FR-01) |
| POST | `/projects` 🔒 | Create project |
| PATCH | `/projects/:id` 🔒 | Update project |
| DELETE | `/projects/:id` 🔒 | Remove project |
| GET | `/projects/:id/pois` | Points of interest for the map (FR-04, FR-05) |
| GET | `/projects/:id/amenities` | Amenities list |

### Buildings, Floors, Units
| Method | Path | Notes |
|---|---|---|
| GET | `/projects/:id/masterplan` | Masterplan data with live unit statuses (FR-08, FR-09) |
| GET | `/buildings/:id/floors` | Floor list for a building (FR-11) |
| GET | `/floors/:id/units` | Units on a floor (FR-12, FR-14) |
| GET | `/units` | Filtered unit search (FR-18) |
| GET | `/units/:id` | Unit details (FR-15, FR-16, FR-17) |
| GET | `/units/:id/price-history` | Price change timeline (FR-17a) |
| POST | `/buildings` 🔒 / `/floors` 🔒 / `/units` 🔒 | Create |
| PATCH | `/units/:id` 🔒 | Update unit fields |
| PATCH | `/units/:id/status` 🔒 | Status transition — **must go through the concurrency-safe flow**; returns `409` on conflict (FR-42) |
| POST | `/units/import` 🔒 | Bulk import via Excel/CSV: upload → validate → preview → confirm (FR-43) |

### Payment Plans
| Method | Path | Notes |
|---|---|---|
| GET | `/units/:id/payment-plan` | Effective plan (unit override or project default) (FR-53) |
| POST | `/payment-plans` 🔒 | Create plan on a project or unit (FR-45a); validate percentages sum correctly |
| PATCH | `/payment-plans/:id` 🔒 | Update plan |
| POST | `/payment-plans/:id/calculate` | Client-adjustable installment calculator (FR-54) — down payment %/duration in, recalculated schedule out |

### Virtual Tours
| Method | Path | Notes |
|---|---|---|
| GET | `/units/:id/tours` | List tours for a unit (furnished/unfurnished) |
| GET | `/tours/:id/scenes` | Scenes + hotspots for the tour (FR-22, FR-23) |
| POST | `/tours` 🔒 / `/scenes` 🔒 / `/hotspots` 🔒 | Content management |

### Favorites & Comparison
| Method | Path | Notes |
|---|---|---|
| GET/POST/DELETE | `/favorites` | Works for both `userId` and `guestSessionId` (FR-32) |
| POST | `/guest-sessions/:id/merge` | Merge guest favorites/comparisons into a newly registered account |
| GET/POST/DELETE | `/comparisons` | Up to 4 units (FR-20) |
| GET | `/comparisons/:id/share` | Shareable comparison link (FR-21) |

### Leads & Bookings
| Method | Path | Notes |
|---|---|---|
| POST | `/leads` | Create a Lead/Inquiry, works for guest or registered user (FR-35) |
| GET | `/leads` 🔒 | List/filter leads (agent/manager view) |
| PATCH | `/leads/:id` 🔒 | Update status, reassign agent |
| POST | `/bookings` | Create a viewing/booking request tied to a Lead (FR-35) |
| PATCH | `/bookings/:id` 🔒 | Confirm/complete/cancel |

### Recommendation & Analytics
| Method | Path | Notes |
|---|---|---|
| POST | `/recommendations` | Input budget/needs, get ranked matching units (FR-31) |
| POST | `/analytics/events` | Log a client-side interaction event (view_unit, apply_filter, etc.) |
| GET | `/analytics/dashboard` 🔒 | Aggregated dashboard metrics (FR-38, FR-39) |
| GET | `/analytics/kpis` 🔒 | Business KPIs vs. targets (FR-39a) |

### Admin & Users
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | JWT login |
| POST | `/auth/refresh` | Refresh token |
| GET | `/users/me` | Current user profile |
| CRUD | `/users` 🔒, `/roles` 🔒 | User & role management (FR-40, FR-45) |
| GET | `/audit-log` 🔒 | Change/status-transition history (Section 4.3, FR-42) |

### Notifications
| Method | Path | Notes |
|---|---|---|
| GET | `/notifications` | Current user's notifications (in-app feed) |
| PATCH | `/notifications/:id/read` | Mark as read |
| (internal) | Notification dispatch is event-driven via the queue, not a client-facing endpoint — see [`02-architecture.md`](./02-architecture.md) | Triggered by Lead creation (FR-57), import completion (FR-58), booking confirmation (FR-59), favorite status change (FR-60) |

### Phase 4 (Enterprise / SaaS)
| Method | Path | Notes |
|---|---|---|
| CRUD | `/developers` 🔒 | Tenant management (FR-50) |
| POST | `/integrations/crm/webhook` 🔒 | Outbound Lead sync to external CRM (FR-51) |
| — | Public API keys & webhooks | For third-party integrations (FR-52) |

## Related Documents

- [`03-database-schema.md`](./03-database-schema.md) — entities backing every endpoint above
- [`02-architecture.md`](./02-architecture.md) — concurrency rules the `PATCH /units/:id/status` endpoint must implement
- [`05-functional-requirements.md`](./05-functional-requirements.md) — FR codes referenced throughout
