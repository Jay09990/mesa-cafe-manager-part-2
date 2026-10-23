# architecture.md — Mesa (Café/SMB Booking SaaS)

> Working project name: **Mesa**. Rename freely — every doc uses "Mesa" as a placeholder; find/replace if you pick something else.

## Structure Decision: Feature-First

This project is **feature-first**, not page-first. Reasoning: Mesa has clearly separable, independently-evolving domains (booking, menu, sales log, dashboard, admin panel, billing) that map directly to the tiered pricing model. A feature-first structure means:
- Adding a later feature = adding one new folder under `features/`, not touching unrelated code
- Each feature owns its components, hooks, API calls, types, and local state together — easier for an AI agent to reason about one feature in isolation without cross-contaminating others
- Page-first (organizing by route) would scatter booking logic across multiple route folders as the app grows — wrong fit here

## Folder Structure

```
mesa/
├── app/                                    # Next.js App Router — routing only, thin
│   ├── (public)/
│   │   └── [tenant]/
│   │       ├── page.tsx                    # tenant's landing page
│   │       ├── menu/page.tsx               # full menu (all items, sold-out labelled)
│   │       ├── book/page.tsx               # booking interface
│   │       ├── booking-status/page.tsx     # view-only booking status
│   │       └── layout.tsx                  # resolves tenant, wraps in ThemeProvider
│   ├── (admin)/
│   │   └── admin/
│   │       └── [tenant]/
│   │           ├── dashboard/page.tsx      # Today dashboard
│   │           ├── bookings/page.tsx
│   │           ├── menu/page.tsx
│   │           ├── sales/page.tsx          # sales log entry + history
│   │           ├── customers/page.tsx      # read-only list
│   │           ├── settings/page.tsx
│   │           ├── billing/page.tsx        # trial status only during the trial
│   │           └── layout.tsx              # admin shell, tenant-scoped auth guard
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── onboarding/page.tsx
│   └── api/                                # route handlers, thin — delegate to features/*
│       ├── cron/day-end-report/route.ts    # Vercel Cron target
│       ├── usage/route.ts                  # public usage events
│       └── uploadthing/                    # UploadThing route handler + file router
│
├── features/                               # <- core of the app, feature-first
│   ├── tenant/
│   │   ├── resolveTenant.ts                # subdomain/domain → tenant lookup
│   │   ├── settings-service.ts             # capacity, hours, settings updates
│   │   ├── tenant-context.tsx
│   │   └── types.ts
│   ├── theming/
│   │   ├── theme-tokens.ts                 # per-tenant color/font/layout config
│   │   ├── ThemeProvider.tsx
│   │   └── components/                     # themeable primitives: Hero, MenuGrid, Footer
│   ├── booking/
│   │   ├── components/                     # BookingForm, SlotPicker, AdminBookingForm
│   │   ├── hooks/
│   │   ├── server/
│   │   │   ├── availability.ts             # THE single slot generator
│   │   │   └── service.ts                  # create/update booking (transactional)
│   │   ├── api.ts
│   │   ├── store.ts                        # zustand slice for booking flow state
│   │   └── types.ts
│   ├── menu/
│   │   ├── components/                     # MenuEditor, ItemForm, SoldOutToggle
│   │   ├── service.ts
│   │   └── types.ts
│   ├── sales-log/
│   │   ├── components/                     # SalesLogForm, SalesHistory
│   │   ├── service.ts                      # validation, upsert, totals
│   │   └── types.ts
│   ├── dashboard/
│   │   ├── components/                     # KpiCard, SalesTrendChart, PaymentMixChart, BookingsByHourChart
│   │   ├── server/summary.ts               # today + trends aggregation
│   │   └── report/day-end-email.tsx        # email template used by the cron
│   ├── customers/
│   │   ├── service.ts                      # upsert-from-booking, list/search
│   │   └── types.ts
│   ├── usage/
│   │   ├── service.ts                      # trackEvent()
│   │   └── types.ts
│   ├── admin-panel/
│   │   ├── components/                     # AdminSidebar, SettingsForm, BookingsTable
│   │   └── types.ts
│   ├── auth/
│   │   ├── clerk-config.ts
│   │   └── guards.ts                       # role/tier gating helpers
│   ├── billing/
│   │   ├── components/                     # PricingTable, TrialBanner
│   │   ├── api.ts
│   │   ├── webhooks/                       # Razorpay webhook handlers
│   │   └── tier-config.ts                  # single source of truth: what each tier (and the trial) unlocks
│   └── analytics/                          # RESERVED — deeper analytics later; stub only
│
├── components/ui/                          # shadcn primitives — shared, NOT feature-specific
├── lib/                                    # db client, env config, generic utils
│   ├── prisma.ts
│   ├── resend.ts
│   ├── api-routes.ts                       # categorized endpoint registry
│   ├── time.ts                             # tenant-timezone date helpers (built-in Intl, no date library)
│   └── csv.ts                              # CSV writer (escaping + UTF-8 BOM)
├── prisma/
│   └── schema.prisma
├── vercel.json                             # cron schedule
├── docs/                                   # this doc set lives here, in the repo
└── public/
```

## Rules for the Agent

1. New feature = new folder under `features/`. Never scatter one feature's logic across multiple top-level folders.
2. `app/` stays thin — pages and route handlers import from `features/*`, they don't contain business logic themselves.
3. `components/ui/` is for generic shadcn primitives only (Button, Input, Dialog). Anything café/booking-specific belongs inside its feature folder, even if it's visually a "component."
4. Every feature folder that touches tier-gated functionality must check `features/billing/tier-config.ts` — never hardcode tier or trial logic inline inside a feature.
5. `features/analytics/` stays a stub (empty folder + a `README.md` saying "Reserved — deeper analytics, not in the trial") until it is actually being built. The Today dashboard lives in `features/dashboard/`, not here.
6. **Cross-feature calls go through exported service functions only** (e.g. booking calls `customers/service`). Never import another feature's components or internal files.
7. **All business-date logic goes through `lib/time.ts`** using the tenant's timezone. Never derive "today" or a weekday from the server's local time.
8. **One slot generator**: `features/booking/server/availability.ts`. The availability API, booking validation and the admin timeline all use it. Never hardcode slot times.
9. **Migrations are additive.** Add the new column, backfill, switch code over, drop the old column in a later release. Never drop a column that holds data in the same migration that replaces it.
10. **Tenant isolation on every query.** Every Prisma query on a tenant-scoped table filters by `tenantId` derived server-side, and every admin handler verifies the signed-in user belongs to that tenant.
