import { beforeEach, describe, expect, it, vi } from "vitest";
import { getQuotationReadiness } from "./quotation-readiness";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findCurrentAccount: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/current-account", () => ({
  findCurrentAccount: mocks.findCurrentAccount,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "staff-1", role: "ADMIN" } });
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`redirect:${url}`);
  });
});

describe("quotation readiness server action", () => {
  it.each(["ADMIN", "SALES"])(
    "returns blocked readiness to an active %s without creating records",
    async (role) => {
      // Given
      mocks.findCurrentAccount.mockResolvedValue({
        id: "staff-1",
        active: true,
        role,
      });
      // When
      const result = await getQuotationReadiness();
      // Then
      expect(result.issuanceEnabled).toBe(false);
      expect(result.reason).toBe("POLICY_UNRESOLVED");
      expect(mocks.findCurrentAccount).toHaveBeenCalledWith("staff-1");
    },
  );

  it("denies an unauthenticated caller", async () => {
    // Given
    mocks.auth.mockResolvedValue(null);
    // When / Then
    await expect(getQuotationReadiness()).rejects.toThrow("redirect:/login");
    expect(mocks.findCurrentAccount).not.toHaveBeenCalled();
  });

  it("denies a deactivated account despite its admin session", async () => {
    // Given
    mocks.findCurrentAccount.mockResolvedValue({
      id: "staff-1",
      active: false,
      role: "ADMIN",
    });
    // When / Then
    await expect(getQuotationReadiness()).rejects.toThrow("redirect:/login");
  });

  it("does not trust an admin token when the stored role is unauthorized", async () => {
    // Given
    mocks.findCurrentAccount.mockResolvedValue({
      id: "staff-1",
      active: true,
      role: "UNAUTHORIZED",
    });
    // When / Then
    await expect(getQuotationReadiness()).rejects.toThrow("redirect:/");
  });
});
