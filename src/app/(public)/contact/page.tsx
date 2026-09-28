import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "./contact-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-xl bg-brand-ink px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-brand-paper">Contact our sales team</h1>
        <p className="mt-3 leading-relaxed text-brand-mist">
          For quotations, stock checks, or technical questions about the equipment listed here, reach
          our sales team. This prototype does not process orders online.
        </p>
      </div>

      <Card className="border-brand-mist p-6">
        <ContactForm />
      </Card>

      <Card className="border-brand-mist p-6">
        <h2 className="text-lg font-semibold text-brand-ink">Prefer email?</h2>
        <p className="mt-2 text-sm leading-6 text-brand-slate">
          Reach the sales team directly at{" "}
          <a href="mailto:sales@firelink.local" className="font-semibold text-ember-dark underline">
            sales@firelink.local
          </a>
          . Include the product SKU and quantity if you know them.
        </p>
      </Card>

      <section className="rounded-xl border border-brand-mist bg-brand-canvas p-5">
        <h2 className="text-sm font-semibold text-brand-ink">Before you contact us</h2>
        <p className="mt-2 text-sm leading-6 text-brand-slate">
          Availability on each product page shows whether items are{" "}
          <strong className="text-brand-ink">available locally</strong>,{" "}
          <strong className="text-brand-ink">in stock</strong>, or{" "}
          <strong className="text-brand-ink">on indent order</strong>. If you already know a part
          number, include it in your message for a faster reply.
        </p>
        <p className="mt-3 text-sm leading-6 text-brand-slate">
          Anything you added with <strong className="text-brand-ink">Add to enquiry</strong> is kept
          on this device until you send the form. Products are optional — a general enquiry is just
          as welcome. Not sure where to start?{" "}
          <Link href="/products" className="font-semibold text-ember-dark underline">
            Browse the catalogue
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
