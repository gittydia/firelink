# FireLink - Domain Model

## Enums

| Enum                        | Values                                 | Notes                                         |
| --------------------------- | -------------------------------------- | --------------------------------------------- |
| `UserRole`                  | `ADMIN`, `SALES`                       | Role-based access control                     |
| `AvailabilityStatus`        | `LOCAL`, `IN_STOCK`, `INDENT`          | Product availability classification           |
| `InquiryNotificationStatus` | `PENDING`, `SENT`, `FAILED`, `SKIPPED` | Outcome of the best-effort sales notification |

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
- Product N—1 User (`inventoryUpdatedBy`; set to `NULL` if the account is deleted)
- Product 1—N InquiryProduct
- Inquiry 1—N InquiryProduct (cascading delete)
