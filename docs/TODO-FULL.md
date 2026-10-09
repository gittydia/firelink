# Fire Guard Solutions - Full Implementation TODO (Production-Grade)

This document contains the complete, production-ready task breakdown from the master technical prompt. For the current prototype build, a trimmed subset will be executed. Keep this as reference if expanding to full production later.

See `docs\TODO-PROTOTYPE.md` for the active trimmed list.

## Catalog requirement follow-ups (from the PRD R-01–R-12 audit)

Two PRD requirements are intentionally partial in the prototype and stay out of prototype scope. See `docs/REQUIREMENTS-MATRIX.md` for the full traceability.

- [ ] **R-09 – public data freshness.** The prototype stamps `inventoryUpdatedAt` / `inventoryUpdatedById` on genuine availability changes (`src/lib/inventory-audit.ts`) but shows freshness only in admin. Production: decide a freshness threshold and, if approved, surface an "availability last updated / stale" indicator to customers. Blocked by: freshness threshold + display format (PRD unknown).
- [ ] **R-12 – change accountability.** The prototype records only the actor + timestamp of the most recent availability change; it keeps no per-event audit history. Production: if mandated, add an append-only audit log (actor, timestamp, action, affected record) with restricted access. Blocked by: whether audit history is required (PRD unknown).
