"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { buildInventoryAuditStamp } from "@/lib/inventory-audit";
import { requireRole } from "@/lib/permissions";
import { buildVariantSku } from "@/lib/prc-sku";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  productCreateSchema,
  productUpdateSchema,
  productVariantCreateSchema,
  type ProductCreateInput,
  type ProductUpdateInput,
  type ProductVariantCreateInput,
} from "@/lib/validation";

async function ensureUniqueSlug(base: string): Promise<string> {
  for (let i = 1; i <= 1000; i += 1) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const taken = await prisma.product.findUnique({
      where: { slug: candidate },
    });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function friendlyUniqueError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(", ")
      : "field";
    throw new Error(`A product with this ${target} already exists.`);
  }
  throw error;
}

function revalidateProductPaths() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
}

export async function createProduct(input: ProductCreateInput) {
  await requireRole(["ADMIN", "SALES"]);

  const parsed = productCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      "Invalid product data: " +
        parsed.error.issues.map((issue) => issue.message).join("; "),
    );
  }

  const data = parsed.data;
  const slug = await ensureUniqueSlug(slugify(data.name) || "product");

  try {
    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        slug,
        brand: data.brand,
        modelNumber: data.modelNumber ?? null,
        color: data.color ?? null,
        categoryId: data.categoryId,
        shortDescription: data.shortDescription ?? null,
        description: data.description ?? null,
        availabilityStatus: data.availabilityStatus,
        origin: data.origin,
        active: data.active ?? true,
        images: {
          create: data.images.map((image, index) => ({
            imageUrl: image.imageUrl,
            altText: image.altText ?? null,
            displayOrder: index,
          })),
        },
        specifications: {
          create: data.specifications.map((spec, index) => ({
            specName: spec.specName,
            specValue: spec.specValue,
            unit: spec.unit ?? null,
            displayOrder: index,
          })),
        },
      },
    });

    revalidateProductPaths();
    redirect(`/admin/products/${product.id}/edit`);
  } catch (error) {
    friendlyUniqueError(error);
  }
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  const session = await requireRole(["ADMIN", "SALES"]);

  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      "Invalid product data: " +
        parsed.error.issues.map((issue) => issue.message).join("; "),
    );
  }

  const data = parsed.data;
  // The client form always submits the complete product, so every field here
  // carries a real value. This avoids relying on `.partial()` parse defaults
  // (e.g. `active` defaulting to true) ever overriding stored data.
  const updateData: Prisma.ProductUncheckedUpdateInput = {
    sku: data.sku,
    name: data.name,
    slug: data.slug,
    brand: data.brand,
    modelNumber: data.modelNumber ?? null,
    color: data.color ?? null,
    categoryId: data.categoryId,
    shortDescription: data.shortDescription ?? null,
    description: data.description ?? null,
    availabilityStatus: data.availabilityStatus,
    origin: data.origin,
    active: data.active,
  };

  const current = await prisma.product.findUnique({
    where: { id },
    select: { availabilityStatus: true },
  });

  // Prisma reads an omitted availabilityStatus as "leave unchanged"; without this
  // guard a non-null assertion would fabricate a stamp for a change that never happened.
  const stamp =
    current && data.availabilityStatus !== undefined
      ? buildInventoryAuditStamp({
          currentStatus: current.availabilityStatus,
          nextStatus: data.availabilityStatus,
          userId: session.user.id,
        })
      : null;

  if (stamp) {
    updateData.inventoryUpdatedAt = stamp.inventoryUpdatedAt;
    updateData.inventoryUpdatedById = stamp.inventoryUpdatedById;
  }

  try {
    await prisma.$transaction([
      prisma.product.update({ where: { id }, data: updateData }),
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productImage.createMany({
        data: (data.images ?? []).map((image, index) => ({
          productId: id,
          imageUrl: image.imageUrl,
          altText: image.altText ?? null,
          displayOrder: index,
        })),
      }),
      prisma.productSpecification.deleteMany({ where: { productId: id } }),
      prisma.productSpecification.createMany({
        data: (data.specifications ?? []).map((spec, index) => ({
          productId: id,
          specName: spec.specName,
          specValue: spec.specValue,
          unit: spec.unit ?? null,
          displayOrder: index,
        })),
      }),
    ]);

    revalidateProductPaths();
    redirect("/admin/products");
  } catch (error) {
    friendlyUniqueError(error);
  }
}

export async function toggleProductActive(formData: FormData) {
  await requireRole(["ADMIN", "SALES"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { active: true },
  });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data: { active: !product.active },
  });
  revalidateProductPaths();
}

function friendlyVariantUniqueError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
    if (target.includes("sku")) {
      throw new Error("A variant with this SKU already exists.");
    }
    throw new Error(
      "This product already has a variant with that size and series.",
    );
  }
  throw error;
}

function revalidateVariantPaths(productId: string, slug: string) {
  revalidateProductPaths();
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath(`/products/${slug}`);
}

export async function createVariant(
  productId: string,
  input: ProductVariantCreateInput,
) {
  await requireRole(["ADMIN", "SALES"]);

  const parsed = productVariantCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      "Invalid variant data: " +
        parsed.error.issues.map((issue) => issue.message).join("; "),
    );
  }

  const data = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, slug: true },
  });
  if (!product) throw new Error("Product not found.");

  try {
    await prisma.productVariant.create({
      data: {
        productId,
        sku: buildVariantSku(product.name, data.size, data.series),
        size: data.size,
        series: data.series,
        unit: data.unit ?? null,
        // Admin-created variants are live and authoritative (docs/DECISIONS.md ADR-020).
        reviewStatus: "PENDING",
        unitPrice: data.unitPrice === "" ? null : data.unitPrice,
        priceHigh: data.priceHigh === "" ? null : data.priceHigh,
        active: data.active,
      },
    });

    revalidateVariantPaths(productId, product.slug);
  } catch (error) {
    friendlyVariantUniqueError(error);
  }
}

export async function toggleVariantActive(id: string) {
  await requireRole(["ADMIN", "SALES"]);

  const variant = await prisma.productVariant.findUnique({
    where: { id },
    select: { active: true, product: { select: { id: true, slug: true } } },
  });
  if (!variant) return;

  await prisma.productVariant.update({
    where: { id },
    data: { active: !variant.active },
  });
  revalidateVariantPaths(variant.product.id, variant.product.slug);
}
