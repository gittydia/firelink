"use client";

import { useMemo, useState } from "react";
import type { AvailabilityStatus } from "@prisma/client";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { availabilityLabels } from "@/lib/availability";

type Category = { id: string; name: string };
type SortOption = "newest" | "name";

interface ProductCatalogProps {
  products: ProductCardData[];
  categories: Category[];
}

const availabilityOptions = Object.entries(availabilityLabels) as [
  AvailabilityStatus,
  string,
][];

function matchesSearch(product: ProductCardData, query: string): boolean {
  const searchableFields = [
    product.name,
    product.brand,
    product.modelNumber,
    product.color,
    product.shortDescription,
  ];

  return searchableFields.some((field) =>
    field?.toLocaleLowerCase().includes(query),
  );
}

export function ProductCatalog({ products, categories }: ProductCatalogProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [availability, setAvailability] = useState<AvailabilityStatus | "">("");
  const [sort, setSort] = useState<SortOption>("newest");

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const isFiltered = Boolean(
    normalizedQuery || categoryId || availability || sort !== "newest",
  );

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCategory = !categoryId || product.categoryId === categoryId;
      const matchesAvailability =
        !availability || product.availabilityStatus === availability;
      return (
        matchesCategory &&
        matchesAvailability &&
        matchesSearch(product, normalizedQuery)
      );
    });

    if (sort === "name") {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [availability, categoryId, normalizedQuery, products, sort]);

  function resetFilters() {
    setQuery("");
    setCategoryId("");
    setAvailability("");
    setSort("newest");
  }

  return (
    <section aria-labelledby="catalog-heading" className="space-y-6">
      <div className="rounded-xl border border-brand-mist bg-brand-paper p-4 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.55)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-slate">
              Equipment directory
            </p>
            <h1
              id="catalog-heading"
              className="mt-1 text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl"
            >
              Find the equipment you need
            </h1>
            <p className="mt-2 text-base leading-6 text-brand-slate">
              Search approved product details and check the availability status
              before you quote.
            </p>
          </div>
          <p
            aria-live="polite"
            className="font-mono text-sm tabular-nums text-brand-slate"
          >
            {visibleProducts.length} of {products.length} products
          </p>
        </div>

        <div className="mt-6 grid gap-3 border-t border-brand-mist pt-5 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_minmax(9rem,1fr)_auto]">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brand-ink">
              Search products
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, brand, model, or description"
              className="min-h-11 w-full rounded-lg border border-brand-mist bg-brand-paper px-3 text-base text-brand-ink outline-none transition focus:border-brand-ink focus:ring-2 focus:ring-brand-mist"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brand-ink">
              Category
            </span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-brand-mist bg-brand-paper px-3 text-base text-brand-ink outline-none transition focus:border-brand-ink focus:ring-2 focus:ring-brand-mist"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brand-ink">
              Availability
            </span>
            <select
              value={availability}
              onChange={(event) =>
                setAvailability(event.target.value as AvailabilityStatus | "")
              }
              className="min-h-11 w-full rounded-lg border border-brand-mist bg-brand-paper px-3 text-base text-brand-ink outline-none transition focus:border-brand-ink focus:ring-2 focus:ring-brand-mist"
            >
              <option value="">Any availability</option>
              {availabilityOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brand-ink">
              Sort by
            </span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="min-h-11 w-full rounded-lg border border-brand-mist bg-brand-paper px-3 text-base text-brand-ink outline-none transition focus:border-brand-ink focus:ring-2 focus:ring-brand-mist"
            >
              <option value="newest">Newest first</option>
              <option value="name">Name A-Z</option>
            </select>
          </label>
          <button
            type="button"
            onClick={resetFilters}
            disabled={!isFiltered}
            className="min-h-11 self-end rounded-lg border border-brand-mist px-4 text-sm font-semibold text-brand-ink transition hover:bg-brand-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-mist bg-brand-paper px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-brand-ink">
            No matching products
          </h2>
          <p className="mx-auto mt-2 max-w-md text-brand-slate">
            Adjust your search or filters to view more equipment.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 min-h-11 rounded-lg bg-brand-ink px-4 text-sm font-semibold text-brand-paper transition hover:bg-fire-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
