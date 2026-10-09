"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AvailabilityStatus, VariantReviewStatus } from "@prisma/client";
import { ProductImageFrame } from "@/components/product-image-frame";
import { ActiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { availabilityLabels } from "@/lib/availability";
import { formatPrice } from "@/lib/format";
import { productOriginLabels } from "@/lib/product-origin";
import { isUsableImageUrl, resolveImageAlt } from "@/lib/product-image";
import { slugify } from "@/lib/utils";
import {
  productCreateSchema,
  type ProductCreateInput,
  type ProductFormValues,
} from "@/lib/validation";
import { createProduct, createVariant, toggleVariantActive, updateProduct } from "./actions";

const availabilityOptions: SelectOption[] = (
  Object.keys(availabilityLabels) as AvailabilityStatus[]
).map((value) => ({ value, label: availabilityLabels[value] }));

const productOriginOptions: SelectOption[] = [
  { value: "LOCAL", label: productOriginLabels.LOCAL },
  { value: "INTERNATIONAL", label: productOriginLabels.INTERNATIONAL },
];

export interface ProductVariantFormRow {
  id: string;
  sku: string;
  size: string;
  series: string;
  unit: string | null;
  unitPrice: string | null;
  priceHigh: string | null;
  active: boolean;
  reviewStatus: VariantReviewStatus;
  ambiguityNote: string | null;
  sourceSlide: string | null;
}

interface ProductFormProps {
  categories: SelectOption[];
  productId?: string;
  initial?: ProductFormValues;
  variants?: ProductVariantFormRow[];
}

function emptyProduct(): ProductFormValues {
  return {
    sku: "",
    name: "",
    slug: "",
    brand: "",
    modelNumber: "",
    color: "",
    categoryId: "",
    shortDescription: "",
    description: "",
    availabilityStatus: "LOCAL",
    active: true,
    images: [{ imageUrl: "", altText: "", displayOrder: 0 }],
    specifications: [],
  };
}

function ImageFieldPreview({
  imageUrl,
  altText,
  productName,
  isSaved,
}: {
  imageUrl: string;
  altText: string;
  productName: string;
  isSaved: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const canPreview = isUsableImageUrl(imageUrl);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={!canPreview}
        aria-label={
          canPreview
            ? "Enlarge image preview"
            : "Enter a valid image URL to preview it"
        }
        className="rounded-md disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fire"
      >
        <ProductImageFrame
          src={imageUrl}
          alt=""
          emptyLabel="No image"
          errorLabel="Broken"
          className="size-20"
        />
      </button>
      {canPreview ? (
        <span
          className={
            isSaved
              ? "text-[10px] text-neutral-500"
              : "text-[10px] text-amber-600"
          }
        >
          {isSaved ? "Saved" : "Unsaved"}
        </span>
      ) : null}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={productName || "Image preview"}
        description={imageUrl}
        closeLabel="Close image preview"
      >
        <ProductImageFrame
          src={imageUrl}
          alt={resolveImageAlt(altText, productName)}
          size="preview"
          errorLabel="This image could not be loaded. Check the URL, then try again."
        />
      </Dialog>
    </div>
  );
}

export function ProductForm({
  categories,
  productId,
  initial,
  variants,
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [variantPendingId, setVariantPendingId] = useState<string | null>(null);
  const [variantError, setVariantError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ProductCreateInput>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: initial ?? emptyProduct(),
  });

  const images = useFieldArray({ control, name: "images" });
  const specifications = useFieldArray({ control, name: "specifications" });

  // Auto-fill the slug from the name until the user customises it.
  const name = useWatch({ control, name: "name" }) ?? "";
  const prevName = useRef(name);
  useEffect(() => {
    if (name === prevName.current) return;
    const currentSlug = getValues("slug") ?? "";
    const autoSlug = slugify(name);
    if (currentSlug === "" || currentSlug === slugify(prevName.current)) {
      setValue("slug", autoSlug, { shouldValidate: false });
    }
    prevName.current = name;
  }, [name, getValues, setValue]);

  const watchedImages = useWatch({ control, name: "images" }) ?? [];
  const savedImageUrls = useMemo(
    () =>
      new Set(
        (initial?.images ?? [])
          .map((image) => image.imageUrl.trim())
          .filter((url) => url !== ""),
      ),
    [initial],
  );

  function onSubmit(values: ProductCreateInput) {
    setSubmitError(null);

    const payload: ProductCreateInput = {
      ...values,
      images: values.images
        .filter((image) => image.imageUrl.trim() !== "")
        .map((image, index) => ({
          imageUrl: image.imageUrl.trim(),
          altText: image.altText?.trim() || null,
          displayOrder: index,
        })),
      specifications: values.specifications
        .filter(
          (spec) => spec.specName.trim() !== "" && spec.specValue.trim() !== "",
        )
        .map((spec, index) => ({
          specName: spec.specName.trim(),
          specValue: spec.specValue.trim(),
          unit: spec.unit?.trim() || null,
          displayOrder: index,
        })),
    };

    startTransition(async () => {
      try {
        if (productId) {
          await updateProduct(productId, payload);
        } else {
          await createProduct(payload);
        }
        router.refresh();
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
      }
    });
  }

  function handleToggleVariant(variant: ProductVariantFormRow) {
    setVariantError(null);
    setVariantPendingId(variant.id);
    startTransition(async () => {
      try {
        await toggleVariantActive(variant.id);
        router.refresh();
      } catch (error) {
        setVariantError(
          error instanceof Error
            ? error.message
            : "Could not update the variant.",
        );
      } finally {
        setVariantPendingId(null);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {submitError ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {submitError}
        </p>
      ) : null}

      {/* Core details */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            placeholder="e.g. ABC Dry Chemical Fire Extinguisher 5kg"
            {...register("name")}
            error={errors.name?.message}
          />
          <Input
            label="Slug"
            placeholder="Auto-filled from name; lowercase, hyphens"
            {...register("slug")}
            error={errors.slug?.message}
          />
          <Input
            label="SKU"
            placeholder="e.g. EXT-ABC-050"
            {...register("sku")}
            error={errors.sku?.message}
          />
          <Input
            label="Brand"
            placeholder="e.g. FireGuard"
            {...register("brand")}
            error={errors.brand?.message}
          />
          <Input
            label="Model number"
            {...register("modelNumber")}
            error={errors.modelNumber?.message}
          />
          <Input
            label="Color"
            {...register("color")}
            error={errors.color?.message}
          />
          <Select
            label="Category"
            placeholder="Select a category"
            options={categories}
            {...register("categoryId")}
            error={errors.categoryId?.message}
          />
        </div>
        <div className="grid gap-4">
          <Textarea
            label="Short description"
            rows={2}
            placeholder="One-line summary shown in the catalog."
            {...register("shortDescription")}
            error={errors.shortDescription?.message}
          />
          <Textarea
            label="Full description"
            rows={4}
            placeholder="Detailed product description."
            {...register("description")}
            error={errors.description?.message}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Availability"
            options={availabilityOptions}
            {...register("availabilityStatus")}
            error={errors.availabilityStatus?.message}
          />
          <Select
            label="Product origin"
            placeholder="Select product origin"
            options={productOriginOptions}
            {...register("origin")}
            error={errors.origin?.message}
          />
          <label className="flex h-full items-center gap-2 text-sm font-medium text-neutral-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-fire"
              {...register("active")}
            />
            Active (visible on the public site)
          </label>
        </div>
      </section>

      {/* Images */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Images</h2>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              images.append({ imageUrl: "", altText: "", displayOrder: 0 })
            }
            disabled={images.fields.length >= 4}
          >
            Add image
          </Button>
        </div>
        {images.fields.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No images. Add one to show a photo on the product page.
          </p>
        ) : null}
        <div className="space-y-3">
          {images.fields.map((field, index) => {
            const fieldImage = watchedImages[index];
            const imageUrl = fieldImage?.imageUrl ?? "";
            const altText = fieldImage?.altText ?? "";

            return (
              <div
                key={field.id}
                className="grid gap-3 rounded-md border border-neutral-200 bg-white p-3 sm:grid-cols-[auto_1fr_1fr_auto]"
              >
                <ImageFieldPreview
                  imageUrl={imageUrl}
                  altText={altText}
                  productName={name}
                  isSaved={savedImageUrls.has(imageUrl.trim())}
                />
                <Input
                  label={`Image URL ${index + 1}`}
                  placeholder="https://…"
                  {...register(`images.${index}.imageUrl` as const)}
                  error={errors.images?.[index]?.imageUrl?.message}
                />
                <Input
                  label="Alt text"
                  placeholder="Describe the image"
                  {...register(`images.${index}.altText` as const)}
                  error={errors.images?.[index]?.altText?.message}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => images.remove(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Specifications */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Specifications
          </h2>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              specifications.append({
                specName: "",
                specValue: "",
                unit: "",
                displayOrder: 0,
              })
            }
            disabled={specifications.fields.length >= 10}
          >
            Add specification
          </Button>
        </div>
        <div className="space-y-3">
          {specifications.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-md border border-neutral-200 bg-white p-3 sm:grid-cols-[1fr_1fr_120px_auto]"
            >
              <Input
                label="Name"
                placeholder="e.g. Capacity"
                {...register(`specifications.${index}.specName` as const)}
                error={errors.specifications?.[index]?.specName?.message}
              />
              <Input
                label="Value"
                placeholder="e.g. 5"
                {...register(`specifications.${index}.specValue` as const)}
                error={errors.specifications?.[index]?.specValue?.message}
              />
              <Input
                label="Unit"
                placeholder="e.g. kg"
                {...register(`specifications.${index}.unit` as const)}
                error={errors.specifications?.[index]?.unit?.message}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => specifications.remove(index)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Variants */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Variants</h2>
        {productId ? (
          <>
            <VariantAddForm productId={productId} />
            {variants && variants.length > 0 ? (
              <div className="space-y-3">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="grid items-center gap-3 rounded-md border border-neutral-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {variant.size || "—"}
                        {variant.series ? ` · ${variant.series}` : ""}
                      </p>
                      <p className="text-xs text-neutral-500">{variant.sku}</p>
                    </div>
                    <p className="text-sm text-neutral-700">
                      {variant.unitPrice
                        ? formatPrice(variant.unitPrice)
                        : "—"}
                      {variant.unit ? ` / ${variant.unit}` : ""}
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <ActiveBadge active={variant.active} />
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={variantPendingId === variant.id}
                        onClick={() => handleToggleVariant(variant)}
                      >
                        {variant.active ? "Archive" : "Restore"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No variants yet.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-neutral-500">
            Save the product first, then add variants here.
          </p>
        )}
        {variantError ? (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {variantError}
          </p>
        ) : null}
      </section>

      <div className="flex items-center gap-3 border-t border-neutral-200 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving…"
            : productId
              ? "Save changes"
              : "Create product"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function VariantAddForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [series, setSeries] = useState("");
  const [unit, setUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  function onSubmitAdd() {
    setError(null);
    startTransition(async () => {
      try {
        await createVariant(productId, {
          size,
          series,
          unit: unit === "" ? null : unit,
          unitPrice,
          priceHigh: "",
          active: true,
        });
        setSize("");
        setSeries("");
        setUnit("");
        setUnitPrice("");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not add the variant.",
        );
      }
    });
  }

  return (
    <div className="space-y-3 rounded-md border border-neutral-200 bg-white p-3">
      <p className="text-sm font-medium text-neutral-700">Add variant</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <Input
          label="Size"
          placeholder="e.g. 5kg"
          value={size}
          onChange={(event) => setSize(event.target.value)}
        />
        <Input
          label="Series"
          placeholder="e.g. ABC"
          value={series}
          onChange={(event) => setSeries(event.target.value)}
        />
        <Input
          label="Unit"
          placeholder="e.g. pc"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
        />
        <Input
          label="Price"
          placeholder="₱ 0.00"
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
        />
        <div className="flex items-end">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={onSubmitAdd}
          >
            {isPending ? "Adding…" : "Add variant"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-neutral-500">
        Enter a size, series, or both. Prices are in PHP with up to 2 decimal
        places.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
