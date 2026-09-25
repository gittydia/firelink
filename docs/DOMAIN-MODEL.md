# FireLink - Domain Model

## Enums

| Enum | Values | Notes |
|---|---|---|
| `UserRole` | `ADMIN`, `SALES` | Role-based access control |
| `AvailabilityStatus` | `LOCAL`, `IN_STOCK`, `INDENT` | Product availability classification |

### Availability semantics

- `LOCAL` - locally available / locally sourced
- `IN_STOCK` - currently has available inventory
- `INDENT` - must be specially ordered / sourced before delivery

## Entities

### User
Staff account. `passwordHash` is bcrypt; never store plaintext. `active` = soft deactivate (cannot log in when false).

### Category
Catalog grouping (e.g., Fire Extinguishers). `name` unique. `active` = soft deactivate.

### Product
Core catalog entity. `sku` and `slug` unique. `availabilityStatus` is one of the enum values. `active` = soft archive (inactive products are hidden from public catalog).

#### Inventory audit
`inventoryUpdatedAt` + `inventoryUpdatedById` record when availability last genuinely changed and which staff account made it. Written only on a real `availabilityStatus` change, so re-submitting the same status leaves the stamp untouched. Both stay `NULL` for products created through the admin UI and for rows that predate this feature; the admin UI renders those as "Not recorded".

### ProductImage
Gallery images for a product, ordered by `displayOrder`.

### ProductSpecification
Flexible key/value + unit for technical specs (e.g., Working Pressure = 175 PSI). Ordered by `displayOrder`.

## Relations

- Category 1—N Product (a product belongs to one category; a category has many products)
- Product 1—N ProductImage
- Product 1—N ProductSpecification
- Product N—1 User (`inventoryUpdatedBy`; set to `NULL` if the account is deleted)