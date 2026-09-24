# FireLink - AI Agent Guide

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Prisma, PostgreSQL, Zod, React Hook Form, NextAuth v5 (Auth.js).

## Structure

- `src/app/` - App Router routes (public + admin groups)
- `src/components/` - Reusable UI/layout/product/admin components
- `src/lib/` - DB/client, auth, validation, permissions, utils, constants
- `src/services/` - Domain services (products, categories, inventory)
- `src/types/` - Shared TypeScript types
- `prisma/` - Schema, migrations, seed
- `docs/` - Domain model, auth, testing, decisions, TODOs
- `public/uploads/`, `public/documents/` - Uploaded assets (local prototype)

## Working rules

1. Start with `git status --short`; preserve unrelated work.
2. Use `rg` to find code and inspect only relevant files/lines.
3. Do not inspect generated/dependency directories: `node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`, `prisma/migrations/*/migration.sql.bak`, lockfiles.
4. Keep code in owning feature/module; avoid premature abstraction.
5. Keep secrets in ignored `.env` files. Never print secrets in logs/reports.
6. Prototype scope: information + inventory visibility only (no checkout/payments/shipping). Maintain soft-deletes via `active` flags.
7. Authorization is server-side only (RBAC). Never rely on hiding UI alone.
8. Validate backend + frontend (Zod everywhere). No `any` unless unavoidable and justified.
9. Before handoff: run typecheck/lint when changes warrant; fix diagnostics on changed files. For prototype, aim for clean typecheck/lint.
10. Update relevant docs when changing public contracts, user journeys, or setup.

## Commands (pnpm)

- `pnpm dev` - Run dev server
- `pnpm build` - Build app
- `pnpm start` - Run production server
- `pnpm typecheck` - TypeScript check
- `pnpm lint` - Lint
- `pnpm format` / `pnpm format:fix` - Prettier
- `pnpm db:generate` - Prisma generate
- `pnpm db:migrate` - Prisma migrate dev
- `pnpm db:deploy` - Prisma migrate deploy
- `pnpm db:studio` - Prisma Studio
- `pnpm db:seed` - Seed DB

## Read on demand

| File | Read when |
|---|---|
| `README.md` | Setup or architecture changes |
| `docs/DOMAIN-MODEL.md` | Changing data/business rules |
| `docs/AUTH.md` | Changing auth/permissions |
| `docs/TESTING.md` | Adding/repairing tests |
| `docs/DECISIONS.md` | Understanding rationale |
| `docs/TODO-PROTOTYPE.md` | Working through prototype tasks |
| `docs/TODO-FULL.md` | Planning production expansion |
