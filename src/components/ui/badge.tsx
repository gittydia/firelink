import type { AvailabilityStatus } from "@prisma/client";
import { availabilityLabels } from "@/lib/availability";
import { staffStatusLabel } from "@/lib/staff";
import { cn } from "@/lib/utils";

/** Always renders the status as text; color is decorative, never the only cue. */
export function AvailabilityBadge({
  status,
  className,
}: {
  status: AvailabilityStatus;
  className?: string;
}) {
  const tone: Record<AvailabilityStatus, string> = {
    LOCAL: "bg-sky-100 text-sky-800",
    IN_STOCK: "bg-emerald-100 text-emerald-800",
    INDENT: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone[status],
        className,
      )}
    >
      {availabilityLabels[status]}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        active
          ? "bg-neutral-100 text-neutral-700"
          : "bg-neutral-200 text-neutral-500",
      )}
    >
      {active ? "Active" : "Archived"}
    </span>
  );
}

/** "Archived" is product vocabulary; accounts are "Inactive", never removed. */
export function AccountStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-neutral-200 text-neutral-600",
      )}
    >
      {staffStatusLabel(active)}
    </span>
  );
}
