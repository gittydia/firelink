/**
 * Fire Guard Solutions pricelist image attach — writes the LOCKED slide→product image
 * attachments (image-attachment milestone) as ProductImage rows.
 *
 * The ATTACH table below is the locked decision from the image-matching
 * investigation: matched by provenance (primary label event ↔ slide, exact
 * name equals), never inferred. Slide 3's 'Butterfly Valve with Tamper Switch'
 * is the documented cross-slide exception: its variants live on slides 5/7.
 *
 * Sources of truth:
 *   - pricelist_cleaned/visual_inventory.csv  → `file` per (slide, image_index)
 *   - extracted_images/                        → physical source files
 *   - DB Product rows (matched byte-exact by name)
 *
 * Run:
 *   npx tsx scripts/pricelist/attach_pricelist_images.ts          # dry-run (verify, no writes)
 *   npx tsx scripts/pricelist/attach_pricelist_images.ts --apply  # copy to public/ + insert rows
 */
import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");

const ENTRY_CSV = resolve(process.cwd(), "pricelist_cleaned/visual_inventory.csv");
const SRC_DIR = resolve(process.cwd(), "pricelist_cleaned/extracted_images");
const DEST_DIR = resolve(process.cwd(), "public/pricelist-images");

/** RFC 4180 parser: quoted fields, doubled-quote escapes, CRLF/LF. */
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

/** One locked attachment decision: product (byte-exact DB name), slide, images. */
interface AttachEntry {
  product: string;
  slide: number;
  images: number[];
  /** Slides the product's variants must cover (provenance). */
  expectedSlides: number[];
}

// LOCKED image-attachment table — see docs/DECISIONS.md (image-attachment ADR).
const ATTACH: AttachEntry[] = [
  {
    product: "Butterfly Valve with Tamper Switch",
    slide: 3,
    images: [1],
    // Cross-slide exception: image on slide 3; variants on slide 5 (slide 7
    // holds a separate butterfly product without tamper switch).
    expectedSlides: [5],
  },
  { product: "Empty Tank", slide: 12, images: [1, 2, 4, 5, 6, 7], expectedSlides: [12] },
  { product: "UL/FM GIACOMINI", slide: 16, images: [1, 2, 5, 6], expectedSlides: [16] },
  {
    product: "FIRE HOSE- PUSH LOCK -CABINET 50 FT.",
    slide: 20,
    images: [1, 2],
    expectedSlides: [20],
  },
  {
    product: "SINGLE JACKET 2 ½ HYFLO FIRE HOSE 50 FT.",
    slide: 21,
    images: [1],
    expectedSlides: [21],
  },
  { product: "TRANSFER PUMP", slide: 27, images: [3], expectedSlides: [27] },
  { product: "FIRE PUMP", slide: 37, images: [1, 3, 4], expectedSlides: [37] },
  {
    product: "Horizontal Split Case Fire Pump Assembly – Electric – Streamplus Brand Australia -",
    slide: 40,
    images: [1, 2, 3, 4, 5],
    expectedSlides: [40],
  },
  {
    product: "Horizontal Split Case Fire Pump Assembly – Electric – PURITY CHINA BRAND-",
    slide: 41,
    images: [1, 2, 3, 4, 5],
    expectedSlides: [41],
  },
  {
    product: "Horizontal End Suction Fire Pump Assembly- Electric – Streamplus Brand Australia -",
    slide: 42,
    images: [1, 2, 3, 4, 5, 6],
    expectedSlides: [42],
  },
  {
    product:
      "Horizontal End Suction and Vertical Inline Fire Pump Assembly – Electric– Purity Brand China -",
    slide: 43,
    images: [1, 2, 3, 4],
    expectedSlides: [43],
  },
  {
    product:
      "Horizontal End Suction and Vertical Inline Fire Pump Assembly – Electric– Purity Brand China -",
    slide: 46,
    images: [1, 2, 3, 4],
    // Shared product name with slide 43; all variants observed on slide 43.
    expectedSlides: [43],
  },
  {
    product: "Horizontal End Suction Fire Pump Assembly – Electric – Purity Brand China -",
    slide: 47,
    images: [1, 2, 3, 4, 5, 6],
    expectedSlides: [47],
  },
  {
    product:
      "Horizontal End Suction Fire Pump Assembly- Diesel Engine Driven – Streamplus Brand Australia -",
    slide: 48,
    images: [1, 2, 3, 4, 5, 6],
    expectedSlides: [48],
  },
  {
    product:
      "Horizontal End Suction Fire Pump Assembly- Diesel Driven – PURITY Brand China -",
    slide: 50,
    images: [1, 2, 3, 4, 5, 6],
    expectedSlides: [50],
  },
  {
    product: "Black Iron - Bell Reducer - Welded",
    slide: 57,
    images: [1],
    expectedSlides: [57],
  },
  { product: "STAINLESS TANK", slide: 58, images: [1], expectedSlides: [58] },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

async function main(): Promise<void> {
  let entryCsv: string;
  try {
    entryCsv = readFileSync(ENTRY_CSV, "utf8").replace(/^\uFEFF/, "");
  } catch (err) {
    throw new Error(`Cannot read ${ENTRY_CSV}`, { cause: err });
  }

  const parsed = parseCsv(entryCsv);
  const header = parsed[0].map((h) => h.trim().toLowerCase());
  const col = (name: string): number => {
    const idx = header.findIndex((h) => h === name);
    if (idx === -1) throw new Error(`visual_inventory.csv is missing column "${name}".`);
    return idx;
  };
  const c = {
    slide: col("slide"),
    imageIndex: col("image_index"),
    file: col("file"),
  };

  // (slide:image_index) → file
  const fileByKey = new Map<string, string>();
  for (let i = 1; i < parsed.length; i++) {
    const cells = parsed[i];
    if (cells.every((cell) => cell.trim() === "")) continue;
    const slide = cells[c.slide]?.trim();
    const imageIndex = cells[c.imageIndex]?.trim();
    const file = cells[c.file]?.trim();
    if (!slide || !imageIndex || !file) continue;
    const key = `${slide}:${imageIndex}`;
    if (fileByKey.has(key) && fileByKey.get(key) !== file) {
      throw new Error(`File collision at ${key}: "${fileByKey.get(key)}" vs "${file}".`);
    }
    fileByKey.set(key, file);
  }

  const problems: string[] = [];
  const resolved: { entry: AttachEntry; file: string; dest: string }[] = [];

  // 1. Resolve + verify source files per locked (slide, image_index).
  for (const entry of ATTACH) {
    for (const idx of entry.images) {
      const file = fileByKey.get(`${entry.slide}:${idx}`);
      if (!file) {
        problems.push(
          `slide ${entry.slide} image_${idx.toString().padStart(2, "0")} → no file row in visual_inventory.csv`,
        );
        continue;
      }
      const src = resolve(SRC_DIR, file);
      if (!existsSync(src)) {
        problems.push(`slide ${entry.slide} image_${idx} → missing source file ${file}`);
        continue;
      }
      resolved.push({ entry, file, dest: resolve(DEST_DIR, file) });
    }
  }

  // 2. Load DB state for the 17 locked product names (byte-exact).
  const names = Array.from(new Set(ATTACH.map((e) => e.product)));
  const dbProducts = await prisma.product.findMany({
    where: { name: { in: names } },
    select: {
      id: true,
      name: true,
      sku: true,
      _count: { select: { images: true, variants: true } },
      variants: {
        select: { sourceSlide: true },
        where: { sourceSlide: { not: null } },
      },
    },
  });
  const byName = new Map(dbProducts.map((p) => [p.name, p]));
  const dupNames = dbProducts
    .map((p) => p.name)
    .filter((n, i, arr) => arr.indexOf(n) !== i);
  if (new Set(dupNames).size > 0) {
    problems.push(`Duplicate product names in DB: ${JSON.stringify(Array.from(new Set(dupNames)))}`);
  }
  const missing = names.filter((n) => !byName.has(n));
  if (missing.length > 0) {
    problems.push(`Products not found in DB (byte-exact): ${JSON.stringify(missing, null, 2)}`);
    // Fuzzy candidates to guide a name fix in one round.
    const all = await prisma.product.findMany({
      select: { name: true },
      where: { active: true },
    });
    for (const m of missing) {
      const nm = normalize(m);
      const candidates = all
        .map((p) => p.name)
        .filter((n) => normalize(n).includes(nm) || nm.includes(normalize(n)))
        .slice(0, 5);
      if (candidates.length) {
        console.log(`  fuzzy candidates for "${m}": ${JSON.stringify(candidates)}`);
      }
    }
  }

  // 3. Per-product provenance + zero-image checks.
  for (const name of names) {
    const p = byName.get(name);
    if (!p) continue;
    const entry = ATTACH.find((e) => e.product === name)!;
    const slides = p.variants.map((v) => v.sourceSlide);
    const missingSlides = entry.expectedSlides.filter((s) => !slides.includes(s));
    if (missingSlides.length > 0) {
      problems.push(
        `"${name}" variant sourceSlides ${JSON.stringify(slides)} missing expected ${JSON.stringify(missingSlides)}`,
      );
    }
    if (p._count.images !== 0) {
      problems.push(
        `"${name}" already has ${p._count.images} ProductImage row(s); refusing to attach (idempotency guard).`,
      );
    }
  }

  const totalLocked = ATTACH.reduce((n, e) => n + e.images.length, 0);
  console.log("=== Pricelist image attach plan ===");
  console.log(`Locked attachments: ${totalLocked} images / ${names.length} products`);
  console.log(`Resolved source files: ${resolved.length}`);
  if (!APPLY) {
    console.log("Mode: DRY-RUN (no writes) — pass --apply to copy + insert.");
    for (const r of resolved) {
      console.log(`  slide ${r.entry.slide} → ${r.file} → ${r.dest}`);
    }
  }

  if (problems.length > 0) {
    console.error("\n=== PROBLEMS (refusing to write) ===");
    for (const p of problems) console.error(`- ${p}`);
    process.exitCode = 1;
    return;
  }

  if (resolved.length !== totalLocked) {
    console.error(`Resolved ${resolved.length} of ${totalLocked} locked attachments — aborting.`);
    process.exitCode = 1;
    return;
  }

  if (!APPLY) {
    console.log("\nAll checks passed (dry-run). Re-run with --apply to write.");
    return;
  }

  // ---- Apply: copy files, then insert ProductImage rows (idempotent by guard above). ----
  mkdirSync(DEST_DIR, { recursive: true });
  let copied = 0;
  for (const r of resolved) {
    const src = resolve(SRC_DIR, r.file);
    try {
      copyFileSync(src, r.dest);
      copied++;
    } catch (err) {
      throw new Error(`Failed to copy ${src} → ${r.dest}`, { cause: err });
    }
  }

  // displayOrder: sequential across the locked table in table order.
  const perProduct = new Map<string, { productId: string; rows: { imageUrl: string; altText: string }[] }>();
  let order = 0;
  for (const r of resolved) {
    const p = byName.get(r.entry.product)!;
    let group = perProduct.get(p.id);
    if (!group) {
      group = { productId: p.id, rows: [] };
      perProduct.set(p.id, group);
    }
    group.rows.push({
      imageUrl: `/pricelist-images/${r.file}`,
      altText: p.name,
    });
    order++;
  }

  await prisma.$transaction(
    async (tx) => {
      for (const g of perProduct.values()) {
        await tx.productImage.createMany({
          data: g.rows.map((row, index) => ({
            productId: g.productId,
            imageUrl: row.imageUrl,
            altText: row.altText,
            displayOrder: index,
          })),
        });
      }
    },
    { timeout: 120_000 },
  );

  console.log("\n=== Apply complete ===");
  console.log(`Files copied: ${copied} → ${DEST_DIR}`);
  console.log(`ProductImage rows created: ${order}`);
  console.log('ALERT: admin form validation (src/lib/product-image.ts) requires http(s) URLs;',
    'local /pricelist-images/... rows were inserted via Prisma and will not survive an admin re-save.');
}

main()
  .catch((err) => {
    console.error("Attach FAILED:");
    console.error(err instanceof Error ? err.stack ?? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
