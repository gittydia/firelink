import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Contact</h1>
        <p className="mt-3 leading-relaxed text-neutral-700">
          For quotations, stock checks, or technical questions about the equipment listed here, reach our sales team.
          This prototype does not process orders online.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Sales team</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <dt className="w-24 shrink-0 font-medium text-neutral-500">Email</dt>
            <dd>
              <a href="mailto:sales@firelink.local" className="text-fire hover:text-fire-dark">
                sales@firelink.local
              </a>
            </dd>
          </div>
        </dl>
      </Card>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
        <p className="font-medium text-neutral-800">Before you contact us</p>
        <p className="mt-1">
          Availability on each product page shows whether items are <strong>available locally</strong>,{" "}
          <strong>in stock</strong>, or <strong>on indent order</strong>. Include the product SKU in your message for
          a faster response.
        </p>
      </div>
    </div>
  );
}