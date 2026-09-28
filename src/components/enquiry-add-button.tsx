"use client";

import { useState } from "react";
import { MAX_LINE_QUANTITY } from "@/lib/inquiry";
import { useInquirySelection } from "@/components/use-inquiry-selection";

interface EnquiryAddButtonProps {
  productId: string;
  productName: string;
  /** Adds a quantity stepper. Only worth it where there is room for it. */
  withQuantity?: boolean;
  className?: string;
}

export function EnquiryAddButton({
  productId,
  productName,
  withQuantity = false,
  className = "",
}: EnquiryAddButtonProps) {
  const { has, add, remove, setQuantity, ready, atCapacity } =
    useInquirySelection();
  const [quantity, setLocalQuantity] = useState(1);

  const selected = ready && has(productId);
  const blocked = ready && !selected && atCapacity;

  function toggle() {
    if (selected) {
      remove(productId);
      return;
    }
    add(productId, quantity);
  }

  return (
    <div className={className}>
      {withQuantity ? (
        <label className="mb-2 block">
          <span className="mb-1 block text-xs font-semibold text-brand-ink">
            Quantity
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_LINE_QUANTITY}
            value={quantity}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              const clamped = Number.isFinite(next)
                ? Math.min(Math.max(next, 1), MAX_LINE_QUANTITY)
                : 1;
              setLocalQuantity(clamped);
              if (selected) setQuantity(productId, clamped);
            }}
            className="min-h-11 w-24 rounded-lg border border-brand-mist bg-brand-paper px-3 text-base tabular-nums text-brand-ink outline-none transition focus:border-brand-ink focus:ring-2 focus:ring-brand-mist"
          />
        </label>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        disabled={blocked}
        aria-pressed={selected}
        className={`min-h-11 w-full rounded-lg px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          selected
            ? "border border-brand-mist bg-brand-paper text-brand-ink hover:bg-brand-canvas focus-visible:outline-brand-ink"
            : "bg-ember text-white hover:bg-ember-dark focus-visible:outline-ember-dark"
        }`}
      >
        {selected ? (
          <>
            <span aria-hidden="true">✓</span> In enquiry — remove
          </>
        ) : blocked ? (
          "Enquiry list full"
        ) : (
          `Add ${productName} to enquiry`
        )}
      </button>

      {blocked ? (
        <p className="mt-2 text-xs text-brand-slate">
          You can enquire about up to 50 products. Remove one to add another.
        </p>
      ) : null}
    </div>
  );
}
