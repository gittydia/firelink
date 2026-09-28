import type { AvailabilityStatus } from "@prisma/client";

/**
 * Inventory audit helpers. A stamp records when a product's availability last
 * genuinely changed and who changed it. Pure, so the rule is testable without
 * a database.
 */

/** Shown when a product has no recorded inventory change (legacy rows, or created via admin). */
export const INVENTORY_AUDIT_MISSING_LABEL = "Not recorded";

/** Audit timestamps are stored in UTC and rendered in the site's local time. */
export const INVENTORY_AUDIT_TIME_ZONE = "Asia/Manila";

export type InventoryAuditStamp = {
  inventoryUpdatedAt: Date;
  inventoryUpdatedById: string;
};

type BuildInventoryAuditStampInput = {
  currentStatus: AvailabilityStatus;
  nextStatus: AvailabilityStatus;
  userId: string;
  now?: Date;
};

/**
 * Build the audit fields for an availability write. Returns `null` when the
 * status is unchanged, so callers skip the write instead of falsifying the
 * audit trail.
 */
export function buildInventoryAuditStamp({
  currentStatus,
  nextStatus,
  userId,
  now = new Date(),
}: BuildInventoryAuditStampInput): InventoryAuditStamp | null {
  if (currentStatus === nextStatus) return null;

  return {
    inventoryUpdatedAt: now,
    inventoryUpdatedById: userId,
  };
}

/** Format an audit timestamp for admin display, or the missing label when unset. */
export function formatInventoryUpdatedAt(value: Date | null): string {
  if (!value) return INVENTORY_AUDIT_MISSING_LABEL;

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: INVENTORY_AUDIT_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

/** The actor is nullable: the relation is cleared when a staff account is deleted. */
export function formatInventoryUpdatedBy(
  name: string | null | undefined,
): string {
  if (!name) return INVENTORY_AUDIT_MISSING_LABEL;

  return `by ${name}`;
}
