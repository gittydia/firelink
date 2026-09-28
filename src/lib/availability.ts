import type { AvailabilityStatus } from "@prisma/client";

/** Human-readable labels — always shown as text, never color-only. */
export const availabilityLabels: Record<AvailabilityStatus, string> = {
  LOCAL: "Available Locally",
  IN_STOCK: "In Stock",
  INDENT: "Indent / Order Basis",
};

/** Plain-language explanations for catalog + admin surfaces. */
export const availabilityDescriptions: Record<AvailabilityStatus, string> = {
  LOCAL: "Available from local stock. Ready to quote.",
  IN_STOCK: "In stock and available now.",
  INDENT: "Sourced on order. Lead time applies.",
};

export function parseAvailability(
  value: string | undefined,
): AvailabilityStatus | undefined {
  if (value === "LOCAL" || value === "IN_STOCK" || value === "INDENT") {
    return value;
  }
  return undefined;
}
