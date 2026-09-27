"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type ProductImageFrameSize = "thumbnail" | "preview";

interface ProductImageFrameProps {
  src: string | null | undefined;
  /** Pass "" when an enclosing control already carries the accessible name. */
  alt: string;
  size?: ProductImageFrameSize;
  className?: string;
  emptyLabel?: string;
  errorLabel?: string;
}

const SIZE_CLASSES: Record<ProductImageFrameSize, string> = {
  thumbnail: "size-12",
  preview: "aspect-[4/3] w-full",
};

const LABEL_CLASSES: Record<ProductImageFrameSize, string> = {
  thumbnail: "text-[10px]",
  preview: "text-xs",
};

/**
 * Renders a remote product image, or a labelled placeholder when the URL is
 * blank or the browser cannot load it. Uses a plain <img> because admin-supplied
 * URLs come from arbitrary hosts that cannot be whitelisted in next.config.ts.
 */
export function ProductImageFrame({
  src,
  alt,
  size = "thumbnail",
  className,
  emptyLabel = "No image",
  errorLabel = "Could not load",
}: ProductImageFrameProps) {
  // Recording the exact URL that failed means editing the field back to a
  // working link clears the error with no effect and no extra state to reset.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const url = (src ?? "").trim();
  const status = !url ? "empty" : failedSrc === url ? "error" : "ready";

  const frameClass = cn(
    "relative flex overflow-hidden rounded-md border border-neutral-200",
    SIZE_CLASSES[size],
    className,
  );

  if (status === "ready") {
    return (
      <div className={frameClass}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image only
            accepts hosts whitelisted in next.config.ts, and admin URLs are arbitrary. */}
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(url)}
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        frameClass,
        "items-center justify-center bg-neutral-100 text-neutral-400",
      )}
    >
      <span className="flex flex-col items-center gap-1 px-1 text-center">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L16 17" />
          <path d="m14 15 1.8-1.8a2 2 0 0 1 2.8 0L20.5 15" />
        </svg>
        <span className={cn("leading-tight", LABEL_CLASSES[size])}>
          {status === "error" ? errorLabel : emptyLabel}
        </span>
      </span>
    </div>
  );
}
