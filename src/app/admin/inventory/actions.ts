"use server";

import { revalidatePath } from "next/cache";
import { buildInventoryAuditStamp } from "@/lib/inventory-audit";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { inventoryUpdateSchema } from "@/lib/validation";

export async function updateAvailability(formData: FormData) {
  // The actor comes from the server session, never from the submitted form.
  const session = await requireRole(["ADMIN", "SALES"]);

  const productId = formData.get("productId");
  const parsed = inventoryUpdateSchema.safeParse({
    availabilityStatus: formData.get("availabilityStatus"),
  });

  if (typeof productId !== "string" || !productId || !parsed.success) {
    throw new Error("Invalid inventory update.");
  }

  const nextStatus = parsed.data.availabilityStatus;
  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { availabilityStatus: true },
  });

  if (!current) {
    throw new Error("Invalid inventory update.");
  }

  const stamp = buildInventoryAuditStamp({
    currentStatus: current.availabilityStatus,
    nextStatus,
    userId: session.user.id,
  });

  // Re-submitting the current status must not move the recorded "last changed" stamp.
  if (!stamp) return;

  await prisma.product.update({
    where: { id: productId },
    data: { availabilityStatus: nextStatus, ...stamp },
  });

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/inventory");
}