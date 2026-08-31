# 06 — Product Backlog

> Source: `EstateX_SRS_Backlog_DB_EN_v1_1.md` (Section 7). Format: **As a... I want... so that...**, with brief acceptance criteria and priority. This is the source list to import into Jira/Linear — each story number below can become a ticket ID (`EST-1`, `EST-2`, ...). FR-code traceability lives in [`05-functional-requirements.md`](./05-functional-requirements.md).

## Phase 1 — Foundation & Core Property Experience

### Epic 1.1 — Project & Location Discovery

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 1 | As a visitor, I want to see an attractive project home page showing the key information, so that I understand the general idea within seconds | The main image/video, name, location, starting price, and "Explore Project" button appear | Must |
| 2 | As a visitor, I want to see an interactive map with surrounding points of interest, so that I can evaluate the project's location | The map shows at least 5 POI categories with distance/time to each point | Must |

### Epic 1.2 — Masterplan & Unit Exploration

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 3 | As a visitor, I want to zoom and pan within the project's Masterplan, so that I can easily explore all the buildings | Smooth Zoom/Pan support on desktop and mobile | Must |
| 4 | As a visitor, I want to see the status of each building/unit (available/reserved/sold) by color, so that I know what's actually available | Colors are directly linked to the status field in the database and update instantly | Must |
| 5 | As a visitor, I want to select a building, then a floor, then a unit in sequence, so that I can quickly reach the details of the unit I'm interested in | The Masterplan → Building → Floor → Unit path does not exceed 3 clicks | Must |
| 6 | As a visitor, I want to see a complete unit details page (area, rooms, price, plan, photos), so that I can evaluate it accurately | All core fields appear along with photos and Floor Plan | Must |

### Epic 1.3 — Filtering & Search

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 7 | As a buyer, I want to filter units by price, area, and number of rooms, so that I can reach the units that suit me only | At least 6 core filters, with instant updates to results and the plan | Must |
| 7a | As a visitor, I want to search across all projects by name, location, or price range, so that I can quickly find relevant listings when multiple projects exist | Search returns matching projects within 1 second for a typical dataset | Must |

### Epic 1.4 — Core Admin Dashboard

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 8 | As an admin, I want to log in securely to the dashboard, so that I can manage the project's data | JWT authentication, account lockout after repeated failed attempts | Must |
| 9 | As an admin, I want to add/edit/delete projects, buildings, and units, so that the platform's data is always up to date | Full CRUD operations with data validation | Must |
| 10 | As an admin, I want to update any unit's availability status with one click, so that changes are reflected to end customers immediately | The update appears to the end user without needing a redeploy, and a conflicting concurrent update is rejected with a clear error instead of silently overwriting | Must |

### Epic 1.5 — Basic Lead Capture

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 11 | As an interested visitor, I want to send an information request or contact via WhatsApp from the unit page, so that I can speak directly with the sales team | A contact form + WhatsApp button both work from every unit page | Must |

### Epic 1.6 — Payment Plans

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 32 | As an admin, I want to define a payment plan template (down payment %, number/frequency of installments) and attach it to a project or unit, so that buyers see accurate payment options | At least one payment plan can be created and linked to a unit; validation prevents invalid splits (e.g., percentages not summing to 100%) | Must |
| 33 | As a buyer, I want to see the available payment plan and an estimated installment breakdown on the unit page, so that I understand what I would actually pay | Down payment, installment amount, and duration are clearly displayed | Must |
| 34 | As a buyer, I want to adjust the down payment percentage and instantly see the recalculated installment, so that I can explore what fits my budget | Recalculation happens client-side without a page reload | Should |

### Epic 1.7 — Notifications

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 35 | As a sales agent, I want to be notified immediately when a new Lead is assigned to me, so that I can respond quickly | In-app notification + email sent within 1 minute of Lead creation | Must |
| 36 | As an admin, I want to be notified when a bulk unit import finishes, so that I know whether it succeeded or needs correction | A summary notification (rows imported/failed) is delivered on completion | Should |
| 37 | As a customer, I want to receive a confirmation after submitting an inquiry or booking request, so that I know it was received | Confirmation sent via email/SMS/WhatsApp within a few minutes | Should |

---

## Phase 2 — Immersive Experience

### Epic 2.1 — 3D Masterplan & Buildings

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 12 | As a visitor, I want to explore the general plan in a rotatable 3D format, so that I get a realistic impression of the project | Smooth Orbit/Zoom control at 30fps+ on mid-range devices | Should |
| 13 | As a visitor, I want to enable day/night mode and see the sun path, so that I can evaluate the building's natural lighting | Instant toggle between the two modes with sun angle simulation based on time | Could |

### Epic 2.2 — 360° Virtual Tour

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 14 | As a buyer, I want to walk through the unit via 360° scenes for each room, so that I feel as if I'm actually inside it | A complete tour of at least 5 scenes (living room, kitchen, 2 bedrooms, bathroom) with smooth transitions | Must |
| 15 | As a buyer, I want to move between rooms by clicking interactive points (Hotspots) within the scene, so that I can navigate naturally without returning to an external list | Each scene contains at least one Hotspot leading to another scene | Must |
| 16 | As a mobile user, I want to control the tour via touch and drag, so that the experience works smoothly on my phone | Support for standard touch gestures (drag, two-finger zoom) | Must |
| 17 | As a buyer inside the tour, I want to see an indicator of my current location on a mini map of the unit, so that I don't lose my orientation | A Mini-map element that updates with each transition between rooms | Should |
| 18 | As a buyer, I want to see the dimensions and area of each room during the tour, so that I can accurately assess the size of the spaces | Dimension labels appear as a togglable/hideable overlay | Should |
| 19 | As a buyer, I want to try changing finishes (flooring/paint) within the tour, so that I can imagine the unit in my own style | At least 3 finish options, instantly switchable within the scene | Could |

### Epic 2.3 — View Experience

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 20 | As a buyer, I want to see the unit's balcony view as a 360° scene, so that I know what I'll actually see from the home | A dedicated view scene for each unit (or group of similarly-oriented units) | Could |

---

## Phase 3 — Sales Intelligence

### Epic 3.1 — Comparison & Favorites

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 21 | As a buyer, I want to select multiple units and compare them in one table, so that I can make my decision without leaving the platform | Comparison of up to 4 units in one table covering all core fields; works for guest sessions, not only logged-in users | Should |
| 22 | As a buyer, I want to save the units I liked in a favorites list, so that I can easily return to them later | A "My Favorites" list saved and linked to the user's account/session, including a guest session that gets merged into the account if the user later registers | Should |
| 22a | As a buyer who favorited a unit, I want to be notified if its price or status changes, so that I don't miss an update | Notification triggered on relevant field change for favorited units | Could |

### Epic 3.2 — Smart Recommendation

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 23 | As a buyer, I want to enter my budget and needs and get the best matching units, so that I save the time of manual searching | At least 3 results shown, ranked by percentage match | Should |

### Epic 3.3 — Sharing & Deep Links

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 24 | As a sales agent, I want to share a direct link to a specific unit with my customer, so that they open it directly without searching from scratch | A shareable link (deep link) for each unit that opens its page directly | Must |
| 25 | As a sales agent, I want to generate a QR code for any unit, so that I can use it in print materials and at the sales center | Instant, downloadable QR generation for each unit | Could |

### Epic 3.4 — Lead Intelligence & Analytics

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 26 | As a sales manager, I want to see the interest context of each Lead (units viewed, compared, filtered), so that my team can follow up with accurate information | Each Lead is linked to a complete interaction record (pages, filters, units) | Should |
| 27 | As a sales manager, I want an analytics dashboard showing the most viewed units and the conversion rate, so that I can make better pricing and marketing decisions | A dashboard showing at least 6 key metrics, updated daily | Could |
| 27a | As a sales manager, I want to see our core business KPIs (conversion rate, avg. response time, monthly Leads vs. target) against defined targets, so that I can track performance, not just raw numbers | Dashboard shows KPI values alongside their targets — see [`07-non-functional-requirements.md`](./07-non-functional-requirements.md) | Should |
| 27b | As an investor, I want to see a unit's price history on its details page, so that I can judge its value trend before deciding | A simple line/timeline of price changes over time is visible | Should |

---

## Phase 4 — Enterprise / SaaS

### Epic 4.1 — Multi-tenancy

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 28 | As the platform owner, I want to host multiple real estate developers each in their own isolated space, so that I can sell the platform as a SaaS service | Full data isolation and branding for each Developer | Should |

### Epic 4.2 — Integrations & Advanced Permissions

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 29 | As a technical manager on the client's side, I want to connect the platform to our own CRM system, so that Leads reach our sales team automatically | Integration via API/Webhook that sends complete Lead data as soon as it's created | Should |
| 30 | As a Super Admin, I want granular permissions for each role and an audit log for every change, so that I can ensure data security and transparency | An audit log recording who made the change, what was changed, and when | Could |

### Epic 4.3 — Sales Center Mode

| # | User Story | Acceptance Criteria (Brief) | Priority |
|---|---|---|---|
| 31 | As a sales agent at the showroom, I want a presentation mode on a large screen with a reset button, so that I can quickly start a new experience with each customer | A Reset button that returns the general plan to its default state within one second | Could |

---

## Related Documents

- [`05-functional-requirements.md`](./05-functional-requirements.md) — the FR-xx codes each story traces back to
- [`03-database-schema.md`](./03-database-schema.md) — entities each story touches
- [`07-non-functional-requirements.md`](./07-non-functional-requirements.md) — the "Definition of Done" quality bar every story must meet regardless of Epic
