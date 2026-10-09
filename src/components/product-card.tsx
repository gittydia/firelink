import Image from "next/image";
import Link from "next/link";
import type { AvailabilityStatus, ProductOrigin } from "@prisma/client";
import { EnquiryAddButton } from "@/components/enquiry-add-button";
import { AvailabilityBadge, ProductOriginBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export interface ProductCardData {
  id: string;
  slug: string;
  categoryId: string | null;
  name: string;
  brand: string;
  modelNumber: string | null;
  color: string | null;
  shortDescription: string | null;
  availabilityStatus: AvailabilityStatus;
  origin: ProductOrigin | null;
  images: { imageUrl: string; altText: string | null }[];
  priceFrom: number | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  return (
    <Card className="overflow-hidden border-brand-mist shadow-[0_16px_34px_-28px_rgba(15,23,42,0.7)] transition-shadow duration-200 hover:shadow-[0_22px_42px_-26px_rgba(15,23,42,0.5)]">
      <Link href={`/products/${product.slug}`} className="group block">
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
        <div className="flex flex-col gap-1.5 p-4">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-3">
            <h3 className="min-w-0 font-semibold leading-snug text-brand-ink group-hover:text-ember-dark">
              {product.name}
            </h3>
            <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:min-w-0">
              <AvailabilityBadge status={product.availabilityStatus} />
              {product.origin ? (
                <ProductOriginBadge origin={product.origin} />
              ) : null}
            </div>
          </div>
          <p className="text-xs font-medium text-brand-slate">
            {product.brand}
            {product.modelNumber ? ` · ${product.modelNumber}` : ""}
            {product.color ? ` · ${product.color}` : ""}
          </p>
          {product.priceFrom !== null ? (
            <p className="mt-0.5 text-sm font-semibold text-brand-ink">
              From {formatPrice(product.priceFrom)}
            </p>
          ) : null}
          {product.shortDescription ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-brand-slate">
              {product.shortDescription}
            </p>
          ) : null}
        </div>
      </Link>
      {/* Sits outside the card link so the button is not nested inside another control. */}
      <div className="border-t border-brand-mist p-4">
        <EnquiryAddButton productId={product.id} productName={product.name} />
      </div>
    </Card>
  );
}
