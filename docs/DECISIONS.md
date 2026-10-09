# Fire Protection Equipment - Decisions

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

## ADR-012: The pricelist is a standalone staging pipeline, not yet a schema entity

`scripts/pricelist/extract_pricelist.py` reads the source workbook and writes four artifacts to `pricelist_cleaned/normalized/` — `pricelist_entries.csv`, `pricelist_entries.json`, `quarantine.csv`, `parse_report.json`. It runs on its own and shares no code with the Next.js app. `prisma/schema.prisma` and `prisma/seed.ts` are deliberately **untouched**: no `Pricelist` model and no category rows exist yet, because the 16 extracted categories need a human decision on the catalog taxonomy first. Promoting the CSV into tables is a separate, explicitly-approved step; the CSV is the contract that step will read.

The pipeline is re-runnable and idempotent: a corrected source workbook replaces the quarantined rows on the next run rather than being hand-patched. Anything a human resolves should be fixed in the source or in the parser, never edited into the output.

## ADR-013: Every entry records how its product name was resolved, and unresolved names are emitted rather than dropped

`product_source` is one of `own-label`, `inherited-label`, `slide-title`, `unresolved`, and it is the field that makes a bulk import reviewable. A name taken from the row's own cell is stronger evidence than one inherited from the preceding row, which is weaker than one carried from the slide title. Current distribution: 366 `own-label`, 300 `slide-title`, 241 `inherited-label`, 44 `unresolved` — so roughly a third of rows are resolved by inference rather than by their own label, which is exactly the population a reviewer must re-check.

Slide titles are only trusted when the slide is homogeneous. PowerPoint tables merge whole rows into the first cell, so a cell like `Smoke & Heat | 650` arrives where a product name belongs; such cells are rejected (`has_data_noise`) and the table downgrades to inherited/title resolution rather than writing a price into the product name. Mixed slides (5, 16, 17, 24, 57) are flagged as title-unreliable in the report. Damage is never silently normalized: a name carrying a replacement character is kept and marked `NEEDS_REVIEW` with an explicit note instead of being guessed.

## ADR-014: `price_high` is null unless the source itself shows a range

No entry carries a `price_high`, and none is inferred. Two prices on one row mean the row is ambiguous (`price-pair-ambiguous` quarantine) or one of them is a size, not a range — inventing a low/high pair from them would fabricate a discount structure the source never stated. The one row that could be read as a range stays null. Ranges are introduced only when the workbook prints them as ranges, with both endpoints in the source text.

## ADR-015: Categories come from an explicit per-table map for this workbook, with a keyword classifier as fallback

Category assignment is a deliberate per-table/per-slide map derived from the labels actually present in this workbook, not a generic keyword guess. Where nothing matches, the row is emitted as `Unclassified` with `NEEDS_REVIEW` rather than being forced into a plausible category — the alternative is a confidently wrong category that nobody ever revisits. `Terms & Conditions` is excluded as a non-product slide. The current run has 0 unclassified tables and 0 map gaps, and `Unclassified` is the intended value only if a future workbook trips the fallback.

`review_status` is `PENDING` only when the product name is `own-label` **and** the row carries no notes at all, so any ambiguity — an inferred name, a missing size, a category guess, a damaged glyph — forces `NEEDS_REVIEW` (786 rows). This is a conservative default on purpose: a `PENDING` row is a claim that the row is clean, so the bar for earning it has to be high.

## ADR-016: A bare integer below 30 is a size, not a price

`BARE_INTEGER_SIZE_FLOOR = 30` in the parser rejects any price-shaped cell that is a comma-free, decimal-free integer below 30. Without it, slide 53's conduit schedule was read as three ₱1 and ₱2 products. The rule is deliberately narrow: it does not touch `15.00` or `25.00` (the decimal point means the cell was formatted as currency), does not touch `30` itself, and applies only to a form that is otherwise size-ambiguous.

The evidence is a gap in the distribution, and it is re-runnable rather than asserted: `python scripts/pricelist/measure_size_price_floor.py` re-extracts the workbook once per candidate floor and reports the effect of each. Of the 954 rows the parser emits with the rule off, 714 carry a bare-integer price. Exactly three of those sit below 30 — `1` (`S53 T10 r2`), `2` (`S53 T9 r1`), `2` (`S53 T13 r3`) — and the next value up is a genuine ₱30 price (`S13 T5 r2`).

The stronger argument for 30 specifically is that it is the largest value the choice is safe at. Every floor from 3 to 30 produces a byte-identical outcome: 951 entries, 54 quarantined, 0 gained, 0 repriced, exactly the 3 slide-53 rows lost. Floors 1 and 2 are too low: floor 1 admits all three rows, and floor 2 rejects the `1` but still admits both `2`s; 31 and above are too high and start rejecting the genuine ₱30 (950 entries at 31, 949 at 50). The floor therefore sits at the top of the plateau, not in the middle of it, so a future edit that nudges it upward is caught immediately.

Slide 53 T12 confirms the reading directly: the same schedule elsewhere prices `1 1/4 | 75.00`, `1 1/2 | 102.00`, `2 | 140.00`, so a bare `2` in a size column is inches, not money. A general table-wide column-role inference was tried and **refuted**: it changed 17 genuine prices and still missed the slide-53 rows, because the workbook reuses the same column for different meanings slide to slide.

The floor is a heuristic over one workbook, so it lives in one named constant with its evidence attached. If a future source prices a genuine item below 30 in bare-integer form, that constant is the one place to revisit.

## ADR-017: A row the parser cannot interpret is quarantined, not guessed and not dropped

54 of 1,005 source rows (5.4%) are held back in `quarantine.csv` rather than coerced into `pricelist_entries.csv`. They split into two failures: 53 `size-without-price` (a size with no usable price cell — the slide-53 conduit schedules, whose price column is missing) and 1 `price-pair-ambiguous` (two plausible price cells in one row).

The tempting shortcut is to fill the missing prices from the priced sibling tables on the same slide, or to pick the better-formed of the two candidates. Both are refused, and the reason is that a fabricated entry is indistinguishable from a real one once it is in the catalog. It gets a price that looks authoritative, it passes every downstream check, and nobody ever re-opens it — the failure is invisible precisely because the data is clean-looking. Quarantine makes the gap enumerable and fixable: 54 rows, two reason codes, and a human can look at slide 53 and settle the whole batch in one pass. Silence does the opposite, and a dropped row is worse than a wrong one because a dropped row cannot even be counted.

Quarantine is also why the entry count is a checkable number. 951 emitted plus 54 quarantined is 1,005 source rows, and `parse_report.json` records both halves, so a re-run that silently loses or invents rows fails the audit instead of quietly changing the catalog. A quarantined row is never hand-edited into place — the source or the parser is fixed and the import re-run (ADR-012), which keeps the normalized output reproducible from the source rather than from a sequence of manual patches.

## ADR-018: The evidence base is the cleaned workbook; the deck-to-workbook step is documented but its tool is not committed

The supplier's source of record is `ppt/PRICELIST-JANUARY-2026.ppt`. It is a legacy OLE2 binary PowerPoint (97-2003, 19.4 MB), not an OOXML `.pptx`, so the usual tooling does not read it: `python-pptx` rejects the format and no LibreOffice/soffice binary is present in this environment. All extraction, measurement, and acceptance evidence therefore comes from `pricelist_cleaned/PRICELIST-JANUARY-2026_CLEANED_EXTRACTION.xlsx`, the cleaned workbook derived from that deck, plus the per-cell evidence in `table_cells.csv`, `structured_extraction.json`, and `cleaned_slide_report.md`.

That boundary is *documented*, not unexplained, and the distinction matters. `cleaned_slide_report.md` records that text and tables were read from native PowerPoint objects — not OCR, not visual transcription of the 59 PNGs in `slide_renders/` — and it enumerates all 59 slides as 352 table blocks, notes that the deck carries no speaker notes, and states that embedded picture files were listed and extracted separately (the 294 files in `extracted_images/`). So the step was programmatic and its output is auditable by eye against the deck. What is missing is the converter itself, so the step cannot be re-run or independently re-audited from this repo. The gap is a missing tool, not a missing method, and that is a much cheaper thing to close later.

The practical consequence is that the workbook is trusted but not regenerable here. That is acceptable for staging — the workbook carries per-cell provenance and every accepted row is re-checkable against it — but it is a real limit on the guarantee, and it is recorded rather than left as a gap someone has to rediscover. Two things would close it: commit the converter that produced `cleaned_slide_report.md` (LibreOffice headless, or a binary-`.ppt` reader such as Apache POI HSLF) plus a fixture, or obtain a supplier-supplied `.pptx` and CSV. Until one of those exists, treat the cleaned workbook as the review surface and the deck as the document of record behind it, and do not describe any claim as "verified against the original `.ppt`" — it has been verified against the cleaned workbook, whose derivation from the deck is documented but not re-runnable.

Note also that the corrected ADR-016 evidence is measured *from the parser's own output*, not by hand-counting cells in the deck. That choice is deliberate: it keeps the number in the same units as the thing the floor changes, so 714 stays honest even if the upstream conversion is later redone.

## ADR-019: The normalized pricelist imports as catalog rows; ambiguous variants import archived, not dropped

The promotion step deferred by ADR-012 is now done, and it is all-or-nothing on existence but opinionated on visibility. `pricelist_cleaned/normalized/pricelist_entries.csv` (the permanent contract, 1,207 rows) materializes as two new entities: one `Product` per distinct product name (137 products) and one `ProductVariant` per `(product, size, series)` key (779 distinct keys). `ProductVariant` carries the pricing (`unitPrice`, `priceHigh` — which stays null, per ADR-014) and full provenance (`reviewStatus`, `ambiguityNote`, `sourceSlide`/`sourceTable`/`sourceRow`/`sourceColumn`, `unit`), with `@@unique([productId, size, series])`; empty `size`/`series` normalize to `''` so the key never collapses on a missing value. This supersedes the ADR-012 deferral of the catalog-taxonomy decision: the 16 categories are imported as the workbook names them and promoted `active = true` — taxonomy refinement is a full-build task, and renaming a category later is a one-field update, not a data hazard.

The visibility rule is the import's whole point: `PENDING` rows (151, spanning 39 products / 21 series) import `active = true` with their prices live in the public catalog, while `NEEDS_REVIEW` rows (1,056) import `active = false` with provenance intact — invisible to the public, fully queryable and promotable by staff in the admin. Nothing is dropped and nothing is guessed. An ambiguous variant being *in the database* is not the same as it being *promoted*; staging it archived keeps the "never infer" boundary (ADR-017) intact while making the resolve-later backlog enumerable instead of binary.

`brand` is imported as the CSV value when present (326 rows) and as `''` otherwise, because the column is a non-null `String` and `''` is the honest representation of "absent" at this boundary. The admin UI must render `''` distinctly from a real brand rather than blanking it into a plausible value, and the admin form's existing `brand.trim().min(1)` stays strict for manual edits — the import path and the human path enforce different floors on purpose.

One wrinkle the keycheck workup caught is worth codifying: 153 of the 779 keys appear with two or more *different* unit prices (the repeated-header case `keycheck.py` was written to detect). For those keys the first row wins the variant row, and the variant imports `active = false` with the colliding prices and both source locations written into `ambiguityNote` — the contradiction is recorded, never resolved by preferring one price or averaging them. Keys duplicated with an *identical* price dedupe silently, since collapsing them loses no information. Both cases are forced `NEEDS_REVIEW` regardless of what the CSV's own `review_status` says, so a conflicting price can never ride in on a `PENDING` row.

Availability rides on the `Product`, not the variant: new products created by the import are stamped `availabilityStatus = INDENT` (overriding the schema default `LOCAL`), because a pricelist row proves only that the product exists and has a price — never that stock is on hand. Re-imports never overwrite an existing product's `availabilityStatus` or `slug`; those are staff-curated values owned by the admin inventory/view UI, not by the pipeline. Variants carry no availability status of their own — a variant's public visibility is gated solely by its `active` flag, and a product's headline availability remains a product-level concern.

## ADR-020: Admin-created variants are live and authoritative

A variant added through the admin form is stamped `reviewStatus = "PENDING"` and `active = true` at creation, so a staff-typed size/price is live on the public catalog immediately — no review queue. The alternative was to route manual rows through the import ladder, but that ladder exists to stand in for evidence a keyboard never had: the importer marks `NEEDS_REVIEW` when the source is ambiguous (ADR-019), while a staff member typing a value *is* the review, and a second approval pass over their own input adds friction without new information.

The status's meaning therefore depends on the creation path, and the two paths keep their defaults honestly separate. The schema default is `PENDING`; the importer overrides it to `NEEDS_REVIEW` for anything it distrusts, so the status always records who cleared the row — the admin form implies "typed by staff", the importer says "unresolved when imported".

Public visibility is gated by `active` alone, never by `reviewStatus`: archived `NEEDS_REVIEW` rows stay queryable in `/admin` with provenance intact (ADR-019), and `toggleVariantActive` is the promotion/demotion lever. Stepping a variant revalidates the product detail page and both admin surfaces, so a toggle is reflected wherever the row is rendered.

The SKU is derived with the importer's own `buildVariantSku` (`src/lib/prc-sku.ts`), so a manually added key resolves to the same `PRC-…` code an import would generate; if a row with that `(size, series)` key already exists, `@@unique([productId, size, series])` rejects the insert and the error names the colliding SKU instead of silently overwriting it.

Prices travel from the form to the action as strings (`/^\d{1,10}(\.\d{1,2})?$/`, mirroring `DECIMAL(12,2)`), and an emptied price field becomes `NULL` rather than `0` — a variant without a price renders as `—`, never as a silent zero. `size` and `series` are individually optional but at least one is required, matching the `@@unique([productId, size, series])` key whose absent halves normalize to `''`.

## ADR-021: Pricelist images attach as local files under `public/pricelist-images/`, bypassing the admin http(s)-only URL path

The sold-sheet photos extracted from the January 2026 deck (`pricelist_cleaned/extracted_images/`, keyed by slide) are attached to catalog products by `scripts/pricelist/attach_pricelist_images.ts`. The script embeds a locked product-name → slide map, supports `--apply` (default is dry-run), copies the matching extracted files into `public/pricelist-images/`, and inserts `ProductImage` rows with local `/pricelist-images/…` URLs ordered by `displayOrder`. A product that already has images is skipped, not re-attached, so re-runs are idempotent.

No application code changed for this step: the public PDP already renders the gallery with `next/image` from `imageUrl`, so an attached row displays there the moment its product is active. The admin URL path is deliberately untouched — `classifyImageUrl` (`src/lib/product-image.ts`) stays `http`/`https`-only, and the accepted consequence is that re-saving a pricelist product in the admin form replaces its image set and drops the local rows (the script prints this as an ALERT). Restoring them is a re-run of the attach script; the alternative — teaching the validator to accept local paths — is deferred to keep the admin URL contract strict.

State after verification (at the time of this ADR): 62 files and 62 `ProductImage` rows attached across 16 products — 72 total image rows including the 10 seeded demo images. All 16 attached products were `active = false` at that point: the import sets a product active only when at least one of its variants imported `PENDING` (variant/product active rules, ADR-019), and these products have none. So attaching the images and promoting the products are separate, deliberate steps — the 16 galleries became publicly visible only through the owner-approved activation applied by `activate_attached.ts` (ADR-022).

## ADR-022: Owner-approved activation promotes the 16 attached pricelist products and all 187 of their variants

The owner approved activating "all 16 products + variants" attached by ADR-021, and `scripts/pricelist/activate_attached.ts` does exactly that in one batch: it flips product `active` and variant `active` flags only — `reviewStatus`, `availabilityStatus`, and prices are untouched. Activation deliberately bypasses the NEEDS_REVIEW gate (ADR-019) for precisely these SKUs, and nothing is inferred: the script embeds the same locked product-name → slug map that ADR-021's attach step used, dry-runs by default, and refuses `--apply` if any target variant has zero `/pricelist-images/` rows, so no unproven row can be promoted. See TODO-PROTOTYPE Phase 9 for the applied result.

The write path is the array form of Prisma's `$transaction([...ops])`. The interactive form (`$transaction(async (tx) => …)` with its reads/writes interleaved and a timeout racing the commit) failed deterministically in this environment with PrismaClientKnownRequestError P2028 ("Transaction already closed"), so the interactive form is deliberately not used for this script and must not be reintroduced for it.

`reviewStatus` stays untouched by design. The 187 newly-active lock-set variants remain `NEEDS_REVIEW` (verified: 187 `NEEDS_REVIEW`, 0 `PENDING` among them), keeping their workbook provenance intact and queryable in `/admin` — promoting a row and resolving its review are separate axes, per ADR-020's "visibility is gated by `active` alone".

Verified catalog totals after apply: 147 products — 65 active (49 already-active outside the locked set plus the 16 lock-set products) and 82 archived — and 779 variants — 324 active (137 `PENDING`, cleared at import or typed in admin, plus 187 lock-set `NEEDS_REVIEW`) and 455 archived. The public catalog shows a newly-active variant only where the source provided a price; the "never infer" boundary (ADR-017) is unchanged.
