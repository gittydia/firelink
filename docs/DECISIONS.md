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

`StaffRowActions` traps focus by intercepting Tab only when focus is already on the dialog's first or last focusable element, so if focus ever lands outside the dialog it is not pulled back in. Clicking the backdrop is the reachable path: the overlay is a plain non-focusable `div`, so the click blurs the active element to `<body>` and the next Tab escapes to the page rather than re-entering the dialog. Keyboard-only use is correct — initial focus moves to Confirm, Tab and Shift+Tab wrap at the boundaries, and Escape closes and restores focus to the trigger — and this is the only dialog in the prototype, so the gap is narrow. Accepted deliberately for the prototype: redirect Tab whenever `document.activeElement` sits outside `dialogRef`, and prefer a native `<dialog>` element, which delegates focus containment to the browser. Note that this behaviour was verified by static trace and build only, never in a real browser — Chrome could not start on the host used for this build (side-by-side configuration error), so focus _movement_ is unproven and should be confirmed once a working browser is available.

## ADR-010: A notification failure never fails the enquiry

`submitInquiry` returns `InquiryActionResult` rather than throwing, and treats the insert as the commit point. Everything after the insert — reading the row back, calling Resend, recording `notificationStatus` — runs inside a `try`/`catch` in `finalizeInquiry` that logs and swallows, because the row is already durable. Rethrowing there would show the visitor a failure for an enquiry that _was_ recorded, and the natural response is to press submit again, leaving sales two copies of one enquiry.

`notificationStatus` (`PENDING`/`SENT`/`FAILED`/`SKIPPED`) and `notificationError` exist so that failure stays visible and reconcilable on the row instead of being lost. `SKIPPED` is a real state, not a failure: it records that no transport was configured, so the attempt was deliberately not made.

Also note `notifySalesOfInquiry` never throws by construction — it catches its own `fetch` errors and returns a result — so the only throw sources in that block are the two Prisma calls.

Delivery is best-effort in a second sense: with `RESEND_API_KEY`/`INQUIRY_TO_EMAIL` unset, `submitInquiry` still returns `success`. Revisit if enquiries ever need guaranteed delivery, which would mean an outbox/queue and a retry job rather than inline sending.

## ADR-011: The enquiry payload carries product IDs only, and free-mail domains are allowed

The browser submits only `productId` and `quantity`; `productName`, `productSku` and `availabilityStatus` are resolved server-side from the catalog at insert time. A tampered payload therefore cannot misreport the catalog to sales — the names in the email and on the row are always the ones the database holds. Stored snapshots are for readability after a later rename, not for trust (see `DOMAIN-MODEL.md`).

`InquiryProduct` is `@@unique([inquiryId, productId])`, which also deduplicates a client that sends the same product twice.

Product selection is **optional**: a general enquiry with zero lines is valid, so `products` defaults to `[]` and the limit is 50 lines / 9999 per line. Work-email domains are not filtered — blocking free-mail providers is a hostile rule for legitimate small contractors and a list that goes stale constantly. Rate limiting and abuse handling are not implemented; the form's only bot defence is a `website` honeypot field, and it should be treated as a speed bump rather than a control. Revisit with a real IP/email rate limiter before production.
