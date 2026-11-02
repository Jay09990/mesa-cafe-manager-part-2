# tools.md — Mesa Tech Stack

Single source of truth for every tool/library decision. The agent should never introduce a new library without checking here first — if something's missing, add it here, then use it.

## Frontend
- **Framework:** Next.js 16 (App Router), React 19, TypeScript — matches your existing production stack (OIL Dashboard, VoltIQ), keeps everything consistent across your projects
- **Styling:** Tailwind CSS v4
- **Component library:** shadcn/ui — generic primitives only (see architecture.md rule 3)
- **Animation:** none by default. The public site may use a CSS transition or fade of ≤ 200ms, per `design.md`. **No animation or smooth-scroll library (GSAP and Lenis are not used)**, no scroll-jacking or parallax. Respect `prefers-reduced-motion`. If GSAP is still in `package.json`, remove it
- **Forms & validation:** React Hook Form + Zod

## State Management
- **Client/UI state:** Zustand — booking flow state, admin panel local UI state, theme preview state
- **Server state:** TanStack Query — all data fetching/caching from the backend (bookings, tenant config, menu data). Don't duplicate server data into Zustand; Zustand is for pure client state only

## Backend
- **API layer:** Next.js Route Handlers for v1 (simplest, colocated, fast to ship). Extract to a standalone Fastify service later only if scaling actually demands it (mirrors the OIL Dashboard pattern, but don't over-engineer this early)
- **Database:** PostgreSQL on **Neon** (decided — not Convex, not Supabase). Free plan: 100 CU-hours and 0.5 GB per project; compute suspends when the monthly limit is reached, and an idle database takes a few seconds to wake — warm it before any live demo. Move to the usage-based Launch plan at the first paying café
- **ORM:** Prisma
- **Multi-tenancy pattern:** shared database, `tenant_id` column on every tenant-scoped table, enforced at the query layer (Prisma middleware or a wrapped client that always injects `tenant_id`) — never trust `tenant_id` from client input alone, always derive it server-side from the authenticated session/subdomain

## Auth
- **Better Auth**, with its Organization plugin for identity, sessions, and invitations. Each café tenant maps to one Better Auth organization.
- Better Auth owns authentication and organization membership. Mesa's separate tenant staff record owns application roles (`owner`, `manager`, `staff_orders`, `staff_bookings`), checked by the shared `guards.ts` helpers. Never authorize application features from a client-supplied organization or role.
- Use the official Better Auth Prisma adapter with the existing Prisma/PostgreSQL database. Keep Better Auth's required auth tables separate from Mesa's tenant-scoped business models.

## File/Image Storage
- **UploadThing** for menu photos, logos, gallery images per tenant. Its current free-plan limits have not been verified — check them at signup

## Notifications
- **Email:** Resend (already proven in VoltIQ) — booking confirmations, admin alerts. Free plan: 3,000 emails/month, capped at 100/day, one verified domain (needs a domain you own). Upgrade to Pro when daily volume passes 100
- **Explicitly not WhatsApp automation** for v1 — not a current strength, don't build it as a dependency

## Billing / Subscriptions
- **Razorpay** — Subscriptions API for the recurring monthly tier fee, plus one-time payment link/order for the upfront design/theming fee. India-first, handles both payment types Mesa needs. Fees: no setup fee or annual charge, about 2% + 18% GST per successful payment, and Subscriptions add about 0.99%. **Not wired during the trial** — the first payments are collected manually with a Razorpay payment link. Confirm KYC requirements for an individual/proprietor before go-live

## Charts
- **Recharts** — used for the Today dashboard (maximum three charts per screen, see `design.md`). Consistent with your other dashboards (OIL Dashboard, VoltIQ)

## Time, CSV and scheduling (no new libraries)
- **Time:** built-in `Intl` API inside `lib/time.ts` for tenant-timezone dates and weekdays — no date library
- **CSV export:** hand-written `lib/csv.ts` (proper quote escaping, UTF-8 BOM so Excel opens it) — no spreadsheet library
- **Scheduling:** Vercel Cron configured in `vercel.json`, calling `/api/cron/day-end-report`, secured with a `CRON_SECRET` environment variable. On the Hobby plan cron runs at most once a day and only within the scheduled hour: a `17:00 UTC` schedule fires any time from 17:00 to 17:59 UTC (about 22:30–23:29 IST). Promise an "evening" email, never an exact time. If this becomes a problem before Pro, a free external scheduler can call the same endpoint with `CRON_SECRET`

## Deployment
- **Vercel Hobby** for the Next.js app during the free pilot only. Hobby is restricted to non-commercial use, so move to Pro ($20/month per member) when the first café pays
- **Neon** for the managed Postgres instance

## Future (Phase 3 — Order-to-Billing, not started)
- **Offline order queue:** PWA + IndexedDB on the device, background sync retry, client-generated idempotency key per order (server must dedupe on it). Not Kafka or any message broker — wrong problem (broker durability vs device-to-server reachability) and disproportionate infra for one café's order volume. Full design in the "Order-to-Billing (planning)" Notion page

## Explicitly Deferred (do not add these until a real client need justifies it)
- Inventory management library/module
- WhatsApp API integration
- Multi-region/CDN-level tenant domain routing complexity (start with subdomains: `tenant.mesa.app`; custom domains via CNAME later)
- Excel/PDF export libraries (CSV only for now)
- Rate-limiting infrastructure such as Redis (the trial uses a simple per-phone daily limit enforced in the database)

## Domain (the one unavoidable spend)
Wildcard subdomains (`tenant.mesa.app`) and sending email from your own address both need a domain you own. Buy one basic domain before the pilot. Everything else runs on free tiers.

## Decisions and Rejected Alternatives (final — do not revisit without a real reason)
- **Convex: rejected.** It is a document database; direct SQL tools and ORMs do not work with it. Mesa is relational and reporting-heavy (daily totals, payment mix, CSV exports), needs a transactional capacity check, and reads trial metrics with SQL in the Neon console. Convex's realtime strength is not needed here, and its free plan can fail writes once limits are hit. No credible evidence was found that it beats Postgres for this workload, and the workload (one café = dozens of bookings a day) is tiny
- **Clerk: rejected.** Cost is not the reason (its free plan is generous — 50,000 monthly retained users and 100 organizations at the time of writing; verify on its pricing page). The reasons: (1) outlets are children of a tenant, not separate organizations, so an organization switcher solves the wrong problem; (2) Mesa's own staff table owns application roles, so Clerk would duplicate membership and create ghost-user risk; (3) user data should live in our own database; (4) every doc here is built around Better Auth. Accepted cost: we build the sign-in forms ourselves (shadcn + React Hook Form) and have no hosted user dashboard
- **Auth membership rule:** Better Auth holds identity and organization membership; the Mesa staff record holds roles. Every guard checks the Mesa staff record. Inviting or removing a user writes both in one service function, so the two can never drift
- **Lenis and GSAP: rejected.** `design.md` forbids scroll-jacking and parallax, and the target users are on mid-range Android phones. A 200ms fade is a CSS transition
- **Supabase: not used.** Neon is the only database

## Cost and Upgrade Tripwires
| Layer | Now | Upgrade when |
|---|---|---|
| Neon (Postgres) | Free plan | First paying café, or when a free limit is hit (then usage-based Launch plan) |
| Vercel | Hobby (free pilot only) | First paying café — Hobby is non-commercial. Pro is $20/month per member |
| Resend | Free plan | Daily emails pass 100 (Pro, $20/month) |
| Razorpay | No fixed cost, not wired | After the trial; fees only on successful payments |
| Domain | Required | Before the pilot |

Expected spend after the first paying café: about $25/month in total (Vercel Pro + Neon Launch). Prices and limits change — re-check the vendors' pricing pages before each upgrade.