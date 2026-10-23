# tools.md — Mesa Tech Stack

Single source of truth for every tool/library decision. The agent should never introduce a new library without checking here first — if something's missing, add it here, then use it.

## Frontend
- **Framework:** Next.js 16 (App Router), React 19, TypeScript — matches your existing production stack (OIL Dashboard, VoltIQ), keeps everything consistent across your projects
- **Styling:** Tailwind CSS v4
- **Component library:** shadcn/ui — generic primitives only (see architecture.md rule 3)
- **Animation:** GSAP is installed but **minimal by default** — only subtle entrance fades (≤ 200ms) on the public site, per `design.md`. No scroll-jacking or parallax. Respect `prefers-reduced-motion`. Remove it entirely if it ends up unused
- **Forms & validation:** React Hook Form + Zod

## State Management
- **Client/UI state:** Zustand — booking flow state, admin panel local UI state, theme preview state
- **Server state:** TanStack Query — all data fetching/caching from the backend (bookings, tenant config, menu data). Don't duplicate server data into Zustand; Zustand is for pure client state only

## Backend
- **API layer:** Next.js Route Handlers for v1 (simplest, colocated, fast to ship). Extract to a standalone Fastify service later only if scaling actually demands it (mirrors the OIL Dashboard pattern, but don't over-engineer this early)
- **Database:** PostgreSQL, hosted on Neon or Supabase (either works — Neon has a cleaner free tier for early-stage)
- **ORM:** Prisma
- **Multi-tenancy pattern:** shared database, `tenant_id` column on every tenant-scoped table, enforced at the query layer (Prisma middleware or a wrapped client that always injects `tenant_id`) — never trust `tenant_id` from client input alone, always derive it server-side from the authenticated session/subdomain

## Auth
- **Better Auth**, with its Organization plugin for identity, sessions, and invitations. Each café tenant maps to one Better Auth organization.
- Better Auth owns authentication and organization membership. Mesa's separate tenant staff record owns application roles (`owner`, `manager`, `staff_orders`, `staff_bookings`), checked by the shared `guards.ts` helpers. Never authorize application features from a client-supplied organization or role.
- Use the official Better Auth Prisma adapter with the existing Prisma/PostgreSQL database. Keep Better Auth's required auth tables separate from Mesa's tenant-scoped business models.

## File/Image Storage
- **UploadThing** (simplest Next.js-native integration) or **Supabase Storage** if already on Supabase for the DB — for menu photos, logos, gallery images per tenant

## Notifications
- **Email:** Resend (already proven in VoltIQ) — booking confirmations, admin alerts
- **Explicitly not WhatsApp automation** for v1 — not a current strength, don't build it as a dependency

## Billing / Subscriptions
- **Razorpay** — Subscriptions API for the recurring monthly tier fee, plus one-time payment link/order for the upfront design/theming fee. India-first, handles both payment types Mesa needs

## Charts
- **Recharts** — used for the Today dashboard (maximum three charts per screen, see `design.md`). Consistent with your other dashboards (OIL Dashboard, VoltIQ)

## Time, CSV and scheduling (no new libraries)
- **Time:** built-in `Intl` API inside `lib/time.ts` for tenant-timezone dates and weekdays — no date library
- **CSV export:** hand-written `lib/csv.ts` (proper quote escaping, UTF-8 BOM so Excel opens it) — no spreadsheet library
- **Scheduling:** Vercel Cron configured in `vercel.json`, calling `/api/cron/day-end-report`, secured with a `CRON_SECRET` environment variable

## Deployment
- **Vercel** for the Next.js app
- **Neon/Supabase** for the managed Postgres instance

## Future (Phase 3 — Order-to-Billing, not started)
- **Offline order queue:** PWA + IndexedDB on the device, background sync retry, client-generated idempotency key per order (server must dedupe on it). Not Kafka or any message broker — wrong problem (broker durability vs device-to-server reachability) and disproportionate infra for one café's order volume. Full design in the "Order-to-Billing (planning)" Notion page

## Explicitly Deferred (do not add these until a real client need justifies it)
- Inventory management library/module
- WhatsApp API integration
- Multi-region/CDN-level tenant domain routing complexity (start with subdomains: `tenant.mesa.app`; custom domains via CNAME later)
- Excel/PDF export libraries (CSV only for now)
- Rate-limiting infrastructure such as Redis (the trial uses a simple per-phone daily limit enforced in the database)
