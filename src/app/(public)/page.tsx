import Image from "next/image";
import Link from "next/link";
import type { AvailabilityStatus } from "@prisma/client";
import { ProductCard } from "@/components/product-card";
import { buttonLinkClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { availabilityDescriptions, availabilityLabels } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Fire Protection Equipment & Supplies",
  description:
    "Browse fire extinguishers, hoses, alarms, emergency lighting, and more — with real availability status.",
};

const availabilityOrder: AvailabilityStatus[] = ["LOCAL", "IN_STOCK", "INDENT"];

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    prisma.category.findMany({
      where: { active: true, products: { some: { active: true } } },
      include: { _count: { select: { products: { where: { active: true } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      include: { images: { orderBy: { displayOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Fire protection equipment,{" "}
            <span className="text-fire">when you need it</span>
          </h1>
          <p className="text-lg text-neutral-600">
            Find extinguishers, hose reels, alarms, and emergency lighting for your facility. Every product shows its
            real availability — available locally, in stock, or on order.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className={buttonLinkClass("bg-fire text-white hover:bg-fire-dark")}
            >
              Browse products
            </Link>
            <Link
              href="/categories"
              className={buttonLinkClass("border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50")}
            >
              View categories
            </Link>
          </div>
        </div>
        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-lg lg:block">
          <Image
            src="https://placehold.co/800x600/dc2626/ffffff?text=FireLink"
            alt="FireLink — fire protection equipment"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* Availability legend */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-neutral-900">What availability means</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {availabilityOrder.map((status) => (
            <Card key={status} className="p-5">
              <p className="text-sm font-semibold text-fire">{availabilityLabels[status]}</p>
              <p className="mt-1 text-sm text-neutral-600">{availabilityDescriptions[status]}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Categories</h2>
          <Link href="/categories" className="text-sm font-medium text-fire hover:text-fire-dark">
            All categories →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?categoryId=${category.id}`} className="group block">
              <Card className="h-full p-5 transition-colors group-hover:border-fire">
                <h3 className="font-semibold text-neutral-900 group-hover:text-fire-dark">{category.name}</h3>
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
      </section>

      {/* Featured products */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Featured products</h2>
          <Link href="/products" className="text-sm font-medium text-fire hover:text-fire-dark">
            View all →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}