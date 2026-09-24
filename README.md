# FireLink - Fire Protection Equipment Product Information & Inventory System

A minimal prototype web app for centralizing fire protection product information and inventory visibility (Local / In Stock / Indent). Designed as an information + inventory visibility platform, not a full e-commerce system.

## Features (Prototype)

- Public product catalog with search, category and availability filters, sorting
- Product detail pages with availability (prominently shown as Local / In Stock / Indent), specs
- Category browsing
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

### 3. Database setup
Local dev uses PostgreSQL in Docker (port 5433, avoids conflicts with a native local install on 5432). Start it, then generate the client, apply migrations, and seed:
```bash
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```
For production (e.g. Vercel), point `DATABASE_URL` at a hosted PostgreSQL instance (Neon / Supabase / Vercel Postgres) and run `pnpm db:deploy` to apply migrations.

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
