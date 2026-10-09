import type { Metadata } from "next";
import type { ProductCardData } from "@/components/product-card";
import { ProductCatalog } from "@/components/product-catalog";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        images: { orderBy: { displayOrder: "asc" }, take: 1 },
        variants: { where: { active: true }, select: { unitPrice: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const mapped: ProductCardData[] = products.map((product) => {
    const prices = product.variants.flatMap((variant) =>
      variant.unitPrice === null ? [] : [Number(variant.unitPrice)],
    );

    return {
      id: product.id,
      slug: product.slug,
      categoryId: product.categoryId,
      name: product.name,
      brand: product.brand,
      modelNumber: product.modelNumber,
      color: product.color,
      shortDescription: product.shortDescription,
      availabilityStatus: product.availabilityStatus,
      origin: product.origin,
      images: product.images.map((image) => ({
        imageUrl: image.imageUrl,
        altText: image.altText,
      })),
      priceFrom: prices.length > 0 ? Math.min(...prices) : null,
    };
  });

  return <ProductCatalog products={mapped} categories={categories} />;
}
