import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuth, requireRole } from "./permissions";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findCurrentAccount: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/current-account", () => ({ findCurrentAccount: mocks.findCurrentAccount }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

function asSession(role: "ADMIN" | "SALES") {
  return { user: { id: "u1", name: "Ana", email: "ana@x.com", role } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`redirect:${url}`);
  });
});

describe("requireAuth", () => {
  it("redirects when there is no session", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow("redirect:/login");
    expect(mocks.findCurrentAccount).not.toHaveBeenCalled();
  });

  it("returns the session for an active account", async () => {
    mocks.auth.mockResolvedValue(asSession("SALES"));
    mocks.findCurrentAccount.mockResolvedValue({ id: "u1", active: true, role: "SALES" });

    const session = await requireAuth();

    expect(session.user.id).toBe("u1");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("looks the account up by the id in the token", async () => {
    mocks.auth.mockResolvedValue(asSession("SALES"));
    mocks.findCurrentAccount.mockResolvedValue({ id: "u1", active: true, role: "SALES" });

    await requireAuth();

    expect(mocks.findCurrentAccount).toHaveBeenCalledWith("u1");
  });

  it("redirects an inactive account even though its cookie still verifies", async () => {
    mocks.auth.mockResolvedValue(asSession("ADMIN"));
    mocks.findCurrentAccount.mockResolvedValue({ id: "u1", active: false, role: "ADMIN" });

    await expect(requireAuth()).rejects.toThrow("redirect:/login");
  });

  it("redirects when the account row is gone", async () => {
    mocks.auth.mockResolvedValue(asSession("ADMIN"));
    mocks.findCurrentAccount.mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow("redirect:/login");
  });
});

describe("requireRole", () => {
  it("allows a role that the database still confirms", async () => {
    mocks.auth.mockResolvedValue(asSession("SALES"));
    mocks.findCurrentAccount.mockResolvedValue({ id: "u1", active: true, role: "SALES" });

    await expect(requireRole(["ADMIN", "SALES"])).resolves.toMatchObject({ user: { id: "u1" } });
  });

  it("denies a role the token claims but the database no longer does", async () => {
    mocks.auth.mockResolvedValue(asSession("ADMIN"));
    mocks.findCurrentAccount.mockResolvedValue({ id: "u1", active: true, role: "SALES" });

    await expect(requireRole(["ADMIN"])).rejects.toThrow("redirect:/");
  });

  it("denies an active account whose role is not allowed", async () => {
    mocks.auth.mockResolvedValue(asSession("SALES"));
    mocks.findCurrentAccount.mockResolvedValue({ id: "u1", active: true, role: "SALES" });

    await expect(requireRole(["ADMIN"])).rejects.toThrow("redirect:/");
  });

  it("rejects an inactive account before its role is even considered", async () => {
    mocks.auth.mockResolvedValue(asSession("ADMIN"));
    mocks.findCurrentAccount.mockResolvedValue({ id: "u1", active: false, role: "ADMIN" });

    await expect(requireRole(["ADMIN"])).rejects.toThrow("redirect:/login");
  });
});
