import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";

/** Server-side guard: redirects to /login when there is no session. */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/** Server-side RBAC guard: requires session + one of the allowed roles. */
export async function requireRole(allowed: UserRole[]) {
  const session = await requireAuth();
  if (!allowed.includes(session.user.role)) {
    redirect("/");
  }
  return session;
}