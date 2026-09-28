import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CurrentAccount = {
  id: string;
  active: boolean;
  role: UserRole;
};

/**
 * Authoritative account state for a session id, for access decisions that must
 * not trust the token. Returns null when the row is gone, so a deleted account
 * is treated exactly like a deactivated one.
 */
export async function findCurrentAccount(
  userId: string,
): Promise<CurrentAccount | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, active: true, role: true },
  });
}
