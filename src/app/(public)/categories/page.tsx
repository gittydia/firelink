import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { active: true, products: { some: { active: true } } },
    include: { _count: { select: { products: { where: { active: true } } } } },
    orderBy: { name: "asc" },
  });

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Categories</h1>
        <p className="text-neutral-500">No categories available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Categories</h1>
        <p className="mt-2 text-neutral-600">Browse products by equipment category.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={`/products?categoryId=${category.id}`} className="group block">
            <Card className="h-full p-5 transition-colors group-hover:border-fire">
              <h2 className="font-semibold text-neutral-900 group-hover:text-fire-dark">{category.name}</h2>
              {category.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{category.description}</p>
              ) : null}
              <p className="mt-3 text-xs text-neutral-500">
                {category._count.products} product{category._count.products === 1 ? "" : "s"}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}