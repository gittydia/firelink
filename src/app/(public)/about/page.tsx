import type { Metadata } from "next";
import Link from "next/link";
import type { AvailabilityStatus } from "@prisma/client";
import { Card } from "@/components/ui/card";
import {
  availabilityDescriptions,
  availabilityLabels,
} from "@/lib/availability";

export const metadata: Metadata = { title: "About" };

const availabilityOrder: AvailabilityStatus[] = ["LOCAL", "IN_STOCK", "INDENT"];

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          About FireLink
        </h1>
        <p className="mt-3 leading-relaxed text-neutral-700">
          FireLink is a product information and inventory visibility platform
          for fire protection equipment. It centralizes product details —
          specifications, categories, and real-time availability — for the
          equipment supplied to projects and facilities.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-neutral-900">
          Equipment lines
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-neutral-700">
          <li>Portable fire extinguishers (dry chemical, CO2, water)</li>
          <li>Fire hoses, hose reels, and nozzles</li>
          <li>Fire alarm and smoke detection devices</li>
          <li>Emergency lighting and exit signs</li>
          <li>Fire blankets</li>
          <li>Hydrants and accessories</li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-neutral-900">
          Availability explained
        </h2>
        <div className="mt-3 space-y-3">
          {availabilityOrder.map((status) => (
            <Card key={status} className="p-4">
              <p className="text-sm font-semibold text-fire">
                {availabilityLabels[status]}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                {availabilityDescriptions[status]}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-sm text-neutral-500">
        This prototype covers product information and inventory visibility. For
        pricing or quotations,{" "}
        <Link href="/contact" className="text-fire hover:text-fire-dark">
          contact our team
        </Link>
        .
      </p>
    </div>
  );
}
