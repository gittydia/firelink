import { describe, expect, it } from "vitest";
import {
  buildStaffCreateData,
  buildStaffUpdateData,
  canManageStaff,
  normalizeStaffEmail,
  resolveStaffStatusChange,
  staffListWhere,
  staffStatusLabel,
} from "./staff";

describe("staffStatusLabel", () => {
  it("names both states in text so color is never the only cue", () => {
    expect(staffStatusLabel(true)).toBe("Active");
    expect(staffStatusLabel(false)).toBe("Inactive");
  });
});

describe("canManageStaff", () => {
  it("allows ADMIN and nobody else", () => {
    expect(canManageStaff("ADMIN")).toBe(true);
    expect(canManageStaff("SALES")).toBe(false);
    expect(canManageStaff(null)).toBe(false);
    expect(canManageStaff(undefined)).toBe(false);
  });
});

describe("normalizeStaffEmail", () => {
  it("trims and lowercases so lookups match the stored value", () => {
    expect(normalizeStaffEmail("  Ana.Reyes@FireLink.Local  ")).toBe(
      "ana.reyes@firelink.local",
    );
  });
});

describe("staffListWhere", () => {
  it("scopes the list to Sales Staff only", () => {
    expect(staffListWhere()).toEqual({ role: "SALES" });
  });
});

describe("buildStaffCreateData", () => {
  it("forces role and active server-side regardless of input", () => {
    const data = buildStaffCreateData({
      name: "  Ana Reyes  ",
      email: "  Ana.Reyes@FireLink.Local ",
      passwordHash: "hashed",
    });

    expect(data).toEqual({
      name: "Ana Reyes",
      email: "ana.reyes@firelink.local",
      passwordHash: "hashed",
      role: "SALES",
      active: true,
    });
  });
});

describe("buildStaffUpdateData", () => {
  it("updates only name and email, never role or status", () => {
    const data = buildStaffUpdateData({
      name: "  Ana Reyes  ",
      email: "  Ana.Reyes@FireLink.Local ",
    });

    expect(data).toEqual({
      name: "Ana Reyes",
      email: "ana.reyes@firelink.local",
    });
    expect(data).not.toHaveProperty("role");
    expect(data).not.toHaveProperty("active");
    expect(data).not.toHaveProperty("passwordHash");
  });
});

describe("resolveStaffStatusChange", () => {
  it("returns null when the status already matches, so no write is issued", () => {
    expect(resolveStaffStatusChange(true, true)).toBeNull();
    expect(resolveStaffStatusChange(false, false)).toBeNull();
  });

  it("returns the requested state on a real change", () => {
    expect(resolveStaffStatusChange(true, false)).toBe(false);
    expect(resolveStaffStatusChange(false, true)).toBe(true);
  });
});
