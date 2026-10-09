# Fire Protection Equipment Design System

## 1. Brief

Refresh the public catalog into a calm, operational inventory surface. The client palette is authoritative: crisp white content, a platinum canvas, pale slate separators, slate-gray supporting copy, and Prussian-blue hierarchy.

## 2. Foundations

- `brand.paper` (`#FFFFFF`): raised content surfaces.
- `brand.canvas` (`#F1F5F9`): page background and quiet controls.
- `brand.mist` (`#CBD5E1`): borders, dividers, inactive control outlines.
- `brand.slate` (`#64748B`): secondary text and supporting metadata.
- `brand.ink` (`#0F172A`): headings, navigation, and primary actions.
- Typography: the existing system sans stack; headings use semibold/bold with tight tracking, while data counts use tabular figures.
- Spacing: a 4px base unit. Main content uses 16px mobile and 24px desktop gutters.

## 3. Layout

- The public catalog has one document scroll owner.
- Product discovery uses a full-width control surface, followed by a responsive product grid: one column on small screens, two at `sm`, three at `lg`.
- Search remains first in reading and tab order; category, availability, and sort controls follow.

## 4. Accessibility

- All controls retain visible labels, keyboard focus, and at least 44px control height.
- Availability always includes its text label; color is supplementary.
- Search results are announced through a polite live region.
- No control depends on hover alone. Reduced-motion users receive no transform-based hover animation.

## 5. Primitives And States

- `CatalogControls`: resting, focused, filtering, and reset states.
- `CatalogSummary`: default and filtered result-count states.
- `ProductCard`: resting, keyboard-focused, and hover states; image motion is disabled for reduced motion.
- `EmptyCatalog`: filtered empty state with an explicit reset action.

## 6. Motion

- Interactive color and shadow changes use a 200ms ease-out transition.
- Product imagery may scale subtly on hover only; `prefers-reduced-motion` removes transforms.

## 7. Homepage

The public homepage is a marketing surface and is the only place the `home` palette applies. Catalog and admin surfaces stay on `brand`.

- Header, footer, and the stats band use `home.navy` (`#0D172B`); the hero overlay grades from `home.navyDeep` (`#0A1122`) toward transparent.
- Headings use `home.text` (`#101A2D`); supporting copy on light grounds uses `home.muted` (`#5D6D82`). On navy, supporting copy uses `home.cta` — no single value clears 4.5:1 against both light and dark grounds.
- Primary homepage actions use `home.cta` (`#91A4BD`) filling to `home.ctaHover` (`#778DA8`), with `home.ctaPale` (`#D5E0EC`) for label and navigation text on navy.
- Icon wells and the brand-partner chips use `home.supply` (`#CAD5E3`).
- Availability states reuse the existing three-label contract (`LOCAL`, `IN_STOCK`, `INDENT`) and add a paired soft/base/deep ramp — `statusGreen`, `statusBlue`, `statusYellow` — for the homepage supply cards. Badge text on a `soft` fill uses the ramp's `onSoft` step, which is darker than `deep`; `deep` stays for icons on the `home.supply` icon well. The text label always carries the state; color stays supplementary, per §4.
- The homepage opts into edge-to-edge bands with a breakout that escapes the layout's `max-w-6xl` `main` wrapper. The wrapper itself stays constrained so the other public pages keep their reading width.
- The bands size themselves with `w-screen`, and `100vw` includes the classic vertical scrollbar that desktop browsers reserve layout space for. The public layout root therefore sets `overflow-x-clip` so the breakout can reach both edges without adding a horizontal scrollbar. `clip` rather than `hidden` on purpose: `hidden` would create a scroll container and break sticky positioning and scroll anchoring.
- The category rail is CSS scroll-snap with a horizontally scrollable overflow region and no added dependency. Category images are admin-supplied and may point at arbitrary hosts, so they render unoptimized rather than being added to `images.remotePatterns`.
- The hero image is `priority` and fixed; the about image is not.

### Image Provenance

| Asset | Source | License | Dimensions |
| --- | --- | --- | --- |
| `public/images/hero-pipeline-valves.jpg` | Pexels photo `29248902` | Pexels License (free for commercial use, attribution not required) | 1920x1440 |
| `public/images/about-pump-room.jpg` | Pexels photo `2569842` | Pexels License (free for commercial use, attribution not required) | 1920x1280 |

These are placeholders pending client-supplied photography. Unsplash was attempted first and returned `401`; iStock required a paid license. Swap the files in place — the paths and `next/image` dimensions stay as documented.

## 8. Accepted Debt

- Existing catalog imagery remains sourced from product records.
- The homepage's hero and about images are licensed third-party placeholders (see §7), not client-supplied photography, and should be replaced once real assets exist.
