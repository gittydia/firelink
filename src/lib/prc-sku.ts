/**
 * PRC SKU scheme for product variants, shared with the pricelist import so
 * imported and admin-created variants live in one SKU space (ADR-020).
 *
 * A variant SKU is `PRC-{product8}-{variant8}`: the product fragment hashes
 * the product *name* and the variant fragment hashes `size\0series`, where the
 * NUL separator keeps `size="a", series="b"` distinct from `size="ab",
 * series=""`. Functions mirror `scripts/pricelist/import_pricelist.ts` exactly;
 * the pipeline keeps its own copies because `scripts/` is never imported by
 * `src/`.
 */

/** 32-bit FNV-1a hash. */
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** 8-char base36 uppercase hash fragment (FNV-1a, zero-padded). */
function hash8(input: string): string {
  return fnv1a(input).toString(36).toUpperCase().padStart(8, "0");
}

/**
 * Build a variant SKU for an admin-created variant. Size and series are
 * trimmed before hashing so surrounding whitespace cannot fork the SKU; the
 * same unique constraint that guards imported rows also guards these.
 */
export function buildVariantSku(productName: string, size: string, series: string): string {
  const sizePart = size.trim();
  const seriesPart = series.trim();
  return `PRC-${hash8(productName.trim())}-${hash8(`${sizePart}\u0000${seriesPart}`)}`;
}