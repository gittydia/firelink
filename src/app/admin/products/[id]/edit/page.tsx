import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import type { ProductCreateInput } from "@/lib/validation";
import { ProductForm } from "../../product-form";

export const metadata: Metadata = { title: "Edit product" };

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  await requireRole(["ADMIN", "SALES"]);

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { displayOrder: "asc" } },
      specifications: { orderBy: { displayOrder: "asc" } },
      variants: { orderBy: [{ size: "asc" }, { series: "asc" }] },
    },
  });
  if (!product) notFound();

  const initial: ProductCreateInput = {
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    modelNumber: product.modelNumber ?? undefined,
    categoryId: product.categoryId,
    shortDescription: product.shortDescription ?? undefined,
    description: product.description ?? undefined,
    availabilityStatus: product.availabilityStatus,
    active: product.active,
    images: product.images.map((image) => ({
      imageUrl: image.imageUrl,
      altText: image.altText ?? undefined,
      displayOrder: image.displayOrder,
    })),
    specifications: product.specifications.map((spec) => ({
      specName: spec.specName,
      specValue: spec.specValue,
      unit: spec.unit ?? undefined,
      displayOrder: spec.displayOrder,
    })),
  };

  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Edit product
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {product.name} · {product.sku}
        </p>
      </div>
      <ProductForm
        categories={categories.map((category) => ({
          value: category.id,
          label: category.name,
        }))}
        productId={product.id}
        initial={initial}
        variants={product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          size: variant.size,
          series: variant.series,
          unit: variant.unit,
          unitPrice: variant.unitPrice?.toString() ?? null,
          priceHigh: variant.priceHigh?.toString() ?? null,
          active: variant.active,
          reviewStatus: variant.reviewStatus,
          ambiguityNote: variant.ambiguityNote,
          sourceSlide: variant.sourceSlide?.toString() ?? null,
        }))}
      />
    </div>
  );
}
