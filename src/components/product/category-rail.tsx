"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Card } from "@/components/ui/card";

export type CategoryCardData = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
};

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {direction === "left" ? (
        <>
          <path d="m15 18-6-6 6-6" />
        </>
      ) : (
        <>
          <path d="m9 18 6-6-6-6" />
        </>
      )}
    </svg>
  );
}

export function CategoryRail({ categories }: { categories: CategoryCardData[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // The rail is a scroll container, so the buttons must reflect live scroll
  // position. A resize or a card count change both invalidate it.
  const syncEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    syncEdges();
    if (!el) return;
    el.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    return () => {
      el.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
    };
  }, [syncEdges, categories.length]);

  const nudge = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.max(288, el.clientWidth * 0.8),
      behavior: "smooth",
    });
  };

  if (categories.length === 0) {
    return <p className="mt-6 text-home-muted">No categories available yet.</p>;
  }

  return (
    <div className="mt-6">
      {/* Desktop has no touch swipe, and the scrollbar is hidden, so without
          explicit controls the rail reads as a static row. */}
      <div className="mb-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={!canScrollLeft}
          aria-label="Scroll categories backward"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-home-text transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={!canScrollRight}
          aria-label="Scroll categories forward"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-home-text transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Chevron direction="right" />
        </button>
      </div>

      <div
        ref={railRef}
        role="region"
        aria-label="Product categories"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?categoryId=${category.id}`}
            className="group w-64 shrink-0 snap-start rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-home-text sm:w-72"
          >
            <Card className="h-full overflow-hidden p-0 transition-shadow group-hover:shadow-lg">
              <div className="relative h-44 w-full overflow-hidden bg-home-supply">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    // Category images are admin-supplied, so the host is not
                    // guaranteed to be in next.config remotePatterns.
                    unoptimized={!category.imageUrl.startsWith("/")}
                    sizes="(min-width: 640px) 288px, 256px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-full w-full items-center justify-center px-4 text-center text-xs font-bold uppercase tracking-[0.15em] text-home-navy/70"
                  >
                    FireLink
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-home-text">
                  {category.name}
                </h3>
                {category.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-home-muted">
                    {category.description}
                  </p>
                ) : null}
                <p className="mt-3 text-xs font-medium text-home-muted">
                  {category.productCount} product
                  {category.productCount === 1 ? "" : "s"}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
