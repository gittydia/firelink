import { z } from "zod";
import { AvailabilityStatus } from "@prisma/client";
import { MAX_LINE_QUANTITY, MAX_SELECTION_LINES } from "@/lib/inquiry";
import { classifyImageUrl } from "@/lib/product-image";

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
  // z.string().url() accepts any scheme and cannot tell an image from a PDF, so
  // classifyImageUrl adds both checks; unknown extensions stay allowed.
  imageUrl: z
    .string()
    .url("Enter a valid image URL")
    .superRefine((value, ctx) => {
      const result = classifyImageUrl(value);
      if (result.kind === "unsupported") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
      } else if (result.kind === "invalid") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Image URL must start with http:// or https://",
        });
      }
    }),
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
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only",
    ),
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

export const productUpdateSchema = productBaseSchema.partial().extend({
  images: z.array(productImageInputSchema).max(4).optional(),
  specifications: z.array(productSpecificationInputSchema).max(10).optional(),
});

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// ---------- Inventory ----------

export const inventoryUpdateSchema = z.object({
  availabilityStatus: availabilityStatusSchema,
});

export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;

// ---------- Staff ----------

// bcrypt truncates anything past 72 bytes, so reject longer input rather than
// silently accept a password that is not the one the admin typed.
const STAFF_PASSWORD_MAX = 72;

export const staffCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .max(200, "Full name is too long"),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(200, "Email is too long"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(
        STAFF_PASSWORD_MAX,
        `Password must be ${STAFF_PASSWORD_MAX} characters or fewer`,
      ),
    confirmPassword: z.string().min(1, "Confirm the password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

/**
 * Editing details never changes role or status, so neither appears in the input.
 * Status changes go through the explicit `staffStatusSchema` action.
 */
export const staffUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(200, "Full name is too long"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(200, "Email is too long"),
});

export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;

export const staffStatusSchema = z.object({
  id: z.string().min(1, "Missing account"),
  active: z.boolean(),
});

// ---------- Inquiry (public Contact form) ----------

/** A single requested line. Only IDs cross the boundary; names are resolved server-side. */
export const inquiryLineSchema = z.object({
  productId: z.string().trim().min(1, "Missing product"),
  quantity: z.coerce.number().int().min(1).max(MAX_LINE_QUANTITY).default(1),
});

export const contactInquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(200, "Full name is too long"),
  company: z
    .string()
    .trim()
    .min(1, "Company is required")
    .max(200, "Company is too long"),
  // Any deliverable address is accepted. Blocking free-mail domains is a
  // hostile rule for legitimate small contractors and goes stale constantly.
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(200, "Email is too long"),
  message: z
    .string()
    .trim()
    .min(1, "Tell us what you need")
    .max(5000, "Message is too long"),
  // refine() rather than literal() so the failure carries a message the UI can show.
  privacyAccepted: z
    .boolean()
    .refine(
      (accepted) => accepted === true,
      "Accept the Privacy Policy to continue",
    ),
  // Product selection is optional: a general enquiry with no lines is valid.
  products: z.array(inquiryLineSchema).max(MAX_SELECTION_LINES).default([]),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;
export type InquiryLineInput = z.infer<typeof inquiryLineSchema>;
