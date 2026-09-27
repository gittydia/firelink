import type { Metadata } from "next";
import Link from "next/link";
import { buttonLinkClass } from "@/components/ui/button";
import { ActiveBadge, AvailabilityBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { ProductImageThumbnail } from "./product-image-thumbnail";
import { toggleProductActive } from "./actions";

export const metadata: Metadata = { title: "Products" };

type SearchParams = Promise<{ q?: string }>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["ADMIN", "SALES"]);

  const { q = "" } = await searchParams;
  const query = q.trim();

  const products = await prisma.product.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { brand: { contains: query } },
            { sku: { contains: query } },
            { modelNumber: { contains: query } },
          ],
        }
      : undefined,
    include: {
      category: true,
      images: { orderBy: { displayOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Products
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {products.length} product{products.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className={buttonLinkClass("bg-fire text-white hover:bg-fire-dark")}
        >
          Add product
        </Link>
      </div>

      <form method="get" className="max-w-md">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name, brand, SKU, model…"
          aria-label="Search admin products"
          className="bg-white"
        />
      </form>

      {products.length === 0 ? (
        <p className="text-sm text-neutral-500">No products found.</p>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th scope="col" className="px-4 py-3 font-medium">
                  Product
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Image
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 font-medium md:table-cell"
                >
                  Category
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Availability
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="font-medium text-neutral-900 hover:text-fire-dark"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {product.brand}
                      {product.modelNumber
                        ? ` · ${product.modelNumber}`
                        : ""} · {product.sku}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <ProductImageThumbnail
                      productName={product.name}
                      images={product.images}
                    />
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-600 md:table-cell">
                    {product.category.name}
                  </td>
                  <td className="px-4 py-3">
                    <AvailabilityBadge status={product.availabilityStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <ActiveBadge active={product.active} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="font-medium text-fire hover:text-fire-dark"
                      >
                        Edit
                      </Link>
                      <form action={toggleProductActive}>
                        <input type="hidden" name="id" value={product.id} />
                        <button
                          type="submit"
                          className="font-medium text-neutral-500 hover:text-neutral-800"
                        >
                          {product.active ? "Archive" : "Restore"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
