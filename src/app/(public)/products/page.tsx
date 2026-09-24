import type { Metadata } from "next";
import { ProductCatalog } from "@/components/product-catalog";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: { images: { orderBy: { displayOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <ProductCatalog products={products} categories={categories} />;
}
