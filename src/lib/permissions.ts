import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { findCurrentAccount } from "@/lib/current-account";

/**
 * Server-side guard: redirects to /login unless the session belongs to an
 * account that is still active.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const account = await findCurrentAccount(session.user.id);
  if (!account?.active) {
    // A verified cookie is not evidence of access: the token was minted at sign-in.
    redirect("/login");
  }

  // Role is read from the row, not the token, so a demotion takes effect at once.
  return { ...session, user: { ...session.user, role: account.role } };
}

/** Server-side RBAC guard: requires session + one of the allowed roles. */
export async function requireRole(allowed: UserRole[]) {
  const session = await requireAuth();
  if (!allowed.includes(session.user.role)) {
    redirect("/");
  }
  return session;
}