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

## ADR-007: Deactivated accounts keep their session until the JWT expires

Sign-in rejects inactive users (`active = false`), but the JWT embeds only `{ id, role }` and `requireRole()` does not re-read `active`, so a deactivated account retains `/admin` access until its token expires. Accepted deliberately for the prototype: deactivation blocks the next sign-in, and the behaviour is identical across products, categories, inventory and staff, so staff deactivation is no weaker than the rest of the app. Revisit when session revocation or shorter token lifetimes arrive with the full build.

## ADR-008: Formatting is not enforced repo-wide (pre-existing prettier mismatch)

`pnpm format` (`prettier --check .`) already fails on a clean checkout, for two pre-existing reasons: there is no prettier config and no `package.json#prettier` key, so the default `printWidth: 80` applies while committed code is written to roughly 100 columns; and Windows checkouts are CRLF while prettier defaults to `endOfLine: "lf"`. Do not run `pnpm format:fix` to "fix" this — it rewrites line endings and reflows every file, burying real changes in noise. Match the surrounding file's existing style instead; `pnpm typecheck` and `pnpm lint` are the enforced gates.

## ADR-009: The status-confirmation dialog traps focus at the boundaries only (known limitation)

`StaffRowActions` traps focus by intercepting Tab only when focus is already on the dialog's first or last focusable element, so if focus ever lands outside the dialog it is not pulled back in. Clicking the backdrop is the reachable path: the overlay is a plain non-focusable `div`, so the click blurs the active element to `<body>` and the next Tab escapes to the page rather than re-entering the dialog. Keyboard-only use is correct — initial focus moves to Confirm, Tab and Shift+Tab wrap at the boundaries, and Escape closes and restores focus to the trigger — and this is the only dialog in the prototype, so the gap is narrow. Accepted deliberately for the prototype: redirect Tab whenever `document.activeElement` sits outside `dialogRef`, and prefer a native `<dialog>` element, which delegates focus containment to the browser. Note that this behaviour was verified by static trace and build only, never in a real browser — Chrome could not start on the host used for this build (side-by-side configuration error), so focus *movement* is unproven and should be confirmed once a working browser is available.