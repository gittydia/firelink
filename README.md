# FireLink - Fire Protection Equipment Product Information & Inventory System

A minimal prototype web app for centralizing fire protection product information and inventory visibility (Local / In Stock / Indent). Designed as an information + inventory visibility platform, not a full e-commerce system.

## Features (Prototype)

- Public product catalog with search, category and availability filters, sorting
- Product detail pages with availability (prominently shown as Local / In Stock / Indent), specs, and an active-variants table (size / series / unit / price)
- Category browsing
- Guest enquiry flow: optional "add to enquiry" selection that persists across pages, submitted to a durable `Inquiry` row with an `FLQ-YYYYMMDD-XXXXXX` reference
- Privacy Policy page with a versioned consent record on every enquiry
- Role-based access (ADMIN, SALES) for product/inventory management
- Server-side authorization (RBAC) only
- Soft-deletes via `active` flags
- Zod validation (backend + frontend)

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL
- NextAuth v5 (Auth.js) with Credentials
- React Hook Form + Zod
- bcryptjs

## Quick Start

### 1. Install dependencies

```bash
pnpm i
```

### 2. Setup environment

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

Generate `AUTH_SECRET` (recommended):

```bash
openssl rand -base64 32
```

Update `AUTH_SECRET` and `NEXTAUTH_URL`.

Inquiry notifications are optional. Leave `RESEND_API_KEY` unset to run locally: enquiries are still persisted, the notification is recorded as `SKIPPED`, and no email is attempted.

### 3. Database setup

Local dev uses PostgreSQL in Docker (port 5433, avoids conflicts with a native local install on 5432). Start it, then generate the client, apply migrations, and seed:

```bash
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

For production (e.g. Vercel), set `FIRELINK_DATABASE_URL` (pooled connection) and `FIRELINK_DATABASE_URL_UNPOOLED` (direct connection) to your hosted PostgreSQL instance (Neon / Supabase / Vercel Postgres), then run `pnpm db:deploy` to apply migrations. The names intentionally differ from `DATABASE_URL` so hosting integrations cannot override them.

### 4. Run dev server

```bash
pnpm dev
```

App: http://localhost:3000

## Demo Credentials (seeded)

- Admin: `admin@firelink.local` / `admin123`
- Sales: `sales@firelink.local` / `sales123`

## Scripts

- `pnpm dev` – dev server
- `pnpm build` / `pnpm start` – build/run
- `pnpm typecheck` – TS check
- `pnpm test` – unit tests (Vitest)
- `pnpm lint` – lint
- `pnpm format` / `pnpm format:fix` – Prettier
- `pnpm db:generate` – Prisma generate
- `pnpm db:migrate` – Prisma migrate dev
- `pnpm db:deploy` – Prisma migrate deploy
- `pnpm db:studio` – Prisma Studio
- `pnpm db:seed` – Seed DB

## Project Notes

- Availability values: `LOCAL`, `IN_STOCK`, `INDENT` (text shown prominently, not color-only)
- Soft-deletes: products/categories use `active` (false = archived)
- Server-side RBAC enforced; UI hiding is not sufficient
- Prototype scope: information + inventory visibility only (no payments/checkout/shipping)
- Variant rows are admin-managed: added and archived from the product form; only `active` variants appear publicly (ADR-020)
- Enquiries are captured, not transacted — there is no cart, quote, or order
- An enquiry is durable once written; a failed sales email never fails the submission (see `docs/DECISIONS.md` ADR-010)
- Product selection sends IDs only; names, SKUs, and availability are resolved server-side (ADR-011)
- Spam defence is a honeypot field only — no rate limiting yet
