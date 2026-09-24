# FireLink - Decisions

## ADR-001: Single-package repository (no pnpm workspaces)

Follows `templates-prompt/repo_temp.md`: one Next.js deployable with no shared packages yet. Added - if a web/API/mobile split or shared `packages/contracts` becomes real, evolve to workspaces then.

## ADR-002: PostgreSQL via Prisma (local dev on Docker, hosted Postgres in production)

`DATABASE_URL` points at PostgreSQL. Local development uses `docker-compose.yml` (Postgres on port 5433, avoiding conflicts with a native PostgreSQL install on 5432). Production targets a hosted Postgres instance (Neon / Supabase / Vercel Postgres). Supersedes the original prototype choice of SQLite (`file:./dev.db`) — SQLite cannot run on Vercel's serverless filesystem, so the schema was switched in September 2026 before first deploy.

## ADR-003: NextAuth v5 (Auth.js beta) with Credentials + JWT

Simple email/password for staff. Role is embedded in the JWT/session; every protected action re-verifies server-side.

## ADR-004: Availability is an enum, never color-only

`LOCAL` / `IN_STOCK` / `INDENT` are rendered as text plus a visual badge. Color alone never carries meaning.

## ADR-005: Soft deletes via `active` flags

Products and categories are archived (active = false) rather than deleted, preserving catalog history.

## ADR-006: Prototype scope boundary

Information + inventory visibility only. No payments, checkout, shipping, accounting, payroll, or ERP features.