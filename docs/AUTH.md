# FireLink - Authentication & Authorization

## Authentication

- NextAuth v5 (Auth.js) with Credentials provider.
- Passwords stored as bcrypt hashes in `User.passwordHash`.
- Session/JWT carries the user's `role`.
- HTTP-only, Secure (production), SameSite cookies.

## Roles

| Role | Can do |
|---|---|
| Public (unauthenticated) | Browse catalog, search, filter, view product details |
| `SALES` | Log in; create/edit products; update inventory availability |
| `ADMIN` | Everything SALES can do, plus manage categories and staff users |

## Authorization boundaries (server-side only)

- `/admin/**` pages require a valid session (page-level `requireAuth`).
- Admin actions (server actions / route handlers) use `requireRole('ADMIN')` / `requireRole('ADMIN' | 'SALES')` guards.
- Middleware protects `/admin` and `/api/admin` routes as defense-in-depth; the source of truth is always the server-side check.
- Public queries only ever return `active` public products with no internal fields.

## Rules

- Never rely on hiding UI for security.
- Do not expose `passwordHash` or internal fields to the client.
- Deactivated users (`active = false`) cannot sign in.
- Audit trails (e.g. `Product.inventoryUpdatedById`) take the actor from the server session, never from submitted form data. The relation is `SetNull`, so deactivating or deleting an account preserves historical attribution as "Not recorded" rather than erasing it.
- Audit data is admin-only; do not surface staff names on public pages.