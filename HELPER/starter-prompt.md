# starter-prompt.md — Use This to Kick Off Mesa in Your AI IDE

Paste this as your first prompt in Cursor/Antigravity, with all 7 docs added to context/attached:

---

**PROMPT:**

You are building Mesa, a multi-tenant SaaS platform for cafés/SMBs that gives each tenant a custom-feeling branded website + shared booking system + admin panel, sold via a one-time design fee plus a recurring tiered subscription (Basic/Standard/Premium/Custom).

Seven docs are provided in `/HELPER`. Use them as follows — do not deviate from what they specify without flagging it first:

- **architecture.md** — defines the folder structure (feature-first) and where every file goes. Follow this exactly.
- **tools.md** — the complete, exhaustive list of every library/service to use. Do not introduce anything not listed here without asking.
- **design.md** — general UI/UX philosophy, typography, spacing, and the distinction between the themeable public site vs. the fixed admin panel.
- **color-system.md** — exact color tokens for the default theme, plus the reasoning framework for future themes. Follow this for anything color-related.
- **agent-loop.md** — how you should sequence your own work and decide when to actually stop and ask a question vs. proceed independently. Follow the build order in this doc exactly — do not skip ahead to later steps.
- **modules.md** — what each module (Tenant, Auth, Theming, Public Site, Booking, Admin Panel, Billing) is responsible for.
- **backend-api-docs.md** — exact API contracts: endpoints, payloads, response shapes. Match these precisely so frontend and backend stay in sync.

**Your first task:** Follow the Build Order section in `agent-loop.md`, starting from step 1 (tenant resolution + Clerk auth setup). Set up the Prisma schema for tenant, user, booking, and menu item next, matching the data implied by `backend-api-docs.md` and `modules.md`.

Do not build anything marked "not in v1" or "Premium/Custom" in any of the docs. Do not build a second theme variant. Do not build inventory management or WhatsApp integration.

Work through the build order step by step. Only stop and ask me a question if you hit a genuine ambiguity that agent-loop.md says is a stop condition — otherwise keep moving through the sequence and show me progress as you go.

---

*(If your AI IDE supports persistent project rules/context files, put architecture.md, tools.md, and agent-loop.md there permanently so every future session in this project starts with them loaded, not just the first one.)*

---

## Trial Release Prompt (use this now — the project is already scaffolded)

Paste this in your AI IDE with the updated docs attached:

---

**PROMPT:**

Mesa already has tenant resolution, Clerk auth, the Prisma schema, menu management, booking and a billing stub. We are now building the **Trial Release**: a 30-day free trial for 3–4 pilot cafés whose purpose is to learn what cafés actually use and value.

The docs in `/docs` have been updated for this phase. Read them in this order before writing code:

1. **modules.md** — start with "Current Phase: Trial Release", then the module you are working on, then "Data Model Changes" and "Explicitly Not in the Trial"
2. **agent-loop.md** — follow "Phase 2 — Trial Release Build Order" exactly, step by step, and the working rules at the end of it
3. **architecture.md** — new folders and the 10 rules (especially: one slot generator, `lib/time.ts` for all dates, additive migrations, tenant isolation)
4. **backend-api-docs.md** — exact contracts for every new and changed endpoint, plus the role access table
5. **design.md** — the design direction is *professional and easy to use, not stylish*; follow it for every screen
6. **tools.md** and **color-system.md** — unchanged rules; no new libraries beyond what `tools.md` lists

Start at **Step 0** and continue through Step 4. Do not build anything listed under "Explicitly Not in the Trial", and do not wire Razorpay checkout. Make migrations additive, run the existing tests after each step, and after each step send me a short summary: what changed, what to test by hand, and anything that needs my decision. Only stop and ask when `agent-loop.md` says it is a stop condition.

---
