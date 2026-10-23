# agent-loop.md — How to Work Through This Project

You are building Mesa. This doc governs how you decide what to do next. The goal: minimize how often the human needs to step in — only stop and ask when genuinely blocked, not for routine decisions covered elsewhere in this doc set.

## Reference Order

Before writing any code for a new piece of work, check docs in this order:
1. `modules.md` — what does this module need to do?
2. `architecture.md` — where does this code live?
3. `tools.md` — what libraries am I allowed to use for this?
4. `design.md` + `color-system.md` — if it touches UI
5. `backend-api-docs.md` — if it touches an API contract

If the answer is in one of these docs, proceed without asking. Only surface a question if the docs genuinely don't cover the situation.

## Default Loop for Any New Task

1. Identify which module (per `modules.md`) the task belongs to
2. Identify whether it's frontend, backend, or both
3. Check `architecture.md` for exactly where new files go
4. Check `tools.md` — do not introduce a library not listed there without flagging it first
5. Build the smallest working version of the piece, tier-gated correctly per `billing/tier-config.ts` if relevant
6. Self-review: does this match `design.md` conventions (if UI) and `backend-api-docs.md` contracts (if API)?
7. Move to the next logical piece — don't wait for confirmation on routine progress

## When to Actually Stop and Ask

Only interrupt the human for:
- A genuine ambiguity not resolved by any doc (e.g. two reasonable ways to model a relationship in the database schema, with real tradeoffs)
- A decision that would require adding a new tool/library not in `tools.md`
- Anything that touches the tier-gating logic in a way that could unintentionally expose a Premium/Custom feature to a lower tier (the trial rule in `tier-config.ts` is the only allowed override — and it only unlocks the trial modules)
- A migration that would drop or rewrite existing data
- A requirement that seems to conflict with an existing decision in these docs (surface the conflict explicitly, don't silently pick one side)

Do NOT stop to ask about: naming conventions (follow existing patterns in the codebase), which shadcn component to use for a standard UI need, minor copy/microcopy wording, or routine CRUD implementation details — just proceed with the most sensible choice and keep moving.

## Phase 1 Build Order (foundation — largely complete)

1. Tenant resolution + auth (Clerk Organizations) — nothing else works without this
2. Database schema (Prisma) for tenant, user, booking, menu item — get this right early, it's expensive to change later
3. Admin panel: menu management (Basic tier) — simplest full vertical slice to prove the architecture works end to end
4. Public themed landing page (single default theme to start — see design.md)
5. Booking module (Standard tier)
6. Billing/subscription wiring (Razorpay)
7. Tier-gating enforcement across admin panel and booking
8. Only after a pilot client is live: expand `theming/` with additional theme variants

Do not jump ahead to Premium/Custom features or a second theme variant before this sequence is working end-to-end for one tenant.

## Phase 2 — Trial Release Build Order (CURRENT PHASE)

Phase 1 (above) is largely built. The current goal is a 30-day free trial with 3–4 pilot cafés, scoped in `modules.md` ("Current Phase: Trial Release"). Build in this order, one step at a time, finishing each before the next:

**Step 0 — Foundations (small, unblocks everything)**
- Add the Tenant fields (`timezone`, `currency`, `autoConfirmBookings`, `slotIntervalMinutes`, `trialEndsAt`, `lastDayEndReportDate`) and the `UsageEvent` model; implement `lib/time.ts` and `trackEvent()`
- Onboarding creates a trial tenant (no plan selection); trial rule in `tier-config.ts`

**Step 1 — Booking (hardened)**
- One slot generator driven by opening hours (add `weeklyOverrides`), midnight-crossing windows handled
- Transactional capacity check + insert (no double booking)
- Split `contact` into `phone` + `email`; email only when an email exists; wording per `modules.md`
- `source`, `autoConfirmBookings`, owner-side "Add booking", honeypot + per-phone daily limit
- `Customer` records created/updated from bookings; read-only Customers page

**Step 2 — Menu & Public Site**
- `dietaryType`, `sortOrder`, `isFeatured`; photo upload; one-tap sold-out toggle
- Public `/[tenant]/menu` page; landing preview rules; contact block (click-to-call, map link, Instagram)
- Public usage events

**Step 3 — Sales Log & Today Dashboard**
- `SalesLog` model, entry screen, history list
- Today dashboard (4 KPI cards + max 3 charts), prompt card when today isn't logged
- Day-end email cron (`CRON_SECRET`), CSV export for sales and bookings

**Step 4 — Trial readiness**
- Trial banner (non-blocking), Billing page shows trial status only
- Usage events wired everywhere listed in `modules.md`; confirm the metric queries work in the Neon console

**Do not build in this phase** (see `modules.md` → "Explicitly Not in the Trial"): POS/orders, QR ordering, inventory, expenses/P&L, loyalty, staff PIN/audit log, outlets/chains, deposits/reminders, WhatsApp, extra themes, Excel/PDF reports. Do not wire Razorpay checkout. Ordering/billing (`modules.md` → "Phase 3") is designed but not started — don't scaffold its tables or folders yet, and don't name anything in the trial build in a way that would collide with `TableSession`, `Order`, `OrderItem`, `Bill`, `Payment`, `Ingredient` or `ModifierGroup`.

**Working rules for this phase**
- Where existing code contradicts these docs, change the code to match the docs — but with additive migrations (see `architecture.md` rule 9)
- Run the existing tests after each step. Add tests for the slot generator (including midnight-crossing windows and closed days), the capacity transaction, and sales-log validation
- After each step, give a short summary: what changed, what to test by hand, anything that needs a decision