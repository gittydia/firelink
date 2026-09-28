import { describe, expect, it } from "vitest";
import {
  INVENTORY_AUDIT_MISSING_LABEL,
  buildInventoryAuditStamp,
  formatInventoryUpdatedAt,
  formatInventoryUpdatedBy,
} from "./inventory-audit";

describe("buildInventoryAuditStamp", () => {
  it("returns null when the status is unchanged", () => {
    const stamp = buildInventoryAuditStamp({
      currentStatus: "IN_STOCK",
      nextStatus: "IN_STOCK",
      userId: "user-1",
    });

    expect(stamp).toBeNull();
  });

  it("stamps the actor and the supplied time on a real change", () => {
    const now = new Date("2026-09-25T02:30:00.000Z");

    const stamp = buildInventoryAuditStamp({
      currentStatus: "LOCAL",
      nextStatus: "INDENT",
      userId: "user-1",
      now,
    });

    expect(stamp).toEqual({
      inventoryUpdatedAt: now,
      inventoryUpdatedById: "user-1",
    });
  });

  it("treats every distinct pair as a change", () => {
    const pairs = [
      ["LOCAL", "IN_STOCK"],
      ["IN_STOCK", "LOCAL"],
      ["LOCAL", "INDENT"],
      ["INDENT", "IN_STOCK"],
    ] as const;

    for (const [currentStatus, nextStatus] of pairs) {
      expect(
        buildInventoryAuditStamp({
          currentStatus,
          nextStatus,
          userId: "user-1",
        }),
      ).not.toBeNull();
    }
  });
});

describe("formatInventoryUpdatedAt", () => {
  it("falls back to the missing label when unset", () => {
    expect(formatInventoryUpdatedAt(null)).toBe(INVENTORY_AUDIT_MISSING_LABEL);
  });

  it("renders in the site time zone rather than UTC", () => {
    // 2026-09-25T02:30Z is 10:30 the same day in Asia/Manila (UTC+8).
    const utc = new Date("2026-09-25T02:30:00.000Z");
    const manila = formatInventoryUpdatedAt(utc);

    expect(manila).toContain("10:30");
    expect(manila).not.toBe(INVENTORY_AUDIT_MISSING_LABEL);
  });
});

describe("formatInventoryUpdatedBy", () => {
  it("prefixes a known name with 'by'", () => {
    expect(formatInventoryUpdatedBy("Ana Reyes")).toBe("by Ana Reyes");
  });

  it("falls back to the missing label for a deleted or absent account", () => {
    expect(formatInventoryUpdatedBy(null)).toBe(INVENTORY_AUDIT_MISSING_LABEL);
    expect(formatInventoryUpdatedBy(undefined)).toBe(
      INVENTORY_AUDIT_MISSING_LABEL,
    );
  });
});
