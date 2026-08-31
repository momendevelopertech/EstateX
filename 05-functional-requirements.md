# 05 — Functional Requirements

> Source: `EstateX_SRS_Backlog_DB_EN_v1_1.md` (Section 5). Each requirement has a unique code (FR-xx) traced against Product Backlog items in [`06-product-backlog.md`](./06-product-backlog.md). Priority follows the MoSCoW method (Must / Should / Could / Won't). This is a stable reference — it should stay in sync with backlog *content*, but ticket status/movement lives in the backlog file, not here.

## 5.1 Discovery & Landing

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-01 | Display a project home page (Hero) including an introductory image/video, name, developer, location, status, starting price, and number of available units | Must | 1 |
| FR-02 | A list/grid to display multiple real estate projects when there is more than one project | Must | 1 |
| FR-03 | General search across projects by name, location, or price range | Must | 1 |

## 5.2 Location Experience

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-04 | An interactive map showing the project location and surrounding points of interest (POI): airports, schools, hospitals, malls, transportation | Must | 1 |
| FR-05 | Display the distance/time between the project and each point of interest, with the ability to click on each POI to view its details | Should | 1 |

## 5.3 Interactive Masterplan

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-06 | Display the Masterplan in 2D format, zoomable and pannable | Must | 1 |
| FR-07 | Display the Masterplan in 3D format, orbitable and zoomable, with the ability to select the building directly from the scene | Should | 2 |
| FR-08 | Color-code the status of each building/unit on the plan by availability: available (green) / reserved (yellow) / sold (red) / unavailable (gray), directly linked to actual inventory data | Must | 1 |
| FR-09 | Automatically update the plan when filters are applied (not just the card list) | Must | 1 |
| FR-10 | Day/Night mode and Sun Path simulation based on the selected date and time | Could | 2 |

## 5.4 Building & Floor Explorer

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-11 | Navigate from the general plan to a specific building, then display a list/plan of the floors within it | Must | 1 |
| FR-12 | A Floor Switcher tool showing the units on each floor | Must | 1 |
| FR-13 | Display an explorable 3D building with visual navigation between floors | Could | 2 |

## 5.5 Unit Selector & Unit Details

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-14 | Display all units on the floor interactively, clickable to open each unit's details | Must | 1 |
| FR-15 | Unit details page/panel: unit number, building, floor, type, area, number of rooms and bathrooms, price, availability status | Must | 1 |
| FR-16 | Additional details: balcony, terrace, parking spot, storage, garden, view, orientation, ceiling height | Should | 1 |
| FR-17 | Display the unit's floor plan, gallery photos, and 3D viewer for the unit | Must | 1 |
| FR-17a | Display the unit's historical price changes as a simple timeline/chart on the unit details page (investor-facing) | Should | 3 |

## 5.6 Advanced Filtering Engine

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-18 | Filter by: price (range), area (range), number of rooms, unit type, floor (ground/low/medium/high), availability status, view, and additional amenities (balcony/terrace/parking/garden) | Must | 1 |
| FR-19 | Save search results/criteria as a "Saved Search" to return to later | Could | 3 |

## 5.7 Unit Comparison

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-20 | Select multiple units (up to 4) and display them in a side-by-side comparison table of the most important features | Should | 3 |
| FR-21 | Share a direct link to the comparison result | Could | 3 |

## 5.8 Virtual Property Tour (360°)

Built on an independent data model (`VirtualTour → Scenes → Hotspots`) — see [`03-database-schema.md`](./03-database-schema.md).

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-22 | An interactive 360° tour for each unit, covering all rooms (living room, kitchen, bedrooms, bathrooms, balcony) | Must | 2 |
| FR-23 | Navigate between rooms via interactive points (Hotspots) within the panoramic scene | Must | 2 |
| FR-24 | Support movement within the scene via mouse on desktop and touch on mobile/tablet | Must | 2 |
| FR-25 | Display an indicator of the user's current location within a Mini Floor Plan Indicator during the tour | Should | 2 |
| FR-26 | Display room dimensions and areas within the tour itself | Should | 2 |
| FR-27 | Display the unit furnished and unfurnished, with the ability to switch between the two states | Could | 2 |
| FR-28 | Change finishes and colors (Finishes Customizer) for some unit elements (flooring, paint) within the tour | Could | 2 |
| FR-29 | Support viewing the tour via a VR headset as an optional advanced experience mode | Won't (Phase 4) | 4 |

## 5.9 Balcony & View Experience

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-30 | From the unit page, the ability to view the balcony view as a 360° scene showing the direction and neighboring buildings/landmarks | Could | 2 |

## 5.10 Smart Recommendation Engine

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-31 | Enter user requirements (budget, number of rooms, area, preferred view) and display the best matching units with a percentage match | Should | 3 |

## 5.11 Favorites, Sharing & QR

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-32 | Add/remove a unit from "My Favorites" list, available to both guest sessions and registered users, with guest data merged into the account upon later registration | Should | 3 |
| FR-33 | A direct link (Deep Link) for each unit, shareable via any channel | Must | 3 |
| FR-34 | Generate a QR code for each unit for use at the sales center and in printed materials | Could | 3 |

> **Rationale for FR-32:** requiring a registered `userId` for `Favorite`/`Comparison` while `Lead` supported guests forced visitors to register just to save a unit — a common drop-off source. See `GuestSession` in [`03-database-schema.md`](./03-database-schema.md).

## 5.12 Lead Capture

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-35 | An "Request Information / Book a Viewing" form that appears at key points of interest (after viewing the unit, comparison, view) | Must | 1 |
| FR-36 | Save the full interest context with each Lead: project, building, unit, filters used, pages visited, time spent | Should | 3 |
| FR-37 | A direct WhatsApp contact button from the unit page | Must | 1 |

## 5.13 Analytics

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-38 | An analytics dashboard showing: visitors, project views, Masterplan interaction, unit views, favorites, comparisons, Leads, bookings | Should | 3 |
| FR-39 | Reports: most viewed buildings/units, most searched price range, average session duration, conversion rate | Could | 3 |
| FR-39a | Dashboard displays defined business KPIs against targets — see [`07-non-functional-requirements.md`](./07-non-functional-requirements.md) | Should | 3 |

## 5.14 Admin & Inventory

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-40 | Secure login to the dashboard with role-based permissions (RBAC) | Must | 1 |
| FR-41 | Full CRUD management of projects, buildings, floors, and units | Must | 1 |
| FR-42 | Update unit availability status (available/reserved/sold/hidden) with immediate reflection on the interface and the plan, enforced through the concurrency-safe transition — see [`02-architecture.md §3`](./02-architecture.md#3-booking-concurrency--consistency) | Must | 1 |
| FR-43 | Bulk import of units via Excel/CSV file with steps: upload → validate → preview → confirm | Should | 1 |
| FR-44 | Media management (photos, plans, 360° tours, 3D models, videos, documents) for each project/unit | Must | 1 |
| FR-45 | Tiered permissions: Super Admin, Admin, Sales Manager, Sales Agent, Content Manager | Should | 1 |
| FR-45a | Admin can define and attach payment plan templates (down payment %, number of installments, frequency, optional interest/handling fee) to a project or an individual unit | Must | 1 |

## 5.15 Payment & Pricing

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-53 | Display available payment plans on the unit details page (down payment, monthly/quarterly installment amount, payment duration, final delivery-linked payment if applicable) | Must | 1 |
| FR-54 | A simple interactive installment calculator letting the buyer adjust down payment % or duration and see the resulting installment estimate | Should | 1 |
| FR-55 | Support displaying unit prices in multiple currencies (e.g., local currency + USD) based on user preference or locale | Could | 2 |
| FR-56 | Maintain a price history log per unit, used to power FR-17a | Should | 1 |

## 5.16 Notifications

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-57 | Notify the assigned sales agent (in-app + email) immediately when a new Lead is created or assigned to them | Must | 1 |
| FR-58 | Notify relevant admins/managers when a unit's status changes to `sold` or when a bulk import completes (success/failure summary) | Should | 1 |
| FR-59 | Send the customer a confirmation (email/SMS/WhatsApp) when their information request or booking is received | Should | 1 |
| FR-60 | Notify a customer who favorited a unit if its price or availability status changes | Could | 3 |

## 5.17 Localization & Responsiveness

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-46 | Full support for Arabic and English with RTL/LTR direction and number/currency formatting | Must | 1 |
| FR-47 | Responsive design with three experience levels: desktop (full experience), tablet (presentation view), mobile (simplified, lightweight experience) | Must | 1 |

## 5.18 Sales Center & Offline Mode

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-48 | A Presentation Mode for the sales center on large screens with a "Reset Experience" button between customers | Could | 4 |
| FR-49 | Support for a cached/isolated experience when internet connectivity is weak or unavailable inside sales centers | Could | 4 |

## 5.19 Multi-tenant & Integrations

| Code | Description | Priority | Phase |
|---|---|---|---|
| FR-50 | A multi-tenant architecture allowing multiple real estate developers to manage their projects in isolation on the same platform | Should | 4 |
| FR-51 | Integration with external CRM systems to automatically send Leads with full context data | Should | 4 |
| FR-52 | Public APIs and Webhooks for integration with third-party systems | Could | 4 |

## Related Documents

- [`06-product-backlog.md`](./06-product-backlog.md) — user stories implementing these FRs, organized by phase
- [`03-database-schema.md`](./03-database-schema.md) — data model backing these requirements
- [`04-api-spec.md`](./04-api-spec.md) — endpoints implementing these requirements
