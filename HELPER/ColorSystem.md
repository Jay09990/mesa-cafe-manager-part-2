# color-system.md — Mesa Color System

Kept separate from `design.md` so theme/color changes can be made directly here, and the agent told to "follow color-system.md" without touching general design philosophy.

## How Theming Works

Each tenant has a `theme` object stored in the database, structured like this:
```ts
type ThemeColors = {
  primary: string;      // main brand color — CTAs, key accents
  secondary: string;    // supporting accent
  background: string;   // page background
  surface: string;      // cards, elevated sections
  text: string;         // primary text
  textMuted: string;    // secondary text
  border: string;
}
```
These map to CSS variables at the tenant's theme root (e.g. `--color-primary`), consumed by all components in `features/theming/components/`. Never hardcode a hex value inside a themeable component — always reference the CSS variable.

## Default (v1) Theme — "Mesa Monochrome"

| Token | Value | Reasoning |
|---|---|---|
| `primary` | `#171717` | Near-black anchors key actions and headings |
| `secondary` | `#525252` | Mid-neutral secondary actions without introducing a hue |
| `background` | `#F7F7F5` | Soft neutral background avoids stark white while remaining monochrome |
| `surface` | `#FFFFFF` | Clean elevated surfaces |
| `text` | `#171717` | High-contrast neutral text |
| `textMuted` | `#666666` | Legible secondary information |
| `border` | `#E5E5E5` | Quiet neutral dividers |

## Admin Panel Colors (fixed, NOT themeable)

The admin panel uses a separate, fixed neutral palette regardless of tenant theme — see design.md for why. Keep backgrounds, borders, text, and interactive states neutral in both light and dark modes; do not introduce a colored accent by default.

## Adding a New Theme (post-pilot, per agent-loop.md sequencing)

When a new theme variant is justified by a real client:
1. Define a new `ThemeColors` object following the same token structure above
2. Write the reasoning for each color choice in this file, in a new table, the same way the Default theme is documented — this file should always explain *why*, not just list hex codes
3. Never introduce a new token name without updating the `ThemeColors` type and every themeable component simultaneously

## Color Psychology Quick Reference (for choosing new theme palettes)
See `design.md` → "Color Psychology" section for the reasoning framework. This file only holds the actual token values once a direction is chosen.
