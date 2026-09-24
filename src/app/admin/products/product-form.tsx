"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AvailabilityStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { availabilityLabels } from "@/lib/availability";
import { slugify } from "@/lib/utils";
import { productCreateSchema, type ProductCreateInput } from "@/lib/validation";
import { createProduct, updateProduct } from "./actions";

const availabilityOptions: SelectOption[] = (Object.keys(availabilityLabels) as AvailabilityStatus[]).map(
  (value) => ({ value, label: availabilityLabels[value] })
);

interface ProductFormProps {
  categories: SelectOption[];
  productId?: string;
  initial?: ProductCreateInput;
}

function emptyProduct(): ProductCreateInput {
  return {
    sku: "",
    name: "",
    slug: "",
    brand: "",
    modelNumber: "",
    categoryId: "",
    shortDescription: "",
    description: "",
    availabilityStatus: "LOCAL",
    active: true,
    images: [{ imageUrl: "", altText: "", displayOrder: 0 }],
    specifications: [],
  };
}

export function ProductForm({ categories, productId, initial }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

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
        .filter((spec) => spec.specName.trim() !== "" && spec.specValue.trim() !== "")
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
        setSubmitError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {submitError ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
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
          <Input label="SKU" placeholder="e.g. EXT-ABC-050" {...register("sku")} error={errors.sku?.message} />
          <Input label="Brand" placeholder="e.g. FireGuard" {...register("brand")} error={errors.brand?.message} />
          <Input label="Model number" {...register("modelNumber")} error={errors.modelNumber?.message} />
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
          <label className="flex h-full items-center gap-2 text-sm font-medium text-neutral-700">
            <input type="checkbox" className="h-4 w-4 accent-fire" {...register("active")} />
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
            onClick={() => images.append({ imageUrl: "", altText: "", displayOrder: 0 })}
            disabled={images.fields.length >= 4}
          >
            Add image
          </Button>
        </div>
        {images.fields.length === 0 ? (
          <p className="text-sm text-neutral-500">No images. Add one to show a photo on the product page.</p>
        ) : null}
        <div className="space-y-3">
          {images.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-md border border-neutral-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
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
                <Button type="button" variant="ghost" onClick={() => images.remove(index)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Specifications */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Specifications</h2>
          <Button
            type="button"
            variant="secondary"
            onClick={() => specifications.append({ specName: "", specValue: "", unit: "", displayOrder: 0 })}
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
                <Button type="button" variant="ghost" onClick={() => specifications.remove(index)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-neutral-200 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : productId ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}