import Link from "next/link";
import type { ReactNode } from "react";
import { buttonLinkClass } from "@/components/ui/button";
import { auth } from "@/lib/auth";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

const footerColumns = [
  {
    heading: "Explore",
    links: [
      { href: "/products", label: "Products" },
      { href: "/categories", label: "Categories" },
      { href: "/about", label: "About Us" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="bg-home-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center py-2.5 text-lg font-bold tracking-tight text-white"
          >
            Fire Protection Equipment
          </Link>

          <nav
            aria-label="Main"
            className="hidden items-center gap-7 text-sm font-medium text-home-ctaPale sm:flex"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center rounded py-3 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-home-ctaPale"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {session?.user ? (
            <Link
              href="/admin"
              className={buttonLinkClass(
                "bg-home-cta py-3 text-home-navy hover:bg-home-ctaPale focus-visible:outline-home-ctaPale",
              )}
            >
              Admin
            </Link>
          ) : (
            <Link
              href="/login"
              className={buttonLinkClass(
                "border border-home-cta py-3 text-home-ctaPale hover:bg-home-cta hover:text-home-navy focus-visible:outline-home-ctaPale",
              )}
            >
              Sign in
            </Link>
          )}
        </div>

        <nav
          aria-label="Main mobile"
          className="flex items-center gap-5 border-t border-white/10 px-4 py-2.5 text-sm font-medium text-home-ctaPale sm:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center rounded py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-ctaPale"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Kept constrained on purpose: the homepage opts into edge-to-edge bands
          with a breakout rather than widening this wrapper, so every other
          public page keeps its max-w-6xl container. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="mt-16 bg-home-navy text-home-ctaPale">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-lg font-bold text-white">
              Fire Protection Equipment
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-home-cta">
              Fire protection equipment and supplies with real availability
              visibility &mdash; available locally, in stock, or on order.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.heading}>
              <p className="text-sm font-semibold text-white">
                {column.heading}
              </p>
              <ul className="mt-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block rounded py-3 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-ctaPale"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-5 text-sm text-home-cta">
            &copy; {new Date().getFullYear()} Fire Protection Equipment. Product information
            &amp; inventory visibility for fire protection equipment.
          </div>
        </div>
      </footer>
    </div>
  );
}
