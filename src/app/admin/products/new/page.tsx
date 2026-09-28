import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireRole(["ADMIN", "SALES"]);

  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Add product
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Create a new product with details, images, and specifications.
        </p>
      </div>
      <ProductForm
        categories={categories.map((category) => ({
          value: category.id,
          label: category.name,
        }))}
      />
    </div>
  );
}
