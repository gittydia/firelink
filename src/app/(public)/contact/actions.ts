"use server";

import { Prisma } from "@prisma/client";
import { notifySalesOfInquiry } from "@/lib/email";
import { buildInquiryReference, normalizeInquiryLines } from "@/lib/inquiry";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";
import { prisma } from "@/lib/prisma";
import { contactInquirySchema } from "@/lib/validation";

/**
 * Returns a result instead of throwing, because Next.js redacts error messages
 * that cross the server/client boundary in production builds.
 */
export type InquiryActionResult =
  | { status: "success"; message: string; reference: string }
  | { status: "error"; message: string };

/** Bots fill every field; a real visitor never sees this one. */
const HONEYPOT_FIELD = "website";

const GENERIC_FAILURE = "Could not send your enquiry. Please try again.";

type NewInquiry = {
  id: string;
  reference: string;
};

function failure(message: string): InquiryActionResult {
  return { status: "error", message };
}

function honeypotTripped(input: unknown): boolean {
  if (typeof input !== "object" || input === null) return false;
  const value = (input as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim().length > 0;
}

function validationMessage(error: { issues: { message: string }[] }): string {
  return error.issues.map((issue) => issue.message).join(" ");
}

function isUniqueReferenceViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function submitInquiry(
  input: unknown,
): Promise<InquiryActionResult> {
  const parsed = contactInquirySchema.safeParse(input);
  if (!parsed.success) return failure(validationMessage(parsed.error));
  if (honeypotTripped(input)) return failure(GENERIC_FAILURE);

  const { name, company, email, message } = parsed.data;
  const requested = normalizeInquiryLines(parsed.data.products);

  // Only ids arrive from the browser. Name, SKU and availability are read here
  // so a tampered payload cannot misrepresent the catalog.
  const catalog = requested.length
    ? await prisma.product.findMany({
        where: {
          id: { in: requested.map((line) => line.productId) },
          active: true,
        },
        select: { id: true, name: true, sku: true, availabilityStatus: true },
      })
    : [];
  const byId = new Map(catalog.map((row) => [row.id, row]));

  // A product archived between selection and submission is dropped rather than
  // failing the whole enquiry.
  const selection = requested.flatMap((line) => {
    const product = byId.get(line.productId);
    if (!product) return [];
    return [
      {
        productId: product.id,
        quantity: line.quantity,
        productName: product.name,
        productSku: product.sku,
        availabilityStatus: product.availabilityStatus,
      },
    ];
  });

  const acceptedAt = new Date();
  const insert = () =>
    prisma.inquiry.create({
      data: {
        reference: buildInquiryReference(new Date()),
        name,
        company,
        email,
        message,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        privacyAcceptedAt: acceptedAt,
        notificationStatus: "PENDING",
        products: { create: selection },
      },
      // The reference is read back, never re-derived, so a retry notifies with
      // the value that actually persisted.
      select: { id: true, reference: true },
    });

  let created: NewInquiry;
  try {
    created = await insert();
  } catch (error) {
    if (!isUniqueReferenceViolation(error)) {
      console.error("[inquiry] create failed", error);
      return failure(GENERIC_FAILURE);
    }
    // Six random characters make a collision vanishingly unlikely, but retrying
    // once keeps it from surfacing to the visitor as a failure.
    try {
      created = await insert();
    } catch (retryError) {
      console.error("[inquiry] create failed on reference retry", retryError);
      return failure(GENERIC_FAILURE);
    }
  }

  return finalizeInquiry(created.id, created.reference);
}

/**
 * The enquiry is already durable at this point, so a notification problem is
 * recorded but never shown as a submission failure.
 */
async function finalizeInquiry(
  id: string,
  reference: string,
): Promise<InquiryActionResult> {
  const accepted: InquiryActionResult = {
    status: "success",
    reference,
    message: "Thanks - your enquiry is in. Our sales team will reply shortly.",
  };

  try {
    const inquiry = await prisma.inquiry.findUniqueOrThrow({
      where: { id },
      select: {
        name: true,
        company: true,
        email: true,
        message: true,
        products: {
          select: {
            productName: true,
            productSku: true,
            quantity: true,
            availabilityStatus: true,
          },
        },
      },
    });

    const result = await notifySalesOfInquiry({
      reference,
      name: inquiry.name,
      company: inquiry.company,
      email: inquiry.email,
      message: inquiry.message,
      products: inquiry.products.map((product) => ({
        name: product.productName,
        sku: product.productSku,
        quantity: product.quantity,
        availability: product.availabilityStatus,
      })),
    });

    const status =
      result.status === "sent"
        ? "SENT"
        : result.status === "skipped"
          ? "SKIPPED"
          : "FAILED";

    await prisma.inquiry.update({
      where: { id },
      data: {
        notificationStatus: status,
        notificationError: result.status === "failed" ? result.error : null,
      },
    });
  } catch (error) {
    // Swallowing on purpose: the row is already committed, so rethrowing would
    // invite the visitor to resend and leave sales two copies of one enquiry.
    console.error("[inquiry] notification finalization failed", error);
  }

  return accepted;
}
