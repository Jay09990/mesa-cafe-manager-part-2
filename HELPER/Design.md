# design.md — Mesa UI/UX Design Principles

This doc covers general design philosophy. For exact color tokens/hex values, see `color-system.md` — kept separate so theme swaps don't require touching this file.

## Design Direction: Professional and Easy to Use

Mesa should look **professional and calm, not stylish**. Café owners are busy and not technical; the product wins by being obvious, fast and trustworthy. Delight comes from clarity and speed, not from effects.

- **Conventional beats clever.** Familiar layouts, consistent components, generous whitespace, restrained color. If a screen needs a tutorial, redesign the screen
- **Plain words.** Say "Seats", "Sold out", "Sales today" — no jargon. Short, simple English sentences; avoid idioms so the copy translates cleanly later
- **One primary action per screen**, visually obvious. Secondary actions are quieter
- **Always-visible labels** on every field (never placeholder-only). Sensible defaults pre-filled
- **Big enough to tap:** minimum 44px touch targets, minimum 16px body text. Number fields open the numeric keypad (`inputMode="numeric"`)
- **Feedback every time:** loading state while working, a clear "Saved" when done, confirmation before anything destructive
- **Errors say how to fix it** ("That time just filled up — please pick another"), never raw technical text
- **Empty states say what to do next** ("No bookings yet today — share your booking link")
- **Charts are restrained:** at most three per screen, labelled axes, numbers visible, no 3D or decorative styling
- **Accessibility baseline:** text contrast at least 4.5:1, visible keyboard focus, status is never shown by color alone (use text plus color), honor `prefers-reduced-motion`
- **Motion is minimal:** the public site may use a subtle fade/slide of 200ms or less; no scroll-jacking, parallax or auto-playing animation. The admin panel has no decorative animation — only loading and state-change feedback

## Two Distinct Design Contexts

Mesa has two visually different surfaces that should NOT share the same design language:

1. **Public tenant site (landing, menu + booking)** — clean, professional and on-brand through color, typography and photography — not through effects. Themeable per café. Easy to scan on a phone: name, hours, menu, Book button.
2. **Admin panel & dashboard** — operational tool used daily by a busy café owner/staff. Prioritize clarity, speed, and data density over expressiveness. Same base component library (shadcn) across all tenants — this does NOT get themed per tenant. A café owner switching between checking bookings and running their café doesn't want a "branded experience," they want to find information in two seconds.

## Color Psychology (general guidance — applies when choosing/tuning a tenant's theme)

- **Warm browns/tans:** coziness, comfort, traditional café feel — safe default for most independent cafés
- **Deep greens:** organic, fresh, health-conscious positioning (good for cafés leaning into specialty coffee/plant-based)
- **Matte black + single accent (like Kaaffeella's doodle style):** premium, minimal, design-forward — works for cafés positioning themselves as a "vibe" destination, not just a coffee stop
- **Bright/pastel palettes:** playful, younger-skewing crowd, dessert/bakery-style businesses
- Rule of thumb: pick the palette based on the café's actual customer base and price point, not personal aesthetic preference — a ₹80-chai stall and a ₹450-specialty-latte café need different color psychology entirely

## Typography

- **Two-font system per theme:** one display/heading font (personality-carrying — can vary a lot between themes) + one body font (always highly legible, keep variation minimal here across all themes)
- **Scale:** use a modular scale (1.25 ratio is a safe default) — don't let each theme invent arbitrary font sizes; the *scale* is fixed system-wide, only the *font families* and *base size* vary per theme
- Admin panel typography stays fixed across all tenants — one clean, legible sans-serif (e.g. Inter) regardless of what the public site uses
- Prefer highly legible fonts everywhere; never use script or decorative fonts below 24px or for body text

## Spacing

- **8px base grid** system-wide (4px for fine adjustments where needed) — applies to both public site and admin panel
- Public site sections can breathe more (generous vertical rhythm, 48–96px section gaps) — this is where the "custom feel" partly comes from
- Admin panel stays compact (standard shadcn spacing defaults) — density matters more than breathing room here

## General UX Principles

- **Booking flow: 3 taps or fewer** from landing page to confirmed booking. Every extra step measurably increases drop-off for a café-booking context (this isn't a considered high-ticket purchase — friction kills it fast)
- **Mobile-first, always** — assume most end customers are booking from Instagram → mobile browser, not desktop
- **Admin panel: task-oriented, not dashboard-for-dashboard's-sake** — the owner opens it to do one of four things (check today's bookings, update the menu, log today's sales, see the numbers). Design each screen around one of those jobs, don't make them hunt across a generic layout. The sales entry screen is five numbers and one Save button
- **Theme variation should be visual only, never structural** — different themes change colors/fonts/imagery/motion; they do NOT change where the booking button is or how many steps booking takes. Structural consistency = the SaaS stays maintainable; visual variation = the "custom" feel
