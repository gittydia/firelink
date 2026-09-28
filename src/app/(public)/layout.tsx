import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-fire">
            FireLink
          </Link>
          <nav
            aria-label="Main"
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-neutral-700"
          >
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-fire">
                {link.label}
              </Link>
            ))}
          </nav>
          {session?.user ? (
            <Link
              href="/admin"
              className="rounded-md bg-fire px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-fire-dark"
            >
              Admin
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-700 transition-colors hover:text-fire"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-sm text-neutral-500">
          <p>
            &copy; {new Date().getFullYear()} FireLink. Product information &amp; inventory
            visibility for fire protection equipment.
          </p>
          <Link href="/privacy" className="font-medium transition-colors hover:text-fire">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}