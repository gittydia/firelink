"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitInquiry } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Textarea } from "@/components/ui/textarea";
import { useInquirySelection } from "@/components/use-inquiry-selection";
import {
  contactInquirySchema,
  type ContactInquiryInput,
} from "@/lib/validation";

type Feedback = {
  tone: "success" | "error";
  message: string;
  reference?: string;
} | null;

export function ContactForm() {
  const { lines, ready, count, totalQuantity, clear, setQuantity, remove } =
    useInquirySelection();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [honeypot, setHoneypot] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInquiryInput>({
    resolver: zodResolver(contactInquirySchema),
    defaultValues: { privacyAccepted: false },
  });

  function onSubmit(data: ContactInquiryInput) {
    setFeedback(null);

    // Products and the honeypot are not RHF-managed: the first comes from the
    // shared store, the second must never be validated or rendered.
    const payload = {
      ...data,
      products: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
      website: honeypot,
    };

    startTransition(async () => {
      const result = await submitInquiry(payload);

      if (result.status === "error") {
        setFeedback({ tone: "error", message: result.message });
        return;
      }

      // Cleared only now: a failed send must leave the list intact to retry.
      clear();
      reset();
      setHoneypot("");
      setFeedback({
        tone: "success",
        message: result.message,
        reference: result.reference,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {feedback ? (
        <Notice tone={feedback.tone}>
          {feedback.message}
          {feedback.reference ? (
            <span className="mt-1 block font-mono text-xs">
              Your reference: {feedback.reference}
            </span>
          ) : null}
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          autoComplete="name"
          required
          {...register("name")}
          error={errors.name?.message}
          errorClassName="text-ember-dark"
        />
        <Input
          label="Company"
          autoComplete="organization"
          required
          {...register("company")}
          error={errors.company?.message}
          errorClassName="text-ember-dark"
        />
      </div>

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
        {...register("email")}
        error={errors.email?.message}
        errorClassName="text-ember-dark"
      />

      <Textarea
        label="What do you need?"
        rows={6}
        placeholder="Quantities, delivery location, standards you need to meet, or any questions about a product."
        required
        {...register("message")}
        error={errors.message?.message}
        errorClassName="text-ember-dark"
      />

      <section
        aria-labelledby="selection-heading"
        className="rounded-xl border border-brand-mist bg-brand-canvas p-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="selection-heading"
            className="text-sm font-semibold text-brand-ink"
          >
            Products in this enquiry {count > 0 ? `(${count})` : ""}
          </h2>
          {count > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="text-xs font-semibold text-brand-slate underline hover:text-brand-ink"
            >
              Clear list
            </button>
          ) : null}
        </div>

        {!ready ? (
          <p className="mt-2 text-sm text-brand-slate">
            Loading your selection…
          </p>
        ) : count === 0 ? (
          <p className="mt-2 text-sm text-brand-slate">
            No products selected. This form is fine as a general enquiry, or{" "}
            <Link
              href="/products"
              className="font-semibold text-ember-dark underline"
            >
              browse the catalogue
            </Link>{" "}
            to add items.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-2">
              {lines.map((line, index) => (
                <li
                  key={line.productId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-mist bg-brand-paper px-3 py-2"
                >
                  <span className="text-sm text-brand-ink">
                    Item {index + 1}
                  </span>
                  <span className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-brand-slate">
                      <span>Qty</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={9999}
                        value={line.quantity}
                        aria-label={`Quantity for item ${index + 1}`}
                        onChange={(event) => {
                          const next = Number.parseInt(event.target.value, 10);
                          setQuantity(
                            line.productId,
                            Number.isFinite(next) ? next : 1,
                          );
                        }}
                        className="min-h-9 w-20 rounded-md border border-brand-mist bg-brand-paper px-2 text-sm tabular-nums outline-none focus:border-brand-ink focus:ring-2 focus:ring-brand-mist"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      className="text-xs font-semibold text-brand-slate underline hover:text-brand-ink"
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-brand-slate">
              {count} {count === 1 ? "line" : "lines"} · {totalQuantity} total
              units. Names, SKUs and current availability are confirmed by our
              team when they reply.
            </p>
          </>
        )}
      </section>

      <div>
        <label className="flex items-start gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0"
            {...register("privacyAccepted")}
            required
            aria-invalid={errors.privacyAccepted ? true : undefined}
            aria-describedby={
              errors.privacyAccepted ? "privacyAccepted-error" : undefined
            }
          />
          <span>
            I have read and accept the{" "}
            <Link
              href="/privacy"
              className="font-semibold text-ember-dark underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.privacyAccepted ? (
          <p
            id="privacyAccepted-error"
            className="mt-1 text-sm text-ember-dark"
          >
            {errors.privacyAccepted.message}
          </p>
        ) : null}
      </div>

      {/* Bots fill every field; kept out of the tab order and the accessibility tree. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto size-px overflow-hidden"
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <Button type="submit" className="w-full min-h-11" disabled={isPending}>
        {isPending ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
