/**
 * FireLink pricelist import — materializes the normalized pricelist contract
 * as catalog rows per ADR-019 (docs/DECISIONS.md).
 *
 * Source contract: pricelist_cleaned/normalized/pricelist_entries.csv (1,207 rows).
 * Output: one Product per distinct product name (137), one ProductVariant per
 * (product, size, series) key (779), 16 categories promoted active.
 *
 * Visibility rule: PENDING rows import active; NEEDS_REVIEW rows import archived
 * (active = false) with provenance intact. Keys with colliding prices import
 * archived with the collision recorded in ambiguityNote; identical-price
 * duplicates dedupe silently. Both are forced NEEDS_REVIEW regardless of the
 * CSV's own review_status (a conflicting price can never ride in on a PENDING row).
 *
 * Additive upsert only: nothing is deleted, nothing is guessed. Re-runnable.
 * Product slug and availabilityStatus are never overwritten by the import.
 *
 * Run: pnpm db:import   (or: npx tsx scripts/pricelist/import_pricelist.ts [path])
 */
import { PrismaClient, type VariantReviewStatus } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

const DEFAULT_CSV = resolve(
  process.cwd(),
  "pricelist_cleaned/normalized/pricelist_entries.csv",
);

/** Raw CSV row, fields addressed by header name. Empty cell => "". */
interface CsvRow {
  sourceSlide: string;
  sourceTable: string;
  sourceRow: string;
  category: string;
  product: string;
  brand: string;
  size: string;
  series: string;
  sourceColumn: string;
  unit: string;
  unitPrice: string;
  priceHigh: string;
  reviewStatus: string;
  ambiguityNote: string;
}

/** One normalized (product, size, series) key with its source rows. */
interface KeyGroup {
  product: string;
  size: string;
  series: string;
  rows: CsvRow[];
}

/** Fully decided write plan for one product. */
interface ProductPlan {
  name: string;
  sku: string;
  category: string;
  brand: string;
  active: boolean;
  // Existing product rows keep their slug; new ones get a fresh allocation.
  existingId: string | null;
  slug: string | null;
  variantKeys: string[];
}

/** Fully decided write plan for one variant key. */
interface VariantPlan {
  sku: string;
  size: string;
  series: string;
  unit: string | null;
  unitPrice: string | null;
  priceHigh: string | null;
  active: boolean;
  reviewStatus: VariantReviewStatus;
  ambiguityNote: string | null;
  sourceSlide: number | null;
  sourceTable: number | null;
  sourceRow: number | null;
  sourceColumn: number | null;
}

/**
 * RFC 4180 parser: quoted fields, doubled-quote escapes, CRLF/LF, trailing
 * empty fields preserved. Returns rows of raw field strings.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** 32-bit FNV-1a hash. */
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** 8-char base36 uppercase hash fragment (FNV-1a, zero-padded). */
function hash8(input: string): string {
  return fnv1a(input).toString(36).toUpperCase().padStart(8, "0");
}

/** Lowercase slug from arbitrary text (SKU-safe, strips symbols). */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Strip commas + whitespace, validate decimal, return canonical string. */
function parsePrice(raw: string, ctx: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const cleaned = trimmed.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error(`Unparseable price in ${ctx}: "${raw}"`);
  }
  return cleaned;
}

/** Parse a non-empty integer provenance cell. Empty => null. */
function parseIntCell(raw: string, ctx: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Unparseable integer in ${ctx}: "${raw}"`);
  }
  return Number(trimmed);
}

function parseReviewStatus(raw: string, ctx: string): VariantReviewStatus {
  const value = raw.trim().toUpperCase();
  if (value === "PENDING") return "PENDING";
  if (value === "NEEDS_REVIEW") return "NEEDS_REVIEW";
  throw new Error(`Unknown review_status in ${ctx}: "${raw}"`);
}

/**
 * Colliding-prices note: each distinct price asc, then every source location
 * where it appears, in file order. The contradiction is recorded, never
 * resolved by preferring one price or averaging them.
 */
function conflictNote(group: KeyGroup): string {
  const byPrice = new Map<string, CsvRow[]>();
  for (const r of group.rows) {
    const ctx = `${group.product} / size="${group.size}" / series="${group.series}"`;
    const price = parsePrice(r.unitPrice, ctx);
    if (price === null) continue;
    const list = byPrice.get(price) ?? [];
    list.push(r);
    byPrice.set(price, list);
  }
  const parts: string[] = [];
  for (const [price, rows] of Array.from(byPrice.entries()).sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  )) {
    for (const r of rows) {
      parts.push(
        `${price} @ slide ${r.sourceSlide}, table ${r.sourceTable}, row ${r.sourceRow} (col ${r.sourceColumn})`,
      );
    }
  }
  return `Colliding prices: ${parts.join("; ")}`;
}

/**
 * Fail loudly if two distinct product names hash to the same product SKU.
 * Variant SKUs are `PRC-{product8}-{variant8}` — strictly longer than the
 * product form `PRC-{product8}` — so the two spaces cannot collide as
 * strings; only duplicate variant SKUs within themselves need checking.
 */
function assertUniqueSkus(plans: VariantPlan[], productOrder: string[]): void {
  const productSkus = new Map<string, string>();
  for (const name of productOrder) {
    const sku = `PRC-${hash8(name)}`;
    const existing = productSkus.get(sku);
    if (existing !== undefined && existing !== name) {
      throw new Error(
        `Product SKU collision: "${existing}" and "${name}" both hash to ${sku}.`,
      );
    }
    productSkus.set(sku, name);
  }
  const variantSkus = new Set<string>();
  for (const plan of plans) {
    if (variantSkus.has(plan.sku)) {
      throw new Error(
        `Duplicate variant SKU ${plan.sku} for size "${plan.size}" / series "${plan.series}".`,
      );
    }
    variantSkus.add(plan.sku);
  }
}

async function main(): Promise<void> {
  const csvPath = process.argv[2] ?? DEFAULT_CSV;
  let source: string;
  try {
    source = readFileSync(csvPath, "utf8");
  } catch (err) {
    throw new Error(
      `Cannot read pricelist CSV at "${csvPath}". Expected it at ` +
        `pricelist_cleaned/normalized/pricelist_entries.csv (see ADR-019).`,
      { cause: err },
    );
  }
  // Defensive: strip UTF-8 BOM if present.
  source = source.replace(/^\uFEFF/, "");

  const parsed = parseCsv(source);
  if (parsed.length < 2) {
    throw new Error(`Pricelist CSV is empty (${parsed.length} rows).`);
  }
  const header = parsed[0];
  const col = (name: string): number => {
    const idx = header.findIndex((h) => h.trim().toLowerCase() === name);
    if (idx === -1) throw new Error(`Missing CSV column "${name}".`);
    return idx;
  };
  const c = {
    sourceSlide: col("source_slide"),
    sourceTable: col("source_table"),
    sourceRow: col("source_row"),
    category: col("category"),
    product: col("product"),
    brand: col("brand"),
    size: col("size"),
    series: col("series"),
    sourceColumn: col("source_column"),
    unit: col("unit"),
    unitPrice: col("unit_price"),
    priceHigh: col("price_high"),
    reviewStatus: col("review_status"),
    ambiguityNote: col("ambiguity_note"),
  };

  const dataRows: CsvRow[] = [];
  for (let i = 1; i < parsed.length; i++) {
    const cells = parsed[i];
    if (cells.every((cell) => cell.trim() === "")) continue; // blank lines
    const pick = (idx: number): string => (idx < cells.length ? cells[idx].trim() : "");
    const row: CsvRow = {
      sourceSlide: pick(c.sourceSlide),
      sourceTable: pick(c.sourceTable),
      sourceRow: pick(c.sourceRow),
      category: pick(c.category),
      product: pick(c.product),
      brand: pick(c.brand),
      size: pick(c.size),
      series: pick(c.series),
      sourceColumn: pick(c.sourceColumn),
      unit: pick(c.unit),
      unitPrice: pick(c.unitPrice),
      priceHigh: pick(c.priceHigh),
      reviewStatus: pick(c.reviewStatus),
      ambiguityNote: pick(c.ambiguityNote),
    };
    if (row.product === "") {
      throw new Error(
        `Row ${i + 1} has an empty product name (category "${row.category}"). ` +
          `ADR-019 keys products by name; an empty name cannot import.`,
      );
    }
    dataRows.push(row);
  }

  // Group by the ADR-019 key identity: (product, size, series), each field
  // trimmed (normalization is strip-only — never lowercased or collapsed).
  const productOrder: string[] = [];
  const categoryOrder: string[] = [];
  const keysInOrder: string[] = [];
  const productCategory = new Map<string, string>();
  const keyGroups = new Map<string, KeyGroup>();

  const keyOf = (product: string, size: string, series: string): string =>
    `${product}\u0000${size}\u0000${series}`;

  for (const row of dataRows) {
    if (!productOrder.includes(row.product)) {
      productOrder.push(row.product);
      productCategory.set(row.product, row.category);
    }
    if (!categoryOrder.includes(row.category)) categoryOrder.push(row.category);

    const key = keyOf(row.product, row.size, row.series);
    let group = keyGroups.get(key);
    if (!group) {
      group = { product: row.product, size: row.size, series: row.series, rows: [] };
      keyGroups.set(key, group);
      keysInOrder.push(key);
    }
    group.rows.push(row);
  }

  // ---- Decide the variant write plans (pure, no DB) ----
  const variantPlans = new Map<string, VariantPlan>();
  let conflictKeys = 0;
  let identicalDupKeys = 0;

  for (const key of keysInOrder) {
    const group = keyGroups.get(key)!;
    const ctx = `${group.product} / size="${group.size}" / series="${group.series}"`;
    const distinctPrices = new Set<string>();
    for (const r of group.rows) {
      // "\u0000NULL" sentinel keeps "price absent" distinct from any price,
      // so a key with a missing price alongside priced rows is a conflict.
      distinctPrices.add(parsePrice(r.unitPrice, ctx) ?? "\u0000NULL");
    }
    const conflicting = distinctPrices.size > 1;
    const duplicated = !conflicting && group.rows.length > 1;
    const first = group.rows[0];

    let reviewStatus: VariantReviewStatus = "NEEDS_REVIEW";
    let active = false;
    let ambiguityNote: string | null = null;

    if (conflicting) {
      conflictKeys++;
      ambiguityNote = conflictNote(group);
    } else if (duplicated) {
      identicalDupKeys++;
      ambiguityNote = first.ambiguityNote === "" ? null : first.ambiguityNote;
    } else {
      reviewStatus = parseReviewStatus(first.reviewStatus, ctx);
      active = reviewStatus === "PENDING";
      ambiguityNote = first.ambiguityNote === "" ? null : first.ambiguityNote;
    }

    const plan: VariantPlan = {
      sku: `PRC-${hash8(group.product)}-${hash8(`${group.size}\u0000${group.series}`)}`,
      size: group.size,
      series: group.series,
      unit: first.unit === "" ? null : first.unit,
      unitPrice: parsePrice(first.unitPrice, ctx),
      priceHigh: parsePrice(first.priceHigh, ctx),
      active,
      reviewStatus,
      ambiguityNote,
      sourceSlide: parseIntCell(first.sourceSlide, ctx),
      sourceTable: parseIntCell(first.sourceTable, ctx),
      sourceRow: parseIntCell(first.sourceRow, ctx),
      sourceColumn: parseIntCell(first.sourceColumn, ctx),
    };
    variantPlans.set(key, plan);
  }

  assertUniqueSkus(Array.from(variantPlans.values()), productOrder);

  // ---- Decide the product write plans (pure, no DB) ----
  // Product brand: first non-empty brand value across that product's rows.
  const productBrand = new Map<string, string>();
  for (const group of keyGroups.values()) {
    if (productBrand.has(group.product)) continue;
    const firstBrand = group.rows.find((r) => r.brand !== "");
    productBrand.set(group.product, firstBrand?.brand ?? "");
  }

  // Product active: at least one decided variant for this product imports active.
  const activeVariantProducts = new Set<string>();
  let activeVariants = 0;
  for (const [key, plan] of variantPlans) {
    if (plan.active) {
      activeVariants++;
      activeVariantProducts.add(keyGroups.get(key)!.product);
    }
  }

  const productPlans = new Map<string, ProductPlan>();
  for (const name of productOrder) {
    const sku = `PRC-${hash8(name)}`;
    const keys = keysInOrder.filter((key) => keyGroups.get(key)!.product === name);
    productPlans.set(name, {
      name,
      sku,
      category: productCategory.get(name)!,
      brand: productBrand.get(name) ?? "",
      active: activeVariantProducts.has(name),
      existingId: null,
      slug: null,
      variantKeys: keys,
    });
  }

  // ---- Baseline + slug allocation (read phase, before the write transaction) ----
  const [existingCategories, existingProducts, existingVariants, baselineVariants] =
    await Promise.all([
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.product.findMany({
        select: { id: true, sku: true, name: true, slug: true },
      }),
      prisma.productVariant.findMany({
        select: { id: true, productId: true, size: true, series: true },
      }),
      prisma.productVariant.count(),
    ]);

  const existingCategoryNames = new Map(
    existingCategories.map((cat) => [cat.name, cat.id]),
  );
  const existingProductsBySku = new Map(existingProducts.map((p) => [p.sku, p]));
  const existingProductsByName = new Map(existingProducts.map((p) => [p.name, p]));

  const takenSlugs = new Set(existingProducts.map((p) => p.slug));
  for (const plan of productPlans.values()) {
    const existing = existingProductsBySku.get(plan.sku) ?? existingProductsByName.get(plan.name);
    if (existing) {
      plan.existingId = existing.id;
      plan.slug = existing.slug; // keep the existing slug; never overwrite
    } else {
      const base = slugify(plan.name) || "item";
      let candidate = base;
      let n = 2;
      while (takenSlugs.has(candidate)) {
        candidate = `${base}-${n}`;
        n++;
      }
      takenSlugs.add(candidate);
      plan.slug = candidate;
    }
  }

  // ---- Execute (write phase) ----
  let createdCategories = 0;
  let updatedCategories = 0;
  let createdProducts = 0;
  let updatedProducts = 0;
  let createdVariants = 0;
  let updatedVariants = 0;

  await prisma.$transaction(
    async (tx) => {
      // 1. Categories — promoted active by the workbook name (ADR-019).
      const categoryIds = new Map<string, string>();
      for (const name of categoryOrder) {
        const existingId = existingCategoryNames.get(name);
        if (existingId) {
          await tx.category.update({ where: { id: existingId }, data: { active: true } });
          updatedCategories++;
          categoryIds.set(name, existingId);
        } else {
          const created = await tx.category.create({ data: { name, active: true } });
          createdCategories++;
          categoryIds.set(name, created.id);
        }
      }

      // 2. Products — one per distinct name, keyed by PRC SKU.
      const productIds = new Map<string, string>();
      for (const plan of productPlans.values()) {
        const categoryId = categoryIds.get(plan.category)!;
        if (plan.existingId) {
          // slug and availabilityStatus are never overwritten by the import.
          await tx.product.update({
            where: { id: plan.existingId },
            data: {
              name: plan.name,
              brand: plan.brand,
              categoryId,
              active: plan.active,
            },
          });
          updatedProducts++;
          productIds.set(plan.name, plan.existingId);
        } else {
          const created = await tx.product.create({
            data: {
              sku: plan.sku,
              name: plan.name,
              slug: plan.slug!,
              brand: plan.brand,
              categoryId,
              active: plan.active,
              availabilityStatus: "INDENT",
            },
          });
          createdProducts++;
          productIds.set(plan.name, created.id);
        }
      }

      // 3. Variants — one per (productId, size, series) key.
      const existingVariantsByKey = new Map(
        existingVariants.map((v) => [`${v.productId}\u0000${v.size}\u0000${v.series}`, v.id]),
      );
      for (const [key, plan] of variantPlans) {
        const productId = productIds.get(keyGroups.get(key)!.product)!;
        const compositeKey = `${productId}\u0000${plan.size}\u0000${plan.series}`;
        const existingId = existingVariantsByKey.get(compositeKey);
        const data = {
          sku: plan.sku,
          unit: plan.unit,
          unitPrice: plan.unitPrice,
          priceHigh: plan.priceHigh,
          active: plan.active,
          reviewStatus: plan.reviewStatus,
          ambiguityNote: plan.ambiguityNote,
          sourceSlide: plan.sourceSlide,
          sourceTable: plan.sourceTable,
          sourceRow: plan.sourceRow,
          sourceColumn: plan.sourceColumn,
        };
        if (existingId) {
          await tx.productVariant.update({ where: { id: existingId }, data });
          updatedVariants++;
        } else {
          await tx.productVariant.create({
            data: {
              ...data,
              productId,
              size: plan.size,
              series: plan.series,
            },
          });
          createdVariants++;
        }
      }
    },
    { timeout: 300_000 },
  );

  // ---- Report (post phase) ----
  const [afterCategories, afterProducts, afterVariants, activeProducts] =
    await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.product.count({ where: { active: true } }),
    ]);

  console.log("=== Pricelist import report (ADR-019) ===");
  console.log(`CSV path: ${csvPath}`);
  console.log(`CSV rows parsed: ${dataRows.length}`);
  console.log(`Products (distinct names): ${productOrder.length}`);
  console.log(`Variant keys (product, size, series): ${keyGroups.size}`);
  console.log(`Categories promoted active: ${categoryOrder.length}`);
  console.log(`Conflict keys (2+ prices): ${conflictKeys}`);
  console.log(`Identical-price dup keys: ${identicalDupKeys}`);
  console.log("--- Write totals ---");
  console.log(
    `Categories: ${createdCategories} created, ${updatedCategories} updated ` +
      `(baseline ${existingCategories.length})`,
  );
  console.log(
    `Products: ${createdProducts} created, ${updatedProducts} updated ` +
      `(baseline ${existingProducts.length})`,
  );
  console.log(
    `Variants: ${createdVariants} created, ${updatedVariants} updated ` +
      `(baseline ${baselineVariants})`,
  );
  console.log("--- Post-import counts ---");
  console.log(`Categories total: ${afterCategories}`);
  console.log(`Products: ${afterProducts} total, ${activeProducts} active`);
  console.log(
    `Variants: ${afterVariants} total, ${activeVariants} active, ` +
      `${afterVariants - activeVariants} archived`,
  );
  console.log("=== Done (additive upsert, nothing deleted) ===");
}

main()
  .catch((err) => {
    console.error("Pricelist import FAILED:");
    console.error(err instanceof Error ? err.stack ?? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());