# FireLink - Domain Model

## Enums

| Enum                 | Values                        | Notes                               |
| -------------------- | ----------------------------- | ----------------------------------- |
| `UserRole`           | `ADMIN`, `SALES`              | Role-based access control           |
| `AvailabilityStatus` | `LOCAL`, `IN_STOCK`, `INDENT` | Product availability classification |

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

Gallery images for a product, ordered by `displayOrder`.

Images are **remote URLs typed into the admin form, never uploaded files** — no object storage, no file size limit, no `next/image` optimizer. `imageUrl` must be `http`/`https`, and `classifyImageUrl` (in `src/lib/product-image.ts`) rejects URLs that declare a known non-image format such as `.pdf`, `.zip` or `.mp4`. URLs with an unknown or missing extension stay valid, because many image endpoints (e.g. Unsplash `?fm=jpg`) carry no image extension in the path.

Because admin URLs come from arbitrary hosts that cannot be whitelisted in `next.config.ts`, admin surfaces render them with a plain `<img>` rather than `next/image`.

- **Primary image** - lowest `displayOrder`; ties keep the earlier array position so an unsorted result still resolves deterministically. The public catalog keeps using its existing `next/image` rendering.
- **Admin table** - shows the primary image as a click-to-enlarge thumbnail with a `+N` count for the rest.
- **Admin form** - previews each image row live as the URL is typed, labelled `Saved` when it matches a persisted image and `Unsaved` otherwise.
- **Resilience** - a blank or unloadable URL renders a labelled placeholder instead of a broken image. The failed URL is recorded, so correcting the field clears the error with no manual reset.
- **Alt text** - `altText` falls back to the product name, and never resolves to an empty string for a present image.

### ProductSpecification

Flexible key/value + unit for technical specs (e.g., Working Pressure = 175 PSI). Ordered by `displayOrder`.

## Relations

- Category 1—N Product (a product belongs to one category; a category has many products)
- Product 1—N ProductImage
- Product 1—N ProductSpecification
- Product N—1 User (`inventoryUpdatedBy`; set to `NULL` if the account is deleted)
