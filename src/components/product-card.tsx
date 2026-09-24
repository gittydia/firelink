import Image from "next/image";
import Link from "next/link";
import type { AvailabilityStatus } from "@prisma/client";
import { AvailabilityBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export interface ProductCardData {
  slug: string;
  categoryId: string | null;
  name: string;
  brand: string;
  modelNumber: string | null;
  shortDescription: string | null;
  availabilityStatus: AvailabilityStatus;
  images: { imageUrl: string; altText: string | null }[];
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  return (
    <Card className="overflow-hidden border-brand-mist shadow-[0_16px_34px_-28px_rgba(15,23,42,0.7)] transition-shadow duration-200 hover:shadow-[0_22px_42px_-26px_rgba(15,23,42,0.5)]">
      <Link href={`/products/${product.slug}`} className="group flex h-full flex-col">
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-brand-canvas">
          {image ? (
            <Image
              src={image.imageUrl}
              alt={image.altText ?? product.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-200 motion-reduce:transition-none group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-slate">
              No image available
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-snug text-brand-ink group-hover:text-fire-dark">
              {product.name}
            </h3>
            <AvailabilityBadge status={product.availabilityStatus} className="shrink-0" />
          </div>
          <p className="text-xs font-medium text-brand-slate">
            {product.brand}
            {product.modelNumber ? ` · ${product.modelNumber}` : ""}
          </p>
          {product.shortDescription ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-brand-slate">{product.shortDescription}</p>
          ) : null}
        </div>
      </Link>
    </Card>
  );
}
