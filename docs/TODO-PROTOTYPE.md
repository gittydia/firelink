# FireLink - Prototype TODO (Trimmed)

> **Status: complete.** All phases below are implemented and verified (`pnpm typecheck`, `pnpm lint`, `pnpm build` all pass). Availability is shown as text (Local / In Stock / Indent), auth uses NextAuth v5 Credentials + bcrypt, and RBAC is enforced server-side only.

## Phase 1 - Foundation
- [x] [repo/root] Create package.json (Next.js 15+ App Router, TypeScript, Tailwind, Prisma, Zod, react-hook-form, @hookform/resolvers, next-auth@beta) with scripts: dev, build, start, typecheck, lint, format, format:fix, db:generate, db:migrate, db:studio, db:seed
- [x] [repo/root] Create .gitignore + .env.example (DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL)
- [x] [repo/root] Create AGENTS.md (project-specific, follow templates-prompt)
- [x] [repo/README] Create minimal README (overview, roles, tech, setup, env, migrate, seed, dev)
- [x] [repo/docs] Create docs/DOMAIN-MODEL.md (minimal entities + enums)
- [x] [repo/docs] Create docs/AUTH.md (RBAC basics)
- [x] [repo/docs] Create docs/DECISIONS.md (prototype scope note)

## Phase 2 - Data Model
- [x] [prisma/schema.prisma] Enums: UserRole { ADMIN, SALES }, AvailabilityStatus { LOCAL, IN_STOCK, INDENT }
- [x] [prisma/schema.prisma] User (id, name, email unique, passwordHash, role, active, timestamps)
- [x] [prisma/schema.prisma] Category (id, name unique, active, timestamps)
- [x] [prisma/schema.prisma] Product (id, sku unique, name, slug unique, brand, modelNumber, categoryId FK, shortDescription, description, availabilityStatus, active, timestamps, basic indexes)
- [x] [prisma/schema.prisma] ProductImage (id, productId FK, imageUrl, altText, displayOrder)
- [x] [prisma/schema.prisma] ProductSpecification (id, productId FK, specName/specificationName, specValue/specificationValue, unit, displayOrder)
- [x] [prisma] db:generate + first migration (sqlite; later switched to PostgreSQL via Docker for local dev + hosted Postgres for production)
- [x] [lib/db] src/lib/prisma.ts singleton
- [x] [lib/validation] Zod: login, product create/update, inventory update (minimal)
- [x] [lib/auth+permissions] NextAuth Credentials + bcrypt, role in session, server-side requireAuth/requireRole
- [x] [middleware] Protect /admin routes — implemented as `src/proxy.ts` (Next.js 16: proxy replaces middleware for request interception)
- [x] [prisma/seed.ts] Seed 6–8 categories + ~8–10 demo products (with 1–2 images + 2–3 specs) + admin + sales users
- [x] [db:seed] Run seed

## Phase 3 - Public UI
- [x] [app/layout] Root layout + globals.css (Tailwind)
- [x] [app/(public)/layout] Navbar (Home, Products, Categories, About, Contact, Login)
- [x] [app/(public)/page.tsx] Home: hero, categories (active), featured products (active), availability explanation
- [x] [app/(public)/categories/page.tsx] Active categories grid + links
- [x] [app/(public)/products/page.tsx] Catalog: search (name/SKU/brand/model/desc), filter by category/availability, sort A–Z/Z–A/Newest, grid with availability badge+text
- [x] [app/(public)/products/[slug]/page.tsx] PDP: gallery, info, availability prominent, specs, back to products
- [x] [app/(public)/about/page.tsx] Static
- [x] [app/(public)/contact/page.tsx] Static
- [x] [app/(public)/login/page.tsx] Login form (RHForm+Zod)

## Phase 4 - Admin (Minimal)
- [x] [app/admin/layout.tsx] Admin shell + server guard
- [x] [app/admin/page.tsx] Simple dashboard (counts)
- [x] [app/admin/products/page.tsx] Products table (search, active toggle/archive view), Edit/New
- [x] [app/admin/products/new/page.tsx] Create product (basics + images + up to 10 specs)
- [x] [app/admin/products/[id]/edit/page.tsx] Edit product + availability
- [x] [app/admin/inventory/page.tsx] Quick inventory: list products, change AvailabilityStatus (LOCAL/IN_STOCK/INDENT)

## Phase 5 - Polish + Verify
- [x] [ui/components] Minimal accessible components (Button/Input/Select/Textarea/Badge/Card)
- [x] [a11y] Basic checks (labels, alt text, no color-only)
- [x] [typecheck/lint/build] Run checks, fix diagnostics until clean
- [x] [docs] README reflects prototype setup

## Phase 6 - Guest enquiry flow (redesign, Sep 2026)

Leads convert instead of only phoning. Still no cart or checkout: an enquiry is captured, not transacted.

- [x] [prisma/schema.prisma] `Inquiry` + `InquiryProduct` (join row, `@@unique([inquiryId, productId])`), `InquiryNotificationStatus` enum
- [x] [prisma] Migration applied to Neon; local `5433` instance still needs `db:deploy`
- [x] [lib/inquiry] Selection normalization, 50-line cap, `9999` per line, `FLQ-YYYYMMDD-XXXXXX` reference, storage key
- [x] [lib/inquiry] 18 unit tests
- [x] [lib/validation] `contactInquirySchema` + `inquiryLineSchema`; product selection optional, free-mail domains allowed
- [x] [lib/email] `notifySalesOfInquiry` via Resend `fetch`, no SDK; `sent`/`skipped`/`failed` result
- [x] [app/(public)/contact/actions] `submitInquiry` returning a result rather than throwing; ids-only payload, catalog resolved server-side, archived products dropped, one `P2002` retry
- [x] [app/(public)/contact/actions] Notification finalization is best-effort and never fails a committed enquiry (ADR-010)
- [x] [app/(public)/contact/actions] 16 unit tests, including the reference-retry and swallow paths
- [x] [components] `use-inquiry-selection` — hydration-safe, tolerates corrupt storage
- [x] [app/(public)/contact] Form + redesigned page
- [x] [app/(public)/privacy] Privacy Policy page; `PRIVACY_POLICY_VERSION = "2026-09-28"` in `src/lib/privacy.ts`
- [x] [app/(public)/products] Optional "add to enquiry" on card and detail page
- [x] [tailwind.config] `ember` CTA token
- [x] [docs] DOMAIN-MODEL + DECISIONS updated for the flow (ADR-010, ADR-011)

### Known gaps (deliberate, documented in ADR-010/011)

- No rate limiting; the `website` honeypot is a speed bump, not a control.
- No admin UI for inquiries yet — rows are read via the database only.
- No guaranteed delivery. Needs an outbox plus retry job before production.
- The four UI checkboxes above are closed on build/typecheck/lint/unit-test **and** browser evidence. A headless Chromium pass over `/contact` at 1440x900 and 390x844 confirmed: no horizontal overflow at either width, all five enquiry controls expose a real `<label>` and now a native `required`, every focusable element has a visible focus ring, the honeypot stays out of the tab order and the accessibility tree, and the add-to-enquiry selection survives navigation to `/contact` (`productInquirySelection`, 1 line rendered). Hero body/heading contrast measured 12.02:1 and 17.85:1 on `bg-brand-ink`. Scripts live outside the repo; this is a one-time manual pass, not a CI gate.
- [x] [ui] Enquiry error text is locally consistent: `Input`/`Textarea` accept an optional `errorClassName` (default `text-red-600`, so login/admin are unchanged) and `contact-form.tsx` passes `text-ember-dark`, so all five enquiry error messages render ember-dark at 7.31:1 on white. Invalid-field borders stay red; the mix was reviewed at both viewports and reads clearly. `Select` and other shared components were deliberately left alone to keep the ember CTA-only contract in `tailwind.config.ts`.