import { describe, expect, it } from "vitest";
import { UNSUPPORTED_IMAGE_MESSAGE } from "./product-image";
import {
  productCreateSchema,
  productImageInputSchema,
  productUpdateSchema,
} from "./validation";

// Verbatim from prisma/seed.ts so the seeded catalog can never be locked out by
// a stricter rule: the path carries no extension and the format lives in "fm".
const SEED_URL =
  "https://images.unsplash.com/photo-1666518837279-fad286ce75fb?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg";

describe("productImageInputSchema", () => {
  it("accepts the seeded Unsplash query-format URLs", () => {
    expect(
      productImageInputSchema.safeParse({ imageUrl: SEED_URL }).success,
    ).toBe(true);
  });

  it("accepts an extensionless URL and leaves the type to the browser", () => {
    const result = productImageInputSchema.safeParse({
      imageUrl: "https://cdn.example.com/i/12345",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a document link with the unsupported image message", () => {
    const result = productImageInputSchema.safeParse({
      imageUrl: "https://example.com/spec.pdf",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(UNSUPPORTED_IMAGE_MESSAGE);
    }
  });

  it("rejects a non-image format declared only in the query string", () => {
    expect(
      productImageInputSchema.safeParse({
        imageUrl: "https://example.com/download?format=pdf",
      }).success,
    ).toBe(false);
    expect(
      productImageInputSchema.safeParse({
        imageUrl: "https://example.com/download?fm=json",
      }).success,
    ).toBe(false);
  });

  it("rejects a non-http protocol that z.string().url() still accepts", () => {
    const result = productImageInputSchema.safeParse({
      imageUrl: "ftp://example.com/photo.jpg",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Image URL must start with http:// or https://",
      );
    }
  });

  it("coerces a numeric displayOrder and keeps altText trimmed", () => {
    const result = productImageInputSchema.safeParse({
      imageUrl: "https://example.com/a.jpg",
      altText: "  Red hose reel  ",
      displayOrder: "2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayOrder).toBe(2);
      expect(result.data.altText).toBe("Red hose reel");
    }
  });
});

const validProductInput = {
  sku: "EXT-ABC-050",
  name: "ABC Fire Extinguisher",
  slug: "abc-fire-extinguisher",
  brand: "FireGuard",
  categoryId: "category-1",
  availabilityStatus: "LOCAL",
  active: true,
  images: [],
  specifications: [],
};

describe("product origin validation", () => {
  it("rejects a product create when origin is omitted", () => {
    const result = productCreateSchema.safeParse(validProductInput);

    expect(result.success).toBe(false);
  });

  it("rejects a product update when origin is omitted", () => {
    const result = productUpdateSchema.safeParse({ name: "Updated name" });

    expect(result.success).toBe(false);
  });

  it.each(["LOCAL", "INTERNATIONAL"])(
    "accepts %s as a product origin",
    (origin) => {
      const result = productCreateSchema.safeParse({
        ...validProductInput,
        origin,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.origin).toBe(origin);
      }
    },
  );

  it("rejects availability-only values as a product origin", () => {
    const result = productCreateSchema.safeParse({
      ...validProductInput,
      origin: "IN_STOCK",
    });

    expect(result.success).toBe(false);
  });
});
