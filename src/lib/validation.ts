import { z } from "zod";
import { AvailabilityStatus } from "@prisma/client";

// ---------- Auth ----------

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------- Availability ----------

export const availabilityStatusSchema = z.nativeEnum(AvailabilityStatus);

// ---------- Product ----------

export const productSpecificationInputSchema = z.object({
  specName: z.string().trim().min(1, "Spec name is required").max(100),
  specValue: z.string().trim().min(1, "Spec value is required").max(200),
  unit: z.string().trim().max(50).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).max(100).default(0),
});

export const productImageInputSchema = z.object({
  imageUrl: z.string().url("Enter a valid image URL"),
  altText: z.string().trim().max(200).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).max(100).default(0),
});

const productBaseSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(50),
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  brand: z.string().trim().min(1, "Brand is required").max(100),
  modelNumber: z.string().trim().max(100).optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  shortDescription: z.string().trim().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  availabilityStatus: availabilityStatusSchema,
  active: z.boolean().default(true),
});

export type ProductBaseInput = z.infer<typeof productBaseSchema>;

export const productCreateSchema = productBaseSchema.extend({
  images: z.array(productImageInputSchema).max(4).default([]),
  specifications: z.array(productSpecificationInputSchema).max(10).default([]),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productBaseSchema
  .partial()
  .extend({
    images: z.array(productImageInputSchema).max(4).optional(),
    specifications: z.array(productSpecificationInputSchema).max(10).optional(),
  });

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// ---------- Inventory ----------

export const inventoryUpdateSchema = z.object({
  availabilityStatus: availabilityStatusSchema,
});

export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;