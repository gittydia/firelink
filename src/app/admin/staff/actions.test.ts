import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSalesStaff, setSalesStaffActive, updateSalesStaff } from "./actions";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/permissions", () => ({ requireRole: mocks.requireRole }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

const NOT_FOUND = "Sales Staff account not found.";
const DUPLICATE_EMAIL = "An account with this email already exists.";

function asSalesUser() {
  return { id: "u1", role: "SALES", email: "ana@x.com", active: true };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateSalesStaff", () => {
  beforeEach(() => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      role: "SALES",
      email: "ana@x.com",
    });
    mocks.prisma.user.updateMany.mockResolvedValue({ count: 1 });
  });

  it("scopes the write by role so a check-then-write race cannot touch another role", async () => {
    const result = await updateSalesStaff("u1", { name: "Ana", email: "ana@x.com" });

    expect(result).toEqual({ status: "success", message: "Account details updated." });
    expect(mocks.prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u1", role: "SALES" },
      data: { name: "Ana", email: "ana@x.com" },
    });
  });

  it("reports not found when the role-scoped write matches no row", async () => {
    mocks.prisma.user.updateMany.mockResolvedValue({ count: 0 });

    const result = await updateSalesStaff("u1", { name: "Ana", email: "ana@x.com" });

    expect(result).toEqual({ status: "error", message: NOT_FOUND });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("never writes when the pre-check finds a non-Sales account", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "a1", role: "ADMIN" });

    const result = await updateSalesStaff("a1", { name: "Admin", email: "admin@x.com" });

    expect(result).toEqual({ status: "error", message: NOT_FOUND });
    expect(mocks.prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("writes only the validated fields, so role and active cannot be smuggled in", async () => {
    await updateSalesStaff("u1", {
      name: "Ana",
      email: "ana@x.com",
      role: "ADMIN",
      active: false,
    });

    const [args] = mocks.prisma.user.updateMany.mock.calls[0];
    expect(args.data).toEqual({ name: "Ana", email: "ana@x.com" });
  });

  it("surfaces a duplicate-email violation raised by the write as the duplicate message", async () => {
    mocks.prisma.user.updateMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "test" })
    );

    const result = await updateSalesStaff("u1", { name: "Ana", email: "ana@x.com" });

    expect(result).toEqual({ status: "error", message: DUPLICATE_EMAIL });
  });
});

describe("setSalesStaffActive", () => {
  beforeEach(() => {
    mocks.prisma.user.findUnique.mockResolvedValue(asSalesUser());
    mocks.prisma.user.updateMany.mockResolvedValue({ count: 1 });
  });

  it("scopes the status write by role", async () => {
    const result = await setSalesStaffActive({ id: "u1", active: false });

    expect(result).toEqual({ status: "success", message: "Account deactivated." });
    expect(mocks.prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u1", role: "SALES" },
      data: { active: false },
    });
  });

  it("reports not found when the role-scoped write matches no row", async () => {
    mocks.prisma.user.updateMany.mockResolvedValue({ count: 0 });

    const result = await setSalesStaffActive({ id: "u1", active: false });

    expect(result).toEqual({ status: "error", message: NOT_FOUND });
  });

  it("does not write when the requested status already matches", async () => {
    const result = await setSalesStaffActive({ id: "u1", active: true });

    expect(result).toEqual({ status: "success", message: "Account status is already up to date." });
    expect(mocks.prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("never writes when the pre-check finds a non-Sales account", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "a1", role: "ADMIN", active: true });

    const result = await setSalesStaffActive({ id: "a1", active: false });

    expect(result).toEqual({ status: "error", message: NOT_FOUND });
    expect(mocks.prisma.user.updateMany).not.toHaveBeenCalled();
  });
});

describe("createSalesStaff", () => {
  const validInput = {
    name: "Ana Reyes",
    email: "ana@x.com",
    password: "secret1",
    confirmPassword: "secret1",
  };

  beforeEach(() => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.user.create.mockResolvedValue({ id: "u1" });
  });

  it("forces role and active on create even when the payload claims otherwise", async () => {
    const result = await createSalesStaff({ ...validInput, role: "ADMIN", active: false });

    expect(result).toEqual({ status: "success", message: "Sales Staff account created." });
    const [args] = mocks.prisma.user.create.mock.calls[0];
    expect(args.data.role).toBe("SALES");
    expect(args.data.active).toBe(true);
    expect(args.data.email).toBe("ana@x.com");
    expect(args.data.passwordHash).not.toBe(validInput.password);
  });

  it("refuses a duplicate email before writing", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "u9" });

    const result = await createSalesStaff(validInput);

    expect(result).toEqual({ status: "error", message: DUPLICATE_EMAIL });
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });

  it("maps a unique-email violation raised after the check to the duplicate message", async () => {
    mocks.prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "test" })
    );

    const result = await createSalesStaff(validInput);

    expect(result).toEqual({ status: "error", message: DUPLICATE_EMAIL });
  });
});

describe("authorization", () => {
  beforeEach(() => {
    mocks.prisma.user.findUnique.mockResolvedValue(asSalesUser());
    mocks.prisma.user.updateMany.mockResolvedValue({ count: 1 });
  });

  it("requires ADMIN in every action", async () => {
    await updateSalesStaff("u1", { name: "Ana", email: "ana@x.com" });
    await setSalesStaffActive({ id: "u1", active: false });
    await createSalesStaff({
      name: "Ana",
      email: "ana@x.com",
      password: "secret1",
      confirmPassword: "secret1",
    });

    expect(mocks.requireRole).toHaveBeenCalledTimes(3);
    for (const call of mocks.requireRole.mock.calls) {
      expect(call[0]).toEqual(["ADMIN"]);
    }
  });
});
