import type { Metadata } from "next";
import Link from "next/link";
import type { AvailabilityStatus } from "@prisma/client";
import { buttonLinkClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { availabilityLabels } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export const metadata: Metadata = { title: "Dashboard" };

const availabilityOrder: AvailabilityStatus[] = ["LOCAL", "IN_STOCK", "INDENT"];

export default async function AdminDashboardPage() {
  const session = await requireRole(["ADMIN", "SALES"]);

  const [
    activeProducts,
    archivedProducts,
    activeCategories,
    availabilityGroups,
    recentProducts,
  ] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { active: false } }),
    prisma.category.count({ where: { active: true } }),
    prisma.product.groupBy({
      by: ["availabilityStatus"],
      where: { active: true },
      _count: { _all: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const availabilityCounts = Object.fromEntries(
    availabilityGroups.map((group) => [
      group.availabilityStatus,
      group._count._all,
    ]),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Signed in as {session.user.name} ({session.user.role}).
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className={buttonLinkClass("bg-fire text-white hover:bg-fire-dark")}
          >
            Add product
          </Link>
          <Link
            href="/admin/inventory"
            className={buttonLinkClass(
              "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
            )}
          >
            Manage inventory
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-medium text-neutral-500">
            Active products
          </p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">
            {activeProducts}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-neutral-500">
            Archived products
          </p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">
            {archivedProducts}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-neutral-500">
            Active categories
          </p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">
            {activeCategories}
          </p>
        </Card>
      </div>

      {/* Availability breakdown */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          Availability breakdown
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {availabilityOrder.map((status) => (
            <Card key={status} className="p-5">
              <p className="text-sm font-medium text-fire">
                {availabilityLabels[status]}
              </p>
              <p className="mt-1 text-3xl font-bold text-neutral-900">
                {availabilityCounts[status] ?? 0}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent products */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Recently added
          </h2>
          <Link
            href="/admin/products"
            className="text-sm font-medium text-fire hover:text-fire-dark"
          >
            All products →
          </Link>
        </div>
        {recentProducts.length === 0 ? (
          <p className="text-sm text-neutral-500">No products yet.</p>
        ) : (
          <Card className="divide-y divide-neutral-200">
            {recentProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-2 p-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="font-medium text-neutral-900 hover:text-fire-dark"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {product.sku} · {product.category.name}
                  </p>
                </div>
                <span className="text-xs font-medium text-fire">
                  {availabilityLabels[product.availabilityStatus]}
                </span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
