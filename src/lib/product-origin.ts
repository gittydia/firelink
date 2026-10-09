import type { ProductOrigin } from "@prisma/client";

export const productOriginLabels: Record<ProductOrigin, string> = {
  LOCAL: "Local product",
  INTERNATIONAL: "International / imported",
};

export const productOriginDescriptions: Record<ProductOrigin, string> = {
  LOCAL: "Sourced locally in the Philippines.",
  INTERNATIONAL: "Imported or sourced from abroad.",
};
