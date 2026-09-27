"use client";

import { useState } from "react";
import { ProductImageFrame } from "@/components/product-image-frame";
import { Dialog } from "@/components/ui/dialog";
import { pickPrimaryImage, resolveImageAlt } from "@/lib/product-image";

export interface ProductImageSummary {
  imageUrl: string;
  altText?: string | null;
  displayOrder?: number | null;
}

interface ProductImageThumbnailProps {
  productName: string;
  images: ProductImageSummary[];
  /** A product with several images gets a count next to the primary one. */
  showCount?: boolean;
}

function isUsableUrl(url: string | null | undefined): boolean {
  return (url ?? "").trim() !== "";
}

/**
 * Table cell for a product's primary image: a click-to-enlarge thumbnail that
 * falls back to a placeholder when the product has no usable image URL.
 */
export function ProductImageThumbnail({
  productName,
  images,
  showCount = true,
}: ProductImageThumbnailProps) {
  const [isOpen, setIsOpen] = useState(false);

  const usableImages = images.filter((image) => isUsableUrl(image.imageUrl));
  const primary = pickPrimaryImage(usableImages);

  if (!primary) {
    return <ProductImageFrame src={null} alt="" emptyLabel="No image" />;
  }

  const extraCount = usableImages.length - 1;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={`Enlarge image of ${productName}`}
          className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fire"
        >
          <ProductImageFrame
            src={primary.imageUrl}
            alt=""
            emptyLabel="No image"
            errorLabel="Broken"
          />
        </button>
        {showCount && extraCount > 0 ? (
          <span className="text-xs text-neutral-500">+{extraCount}</span>
        ) : null}
      </div>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={productName}
        description={primary.imageUrl}
        closeLabel="Close image preview"
      >
        <ProductImageFrame
          src={primary.imageUrl}
          alt={resolveImageAlt(primary.altText, productName)}
          size="preview"
          errorLabel="This image could not be loaded. Check the URL, then try again."
        />
      </Dialog>
    </>
  );
}
