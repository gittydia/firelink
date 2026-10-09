# Fire Protection Equipment - Domain Model

## Enums

| Enum                        | Values                                 | Notes                                         |
| --------------------------- | -------------------------------------- | --------------------------------------------- |
| `UserRole`                  | `ADMIN`, `SALES`                       | Role-based access control                     |
| `AvailabilityStatus`        | `LOCAL`, `IN_STOCK`, `INDENT`          | Product availability classification           |
| `InquiryNotificationStatus` | `PENDING`, `SENT`, `FAILED`, `SKIPPED` | Outcome of the best-effort sales notification |
| `VariantReviewStatus`       | `PENDING`, `NEEDS_REVIEW`             | Whether a row cleared the catalog (who stamped it) |

### Availability semantics

- `LOCAL` - locally available / locally sourced
- `IN_STOCK` - currently has available inventory
- `INDENT` - must be specially ordered / sourced before delivery

## Entities

### User

Staff account. `passwordHash` is bcrypt; never store plaintext. `active` = soft deactivate (cannot log in when false).

`role` separates ADMIN from SALES. SALES accounts are managed from `/admin/staff` and are never hard-deleted — deactivation flips `active` and is reversible, so `inventoryUpdatedBy` attribution survives. `email` is unique and stored lowercased and trimmed, since it is the login identifier.

### Category

Catalog grouping (e.g., Fire Extinguishers). `name` unique. `active` = soft deactivate.

### Product

Core catalog entity. `sku` and `slug` unique. `availabilityStatus` is one of the enum values. `active` = soft archive (inactive products are hidden from public catalog).

#### Inventory audit

`inventoryUpdatedAt` + `inventoryUpdatedById` record when availability last genuinely changed and which staff account made it. Written only on a real `availabilityStatus` change, so re-submitting the same status leaves the stamp untouched. Both stay `NULL` for products created through the admin UI and for rows that predate this feature; the admin UI renders those as "Not recorded".

### ProductImage

Gallery images for a product, ordered by `displayOrder`. Two distinct sources feed this table:

1. **Admin-typed remote URLs** — images are **remote URLs typed into the admin form, never uploaded files** — no object storage, no file size limit, no `next/image` optimizer. `imageUrl` must be `http`/`https`, and `classifyImageUrl` (in `src/lib/product-image.ts`) rejects URLs that declare a known non-image format such as `.pdf`, `.zip` or `.mp4`. URLs with an unknown or missing extension stay valid, because many image endpoints (e.g. Unsplash `?fm=jpg`) carry no image extension in the path.

   Because admin URLs come from arbitrary hosts that cannot be whitelisted in `next.config.ts`, admin surfaces render them with a plain `<img>` rather than `next/image`.

2. **Script-attached pricelist files** — `scripts/pricelist/attach_pricelist_images.ts` copies the supplier's sold-sheet photos into `public/pricelist-images/` and inserts rows with local `/pricelist-images/…` paths (`imageUrl` starting `/pricelist-images/`). These are static files served from `public/`, so the public catalog renders them normally through `next/image`. The attach script is idempotent (it refuses products that already have image rows) and never touches the admin URL path. Admin validation stays `http`/`https`-only, so **re-saving a pricelist product in the admin form drops its attached local rows** — restoring them is a re-run of the attach script (ADR-021).

- **Primary image** - lowest `displayOrder`; ties keep the earlier array position so an unsorted result still resolves deterministically. The public catalog keeps using its existing `next/image` rendering.
- **Admin table** - shows the primary image as a click-to-enlarge thumbnail with a `+N` count for the rest.
- **Admin form** - previews each image row live as the URL is typed, labelled `Saved` when it matches a persisted image and `Unsaved` otherwise.
- **Resilience** - a blank or unloadable URL renders a labelled placeholder instead of a broken image. The failed URL is recorded, so correcting the field clears the error with no manual reset.
- **Alt text** - `altText` falls back to the product name, and never resolves to an empty string for a present image.

### ProductSpecification

Flexible key/value + unit for technical specs (e.g., Working Pressure = 175 PSI). Ordered by `displayOrder`.

### ProductVariant

One priced line under a product, keyed by `(size, series)` with `@@unique([productId, size, series])` — an absent size or series normalizes to `''` so the key never collapses on a missing value (matching the importer, ADR-019). `sku` is derived as `PRC-…` by `buildVariantSku(productName, size, series)` in `src/lib/prc-sku.ts`, the same derivation the importer uses, so a manual variant and a future import of the same key resolve identically (ADR-020).

- `unitPrice` / `priceHigh` — PHP. `priceHigh` exists only when the source itself showed a range (ADR-014); an admin-typed variant never sets it.
- `reviewStatus` — `PENDING` or `NEEDS_REVIEW`. The value names who cleared the row: the importer sets `NEEDS_REVIEW` for unresolved rows (ADR-019), the admin form leaves the `PENDING` default because a staff member typed the values (ADR-020).
- `active` — the only public-visibility gate. Imported `NEEDS_REVIEW` variants start archived but stay queryable in `/admin`; `toggleVariantActive` is the promotion/demotion lever.
- `ambiguityNote` + `sourceSlide` — provenance for a reviewed row: what to distrust and where in the workbook it came from.

Current catalog (verified in DB): 147 products — 65 active (49 imported/curated plus the 16 owner-activated pricelist products, ADR-022) and 82 archived, with 140 `INDENT` overall — and 779 variants — 324 active (137 `PENDING` cleared at import or typed in admin, plus 187 owner-activated `NEEDS_REVIEW` variants) and 455 archived `NEEDS_REVIEW` — across 21 categories. The 187 owner-activated variants stay `NEEDS_REVIEW`: `active` controls public visibility, `reviewStatus` records provenance, and activation never rewrites the latter.

### Inquiry

A guest enquiry submitted through the public Contact form. Anonymous by design: there is **no** `userId`, because an enquiry comes from an unauthenticated visitor, so there is no account to attribute, revoke, or cascade from.

- `reference` is unique, generated server-side as `FLQ-YYYYMMDD-XXXXXX`, and is the identifier the visitor is shown. It is read back from the insert and never re-derived, so a retry notifies with the value that actually persisted.
- `privacyPolicyVersion` + `privacyAcceptedAt` are a **point-in-time record of consent**, not a boolean: the policy text can change, and we need to know which version the sender actually agreed to.
- `notificationStatus` tracks the best-effort sales email and `notificationError` retains the failure reason, so a failed send stays visible on the row instead of being lost. The inquiry is durable regardless — see ADR-010.

`message` is capped at 5000 characters and `name`/`company`/`email` at 200 by the Zod schema in `src/lib/validation.ts`.

### InquiryProduct

Join row attaching a requested product to an enquiry, `@@unique([inquiryId, productId])` so a duplicate submission cannot create two lines for one product.

`productName`, `productSku` and `availabilityStatus` are **snapshotted at submission** from the resolved `Product`, so the enquiry stays readable after a rename or archive. `productId` remains the authority and the relation is still the live source of truth. `onDelete: Restrict` on the product side means archiving a product (the supported path, via `active = false`) can never destroy enquiry history; `onDelete: Cascade` on the inquiry side means deleting an enquiry takes its lines with it.

A product that is archived between selection and submission is **dropped from the enquiry** rather than failing the whole submission.

## Relations

- Category 1—N Product (a product belongs to one category; a category has many products)
- Product 1—N ProductImage
- Product 1—N ProductSpecification
- Product 1—N ProductVariant
- Product N—1 User (`inventoryUpdatedBy`; set to `NULL` if the account is deleted)
- Product 1—N InquiryProduct
- Inquiry 1—N InquiryProduct (cascading delete)

## Staging: Pricelist (promoted into catalog rows)

The January 2026 supplier pricelist is extracted to a **staging artifact** and then promoted into catalog rows by the import step — one `Product` per distinct product name, one `ProductVariant` per `(product, size, series)` key — as decided in ADR-019. `prisma/schema.prisma` has no `Pricelist` model and no pricelist categories are seeded; `pricelist_cleaned/normalized/` is the input contract the importer reads, not a live schema. Treat the shape below as the contract — the `Product` and `ProductVariant` entities above are what it became.

One `PricelistEntry` is emitted per source table row, so the import is a flat list of line items rather than a product hierarchy: a row is a size plus a price, and the same product appears once per size it is sold in.

| Field                              | Purpose                                                                                                                                      |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `source_slide` / `source_table` / `source_row` | Coordinates back to the exact workbook cell, so any row can be re-checked against the original.                |
| `raw_text`                         | The source row verbatim, never rewritten. Normalized values are derived from it; it is the ground truth for a later review. |
| `product_name` + `product_source`   | The resolved name and **how** it was resolved (`own-label`, `inherited-label`, `slide-title`, `unresolved`) — see ADR-013.            |
| `size`                             | Free text (`1 1/4`, `2 ½ - ¾`, `1/8 x 2`) because the workbook is not dimensionally consistent. Fractional glyphs are genuine, not damage. |
| `unit_price` + `price_high`         | PHP. `price_high` is populated only for an evidenced range and is otherwise `NULL` — see ADR-014.                                             |
| `category`                         | One of the 16 mapped categories, or `Unclassified` (currently 0) — see ADR-015.                                                                |
| `review_status`                    | `PENDING` only for a clean `own-label` row with no notes; otherwise `NEEDS_REVIEW`. 786 of 951 rows are `NEEDS_REVIEW`.                    |
| `ambiguity_note`                   | Everything a reviewer needs to distrust the row: ignored price candidates, missing sizes, damaged cells, inferred names.                     |

### The 16 mapped categories

Assigned by the explicit per-table map in ADR-015, so these are the actual current values rather than an aspirational taxonomy. The counts are the January 2026 run and are reproduced in `parse_report.json`; a re-run that changes them is a real change to the source, not noise, and should be read as one.

| Category                     | Rows |
| ---------------------------- | ---: |
| Fire Pumps & Pump Sets       |  202 |
| Valves                       |  186 |
| Couplings, Nozzles & Monitors |   99 |
| Hardware & Fasteners         |   84 |
| Pipes & Fittings             |   77 |
| Fire Hoses & Reels           |   52 |
| Sprinkler Heads & Nozzles    |   49 |
| Water Meters & Tank Fittings |   46 |
| Fire Alarm & Detection       |   32 |
| Electrical                   |   32 |
| Tools, Equipment & PPE       |   30 |
| Water Transfer Pumps         |   29 |
| Fire Extinguishers & Agents  |   16 |
| Fire Hydrants                |    9 |
| Instruments & Gauges         |    5 |
| Pumps & Motors               |    3 |
| **Total**                    | **951** |

`Unclassified` is 0 in this run, which means the map covered every table. That is the number to watch: it should only move if a new workbook arrives or the map is deliberately changed, and either way the promotion step should re-check it rather than inherit it.

Rows the parser cannot interpret with confidence are **not** dropped — they go to `quarantine.csv` with a reason (`size-without-price` ×53, `price-pair-ambiguous` ×1). A quarantined row is a known-bad row; a missing row is an unknown one, and only the first is safe to act on. `parse_report.json` carries the per-slide and per-category distribution plus any category-map gaps, which is the acceptance check for a re-run.

Two intermediate files back the audit trail: `slide_index.csv` (per-slide titles) and `table_cells.csv` (every flattened source cell). Both are evidence, not inputs — never hand-edit the normalized output to resolve a quarantine, fix the source or the parser and re-run (ADR-012).
