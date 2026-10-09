import Image from "next/image";
import Link from "next/link";
import type { AvailabilityStatus } from "@prisma/client";
import { buttonLinkClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryRail } from "@/components/product/category-rail";
import { availabilityLabels } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Fire Protection Equipment & Supplies",
  description:
    "Browse fire extinguishers, hoses, alarms, emergency lighting, and more — with real availability status.",
};

const supplyConditions: Array<{
  status: AvailabilityStatus;
  description: string;
  chip: string;
  ring: string;
  icon: string;
}> = [
  {
    status: "LOCAL",
    description:
      "Units are positioned in local metro distribution warehouses. Quotations can be finalized in real time, with delivery scheduled within 1–2 business days or available for authorized pickup immediately.",
    chip: "bg-home-statusGreen-soft text-home-statusGreen-onSoft",
    ring: "border-home-statusGreen",
    icon: "text-home-statusGreen-deep",
  },
  {
    status: "IN_STOCK",
    description:
      "Units have already passed inspection, pressure testing, and hydrostatic validation. Standard freight is packaged the same day upon receipt of purchase authorization.",
    chip: "bg-home-statusBlue-soft text-home-statusBlue-onSoft",
    ring: "border-home-statusBlue",
    icon: "text-home-statusBlue-deep",
  },
  {
    status: "INDENT",
    description:
      "Specialized valves, custom hose lengths, and industrial deluge sprinkler nozzles are sourced directly from certified manufacturers. Lead time is quoted per project blueprints with extended commissioning milestones.",
    chip: "bg-home-statusYellow-soft text-home-statusYellow-onSoft",
    ring: "border-home-statusYellow",
    icon: "text-home-statusYellow-deep",
  },
];

export default async function HomePage() {
  const [categories, brandRows, activeProductCount] = await Promise.all([
    prisma.category.findMany({
      where: { active: true, products: { some: { active: true } } },
      include: {
        _count: { select: { products: { where: { active: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    }),
    prisma.product.count({ where: { active: true } }),
  ]);

  const brands = brandRows
    .map((row) => row.brand.trim())
    .filter((brand) => brand.length > 0);

  // Counted live from the catalog. There is no Order/Sale model, so
  // "products sold" and "clients" are unknowable - do not reinstate them.
  const stats = [
    { value: activeProductCount, label: "PRODUCTS" },
    { value: categories.length, label: "CATEGORIES" },
    { value: brands.length, label: "BRANDS" },
  ];

  return (
    <>
      {/* Breakout instead of widening the layout's max-w-6xl main, so every
          other public page keeps its container. -my-8 cancels main's py-8. */}
      <section className="relative -my-8 left-1/2 right-1/2 w-screen -translate-x-1/2">
        <div className="relative flex min-h-[324px] items-center bg-home-navyDeep">
          <Image
            src="/images/hero-pipeline-valves.jpg"
            alt="Fire protection valves and industrial pipework"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-home-navyDeep via-home-navyDeep/85 to-home-navyDeep/30"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-20">
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Fire protection equipment, when you need it
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-home-ctaPale sm:text-lg">
              Find extinguishers, hose reels, alarms, and emergency lighting for
              your facility. Every product shows its real availability —
              available locally, in stock, or on order.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className={buttonLinkClass(
                  "bg-home-cta px-5 py-3 text-home-navy hover:bg-home-ctaPale focus-visible:outline-home-ctaPale",
                )}
              >
                Browse products
              </Link>
              <Link
                href="/categories"
                className={buttonLinkClass(
                  "border border-home-cta px-5 py-3 text-white hover:bg-white/10 focus-visible:outline-home-ctaPale",
                )}
              >
                View categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 mt-16 w-screen -translate-x-1/2">
        <div className="bg-home-navy px-4 py-8">
          <dl className="mx-auto grid max-w-4xl grid-cols-1 gap-8 text-center sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-4xl font-bold tabular-nums text-white sm:text-5xl">
                    {stat.value.toLocaleString("en-US")}
                  </span>
                  <span className="mt-1 block text-xs font-semibold tracking-[0.2em] text-home-ctaPale">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-home-text sm:text-3xl">
              Our Products
            </h2>
            <p className="mt-2 text-sm text-home-muted">
              Browse by equipment category.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-block rounded py-3 text-sm font-semibold text-home-text underline underline-offset-4 transition-colors hover:text-home-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-home-text"
          >
            View all products &rarr;
          </Link>
        </div>

        <CategoryRail
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            imageUrl: category.imageUrl,
            productCount: category._count.products,
          }))}
        />
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight text-home-text sm:text-3xl">
          Supply Condition
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-home-muted">
          Every listing states where a unit physically is and when it can ship.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {supplyConditions.map((condition) => (
            <Card
              key={condition.status}
              className={`border-t-4 p-6 ${condition.ring}`}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-home-supply ${condition.icon}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    {condition.status === "LOCAL" ? (
                      <>
                        <path d="M20 6 9 17l-5-5" />
                      </>
                    ) : condition.status === "IN_STOCK" ? (
                      <>
                        <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
                        <path d="m3.3 7 8.7 5 8.7-5" />
                        <path d="M12 22V12" />
                      </>
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </>
                    )}
                  </svg>
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${condition.chip}`}
                >
                  {availabilityLabels[condition.status]}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-home-muted">
                {condition.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight text-home-text sm:text-3xl">
          Brand Partners
        </h2>
        {brands.length === 0 ? (
          <p className="mt-2 text-sm text-home-muted">
            Partner brands will appear here as the catalog grows.
          </p>
        ) : (
          <ul className="mt-6 flex flex-wrap gap-3">
            {brands.map((brand) => (
              <li key={brand}>
                <span
                  title={brand}
                  className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-home-supply p-2"
                >
                  <span className="line-clamp-2 break-words text-center text-xs font-bold uppercase leading-tight tracking-tight text-home-navy">
                    {brand}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16 grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-home-text sm:text-3xl">
            About Brand
          </h2>
          <p className="text-sm leading-relaxed text-home-muted">
            Fire Protection Equipment is a Philippine fire protection supplier focused on
            dependable availability. We stock the equipment facilities actually
            need, keep inventory visibility honest, and quote lead times plainly
            so specification decisions are never guesswork.
          </p>
          <Link
            href="/about"
            className={buttonLinkClass(
              "bg-home-cta px-5 py-3 text-home-navy hover:bg-home-ctaPale focus-visible:outline-home-text",
            )}
          >
            Find out more
          </Link>
        </div>
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-home-supply">
          <Image
            src="/images/about-pump-room.jpg"
            alt="Fire pump room with industrial pipework and valves"
            fill
            sizes="(min-width: 1024px) 576px, 100vw"
            className="object-cover"
          />
        </div>
      </section>
    </>
  );
}
