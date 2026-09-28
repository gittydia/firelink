"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  STAFF_ROLE,
  buildStaffCreateData,
  buildStaffUpdateData,
  normalizeStaffEmail,
  resolveStaffStatusChange,
} from "@/lib/staff";
import {
  staffCreateSchema,
  staffStatusSchema,
  staffUpdateSchema,
} from "@/lib/validation";

/**
 * These actions return a result instead of throwing, because Next.js redacts
 * error messages that cross the server/client boundary in production builds.
 * The messages below are the ones the UI is specified to show.
 */
export type StaffActionResult =
  { status: "success"; message: string } | { status: "error"; message: string };

const DUPLICATE_EMAIL = "An account with this email already exists.";
const NOT_FOUND = "Sales Staff account not found.";

/** Matches the cost factor used in prisma/seed.ts. */
const BCRYPT_COST = 10;

function success(message: string): StaffActionResult {
  return { status: "success", message };
}

function failure(message: string): StaffActionResult {
  return { status: "error", message };
}

function isUniqueEmailViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function validationMessage(error: { issues: { message: string }[] }): string {
  return error.issues.map((issue) => issue.message).join(" ");
}

function revalidateStaffPaths() {
  revalidatePath("/admin/staff");
}

export async function createSalesStaff(
  input: unknown,
): Promise<StaffActionResult> {
  await requireRole(["ADMIN"]);

  const parsed = staffCreateSchema.safeParse(input);
  if (!parsed.success) return failure(validationMessage(parsed.error));

  const { name, email, password } = parsed.data;
  const normalizedEmail = normalizeStaffEmail(email);

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) return failure(DUPLICATE_EMAIL);

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    await prisma.user.create({
      data: buildStaffCreateData({
        name,
        email: normalizedEmail,
        passwordHash,
      }),
    });
  } catch (error) {
    if (isUniqueEmailViolation(error)) return failure(DUPLICATE_EMAIL);
    console.error("[staff] create failed", error);
    return failure("Could not create the account. Please try again.");
  }

  revalidateStaffPaths();
  return success("Sales Staff account created.");
}

export async function updateSalesStaff(
  id: string,
  input: unknown,
): Promise<StaffActionResult> {
  await requireRole(["ADMIN"]);

  const parsed = staffUpdateSchema.safeParse(input);
  if (!parsed.success) return failure(validationMessage(parsed.error));

  const { name, email } = parsed.data;
  const normalizedEmail = normalizeStaffEmail(email);

  const current = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true },
  });
  if (!current || current.role !== STAFF_ROLE) return failure(NOT_FOUND);

  if (normalizedEmail !== current.email) {
    const taken = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (taken) return failure(DUPLICATE_EMAIL);
  }

  try {
    // Scoped by role in the write itself, so the check above cannot be raced.
    const { count } = await prisma.user.updateMany({
      where: { id, role: STAFF_ROLE },
      data: buildStaffUpdateData({ name, email: normalizedEmail }),
    });
    if (count === 0) return failure(NOT_FOUND);
  } catch (error) {
    if (isUniqueEmailViolation(error)) return failure(DUPLICATE_EMAIL);
    console.error("[staff] update failed", error);
    return failure("Could not save the account. Please try again.");
  }

  revalidateStaffPaths();
  return success("Account details updated.");
}

export async function setSalesStaffActive(
  input: unknown,
): Promise<StaffActionResult> {
  await requireRole(["ADMIN"]);

  const parsed = staffStatusSchema.safeParse(input);
  if (!parsed.success) return failure(validationMessage(parsed.error));

  const { id, active } = parsed.data;
  const current = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, active: true },
  });
  if (!current || current.role !== STAFF_ROLE) return failure(NOT_FOUND);

  const nextActive = resolveStaffStatusChange(current.active, active);
  if (nextActive === null)
    return success("Account status is already up to date.");

  try {
    const { count } = await prisma.user.updateMany({
      where: { id, role: STAFF_ROLE },
      data: { active: nextActive },
    });
    if (count === 0) return failure(NOT_FOUND);
  } catch (error) {
    console.error("[staff] status change failed", error);
    return failure("Could not change the account status. Please try again.");
  }

  revalidateStaffPaths();
  return success(nextActive ? "Account reactivated." : "Account deactivated.");
}
