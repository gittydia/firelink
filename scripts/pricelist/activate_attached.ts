/**
 * FireLink pricelist product activation (owner decision, Sep 2026).
 *
 * Activates the 16 products that received attached sold-sheet images
 * (scripts/pricelist/attach_pricelist_images.ts) plus ALL their variants.
 *
 * Owner decision: "All 16 products + variants" — activation bypasses the
 * NEEDS_REVIEW review gate (ADR-019) for exactly this set, so their public
 * PDPs show the attached gallery AND the priced variant rows. The locked set
 * is the same 16 SKUs that carry /pricelist-images/ rows; any SKU in the map
 * that has no attached images is a drift error and aborts the run.
 *
 * Scope guard: this script only ever reads/updates the 16 locked products.
 * It touches `active` on Product and ProductVariant; `reviewStatus` and every
 * other field is left untouched.
 *
 * Run:
 *   npx tsx scripts/pricelist/activate_attached.ts          # dry-run (report only)
 *   npx tsx scripts/pricelist/activate_attached.ts --apply  # write the activations
 */
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");

/** The 16 products activated by owner decision (SKU = stable identity). */
const LOCKED_SKUS = [
  "PRC-009DQW62", // Black Iron - Bell Reducer - Welded
  "PRC-005WNPT1", // Butterfly Valve with Tamper Switch
  "PRC-016FDWN6", // Empty Tank
  "PRC-01JDCROG", // FIRE HOSE- PUSH LOCK -CABINET 50 FT.
  "PRC-00LVLYMX", // FIRE PUMP
  "PRC-017E0Z68", // HES Fire Pump Assembly – Electric – Purity Brand China
  "PRC-017KPZ81", // HES Fire Pump Assembly- Diesel Driven – PURITY Brand China
  "PRC-01RH8663", // HES Fire Pump Assembly- Diesel Engine Driven – Streamplus Australia
  "PRC-0005C9G4", // HES Fire Pump Assembly- Electric – Streamplus Brand Australia
  "PRC-01K7IDBK", // HES + Vertical Inline Fire Pump Assembly – Electric – Purity China
  "PRC-01J3LBJM", // Horizontal Split Case Fire Pump – Electric – PURITY CHINA BRAND
  "PRC-009RYZ2O", // Horizontal Split Case Fire Pump – Electric – Streamplus Australia
  "PRC-01YXB5OG", // SINGLE JACKET 2 ½ HYFLO FIRE HOSE 50 FT.
  "PRC-0002DYJH", // STAINLESS TANK
  "PRC-0018OATW", // TRANSFER PUMP
  "PRC-00JD209A", // UL/FM GIACOMINI
];

async function main() {
  const products = await prisma.product.findMany({
    where: { sku: { in: LOCKED_SKUS } },
    include: {
      images: { select: { imageUrl: true } },
      variants: { select: { id: true, active: true } },
    },
  });

  if (products.length !== LOCKED_SKUS.length) {
    const found = new Set(products.map((p) => p.sku));
    const missing = LOCKED_SKUS.filter((s) => !found.has(s));
    throw new Error(`LOCKED_SKUS drift: ${missing.length} SKU(s) not found: ${missing.join(", ")}`);
  }

  const stillInactive: typeof products = [];
  let variantCount = 0;
  let alreadyVariantCount = 0;

  for (const p of products) {
    const attached = p.images.filter((i) => i.imageUrl.startsWith("/pricelist-images/")).length;
    if (attached === 0) {
      throw new Error(`Drift guard: ${p.sku} (${p.name}) has 0 attached /pricelist-images/ rows`);
    }
    const inactiveVariants = p.variants.filter((v) => !v.active).length;
    variantCount += inactiveVariants;
    alreadyVariantCount += p.variants.length - inactiveVariants;
    if (!p.active || inactiveVariants > 0) {
      stillInactive.push(p);
    }
  }

  const toActivate = stillInactive.length;
  console.log(`\nLocked SKUs: ${LOCKED_SKUS.length} | inactive products to activate: ${toActivate}`);
  console.log(`Variants to activate: ${variantCount} (already active: ${alreadyVariantCount})`);

  for (const p of stillInactive) {
    const attached = p.images.filter((i) => i.imageUrl.startsWith("/pricelist-images/")).length;
    const inactiveVariants = p.variants.filter((v) => !v.active).length;
    console.log(
      `  ${p.active ? "OK " : "OFF"} ${p.sku} ${p.name} (active=${p.active}, attached=${attached}, inactiveVariant=${inactiveVariants}/${p.variants.length})`
    );
  }

  if (!APPLY) {
    console.log("\nDry-run only — pass --apply to write the activations.\n");
    return;
  }

  if (toActivate === 0 && variantCount === 0) {
    console.log("Nothing to do — all 16 products and variants are already active.\n");
    return;
  }

  // Build every write as a prepared operation, then run them in one atomic
  // batch. Array-form $transaction never exposes a `tx` client, so an op
  // cannot leak past the transaction boundary (which the earlier interactive
  // callback form hit at runtime: P2028 "old closed transaction").
  const ops: Prisma.PrismaPromise<unknown>[] = [];
  const productHits: string[] = [];
  const variantOpIndexes: number[] = [];

  for (const p of stillInactive) {
    if (!p.active) {
      productHits.push(p.sku);
      ops.push(prisma.product.update({ where: { sku: p.sku }, data: { active: true } }));
    }
    variantOpIndexes.push(ops.length);
    ops.push(
      prisma.productVariant.updateMany({
        where: { productId: p.id, active: false },
        data: { active: true },
      })
    );
  }

  const results = await prisma.$transaction(ops);

  const variantHits = variantOpIndexes.reduce(
    (sum, i) => sum + (results[i] as { count: number }).count,
    0
  );

  console.log(`\nAPPLIED: products activated=${productHits.length}, variants activated=${variantHits}`);
  for (const sku of productHits) console.log(`  + ${sku}`);
  console.log("reviewStatus untouched on all rows.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());