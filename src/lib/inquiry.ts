export const INQUIRY_SELECTION_STORAGE_KEY = "productInquirySelection";
export const MAX_SELECTION_LINES = 50;
export const MAX_LINE_QUANTITY = 9999;

// Omits 0/O/1/I because sales reads these references aloud over the phone.
const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const REFERENCE_SUFFIX_LENGTH = 6;

export interface InquirySelectionLine {
  productId: string;
  quantity: number;
}

export function buildInquiryReference(
  date: Date,
  random: () => number = Math.random,
): string {
  const stamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");

  let suffix = "";
  for (let index = 0; index < REFERENCE_SUFFIX_LENGTH; index += 1) {
    const position = Math.floor(random() * REFERENCE_ALPHABET.length);
    suffix += REFERENCE_ALPHABET[position] ?? REFERENCE_ALPHABET[0] ?? "X";
  }

  return `FLQ-${stamp}-${suffix}`;
}

function toQuantity(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LINE_QUANTITY);
}

/**
 * Collapses duplicate IDs into one line by summing quantity. The unique index on
 * (inquiryId, productId) would otherwise turn a repeated ID into a 500.
 */
export function normalizeInquiryLines(
  lines: readonly unknown[] | null | undefined,
): InquirySelectionLine[] {
  if (!Array.isArray(lines)) return [];

  const quantities = new Map<string, number>();
  for (const line of lines) {
    if (typeof line !== "object" || line === null) continue;
    const candidate = line as { productId?: unknown; quantity?: unknown };
    const productId =
      typeof candidate.productId === "string" ? candidate.productId.trim() : "";
    if (!productId) continue;

    const merged =
      (quantities.get(productId) ?? 0) + toQuantity(candidate.quantity);
    quantities.set(productId, Math.min(merged, MAX_LINE_QUANTITY));
  }

  return [...quantities.entries()]
    .slice(0, MAX_SELECTION_LINES)
    .map(([productId, quantity]) => ({ productId, quantity }));
}

export function serializeInquirySelection(
  lines: InquirySelectionLine[],
): string {
  return JSON.stringify(normalizeInquiryLines(lines));
}

/**
 * Tolerates a null, corrupt, or hand-edited payload and always returns usable
 * lines. Also accepts a bare object, because the first iteration of this flow
 * stored a single line rather than an array.
 */
export function parseInquirySelection(
  raw: string | null | undefined,
): InquirySelectionLine[] {
  if (!raw) return [];

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return [];
  }

  if (Array.isArray(decoded)) return normalizeInquiryLines(decoded);
  if (typeof decoded === "object" && decoded !== null) {
    return normalizeInquiryLines([decoded]);
  }
  return [];
}

export function findSelectionLine(
  lines: InquirySelectionLine[],
  productId: string,
): InquirySelectionLine | undefined {
  return lines.find((line) => line.productId === productId);
}
