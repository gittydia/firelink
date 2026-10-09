# Fire Guard Solutions - Catalog Requirements Matrix

Traceability of the public catalog and inventory-visibility requirements in `PRD.md` (R-01–R-12) to the current prototype implementation.

- **Source:** `PRD.md` §5 Functional Requirements (R-01–R-12) and §5 Requirements Map.
- **Baseline:** branch `main`; Next.js 16 (App Router), Prisma 6, PostgreSQL.
- **Verified:** `pnpm typecheck` clean; `pnpm lint` clean; `next build` clean; `Product.color` present in the DB (`information_schema.columns`).

## Status legend

| Status | Meaning |
| :----- | :------ |
| Implemented | Behaviour exists in the prototype and satisfies the requirement's stated rules. |
| Partial | Core behaviour exists; an **UNKNOWN** the PRD leaves open is intentionally not built. |
| Missing | Not implemented. |

## Matrix

| ID | Requirement | Status | Evidence | Residual gap |
| :--- | :---------- | :----- | :------- | :----------- |
| **R-01** | Browse the product catalog | Implemented | `src/app/(public)/products/page.tsx` queries `where: { active: true }`; `ProductCard` renders name, category, `AvailabilityBadge`; `ProductCatalog` handles zero/one/many and no-result states | Only published (`active`) products appear |
| **R-02** | Search products | Implemented | `src/components/product-catalog.tsx` `matchesSearch` over name, brand, modelNumber, color, shortDescription (case-insensitive) with a no-result message and clear/reset path | PRD left matching rules UNKNOWN → resolved as case-insensitive substring |
| **R-03** | Filter and categorize products | Implemented | Category + availability filters combine; `SortOption = "newest" \| "name"`; `isFiltered` drives the clear action | Categories are controlled/admin-managed values |
| **R-04** | View product details | Implemented | `src/app/(public)/products/[slug]/page.tsx`: name, category, description, specifications, availability, active-variants table | Optional fields omitted (no misleading blanks) |
| **R-05** | Display availability classification | Implemented | `src/lib/availability.ts` tri-state `LOCAL` / `IN_STOCK` / `INDENT` + labels/descriptions; `AvailabilityBadge` used on card + PDP + filter | Label shown as text, never color-only; no quantity |
| **R-06** | Maintain product records | Implemented | `src/app/admin/products/actions.ts` `createProduct`/`updateProduct` guarded by `requireRole(["ADMIN","SALES"])` + Zod (`productCreateSchema`/`productUpdateSchema`); Prisma `P2002` → friendly duplicate message | Validation enforced server-side as well as in the form |
| **R-07** | Maintain availability | Implemented | Admin `availabilityStatus` with `inventoryUpdateSchema`; `buildInventoryAuditStamp` writes `inventoryUpdatedAt`/`inventoryUpdatedById` only on a genuine change | No `stockQuantity` (capstone excludes quantitative stock) |
| **R-08** | Publish and retire products | Implemented | `toggleProductActive`; public queries filter `active: true`; PDP uses `findUnique({ where: { slug, active: true } })` → `notFound()` | Direct links to retired products return 404 |
| **R-09** | Show data freshness | Partial | `src/lib/inventory-audit.ts`: `buildInventoryAuditStamp`, `formatInventoryUpdatedAt`, `"Not recorded"` fallback, `Asia/Manila`; surfaced in admin | No public freshness indicator — PRD leaves threshold/format UNKNOWN (see follow-ups) |
| **R-10** | Validate and handle errors | Implemented | Zod schemas in `src/lib/validation.ts` (backend) + React Hook Form (frontend); friendly messages; `requireRole`/`requireAuth` redirects; no technical details exposed publicly | — |
| **R-11** | Protect maintenance access | Implemented | `src/lib/permissions.ts` `requireAuth` / `requireRole`; role re-read from the DB row each request; inactive account → `/login` | Server-side RBAC only; UI hiding is not relied upon |
| **R-12** | Preserve change accountability | Partial | `inventoryUpdatedById` + `inventoryUpdatedAt` capture actor + timestamp of the **last** availability change | No per-event audit history — PRD marks audit requirement UNKNOWN (see follow-ups) |

**Tally:** 10 Implemented · 2 Partial · 0 Missing.

## PRD unknowns: resolved or deferred

| PRD unknown | Resolution |
| :---------- | :--------- |
| What Local / In Stock / Indent mean; show quantity/location/lead time? | Resolved as a three-state **label only** (`src/lib/availability.ts`); no quantity — capstone excludes quantitative stock. |
| Which product/spec fields are searchable? | Resolved: name, brand, modelNumber, color, shortDescription (case-insensitive). |
| Who may create/edit/publish/retire/change availability? | Resolved: `ADMIN` and `SALES`, enforced server-side (`requireRole`). |
| Label-only visibility vs quantitative inventory? | Resolved: label-only (R-05/R-07). |
| Authentication / roles / account recovery? | Resolved: NextAuth v5 credentials; `ADMIN`/`SALES`; account `active` flag checked per request. Audit history deferred → R-12. |
| Freshness indicator? | Deferred → R-09. |
| Non-functional targets (browsers/devices/a11y/perf/dataset)? | Out of scope for this matrix. |

## Follow-ups (PRD-sanctioned partials)

- **R-09 - public data freshness.** The prototype stamps and surfaces freshness in admin only. Production: decide a freshness threshold and, if approved, show an "availability last updated / stale" indicator to customers. Tracked in `docs/TODO-FULL.md`.
- **R-12 - change accountability.** The prototype records only the latest availability change. Production: if mandated, add an append-only audit log (actor, timestamp, action, affected record) with restricted access. Tracked in `docs/TODO-FULL.md`.
