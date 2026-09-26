import type { Prisma, UserRole } from "@prisma/client";

/**
 * Sales Staff account rules.
 *
 * Pure and type-only so client components can share this vocabulary with the
 * server actions without pulling Prisma into the browser bundle.
 */

/** Staff management covers Sales Staff only; ADMIN accounts are out of scope. */
export const STAFF_ROLE = "SALES" satisfies UserRole;

/** Accounts are never deleted, only deactivated. Text always states the status. */
export type StaffStatusLabel = "Active" | "Inactive";

export function staffStatusLabel(active: boolean): StaffStatusLabel {
  return active ? "Active" : "Inactive";
}

/** Only ADMINs manage Sales Staff. Hiding the nav link is never the enforcement. */
export function canManageStaff(role: UserRole | null | undefined): boolean {
  return role === "ADMIN";
}

/** Email is the login identifier, so lookups must be case-insensitive. */
export function normalizeStaffEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function staffListWhere(): Prisma.UserWhereInput {
  return { role: STAFF_ROLE };
}

export interface StaffCreateFields {
  name: string;
  email: string;
  passwordHash: string;
}

/**
 * `role` and `active` are set here, never taken from the request, so a crafted
 * form cannot mint an ADMIN or a pre-deactivated account through this path.
 */
export function buildStaffCreateData(fields: StaffCreateFields): Prisma.UserUncheckedCreateInput {
  return {
    name: fields.name.trim(),
    email: normalizeStaffEmail(fields.email),
    passwordHash: fields.passwordHash,
    role: STAFF_ROLE,
    active: true,
  };
}

export interface StaffUpdateFields {
  name: string;
  email: string;
}

/**
 * Deliberately omits `role` and `active`: editing details must not change an
 * account's role or status. Status changes go through the explicit
 * `setSalesStaffActive` action instead.
 */
export function buildStaffUpdateData(fields: StaffUpdateFields): Prisma.UserUncheckedUpdateInput {
  return {
    name: fields.name.trim(),
    email: normalizeStaffEmail(fields.email),
  };
}

/**
 * The value to write, or `null` when the account already has the requested
 * status — so a double click does not produce two writes.
 */
export function resolveStaffStatusChange(
  currentActive: boolean,
  requestedActive: boolean
): boolean | null {
  return currentActive === requestedActive ? null : requestedActive;
}
