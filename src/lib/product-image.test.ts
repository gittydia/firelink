import { describe, expect, it } from "vitest";
import {
  UNSUPPORTED_IMAGE_MESSAGE,
  classifyImageUrl,
  isUsableImageUrl,
  pickPrimaryImage,
  resolveImageAlt,
} from "./product-image";

const SEED_URL =
  "https://images.unsplash.com/photo-1666518837279-fad286ce75fb?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg";

describe("classifyImageUrl", () => {
  it("treats blank input as empty rather than invalid", () => {
    expect(classifyImageUrl("")).toEqual({ kind: "empty" });
    expect(classifyImageUrl("   ")).toEqual({ kind: "empty" });
    expect(classifyImageUrl(null)).toEqual({ kind: "empty" });
    expect(classifyImageUrl(undefined)).toEqual({ kind: "empty" });
  });

  it("rejects text that is not a URL", () => {
    expect(classifyImageUrl("not a url")).toEqual({ kind: "invalid" });
    expect(classifyImageUrl("/uploads/photo.jpg")).toEqual({ kind: "invalid" });
  });

  it("rejects non-http protocols", () => {
    expect(classifyImageUrl("ftp://example.com/photo.jpg")).toEqual({
      kind: "invalid",
    });
    expect(classifyImageUrl("data:image/png;base64,AAAA")).toEqual({
      kind: "invalid",
    });
  });

  it("keeps the seeded Unsplash URLs valid even without a path extension", () => {
    expect(classifyImageUrl(SEED_URL)).toEqual({
      kind: "ready",
      url: SEED_URL,
    });
  });

  it("accepts an unknown or missing extension and lets the browser decide", () => {
    expect(isUsableImageUrl("https://cdn.example.com/i/12345")).toBe(true);
    expect(isUsableImageUrl("https://cdn.example.com/render.php?id=7")).toBe(
      true,
    );
    expect(isUsableImageUrl("https://cdn.example.com/photos/")).toBe(true);
  });

  it("accepts known image extensions in any case", () => {
    expect(isUsableImageUrl("https://example.com/a.jpg")).toBe(true);
    expect(isUsableImageUrl("https://example.com/a.JPG")).toBe(true);
    expect(isUsableImageUrl("https://example.com/a.WebP")).toBe(true);
    expect(isUsableImageUrl("https://example.com/a.svg")).toBe(true);
  });

  it("rejects obvious document and archive links", () => {
    expect(classifyImageUrl("https://example.com/spec.pdf")).toEqual({
      kind: "unsupported",
      message: UNSUPPORTED_IMAGE_MESSAGE,
    });
    expect(classifyImageUrl("https://example.com/photos.zip")).toEqual({
      kind: "unsupported",
      message: UNSUPPORTED_IMAGE_MESSAGE,
    });
    expect(classifyImageUrl("https://example.com/sheet.XLSX")).toEqual({
      kind: "unsupported",
      message: UNSUPPORTED_IMAGE_MESSAGE,
    });
  });

  it("catches a non-image format declared only in the query string", () => {
    expect(classifyImageUrl("https://example.com/download?format=pdf")).toEqual(
      {
        kind: "unsupported",
        message: UNSUPPORTED_IMAGE_MESSAGE,
      },
    );
    expect(classifyImageUrl("https://example.com/download?fm=json")).toEqual({
      kind: "unsupported",
      message: UNSUPPORTED_IMAGE_MESSAGE,
    });
  });

  it("does not mistake an unrelated query parameter for a format", () => {
    const url = "https://images.unsplash.com/photo-1?auto=format&w=600";
    expect(isUsableImageUrl(url)).toBe(true);
  });

  it("trims surrounding whitespace from the accepted url", () => {
    expect(classifyImageUrl("  https://example.com/a.png  ")).toEqual({
      kind: "ready",
      url: "https://example.com/a.png",
    });
  });
});

describe("resolveImageAlt", () => {
  it("prefers the entered alt text", () => {
    expect(resolveImageAlt("Red hose reel", "FireLink")).toBe("Red hose reel");
  });

  it("falls back to the product name when alt text is blank", () => {
    expect(resolveImageAlt("", "FireLink Hose Reel")).toBe(
      "FireLink Hose Reel",
    );
    expect(resolveImageAlt("   ", "FireLink Hose Reel")).toBe(
      "FireLink Hose Reel",
    );
    expect(resolveImageAlt(null, "FireLink Hose Reel")).toBe(
      "FireLink Hose Reel",
    );
  });

  it("never resolves to an empty string", () => {
    expect(resolveImageAlt(null, null)).toBe("Product image");
    expect(resolveImageAlt("", "  ")).toBe("Product image");
  });
});

describe("pickPrimaryImage", () => {
  it("returns null when there are no images", () => {
    expect(pickPrimaryImage([])).toBeNull();
  });

  it("picks the lowest display order", () => {
    const images = [
      { imageUrl: "b", displayOrder: 2 },
      { imageUrl: "a", displayOrder: 0 },
      { imageUrl: "c", displayOrder: 1 },
    ];

    expect(pickPrimaryImage(images)?.imageUrl).toBe("a");
  });

  it("keeps the earlier position when orders tie", () => {
    const images = [
      { imageUrl: "first", displayOrder: 1 },
      { imageUrl: "second", displayOrder: 1 },
    ];

    expect(pickPrimaryImage(images)?.imageUrl).toBe("first");
  });

  it("treats a missing order as the array position", () => {
    const images = [
      { imageUrl: "first", displayOrder: 3 },
      { imageUrl: "second" },
    ];

    expect(pickPrimaryImage(images)?.imageUrl).toBe("second");
  });

  it("lets an earlier position with no order win a later explicit order", () => {
    const images = [
      { imageUrl: "first" },
      { imageUrl: "second", displayOrder: 0 },
    ];

    expect(pickPrimaryImage(images)?.imageUrl).toBe("first");
  });

  it("does not mutate the input array", () => {
    const images = [
      { imageUrl: "b", displayOrder: 3 },
      { imageUrl: "a", displayOrder: 1 },
    ];
    const snapshot = images.map((image) => image.imageUrl);

    pickPrimaryImage(images);

    expect(images.map((image) => image.imageUrl)).toEqual(snapshot);
  });
});
