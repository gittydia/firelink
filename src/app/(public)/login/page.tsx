import Image from "next/image";
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
    <section className="relative -mx-4 -my-8 flex min-h-[560px] items-center overflow-hidden bg-home-navyDeep py-12 sm:min-h-[620px] sm:py-16">
      <Image
        src="/images/hero-pipeline-valves.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-home-navyDeep/95 via-home-navy/90 to-home-navyDeep/75"
      />
      <div className="relative mx-auto grid w-full max-w-5xl gap-10 px-4 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="max-w-xl text-white">
          <p className="text-xs font-bold tracking-[0.22em] text-home-ctaPale">
            FIRE GUARD SOLUTIONS STAFF PORTAL
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Keep critical equipment information ready.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-home-ctaPale sm:text-lg">
            Secure staff access for maintaining product details and dependable
            inventory visibility.
          </p>
        </div>

        <div>
          <div className="mb-5 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-home-ctaPale">
              Use your staff account to continue.
            </p>
          </div>
          <Card className="border-white/20 bg-brand-paper p-6 shadow-lg">
            <LoginForm />
          </Card>
        </div>
      </div>
    </section>
  );
}
