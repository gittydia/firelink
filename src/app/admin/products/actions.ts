"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { buildInventoryAuditStamp } from "@/lib/inventory-audit";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  productCreateSchema,
  productUpdateSchema,
  type ProductCreateInput,
  type ProductUpdateInput,
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
        categoryId: data.categoryId,
        shortDescription: data.shortDescription ?? null,
        description: data.description ?? null,
        availabilityStatus: data.availabilityStatus,
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
    categoryId: data.categoryId,
    shortDescription: data.shortDescription ?? null,
    description: data.description ?? null,
    availabilityStatus: data.availabilityStatus,
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
