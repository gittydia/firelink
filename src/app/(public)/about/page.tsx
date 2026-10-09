import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import type { AvailabilityStatus } from "@prisma/client";
import { buttonLinkClass } from "@/components/ui/button";
import {
  availabilityDescriptions,
  availabilityLabels,
} from "@/lib/availability";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how Fire Protection Equipment makes equipment information and availability easier to understand.",
};

const equipmentLines = [
  "Portable fire extinguishers for dry chemical, CO2, and water applications",
  "Fire hoses, hose reels, nozzles, hydrants, and accessories",
  "Fire alarm, smoke detection, and emergency notification devices",
  "Emergency lighting, exit signs, and other life-safety equipment",
];

const availabilityOrder: AvailabilityStatus[] = ["LOCAL", "IN_STOCK", "INDENT"];

const availabilityStyles: Record<AvailabilityStatus, string> = {
  LOCAL: "border-home-statusGreen bg-home-statusGreen-soft/40",
  IN_STOCK: "border-home-statusBlue bg-home-statusBlue-soft/40",
  INDENT: "border-home-statusYellow bg-home-statusYellow-soft/40",
};

export default function AboutPage() {
  return (
    <div className="space-y-16">
      <section className="relative -mt-8 left-1/2 right-1/2 min-h-[400px] w-screen -translate-x-1/2 overflow-hidden bg-home-navyDeep sm:min-h-[460px]">
        <Image
          src="/images/hero-pipeline-valves.jpg"
          alt="Industrial fire-protection pipework and valves"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-home-navyDeep via-home-navyDeep/90 to-home-navy/40"
        />
        <div className="relative mx-auto flex min-h-[400px] max-w-6xl items-end px-4 py-12 sm:min-h-[460px] sm:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-home-ctaPale">
              FIRE PROTECTION, MADE CLEAR
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Equipment information you can rely on.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-home-ctaPale sm:text-lg">
              Fire Protection Equipment brings product details, equipment categories, and real
              availability into one dependable source for facilities and projects.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-home-muted">
            ABOUT FIRE PROTECTION EQUIPMENT
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-home-text sm:text-4xl">
            Reliable product information for essential safety systems.
          </h2>
        </div>
        <div className="space-y-5 text-base leading-relaxed text-home-muted">
          <p>
            Fire Protection Equipment is a product information and inventory visibility platform
            for fire protection equipment. It centralizes specifications,
            categories, and availability for equipment supplied to projects and
            facilities.
          </p>
          <p>
            The goal is straightforward: make it easier to understand what each
            system does, find the right equipment line, and see whether an item
            is available locally, in stock, or supplied on an order basis.
          </p>
        </div>
      </section>

      <section className="bg-brand-paper py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-home-muted">
              EQUIPMENT LINES
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-home-text">
              Core equipment for fire safety readiness.
            </h2>
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {equipmentLines.map((line, index) => (
              <li
                key={line}
                className="flex gap-4 border-t border-home-supply pt-4 text-sm leading-relaxed text-home-muted"
              >
                <span className="font-bold tabular-nums text-home-text">
                  0{index + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.22em] text-home-muted">
            SUPPLY CONDITIONS
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-home-text">
            Availability explained without guesswork.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-home-muted">
            Every product is marked with a clear supply condition so planning can
            begin with accurate information.
          </p>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {availabilityOrder.map((status, index) => (
            <article
              key={status}
              className={`border p-6 ${availabilityStyles[status]}`}
            >
              <p className="text-xs font-bold tracking-[0.22em] text-home-text">
                0{index + 1}
              </p>
              <h3 className="mt-8 text-lg font-bold text-home-text">
                {availabilityLabels[status]}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-home-muted">
                {availabilityDescriptions[status]}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden bg-home-navyDeep">
        <Image
          src="/images/about-pump-room.jpg"
          alt="Fire pump room with industrial pipework and valves"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-home-navyDeep/85"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-xl">
            <p className="text-xs font-bold tracking-[0.22em] text-home-ctaPale">
              READY TO EXPLORE
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Find the equipment your facility needs.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-home-ctaPale">
              Browse the catalog for product details and availability, or speak
              with our team about your project requirements.
            </p>
            <Link
              href="/contact"
              className={buttonLinkClass(
                "mt-8 bg-home-cta px-5 py-3 text-home-navy hover:bg-home-ctaPale focus-visible:outline-home-ctaPale",
              )}
            >
              Contact our team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
