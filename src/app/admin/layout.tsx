import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/lib/auth";
import { requireRole } from "@/lib/permissions";
import { AdminNav } from "./admin-nav";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireRole(["ADMIN", "SALES"]);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-lg font-bold tracking-tight text-fire"
            >
              Fire Guard Solutions
            </Link>
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-neutral-600 sm:inline">
              {session.user.name}
            </span>
            <Link
              href="/"
              className="text-neutral-600 transition-colors hover:text-fire"
            >
              View site
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-neutral-600 transition-colors hover:text-fire"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 md:grid-cols-[200px_1fr]">
        <AdminNav role={session.user.role} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
