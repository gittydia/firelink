import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryAddButton } from "@/components/enquiry-add-button";
import { AvailabilityBadge } from "@/components/ui/badge";
import { buttonLinkClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { availabilityDescriptions } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    select: { name: true, shortDescription: true },
  });
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDescription ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      category: true,
      images: { orderBy: { displayOrder: "asc" } },
      specifications: { orderBy: { displayOrder: "asc" } },
    },
  });
  if (!product) notFound();

  const primaryImage = product.images[0];

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
        <Link href="/products" className="hover:text-fire">
          Products
        </Link>
        {" / "}
        <Link
          href={`/products?categoryId=${product.categoryId}`}
          className="hover:text-fire"
        >
          {product.category.name}
        </Link>
        {" / "}
        <span className="text-neutral-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
            {primaryImage ? (
              <Image
                src={primaryImage.imageUrl}
                alt={primaryImage.altText ?? product.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                No image available
              </div>
            )}
          </div>
          {product.images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-100"
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.altText ?? product.name}
                    fill
                    sizes="(min-width: 1024px) 12vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-neutral-500">
              {product.brand}
              {product.modelNumber ? ` · Model ${product.modelNumber}` : ""} ·
              SKU {product.sku}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
              {product.name}
            </h1>
          </div>

          {/* Availability — text always shown, color is extra */}
          <Card className="border-l-4 border-l-fire p-4">
            <div className="flex flex-wrap items-center gap-3">
              <AvailabilityBadge status={product.availabilityStatus} />
              <p className="text-sm text-neutral-600">
                {availabilityDescriptions[product.availabilityStatus]}
              </p>
            </div>
          </Card>

          {product.description ? (
            <p className="leading-relaxed text-neutral-700">
              {product.description}
            </p>
          ) : null}

          <div className="rounded-xl border border-brand-mist bg-brand-paper p-4 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.55)]">
            <h2 className="text-base font-semibold text-brand-ink">
              Enquire about this item
            </h2>
            <p className="mt-1 text-sm leading-6 text-brand-slate">
              Add it to your enquiry list, then send the whole list to our sales
              team in one message.
            </p>
            <EnquiryAddButton
              productId={product.id}
              productName={product.name}
              withQuantity
              className="mt-3"
            />
            <Link
              href="/contact"
              className={buttonLinkClass(
                "mt-3 w-full border border-brand-mist bg-brand-paper text-brand-ink hover:bg-brand-canvas",
              )}
            >
              Go to enquiry form
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className={buttonLinkClass(
                "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
              )}
            >
              Back to products
            </Link>
          </div>

          {product.specifications.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Specifications
              </h2>
              <table className="mt-2 w-full border-collapse text-sm">
                <tbody>
                  {product.specifications.map((spec) => (
                    <tr
                      key={spec.id}
                      className="border-b border-neutral-200 last:border-b-0"
                    >
                      <th
                        scope="row"
                        className="w-1/3 py-2 pr-4 text-left align-top font-medium text-neutral-500"
                      >
                        {spec.specName}
                      </th>
                      <td className="py-2 text-neutral-800">
                        {spec.specValue}
                        {spec.unit ? ` ${spec.unit}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
