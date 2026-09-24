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