import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { findCurrentAccount } from "@/lib/current-account";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await auth();
  // A deactivated account still holds a valid cookie, so auth() alone would send
  // it back to /admin, where requireAuth sends it straight back here.
  const account = session?.user
    ? await findCurrentAccount(session.user.id)
    : null;
  if (account?.active) redirect("/admin");

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Staff access for product and inventory management.
        </p>
      </div>
      <Card className="p-6">
        <LoginForm />
      </Card>
    </div>
  );
}
