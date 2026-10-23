# modules.md — Mesa Module Breakdown

Each module below maps to a folder under `features/` (see architecture.md). This doc defines *what* each module does; architecture.md defines *where* it lives; backend-api-docs.md defines *how* it talks to the server.

## Current Phase: Trial Release

Mesa is being given to 3–4 pilot cafés for a ~30-day free trial. The goal is **learning, not revenue**: find out what cafés actually use, what they value, and what they would pay for. Everything in this doc is scoped to that goal.

**The three trial modules** (build in this order — see agent-loop.md):
1. **Booking** — fix what exists, add owner-side booking
2. **Menu & Public Site** — full menu, photos, dietary tags, sold-out toggle
3. **Sales Log & Today Dashboard** — daily sales entry → dashboard → day-end email

**Supporting modules** (small, required by the three above): Tenant, Auth, Theming, Customers (minimal), Admin Panel shell, Billing (trial-aware, checkout paused), Trial Instrumentation.

Anything not listed here is out of scope — see "Explicitly Not in the Trial" at the bottom.

## 1. Tenant Module
**Purpose:** Resolve which café/SMB a request belongs to, and provide tenant context everywhere downstream.
- Resolve tenant from subdomain (`tenant.mesa.app`) or custom domain (later). On localhost, derive the tenant slug from the page URL, never hardcode a tenant
- Provide tenant config (name, theme reference, tier, contact info, timezone, currency) via context to both public site and admin panel
- **Timezone and currency are tenant settings** (`timezone` IANA name, default `Asia/Kolkata`; `currency` ISO code, default `INR`). All business-date logic ("today", slot generation, day-end report) uses the tenant's timezone via `lib/time.ts` — never the server's timezone. All money display uses the tenant's currency — no hardcoded currency symbols
- Enforce that all downstream queries are scoped to the resolved tenant — this is the multi-tenancy backbone, treat it as security-critical, not just convenience

## 2. Auth Module
**Purpose:** Identity and access, per tenant.
- Better Auth handles identity, sessions, and organization membership: one Better Auth Organization per tenant, with sign-in/sign-up/session/invites
- Application roles live on Mesa's tenant-scoped staff record and are checked by `guards.ts`; Better Auth organization roles do not grant access to Mesa features
- **Fixed roles** (not an admin-buildable role system yet):
  - **Owner** — everything: bookings, menu, sales log, dashboard, settings, billing, staff management
  - **Manager** — bookings, customers, menu, sales log, dashboard, exports; no settings/billing
  - **Staff: Bookings** — booking calendar/list, add/update bookings, customer list (read); nothing else
  - **Staff: Orders** — reserved for a future orders module; has no accessible screens during the trial, do not assign it
- Guards: helper functions in `guards.ts` that check both "is this user authenticated" and "does this user's role permit this action" — every admin route/action checks against the fixed role list above, never an ad-hoc inline check. Every admin API must verify the signed-in user belongs to the tenant being acted on
- Staff management UI (list + assign role) is **not** part of the trial; the API already exists. If a trial café asks for it, it is the first addition
- Fully custom, admin-buildable roles is a later (Custom-tier) capability — build only once a real client outgrows the fixed roles

## 3. Theming Module
**Purpose:** Make each tenant's public site look distinctly on-brand while sharing the same component library.
- Theme tokens: colors, fonts, spacing overrides, layout variant selection (see color-system.md for the color half of this)
- Themeable components: Hero, MenuGrid, Gallery, Footer, CTA — each accepts theme tokens as props/context, never hardcodes style
- Motion stays minimal by default (see design.md)
- Ships with exactly ONE default theme. Additional themes are added only after a trial café's needs justify a new variant

## 4. Public Site Module
**Purpose:** The tenant-facing landing experience. Clean, fast, easy to scan on a phone.
- Pages: landing `/[tenant]`, full menu `/[tenant]/menu`, booking `/[tenant]/book`, booking status `/[tenant]/booking-status`
- Landing: hero (café name, today's hours, Book button), menu preview (featured items, link to the full menu), location/hours, contact block
- Contact block (from `businessInfo`): click-to-call phone number, address with a map link, optional Instagram link
- Fully server-rendered for SEO (people search "cafes near me")
- Pulls content from the Admin Panel's stored data — content lives in one place, rendered here
- Public usage events (`menu_view`, `book_click`, `booking_started`) are sent via `POST /api/usage` — fire-and-forget, never block the UI
- Gallery is deferred

## 5. Booking Module
**Purpose:** Let an end customer book a table without leaving the café's site, and let the café manage every booking in one place.

**Availability**
- Slots are generated from the tenant's opening hours. Resolution order for any date: `dateOverrides` (exact date) → `weeklyOverrides` (weekday) → `routine`. A closed day returns no slots plus the reason, if given
- Opening-hours windows may cross midnight (e.g. `20:00–02:00`). A slot belongs to the date on which it starts
- Slot interval comes from `slotIntervalMinutes` (default 30). **Never hardcode slot times anywhere**
- There is exactly **one slot generator** (`features/booking/server/availability.ts`). The public availability API, the booking validation, and the admin timeline all use it — no second copy
- Capacity stays **seat-based** in the trial (`seatCapacity`, `maxPartySize`). Table-level assignment is deferred; the UI says "seats", not "tables"
- A booking occupies seats from `time` to `endTime`. Capacity counts overlapping bookings in status `pending` or `confirmed` (a pending booking holds its seats)

**Creating bookings**
- Capacity check and insert happen in **one database transaction** (lock the tenant row or use serializable isolation) so two simultaneous requests cannot both pass capacity. If the slot just filled, return a clean 409
- Contact: `phone` is required, `email` is optional. Email notifications are sent only when an email exists — never email a phone number
- `source` on every booking: `online`, `phone`, or `walk_in`
- Status flow: `pending → confirmed | cancelled | no_show`. Tenant setting `autoConfirmBookings` (default off): when on, online bookings start as `confirmed`
- Owner-side booking: owner, manager and staff_bookings can add a booking from the admin panel (`phone` or `walk_in`). Same capacity rules; created as `confirmed`; customer notification optional
- Abuse guard (trial level): a honeypot field on the public form, and at most 3 online bookings per phone number per day. No OTP or captcha in the trial

**Wording must match reality** — one wording, used on screen, in email and on the status page:
- `pending` → "Request received — the café will confirm shortly"
- `confirmed` → "Booking confirmed"
- Never say "confirmed" or "reserved" for a pending booking

**Deferred:** customer self-cancel/reschedule (status page stays view-only), reminders, deposits, table assignment

## 6. Menu Module
**Purpose:** Single source of truth for what the café sells. Powers the public menu now and ordering/sales detail later.
- Item fields: name, description, price, category, `dietaryType` (`veg`, `non_veg`, `egg`), `imageUrl`, `available`, `sortOrder`, `isFeatured`
- `dietaryType` is **required** when creating or editing an item through the API. Legacy rows may be empty: the admin UI flags them ("Set type") and the public site shows **no** tag for them — never assume veg
- Photos: upload via UploadThing (images only, ≤ 4 MB) in the item form; the returned URL is saved as `imageUrl`
- **Sold out** is one tap in the admin list (`available` toggle). Sold-out items stay visible on the public menu with a "Sold out" label — do not hide them
- Public menu page: all items grouped by category; categories ordered by the lowest `sortOrder` among their items; items ordered by `sortOrder`, then name
- Landing preview: featured items first (`isFeatured`), otherwise the first 6 by `sortOrder`. Never alphabetical-by-category
- **Deferred:** variants/sizes, add-ons, combos, time-based menus, allergens/spice level, CSV import, AI "photo of menu → items" extraction (strong onboarding idea — build after the trial if cafés complain about setup effort)

## 7. Sales Log & Today Dashboard Module
**Purpose:** Let the owner see the money side with minimal effort, without changing the counter workflow — and tell us whether owners keep the habit.

**Sales log**
- One entry per tenant per local date: `ordersCount`, `cash`, `upi`, `card`, `other` (amounts), optional `notes`. The server computes `totalSales` as the sum of the four amounts. Entry should take about two minutes: five numbers and Save
- Allowed for today and any past date in the tenant's timezone, never a future date
- Entries can be edited; every entry stores `createdBy`, `updatedBy`, `updatedAt`. No delete from the UI — history must stay trustworthy (correct a mistake by editing)
- Average order value = `totalSales / ordersCount`, shown only when `ordersCount > 0`

**Today dashboard** (owner and manager)
- 4 KPI cards: Sales, Orders, Average order value, Bookings today (with covers). Each shows change vs yesterday and vs the same weekday last week ("—" when the comparison day has no data)
- A prompt card when today's sales are not logged yet: "Log today's sales"
- 7/30-day sales trend chart, payment-mode split chart, bookings-by-hour chart. **Maximum three charts**, nothing else on the screen
- Empty states say what to do next

**Day-end email** (Resend, email only)
- Sent each evening at 22:30 tenant-local time to the owner: today's sales, orders, average order value, bookings, change vs yesterday. If sales were not logged, send a short nudge instead
- One daily cron is enough while all trial cafés are in India; revisit per-timezone scheduling before going global

**Export:** CSV for the sales log and for bookings, by date range. Excel/PDF/GST reports are deferred

**Deferred:** item-wise sales, expenses and P&L, hour-wise sales (needs orders), plain-language insights, milestones

## 8. Customers Module (minimal)
**Purpose:** A free by-product of bookings and the foundation for a later CRM.
- One customer per tenant + phone number: latest name, phone, optional email, `firstSeenAt`, `lastBookingAt`, `bookingCount`, `noShowCount`
- Written only by the Booking module (through the customers service) when a booking is created or its status changes
- Admin page: read-only list with search by name or phone
- No campaigns, loyalty, segments, birthdays or feedback in the trial

## 9. Admin Panel Module
**Purpose:** Where the café owner/staff manages everything. Organised around four jobs: check today's bookings, update the menu, log today's sales, see the numbers.
- Sidebar: Dashboard (Today), Bookings, Menu, Sales, Customers, Settings, Billing, link to the public site. Show only what the user's role allows
- **Settings** (owner): business info (name, phone, address, map link, Instagram), opening hours (routine, weekday overrides, date overrides), capacity, booking settings (auto-confirm, slot interval), timezone and currency
- **Billing** page during the trial shows trial status and end date only — no checkout
- Analytics beyond the dashboard, inventory, orders: not in the trial

## 10. Billing Module (trial-aware)
**Purpose:** Keep tier logic in one place and make the trial work without charging anyone.
- `tier-config.ts` stays the single source of truth for what each tier unlocks. Add feature flags `salesLog` and `dashboard`. `analytics` stays reserved for deeper analytics later
- **Trial rule:** while `subscriptionStatus === "trial"`, all trial modules and settings are unlocked regardless of tier. Trial length is a constant in `tier-config.ts` (`TRIAL_DAYS = 30`)
- Post-trial tier mapping and pricing are **intentionally undecided** — they will be set from trial findings. Until then `salesLog` and `dashboard` are `false` on every paid tier (reachable only through the trial)
- Onboarding during the trial skips plan selection: the tenant is created with `subscriptionStatus = "trial"` and `trialEndsAt = now + TRIAL_DAYS`
- `trialEndsAt` is informational in this phase: show a non-blocking banner when it passes. **Do not lock features and do not wire Razorpay checkout.** Jay extends or converts tenants manually
- Existing Razorpay code (create-subscription, verify, webhook) stays in the repo but is not surfaced in the UI

## 11. Trial Instrumentation Module
**Purpose:** Measure what cafés actually do, so decisions come from usage and not from guesses.
- `UsageEvent` records: tenant, optional user, event type, small metadata, timestamp
- Public events (anonymous, via `POST /api/usage`): `menu_view`, `book_click`, `booking_started`
- Server-side events (recorded inside the handlers): `booking_created` (meta: source), `booking_status_changed`, `dashboard_opened`, `sales_log_saved`, `menu_item_edited`, `menu_item_toggled`, `report_exported`, `day_end_email_sent`
- **No personal data in metadata** — no names, phone numbers or emails
- Metrics are read with SQL in the Neon console (no UI needed): bookings per week by source; no-show % = `no_show / (confirmed + no_show)`; days with a sales entry ÷ days since trial start; dashboard opens per week; menu edits per week; funnel `menu_view → book_click → booking_created`

## Data Model Changes (additive migrations only)
Never drop or rewrite a column that holds data in the same migration that introduces its replacement.
- **Tenant:** add `timezone` (default `Asia/Kolkata`), `currency` (default `INR`), `autoConfirmBookings` (default false), `slotIntervalMinutes` (default 30), `trialEndsAt`, `lastDayEndReportDate`. `openingHours` JSON gains an optional `weeklyOverrides` (existing saved hours stay valid)
- **Booking:** add `source` (enum `online | phone | walk_in`, default `online`), `phone`, `email`, `customerId`. Backfill `phone`/`email` from `contact` (email if it contains `@`, otherwise phone), then keep `contact` until the next release before dropping it
- **MenuItem:** add `dietaryType` (nullable enum `veg | non_veg | egg`), `sortOrder` (default 0), `isFeatured` (default false)
- **Customer (new):** `tenantId`, `name`, `phone`, `email?`, `firstSeenAt`, `lastBookingAt?`, `bookingCount`, `noShowCount`; unique on `[tenantId, phone]`
- **SalesLog (new):** `tenantId`, `date`, `ordersCount`, `cash`, `upi`, `card`, `other`, `totalSales`, `notes?`, `createdBy?`, `updatedBy?`, timestamps; unique on `[tenantId, date]`
- **UsageEvent (new):** `tenantId`, `userId?`, `type`, `meta?`, `createdAt`; index on `[tenantId, type, createdAt]`



## Phase 3 (planned, after the trial) — Order-to-Billing

**Not in scope yet.** Captured here only so the trial-phase schema doesn't collide with it later, and so the agent doesn't need to rediscover this design from scratch when the time comes. Full workflow, channels and open questions are documented in Notion: "Order-to-Billing (planning)". Summary:

- **Channels, one order engine:** table QR, counter self-service (token-based), waiter tablet (PIN login), pen-and-paper (front desk manual entry with a "KOT already sent" toggle). Build order: front desk staff-entry screen first, then waiter tablet, then counter QR, then table QR last
- **Key data-model decision:** a table can hold several orders in one sitting, so the model is `TableSession` (has many `Order`s) → one `Bill` (has one or more `Payment`s, to support split payment) — **not** one bill per order
- **New entities (future):** `Ingredient`, `ModifierGroup`/`ModifierOption` (add-ons/toppings, required/optional, max selections, priced), `TableSession`, `Order`, `OrderItem`, `Bill`, `Payment`. `MenuItem` would gain ingredients, allergen tags, and modifier links
- **Order type and payment method** both stay editable at the front desk until a bill is marked Paid; editing order type recalculates the bill (e.g. dine-in → takeaway may drop service charge, add packaging charge). Every edit is logged
- **Allergy/medical notes** on an order are a request, not a guarantee — say so on screen; allergen tags plus free text, both printed clearly on the KOT
- **Billing stays staff-initiated:** payment happens at the front desk (cash/UPI/card/split, recorded not gatewayed); bill PDF always goes to the customer's contact, collected at billing time (not order time, to avoid hurting order conversion)
- **Feeds the existing Customer record** (phone-keyed, same one bookings use) for repeat-visit recognition, loyalty/coupons/gift cards
- **Offline handling (decided):** device-side store-and-forward, not a message broker like Kafka — Kafka solves broker-durability, not "tablet can't reach the server," and would mean every café running its own queue infrastructure. Chosen approach: PWA with IndexedDB write-on-submit, background sync retry, and a client-generated idempotency key on every order so a retry can never create a duplicate. Offline only covers *placing* an order — billing needs connectivity, since bill numbers are sequential and server-issued. A 4G-backup router is the cheaper fix for most real outages; paper is the natural fallback
- **Explicitly deferred further:** delivery (own product concern — address, fee, rider), screen-based kitchen display (print-only is fine to start)

## Explicitly Not in the Trial
- POS / billing / KOT / printers, QR ordering, orders of any kind
- Inventory and recipes, expenses and P&L
- Loyalty, coupons, campaigns, feedback and reviews
- Staff PIN login, shifts, audit log, staff-management UI
- Outlets and chain dashboards. Tenant = one business. When chains are needed, add `Outlet` as a child of Tenant with a nullable `outletId` on bookings and sales — keep every new table `tenantId`-scoped so that stays an additive change
- Table-level booking assignment, customer self-cancel/reschedule, booking deposits and reminders
- WhatsApp integration (email only)
- Additional themes, Excel/PDF/GST reports, translations (keep UI copy short and plain so Hindi/Gujarati can be added later)
