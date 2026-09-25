import type { Metadata } from "next";
import type { AvailabilityStatus } from "@prisma/client";
import { AvailabilityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { availabilityLabels } from "@/lib/availability";
import { formatInventoryUpdatedAt, formatInventoryUpdatedBy } from "@/lib/inventory-audit";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { updateAvailability } from "./actions";

export const metadata: Metadata = { title: "Inventory" };

const availabilityOptions = (Object.keys(availabilityLabels) as AvailabilityStatus[]).map((value) => ({
  value,
  label: availabilityLabels[value],
}));

export default async function InventoryPage() {
  await requireRole(["ADMIN", "SALES"]);

  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true, inventoryUpdatedBy: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inventory</h1>
        <p className="text-sm text-neutral-500">No active products to update.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inventory</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Update availability status for {products.length} active product{products.length === 1 ? "" : "s"}.
        </p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th scope="col" className="px-4 py-3 font-medium">Product</th>
              <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Category</th>
              <th scope="col" className="px-4 py-3 font-medium">Last Updated</th>
              <th scope="col" className="px-4 py-3 font-medium">Current</th>
              <th scope="col" className="px-4 py-3 font-medium">Update to</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{product.name}</p>
                  <p className="text-xs text-neutral-500">{product.sku}</p>
                </td>
                <td className="hidden px-4 py-3 text-neutral-600 md:table-cell">{product.category.name}</td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  <p>{formatInventoryUpdatedAt(product.inventoryUpdatedAt)}</p>
                  <p>{formatInventoryUpdatedBy(product.inventoryUpdatedBy?.name)}</p>
                </td>
                <td className="px-4 py-3">
                  <AvailabilityBadge status={product.availabilityStatus} />
                </td>
                <td className="px-4 py-3">
                  <form action={updateAvailability} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="productId" value={product.id} />
                    <Select
                      name="availabilityStatus"
                      defaultValue={product.availabilityStatus}
                      aria-label={`Update availability for ${product.name}`}
                      options={availabilityOptions}
                      className="w-44"
                    />
                    <Button type="submit" variant="secondary">
                      Update
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}