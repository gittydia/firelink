"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { inventoryUpdateSchema } from "@/lib/validation";

export async function updateAvailability(formData: FormData) {
  await requireRole(["ADMIN", "SALES"]);

  const productId = formData.get("productId");
  const parsed = inventoryUpdateSchema.safeParse({
    availabilityStatus: formData.get("availabilityStatus"),
  });

  if (typeof productId !== "string" || !productId || !parsed.success) {
    throw new Error("Invalid inventory update.");
  }

  await prisma.product.update({
    where: { id: productId },
    data: { availabilityStatus: parsed.data.availabilityStatus },
  });

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/inventory");
}