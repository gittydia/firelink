/**
 * Product images are remote URLs typed into the admin form, never uploaded
 * files. Everything here is pure so the URL rules and the primary-image choice
 * can be unit tested in Node without a DOM or a database.
 */

export const UNSUPPORTED_IMAGE_MESSAGE =
  "That URL does not look like an image. Use a direct link to an image file " +
  "(for example .jpg, .png, .webp, .gif, .avif or .svg).";

/**
 * Formats we are certain are not a still image. We only reject these so a
 * pasted document or archive link fails fast with a clear message. Anything
 * unknown stays allowed, because plenty of real image endpoints have no
 * extension at all and a wrong guess here would reject valid data.
 */
const NON_IMAGE_FORMATS: ReadonlySet<string> = new Set([
  "7z",
  "avi",
  "csv",
  "doc",
  "docx",
  "exe",
  "gz",
  "json",
  "mobi",
  "mov",
  "mp3",
  "mp4",
  "pdf",
  "ppt",
  "pptx",
  "rar",
  "rtf",
  "tar",
  "txt",
  "webm",
  "xls",
  "xlsx",
  "xml",
  "zip",
]);

export type ImageUrlClassification =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "unsupported"; message: string }
  | { kind: "ready"; url: string };

/** Trailing extension of the last path segment, lowercased, if any. */
function pathExtension(url: URL): string | undefined {
  const segment = url.pathname.split("/").pop() ?? "";
  const match = /\.([A-Za-z0-9]+)$/.exec(segment);
  return match ? match[1].toLowerCase() : undefined;
}

/**
 * Some CDNs declare the format in the query string instead of the path, for
 * example ".../photo-123?fm=jpg". Check the common spellings so a known
 * non-image format is still caught.
 */
function queryFormat(url: URL): string | undefined {
  for (const key of ["fm", "format", "ext"]) {
    const value = url.searchParams.get(key);
    if (value) return value.toLowerCase();
  }
  return undefined;
}

export function classifyImageUrl(
  rawUrl: string | null | undefined,
): ImageUrlClassification {
  const trimmed = (rawUrl ?? "").trim();
  if (!trimmed) return { kind: "empty" };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { kind: "invalid" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { kind: "invalid" };
  }

  const declaredFormat = pathExtension(parsed) ?? queryFormat(parsed);
  if (declaredFormat && NON_IMAGE_FORMATS.has(declaredFormat)) {
    return { kind: "unsupported", message: UNSUPPORTED_IMAGE_MESSAGE };
  }

  return { kind: "ready", url: trimmed };
}

export function isUsableImageUrl(rawUrl: string | null | undefined): boolean {
  return classifyImageUrl(rawUrl).kind === "ready";
}

/**
 * Falls back to the product name so a blank alt never renders an unlabelled
 * image, and never resolves to an empty string for a photo that is present.
 */
export function resolveImageAlt(
  altText: string | null | undefined,
  productName: string | null | undefined,
): string {
  const alt = (altText ?? "").trim();
  if (alt) return alt;

  const name = (productName ?? "").trim();
  return name || "Product image";
}

export interface ProductImageLike {
  displayOrder?: number | null;
}

function effectiveOrder(image: ProductImageLike, index: number): number {
  const order = image.displayOrder;
  return typeof order === "number" && Number.isFinite(order) ? order : index;
}

/**
 * Lowest displayOrder wins; ties keep the earliest array position so an
 * unsorted result still resolves deterministically. Does not mutate input.
 */
export function pickPrimaryImage<T extends ProductImageLike>(
  images: readonly T[],
): T | null {
  const first = images[0];
  if (!first) return null;

  let primaryIndex = 0;
  let primaryOrder = effectiveOrder(first, 0);

  for (let index = 1; index < images.length; index += 1) {
    const image = images[index];
    if (!image) continue;

    const order = effectiveOrder(image, index);
    if (order < primaryOrder) {
      primaryOrder = order;
      primaryIndex = index;
    }
  }

  return images[primaryIndex] ?? null;
}
