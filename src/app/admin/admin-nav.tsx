"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { canManageStaff } from "@/lib/staff";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/staff", label: "Staff", adminOnly: true },
];

export function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const visibleLinks = links.filter((link) => !link.adminOnly || canManageStaff(role));

  return (
    <nav aria-label="Admin" className="flex gap-2 md:flex-col">
      {visibleLinks.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/admin" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-fire text-white" : "text-neutral-700 hover:bg-neutral-100"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
