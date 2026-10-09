import type { Metadata } from "next";
import Link from "next/link";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";

export const metadata: Metadata = { title: "Privacy Policy" };

const sections = [
  {
    heading: "What this site is",
    body: (
      <>
        Fire Protection Equipment is a product information and inventory prototype. It shows fire
        protection equipment, its category, and whether an item is available
        locally, in stock, or on indent order. It does not sell anything: there
        is no basket, no checkout, no payment, and no order processing. An
        enquiry is a message to our sales team, not a transaction.
      </>
    ),
  },
  {
    heading: "What you can do without giving us anything",
    body: (
      <>
        Browsing products, categories, and product detail pages needs no account
        and no personal details. Your product list is kept in your own browser
        using local storage under the key{" "}
        <code className="rounded bg-brand-canvas px-1 py-0.5 font-mono text-xs">
          productInquirySelection
        </code>
        . It is never sent to us until you press send, and clearing your browser
        storage removes it.
      </>
    ),
  },
  {
    heading: "What an enquiry contains",
    body: (
      <>
        If you choose to send an enquiry we store your name, company, email
        address, message, and any products you attached with the quantity you
        gave. We also record that you accepted this policy, the version you
        accepted, and when. Your enquiry is given a reference such as{" "}
        <code className="rounded bg-brand-canvas px-1 py-0.5 font-mono text-xs">
          FLQ-20260928-4KD2QX
        </code>{" "}
        so you can quote it in a later message.
      </>
    ),
  },
  {
    heading: "What happens to it",
    body: (
      <>
        The enquiry is stored in our database and forwarded to our sales team by
        email so someone can reply. Product names, SKUs, and current
        availability are read from our catalogue at the moment you send, rather
        than trusted from your device. If a product is archived between adding
        it and sending, it is left out and the rest of your enquiry is still
        delivered. A copy of the enquiry is kept against its reference so the
        same question is not answered twice.
      </>
    ),
  },
  {
    heading: "Automatic protection",
    body: (
      <>
        The form carries a hidden field that only automated spam scripts fill
        in. This prototype has no rate limiting yet, so there is a limit on how
        much automated traffic it can absorb before that is worth adding.
      </>
    ),
  },
  {
    heading: "What we never ask for",
    body: (
      <>
        No payment or card details, because nothing is for sale here. No account
        is required, and no password is needed to send an enquiry.
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-ink">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-brand-slate">
          Version{" "}
          <code className="rounded bg-brand-canvas px-1.5 py-0.5 font-mono text-xs">
            {PRIVACY_POLICY_VERSION}
          </code>
        </p>
        <p className="mt-4 leading-relaxed text-brand-slate">
          This page explains what this prototype does with the information you
          give it. It is a plain-language summary for a demonstration system,
          not a legal notice, and it does not set out retention schedules or
          statutory rights.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold text-brand-ink">
              {section.heading}
            </h2>
            <p className="mt-2 leading-relaxed text-brand-slate">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-brand-mist bg-brand-canvas p-5">
        <h2 className="text-sm font-semibold text-brand-ink">
          Questions about your data
        </h2>
        <p className="mt-2 text-sm leading-6 text-brand-slate">
          Ask the sales team at{" "}
          <a
            href="mailto:sales@firelink.local"
            className="font-semibold text-ember-dark underline"
          >
            sales@firelink.local
          </a>
          , or use the{" "}
          <Link
            href="/contact"
            className="font-semibold text-ember-dark underline"
          >
            enquiry form
          </Link>
          . Quote your enquiry reference so we can find the exact message you
          mean.
        </p>
      </section>
    </div>
  );
}
