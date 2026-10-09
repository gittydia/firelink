# Quotation governance foundation

Status: foundation only. No quotation can be created, priced, approved, issued,
rendered, sent, expired, or deleted by this implementation. All four business
decisions remain unresolved. This document governs future implementation where
older proposals suggest live catalog rendering or a particular review method.

## Inspection and reuse

- **Guest inquiry:** `prisma/schema.prisma`: `Inquiry` stores a unique reference,
  customer name/company/email, consent, and notification metadata. No customer
  account is required.
- **Selected products:** `InquiryProduct` links inquiry and product, with quantity
  and submission-time name/SKU/availability snapshots. It does not select a variant
  or record a price. Preserve it unchanged.
- **Catalog prices:** `ProductVariant.unitPrice` and `priceHigh` are nullable
  `Decimal(12,2)`. `Product` has no price. `docs/DOMAIN-MODEL.md` identifies catalog
  prices as PHP; this does not select quotation currency, source, rounding, or
  pricing policy. Missing prices are not zero.
- **References:** `src/lib/inquiry.ts` generates server-side `FLQ-YYYYMMDD-XXXXXX`
  references. Contact actions enforce uniqueness and handle collisions. Reuse the
  approach, not the inquiry reference namespace, for future quotations.
- **Authorization:** `src/lib/permissions.ts` rechecks the current account and
  database role. `ADMIN` and `SALES` are the only roles. Inactive accounts cannot
  use protected operations even with an existing cookie.
- **Attribution:** Inventory uses actor foreign keys and timestamps; historical
  name lookup does not require an active actor. There is no general append-only
  audit/event store to reuse.
- **Notifications:** `src/lib/email.ts` uses Resend for sales inquiry notifications
  after persistence. It has no quotation sending, attachments, or durable
  quotation send ledger. Keep this flow unchanged.
- **Storage/rendering:** No PDF dependency in `package.json`. Product images use
  remote URLs or public static files (ADR-021); these are not private quotation
  artifact storage. Do not place customer documents under `public/`.
- **Configuration/tests:** Prisma and notification settings use environment
  variables. Vitest tests pure helpers and mocked I/O boundaries. No new
  environment switches or dependencies are required here.
- **Statuses:** Availability, inquiry notification, and variant review enums have
  unrelated meanings. None represents quotation approval. Do not reuse them.

The research documents are proposals, not approvals. In particular, ADR-020's
staff-entered catalog pricing is not approval to automatically issue quotations.

## Decision register

No decision below has an approver, approval date, or approved decision reference.
Record those against each decision before changing the code-owned configuration.
Use a reviewed, versioned decision record, not a UI dropdown or client payload.

- **Pricing: unresolved.** Choose `UNIT_PRICE_SNAPSHOT` or
  `FULL_PRICE_CONDITION_SNAPSHOT`; price source; product-to-variant selection;
  currency; precision/rounding; missing-price behavior; discounts, taxes, charges
  and adjustments; commercial validity.
- **Output: unresolved.** Choose `PDF_ONLY` or `HTML_WITH_OPTIONAL_PDF`;
  accessibility acceptance criteria; authorized retrieval; immutable artifact
  storage and template versioning. No renderer is selected.
- **Approval: unresolved.** Choose `AUTOMATIC`, `STAFF_REVIEW`, or
  `ROLE_BASED_APPROVAL`; permissions of existing roles; who may price, review,
  approve and issue; separation of duties and revision behavior.
- **Retention: unresolved.** Specify independent rules for quotation records
  (including issued quotations), documents, send records, expired and voided
  quotations. For each: duration or explicit indefinite retention, clock-start
  event, holds, disposition authority and evidence.

`src/lib/quotation-policy.ts` represents missing decisions with explicit `null`.
Controlled schemas list possible choices without selecting them. Retention rules
have no default duration or start event. They are descriptions, not a cleanup
scheduler; overlapping rules, legal holds and disposition procedures still need
implementation after approval. A decision reference identifies the reviewed record
covering all four gates, not permission to act on its own.

`src/lib/quotation-readiness.ts` exposes a read-only server action for current
ADMIN/SALES accounts. It takes no policy, role, actor or status input. It returns
only a safe readiness result. There is no settings editor or issuance endpoint.
Invalid configuration fails closed without returning parser or infrastructure errors.

Even fully populated configuration returns `issuanceEnabled: false` with
`IMPLEMENTATION_PENDING`. Policy completeness is not an operational feature flag.
Implement and verify the approved behavior before replacing that lock. No
environment variable can enable quotations in this phase.

## Deliberately deferred persistence

Draft creation is optional in this phase and is not introduced: there is no current
draft consumer, and inquiries do not identify a priced variant. No migration,
backfill, fake historical quotation, or extra personal-data copy is needed now.
The following is an additive target design, not the current database schema:

- `Quotation`: unique server-generated reference; required `inquiryId` foreign
  key with no cascading deletion of quotations; independent customer name,
  company and email snapshots; `DRAFT` only initially; actual creator/updater
  IDs and timestamps. Inquiry edits must never rewrite these snapshots.
- `QuotationItem`: required quotation and product relations, source inquiry-line
  linkage, quantity, minimal name/SKU/model snapshots. Use the inquiry's stored
  name/SKU/quantity to preserve submitted intent; model information not captured
  in the inquiry can only be labeled as captured during preparation. Staff must
  resolve variant identity explicitly before pricing, never choose the first or
  cheapest variant. No full specs, images or compliance documents are copied.
- Add pricing columns or normalized price-condition children only after the
  pricing decision. Both attach to the stable quotation-item identity. Use
  Decimal values and explicit currency, never JavaScript floating-point money.
- Add review/approval/issuance states, actual actors and timestamps, and an
  append-only quotation history only with the selected workflow. Never populate
  an approver for automatic mode or create unsupported approval roles.
- Actor foreign keys must retain attribution when `User.active` becomes false;
  history readers must not filter out inactive users. Decide deletion handling
  separately; actor-name snapshots can preserve attribution even if deletion is
  later authorized. No fake actors or timestamps may be backfilled.
- Add `QuotationDocument` and `QuotationSendRecord` only when output and sending
  are approved. Link documents to an issued snapshot/version, not to live catalog
  values. Send metadata should include recipient, real actor, time, delivery
  outcome and artifact/version identity, not unnecessary email body copies.

Future draft creation must authorize on the server, validate the inquiry ID with
Zod, resolve its stored lines, and atomically persist a separate quotation and its
items. It must not update inquiry/customer/product rows. References are unique in
the database, generated on the server, and collision-safe; the exact quotation
reference format remains to be approved.

## Issuance and renderer boundary

Future flow: inquiry -> draft -> approved pricing policy -> selected review gate
-> fixed issued snapshot -> selected renderer -> stored artifact/send record.

The domain service owns calculation, authorization, state transitions, and the
issuance snapshot. A renderer accepts only a read-only issued presentation DTO
containing stored customer/item/commercial snapshots and policy/template versions.
It must not query live Product/Inquiry data or calculate commercial terms. Build
only the selected renderer, not multiple speculative adapters now.

Once issued, customer details, product descriptions and pricing are historically
stable. Later catalog/customer edits must not change HTML views, regenerated
documents, or stored artifacts. Revisions and voiding need an approved policy;
they are not in-place overwrites. Concurrent issue attempts must not duplicate
issuance, artifacts or sends. Selecting a policy never bypasses human review
required by that policy.

Commercial expiration and retention are independent. `validUntil` must not drive
deletion. Expired/voided documents stay preserved pending the approved retention
and disposition process. Archival, eligibility for disposition, and actual deletion
are separate actions; no scheduled cleanup or automatic permanent deletion exists.

## Verification and next-phase acceptance

Current tests exercise missing, partial, malformed and complete policy inputs,
safe blocking results, and the existing active-account/RBAC guard on readiness.
The unchanged inquiry and inventory tests remain regression checks. This phase
does not claim database-backed draft or issued-document behavior exists.

Before enabling the next phase, add database-backed tests proving inquiry
immutability, foreign-key traceability, customer/item snapshots surviving master
edits, inactive-actor attribution, inactive-user write denial, atomic issuance,
and output regenerated without live catalog reads. Verify the approved renderer's
accessibility and test retention independently of expiration. Infrastructure errors
must map to safe action results; server details must never reach the customer.
