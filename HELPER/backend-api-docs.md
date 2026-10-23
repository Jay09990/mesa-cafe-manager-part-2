# backend-api-docs.md — Mesa API Contracts

All endpoints are tenant-scoped. Write endpoints may receive the tenant **slug** (so the server knows which tenant the page is for), but the server must always verify that the authenticated user belongs to that tenant — a client-supplied slug or id is never trusted on its own. Public read-only endpoints resolve the tenant from the subdomain/slug.

Base pattern: `/api/{resource}` for public-facing, `/api/admin/{resource}` for admin-panel-only (auth required, role-checked). Allowed roles are listed per endpoint.

---

## Tenant

### `GET /api/tenant/config`
Public. Resolves current tenant from subdomain.
**Response `data`:**
```json
{
  "id": "string",
  "name": "string",
  "tier": "basic | standard | premium | custom",
  "theme": { "themeId": "string", "colors": {}, "fonts": {} },
  "businessInfo": { "address": "string", "phone": "string", "mapUrl": "string | null", "instagramUrl": "string | null" },
  "openingHours": { "routine": [], "weeklyOverrides": {}, "dateOverrides": [] },
  "timezone": "Asia/Kolkata",
  "currency": "INR",
  "autoConfirmBookings": false
}
```
Keep existing `businessInfo` keys working; the new keys are optional additions.

### `PATCH /api/admin/tenant/capacity` *(existing)*
Owner only. **Payload:** `{ "tenant": "slug", "seatCapacity": 1-1000, "maxPartySize": 1..seatCapacity }`

### `PATCH /api/admin/tenant/hours` *(existing, extended)*
Owner only. **Payload:** `{ "tenant": "slug", "openingHours": OpeningHours }`
```json
{
  "routine": [{ "startTime": "08:00", "endTime": "12:00" }],
  "weeklyOverrides": { "mon": { "isClosed": true, "slots": [] }, "sat": { "slots": [{ "startTime": "10:00", "endTime": "23:00" }] } },
  "dateOverrides": [{ "date": "YYYY-MM-DD", "slots": [], "isClosed": true, "reason": "string" }]
}
```
- `endTime` earlier than `startTime` means the window crosses midnight
- Resolution order for a date: `dateOverrides` → `weeklyOverrides[weekday]` → `routine`
- `weeklyOverrides` is optional; hours saved before it existed remain valid

### `PATCH /api/admin/tenant/settings` *(new)*
Owner only. **Payload (all optional):**
```json
{ "tenant": "slug", "timezone": "Asia/Kolkata", "currency": "INR", "autoConfirmBookings": false, "slotIntervalMinutes": 30, "businessInfo": {} }
```
`slotIntervalMinutes` must be one of 15, 30, 45, 60. `timezone` must be a valid IANA name.

---

## Menu

### `GET /api/admin/menu`
Owner, manager. All menu items for the tenant.

### `POST /api/admin/menu`
Owner, manager.
**Payload:**
```json
{ "name": "string", "description": "string", "price": 0, "category": "string", "dietaryType": "veg | non_veg | egg", "imageUrl": "string | null", "available": true, "sortOrder": 0, "isFeatured": false }
```
`dietaryType` is required. **Response:** created menu item with `id`.

### `PATCH /api/admin/menu/:id`
Owner, manager. Partial update of any field above. The one-tap sold-out toggle is `PATCH` with `{ "available": false }`. `dietaryType`, if sent, must be valid.

### `DELETE /api/admin/menu/:id`
Owner, manager. **Response:** `{ "success": true }`

### `GET /api/menu` *(public, changed)*
Returns **all** items for the public site, including sold-out ones (`available: false`), sorted by `sortOrder`, then name. Each item includes `dietaryType` (may be null for legacy rows), `imageUrl`, `category`, `sortOrder`, `isFeatured`.

### Image upload — `POST /api/uploadthing`
UploadThing route handler (managed by the library). Endpoint `menuImage`: images only, ≤ 4 MB, one file per upload, requires an authenticated owner or manager. The returned file URL is saved through the menu `POST`/`PATCH` as `imageUrl`.

---

## Booking (Standard tier and above, or during trial)

### `GET /api/booking/availability?date=YYYY-MM-DD&partySize=N`
Public. `partySize` is optional; when sent, `available` is true only if `capacityRemaining >= partySize`.
**Response `data`:**
```json
{
  "date": "YYYY-MM-DD",
  "closed": false,
  "closedReason": null,
  "slots": [{ "time": "HH:mm", "endTime": "HH:mm", "available": true, "capacityRemaining": 0 }]
}
```
When the café is closed: `closed: true`, `slots: []`. Slots come only from the single slot generator (see modules.md).

### `POST /api/booking`
Public.
**Payload:**
```json
{ "name": "string", "phone": "string", "email": "string | null", "partySize": 0, "date": "YYYY-MM-DD", "time": "HH:mm", "notes": "string", "website": "" }
```
- `website` is a honeypot: it must be empty. If it is filled, return the normal success shape but create nothing
- `phone` is required; `email` is optional
**Response `data`:** `{ "id": "string", "status": "pending | confirmed", "confirmationSentTo": "email | null" }`
**Errors:** `400` validation, `403` bookings not available for this tenant, `409` slot just filled, `429` too many bookings for this phone number today (limit 3 online bookings per phone per day).
`status` is `confirmed` only when the tenant has `autoConfirmBookings` on. Sends a Resend email only if an email was given.

### `GET /api/booking/:id`
Public status lookup by booking id. **Response `data`:** `{ "id", "status", "date", "time", "endTime", "partySize", "tenantName" }` — never returns phone or email.

### `GET /api/admin/bookings?status=&date=&from=&to=&source=&page=&limit=`
Owner, manager, staff_bookings. List bookings for the tenant, filterable.

### `POST /api/admin/bookings` *(new)*
Owner, manager, staff_bookings. Owner-side booking (phone call or walk-in).
**Payload:**
```json
{ "name": "string", "phone": "string", "email": "string | null", "partySize": 0, "date": "YYYY-MM-DD", "time": "HH:mm", "notes": "string", "source": "phone | walk_in", "sendConfirmation": false }
```
Same capacity rules and `409` behaviour as the public endpoint. Created as `confirmed`. `sendConfirmation` emails the customer only if an email exists.

### `PATCH /api/admin/bookings/:id/status`
Owner, manager, staff_bookings.
**Payload:** `{ "status": "confirmed | cancelled | no_show", "managerRemark": "string" }`
Updates the customer's counters (`noShowCount`). Emails the customer only if the booking has an email.

---

## Customers

### `GET /api/admin/customers?search=&page=&limit=`
Owner, manager, staff_bookings. Read-only.
**Response `data`:** `{ "customers": [{ "id", "name", "phone", "email", "bookingCount", "noShowCount", "lastBookingAt" }] }`
`search` matches name or phone.

---

## Sales Log

### `GET /api/admin/sales-log?from=YYYY-MM-DD&to=YYYY-MM-DD`
Owner, manager. Defaults to the last 30 days; maximum range 366 days.
**Response `data`:** `{ "entries": [{ "date", "ordersCount", "cash", "upi", "card", "other", "totalSales", "notes", "updatedAt" }] }`

### `PUT /api/admin/sales-log/:date`
Owner, manager. Creates or updates the entry for that local date (`:date` is `YYYY-MM-DD`).
**Payload:** `{ "ordersCount": 0, "cash": 0, "upi": 0, "card": 0, "other": 0, "notes": "string" }`
- `ordersCount` is a whole number ≥ 0; amounts are ≥ 0 with at most 2 decimals
- The date must not be in the future in the tenant's timezone
- The server computes `totalSales` (sum of the four amounts)
**Response `data`:** the saved entry plus `"created": true | false`.
There is no `DELETE`; correct mistakes by editing.

---

## Dashboard

### `GET /api/admin/dashboard/today`
Owner, manager. "Today" is the tenant's local date.
**Response `data`:**
```json
{
  "date": "YYYY-MM-DD",
  "salesLogged": true,
  "sales": { "value": 0, "vsYesterdayPct": null, "vsLastWeekPct": null },
  "orders": { "value": 0, "vsYesterdayPct": null, "vsLastWeekPct": null },
  "avgOrderValue": { "value": null, "vsYesterdayPct": null, "vsLastWeekPct": null },
  "bookings": { "count": 0, "covers": 0, "vsYesterdayPct": null, "vsLastWeekPct": null }
}
```
A `*Pct` value is `null` when the comparison day has no data. `avgOrderValue.value` is `null` when there are no orders.

### `GET /api/admin/dashboard/trends?range=7d|30d`
Owner, manager.
**Response `data`:**
```json
{
  "range": "7d",
  "daily": [{ "date": "YYYY-MM-DD", "totalSales": 0, "ordersCount": 0, "bookings": 0 }],
  "paymentMix": { "cash": 0, "upi": 0, "card": 0, "other": 0 },
  "bookingsByHour": [{ "hour": 0, "count": 0 }]
}
```
`paymentMix` and `bookingsByHour` are computed over the selected range.

---

## Export

### `GET /api/admin/export/sales-log?from=&to=`
### `GET /api/admin/export/bookings?from=&to=&status=`
Owner, manager. Return a **CSV file** (UTF-8 with BOM so Excel opens it correctly), `Content-Disposition: attachment`. Maximum range 366 days. Errors return the normal JSON envelope.
- Sales columns: date, orders, cash, upi, card, other, total, notes
- Booking columns: date, time, name, phone, email, party size, status, source, notes, created at

---

## Usage tracking

### `POST /api/usage`
Public. **Payload:** `{ "event": "menu_view | book_click | booking_started" }`. The tenant comes from the subdomain/slug. No personal data. The client calls it fire-and-forget (`fetch` with `keepalive`) and ignores failures.
Server-side events (`booking_created`, `dashboard_opened`, `sales_log_saved`, …) are recorded inside their own handlers and have no endpoint.

---

## Cron

### `GET /api/cron/day-end-report`
Not called by the frontend. Vercel Cron runs it daily at `17:00 UTC` (= 22:30 IST). Requires `Authorization: Bearer ${CRON_SECRET}`; reject anything else with `401`.
For each tenant in trial or active status: compute today's summary in the tenant's timezone and email the owner (or a nudge if no sales were logged). Idempotent per tenant per local date using `Tenant.lastDayEndReportDate`. Records a `day_end_email_sent` event.

---

## Billing (checkout paused during the trial — do not surface in the UI)

### `POST /api/billing/create-setup-order` *(existing)*
Owner only. Creates a Razorpay one-time order for the design/theming fee. **Response:** `{ "orderId": "string", "amount": 0, "currency": "INR" }`

### `POST /api/billing/create-subscription` *(existing)*
Owner only. **Payload:** `{ "tier": "basic | standard | premium" }`. **Response:** `{ "subscriptionId": "string", "razorpayCheckoutUrl": "string" }`

### `POST /api/billing/verify-subscription` *(existing)*
Owner only. Verifies a completed Razorpay subscription payment.

### `POST /api/admin/billing/plan` *(existing)*
Owner only. Plan selection. Not used during the trial.

### `POST /api/billing/webhook` *(existing)*
Razorpay webhook receiver (not called by the frontend). Verifies the signature and updates the tenant's `subscriptionStatus` and `tier`. Handles `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`.

---

## Auth
Handled primarily by Clerk directly (sign-in/sign-up/org management use Clerk's own hosted flows/components). Custom endpoints:

### `POST /api/auth/tenant-setup` *(existing)*
Called from onboarding. **Payload:** `{ "tenantName": "string", "slug": "string" }`. Creates the tenant and its owner user. New tenants start with `subscriptionStatus = "trial"` and `trialEndsAt = now + TRIAL_DAYS`. Rejects a duplicate slug with an error.

### `GET /api/admin/staff`
Owner, manager. Lists staff on the tenant with their assigned role.
**Response `data`:** `{ "staff": [{ "id": "string", "name": "string", "email": "string", "role": "owner | manager | staff_orders | staff_bookings" }] }`

### `POST /api/admin/staff/:id/role`
Owner only. **Payload:** `{ "role": "manager | staff_orders | staff_bookings" }`
Sets the role field on the staff record in Mesa's own database (not a Clerk role — see `tools.md`). The owner role cannot be reassigned via this endpoint.

---

## General Conventions
- **Standard response envelope for every endpoint, success or failure** — the frontend never has to guess the shape per-endpoint:
```json
{ "success": true, "data": {}, "statusCode": 200, "errormsg": null }
```
On failure: `{ "success": false, "data": null, "statusCode": 400, "errormsg": "human-readable message" }`. The only exception is CSV exports, which return a file on success.
- Error messages must tell the user what to do ("That time just filled up — please pick another"), never raw technical text
- All list endpoints support `?page=&limit=` pagination, default `limit=20`
- Dates always ISO 8601 (`YYYY-MM-DD`); times always 24-hour `HH:mm` in the tenant's timezone
- Endpoints are grouped by auth level needed — mirror this in `lib/api-routes.ts` as a single categorized registry (`PUBLIC`, `TENANT_AUTH`, `ADMIN_ONLY`) rather than scattering auth checks per-route file; a shared fetch wrapper reads the category and attaches the right headers automatically

## Role Access Summary
| Area | owner | manager | staff_bookings |
|---|---|---|---|
| Bookings (view, add, update) | yes | yes | yes |
| Customers (read) | yes | yes | yes |
| Menu | yes | yes | no |
| Sales log, dashboard, exports | yes | yes | no |
| Settings (hours, capacity, booking settings) | yes | no | no |
| Staff management, billing | yes | no | no |

`staff_orders` has no accessible area during the trial.
