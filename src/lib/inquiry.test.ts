import { describe, expect, it } from "vitest";
import {
  buildInquiryReference,
  findSelectionLine,
  MAX_LINE_QUANTITY,
  MAX_SELECTION_LINES,
  normalizeInquiryLines,
  parseInquirySelection,
  serializeInquirySelection,
} from "./inquiry";

describe("buildInquiryReference", () => {
  it("formats FLQ-YYYYMMDD-XXXXXX from a UTC date", () => {
    expect(buildInquiryReference(new Date("2026-09-28T23:30:00Z"))).toMatch(
      /^FLQ-20260928-[2-9A-HJ-NP-Z]{6}$/,
    );
  });

  it("omits characters that are ambiguous when read aloud", () => {
    const reference = buildInquiryReference(new Date("2026-01-02T00:00:00Z"));
    expect(reference.slice(-6)).not.toMatch(/[01IO]/);
  });

  it("pads single-digit months and days", () => {
    expect(buildInquiryReference(new Date("2026-03-04T12:00:00Z"))).toContain(
      "FLQ-20260304-",
    );
  });
});

describe("normalizeInquiryLines", () => {
  it("keeps a well-formed line", () => {
    expect(normalizeInquiryLines([{ productId: "abc", quantity: 2 }])).toEqual([
      { productId: "abc", quantity: 2 },
    ]);
  });

  it("sums quantity when a product id is repeated", () => {
    expect(
      normalizeInquiryLines([
        { productId: "abc", quantity: 2 },
        { productId: "abc", quantity: 3 },
      ]),
    ).toEqual([{ productId: "abc", quantity: 5 }]);
  });

  it("defaults a missing or unparseable quantity to 1", () => {
    expect(
      normalizeInquiryLines([
        { productId: "a" },
        { productId: "b", quantity: "not-a-number" },
        { productId: "c", quantity: 0 },
      ]),
    ).toEqual([
      { productId: "a", quantity: 1 },
      { productId: "b", quantity: 1 },
      { productId: "c", quantity: 1 },
    ]);
  });

  it("clamps quantity to the allowed maximum", () => {
    expect(
      normalizeInquiryLines([
        { productId: "a", quantity: MAX_LINE_QUANTITY + 5000 },
        { productId: "a", quantity: MAX_LINE_QUANTITY },
      ]),
    ).toEqual([{ productId: "a", quantity: MAX_LINE_QUANTITY }]);
  });

  it("drops entries without a usable product id", () => {
    expect(
      normalizeInquiryLines([
        { productId: "   " },
        { productId: 42 },
        { quantity: 1 },
        null,
        "nope",
        { productId: " ok ", quantity: 1 },
      ]),
    ).toEqual([{ productId: "ok", quantity: 1 }]);
  });

  it("caps the number of lines", () => {
    const many = Array.from(
      { length: MAX_SELECTION_LINES + 10 },
      (_, index) => ({
        productId: `p${index}`,
        quantity: 1,
      }),
    );
    expect(normalizeInquiryLines(many)).toHaveLength(MAX_SELECTION_LINES);
  });

  it("returns nothing for a non-array input", () => {
    expect(normalizeInquiryLines(null)).toEqual([]);
    expect(normalizeInquiryLines(undefined)).toEqual([]);
    expect(
      normalizeInquiryLines("abc" as unknown as readonly unknown[]),
    ).toEqual([]);
  });
});

describe("parseInquirySelection", () => {
  it("returns nothing for absent storage", () => {
    expect(parseInquirySelection(null)).toEqual([]);
    expect(parseInquirySelection("")).toEqual([]);
  });

  it("returns nothing for corrupt JSON instead of throwing", () => {
    expect(parseInquirySelection("{not json")).toEqual([]);
    expect(parseInquirySelection("undefined")).toEqual([]);
  });

  it("reads the array form", () => {
    expect(parseInquirySelection('[{"productId":"abc","quantity":4}]')).toEqual(
      [{ productId: "abc", quantity: 4 }],
    );
  });

  it("accepts a bare object from the earlier single-line storage shape", () => {
    expect(parseInquirySelection('{"productId":"abc","quantity":2}')).toEqual([
      { productId: "abc", quantity: 2 },
    ]);
  });
});

describe("serializeInquirySelection", () => {
  it("round-trips through parse", () => {
    const lines = [
      { productId: "abc", quantity: 2 },
      { productId: "def", quantity: 1 },
    ];
    expect(parseInquirySelection(serializeInquirySelection(lines))).toEqual(
      lines,
    );
  });

  it("normalizes before writing so storage never holds duplicate ids", () => {
    const serialized = serializeInquirySelection([
      { productId: "abc", quantity: 2 },
      { productId: "abc", quantity: 3 },
    ]);
    expect(parseInquirySelection(serialized)).toEqual([
      { productId: "abc", quantity: 5 },
    ]);
  });
});

describe("findSelectionLine", () => {
  it("returns the matching line", () => {
    expect(
      findSelectionLine([{ productId: "abc", quantity: 2 }], "abc"),
    ).toEqual({ productId: "abc", quantity: 2 });
  });

  it("returns undefined when the product is not selected", () => {
    expect(
      findSelectionLine([{ productId: "abc", quantity: 2 }], "zzz"),
    ).toBeUndefined();
  });
});
