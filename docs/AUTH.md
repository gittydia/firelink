# FireLink - Authentication & Authorization

## Authentication

- NextAuth v5 (Auth.js) with Credentials provider.
- Passwords stored as bcrypt hashes in `User.passwordHash`.
- Session/JWT carries the user's `role`.
- HTTP-only, Secure (production), SameSite cookies.

## Roles

| Role                     | Can do                                                          |
| ------------------------ | --------------------------------------------------------------- |
| Public (unauthenticated) | Browse catalog, search, filter, view product details            |
| `SALES`                  | Log in; create/edit products; update inventory availability     |
| `ADMIN`                  | Everything SALES can do, plus manage categories and staff users |

## Authorization boundaries (server-side only)

- `/admin/**` pages require a session whose account is still active (page-level `requireAuth`).
- Admin actions (server actions / route handlers) use `requireRole('ADMIN')` / `requireRole('ADMIN' | 'SALES')` guards.
- `requireAuth` re-reads the `User` row on every call, so `active` and `role` come from the database. The JWT is minted at sign-in and goes stale; a verified cookie is not evidence of access.
- The proxy matches `/admin/:path*` only and runs on the edge, so it cannot query Prisma. It checks that a session cookie is present as defense-in-depth; the server-side guard is the source of truth. There are no `/api/admin` routes — the only route handler is the Auth.js endpoint.
- Public queries only ever return `active` public products with no internal fields.

## Sales Staff management (`/admin/staff`)

- ADMIN-only. Every page and every server action calls `requireRole('ADMIN')` independently; the nav link is hidden from SALES for usability only.
- Accounts are **never hard-deleted**. Deactivation sets `active = false` and can be reversed, which preserves inventory audit attribution.
- Creation forces `role = 'SALES'` and `active = true` server-side, so a crafted form cannot mint an ADMIN or a pre-deactivated account.
- Editing details accepts only name and email. Role and status are intentionally absent from `staffUpdateSchema` so a detail save cannot change them.
- Status changes go through one explicit action, require confirmation, and reactivation is always offered.
- Email is normalized with `trim().toLowerCase()` because it is the login identifier; duplicate emails are rejected before write and on Prisma `P2002`.
- The list uses an explicit field `select` so `passwordHash` can never reach the client.

## Rules

- Never rely on hiding UI for security.
- Do not expose `passwordHash` or internal fields to the client.
- Deactivated users (`active = false`) cannot sign in, and lose access on their next request even while their session cookie is still valid.
- Audit trails (e.g. `Product.inventoryUpdatedById`) take the actor from the server session, never from submitted form data. The relation is `SetNull`, so deactivating or deleting an account preserves historical attribution as "Not recorded" rather than erasing it.
- Audit data is admin-only; do not surface staff names on public pages.
