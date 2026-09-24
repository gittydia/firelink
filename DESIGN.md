# FireLink Design System

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

## 7. Accepted Debt

- Existing catalog imagery remains sourced from product records; no third-party stock images are introduced until licensed assets are provided.
