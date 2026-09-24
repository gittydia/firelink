# FireLink - Decisions

## ADR-001: Single-package repository (no pnpm workspaces)

Follows `templates-prompt/repo_temp.md`: one Next.js deployable with no shared packages yet. Added - if a web/API/mobile split or shared `packages/contracts` becomes real, evolve to workspaces then.

## ADR-002: Prototype uses SQLite via Prisma

`DATABASE_URL="file:./dev.db"` for zero-setup demonstration. The schema is PostgreSQL-compatible (Prisma enums); switching to Postgres only requires changing `DATABASE_URL` in `.env` and re-running migrate.

## ADR-003: NextAuth v5 (Auth.js beta) with Credentials + JWT

Simple email/password for staff. Role is embedded in the JWT/session; every protected action re-verifies server-side.

## ADR-004: Availability is an enum, never color-only

`LOCAL` / `IN_STOCK` / `INDENT` are rendered as text plus a visual badge. Color alone never carries meaning.

## ADR-005: Soft deletes via `active` flags

Products and categories are archived (active = false) rather than deleted, preserving catalog history.

## ADR-006: Prototype scope boundary

Information + inventory visibility only. No payments, checkout, shipping, accounting, payroll, or ERP features.