import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type SeedImage = { url: string; alt: string };
type SeedSpec = { name: string; value: string; unit?: string };

type SeedProduct = {
  sku: string;
  name: string;
  brand: string;
  modelNumber?: string;
  category: string;
  shortDescription: string;
  description: string;
  availability: "LOCAL" | "IN_STOCK" | "INDENT";
  images: SeedImage[];
  specs: SeedSpec[];
};

const categories = [
  { name: "Fire Extinguishers", description: "Portable extinguishing units for Class A/B/C fires." },
  { name: "Fire Hoses & Reels", description: "Hose reels, hoses, and nozzles for water supply points." },
  { name: "Fire Alarms & Detectors", description: "Detection and alarm devices for early warning." },
  { name: "Emergency Lighting", description: "Exit signs and emergency illumination for evacuation." },
  { name: "Fire Blankets", description: "Blankets for smothering small fires and personal protection." },
  { name: "Hydrants & Accessories", description: "Fire hydrants, standpipes, and connection accessories." },
];

const products: SeedProduct[] = [
  {
    sku: "EXT-ABC-050",
    name: "ABC Dry Chemical Fire Extinguisher 5kg",
    brand: "FireGuard",
    modelNumber: "FG-ABC5",
    category: "Fire Extinguishers",
    shortDescription: "5kg multipurpose dry chemical extinguisher for general-use fire points.",
    description:
      "A 5kg dry chemical extinguisher for in-plant and building fire points. Includes a wall-mount bracket. Agent: monoammonium phosphate-based dry chemical.",
    availability: "IN_STOCK",
    images: [{ url: "https://images.unsplash.com/photo-1666518837279-fad286ce75fb?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg", alt: "ABC dry chemical fire extinguisher 5kg" }],
    specs: [
      { name: "Capacity", value: "5", unit: "kg" },
      { name: "Working Pressure", value: "1.2", unit: "MPa" },
      { name: "Dimensions (H x D)", value: "49 x 13.5", unit: "cm" },
    ],
  },
  {
    sku: "EXT-ABC-090",
    name: "ABC Dry Chemical Fire Extinguisher 9kg",
    brand: "FireGuard",
    modelNumber: "FG-ABC9",
    category: "Fire Extinguishers",
    shortDescription: "9kg dry chemical extinguisher for larger hazard areas.",
    description:
      "A 9kg dry chemical extinguisher suited to larger floor areas and workshops. Includes a wall-mount bracket and pressure gauge.",
    availability: "IN_STOCK",
    images: [{ url: "https://images.unsplash.com/photo-1595740041673-6a525c7be994?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg", alt: "ABC dry chemical fire extinguisher 9kg" }],
    specs: [
      { name: "Capacity", value: "9", unit: "kg" },
      { name: "Working Pressure", value: "1.2", unit: "MPa" },
      { name: "Dimensions (H x D)", value: "60 x 15.5", unit: "cm" },
    ],
  },
  {
    sku: "EXT-CO2-050",
    name: "CO2 Fire Extinguisher 5kg",
    brand: "FireGuard",
    modelNumber: "FG-CO25",
    category: "Fire Extinguishers",
    shortDescription: "5kg carbon dioxide extinguisher for electrical and Class B risks.",
    description:
      "A 5kg carbon dioxide extinguisher intended for electrical equipment and flammable liquid hazards. Discharges as gas to leave no residue.",
    availability: "LOCAL",
    images: [{ url: "https://images.unsplash.com/photo-1625958936686-a9343dc35b5b?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg", alt: "CO2 fire extinguisher 5kg" }],
    specs: [
      { name: "Capacity", value: "5", unit: "kg" },
      { name: "Charge Pressure", value: "5.7", unit: "MPa" },
      { name: "Dimensions (H x D)", value: "52 x 13.6", unit: "cm" },
    ],
  },
  {
    sku: "EXT-WTR-090",
    name: "Water Fire Extinguisher 9L",
    brand: "FireGuard",
    modelNumber: "FG-WTR9",
    category: "Fire Extinguishers",
    shortDescription: "9L water extinguisher for Class A combustible solids.",
    description:
      "A 9-litre water extinguisher for Class A fires involving wood, paper, and textiles. Not intended for electrical or flammable liquid fires.",
    availability: "INDENT",
    images: [{ url: "https://images.unsplash.com/photo-1604656329788-e66ad1dfe01b?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg", alt: "Water fire extinguisher 9L" }],
    specs: [
      { name: "Capacity", value: "9", unit: "L" },
      { name: "Working Pressure", value: "1.0", unit: "MPa" },
      { name: "Dimensions (H x D)", value: "55 x 16", unit: "cm" },
    ],
  },
  {
    sku: "HOS-REEL-25",
    name: "Fire Hose Reel 25m",
    brand: "AquaFlow",
    modelNumber: "AF-HR25",
    category: "Fire Hoses & Reels",
    shortDescription: "Wall-mounted 25m semi-rigid hose reel for interior water supply.",
    description:
      "Wall-mounted fire hose reel with 25m of semi-rigid hose and a pressurised water supply connection. Includes nozzle and manual valve.",
    availability: "IN_STOCK",
    images: [{ url: "https://images.unsplash.com/photo-1766152249662-c7774b68bd72?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg", alt: "Fire hose reel 25m" }],
    specs: [
      { name: "Hose Length", value: "25", unit: "m" },
      { name: "Hose Bore", value: "25", unit: "mm" },
      { name: "Flow Rate", value: "30", unit: "L/min" },
    ],
  },
  {
    sku: "HOS-150-15",
    name: "Fire Hose 1.5in x 15m",
    brand: "AquaFlow",
    modelNumber: "AF-H150",
    category: "Fire Hoses & Reels",
    shortDescription: "15m delivery hose with couplings for hydrant connections.",
    description:
      "A 15m double-jacketed delivery hose with 1.5-inch couplings. Used to connect hydrants or standpipes to the fire point.",
    availability: "LOCAL",
    images: [{ url: "https://images.unsplash.com/photo-1700356848746-5f2dd76c237b?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg", alt: "Fire hose 1.5in x 15m" }],
    specs: [
      { name: "Length", value: "15", unit: "m" },
      { name: "Diameter", value: "1.5", unit: "in" },
      { name: "Coupling", value: "Storz 1.5in" },
    ],
  },
  {
    sku: "ALM-DET-SMK",
    name: "Photoelectric Smoke Detector",
    brand: "Sentinel",
    modelNumber: "SN-DET-PE",
    category: "Fire Alarms & Detectors",
    shortDescription: "Photoelectric smoke detector for ceiling mounting.",
    description:
      "A photoelectric smoke detector for ceiling installation in offices and corridors. Operates on a 9V battery and includes a test button.",
    availability: "IN_STOCK",
    images: [{ url: "https://images.unsplash.com/photo-1767672857994-73a27b723506?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg", alt: "Photoelectric smoke detector" }],
    specs: [
      { name: "Sensor", value: "Photoelectric" },
      { name: "Power", value: "9V DC battery" },
      { name: "Coverage", value: "40", unit: "m2" },
    ],
  },
  {
    sku: "ALM-PNL-8Z",
    name: "Fire Alarm Control Panel 8-Zone",
    brand: "Sentinel",
    modelNumber: "SN-PNL8",
    category: "Fire Alarms & Detectors",
    shortDescription: "Conventional 8-zone fire alarm control panel.",
    description:
      "An 8-zone conventional fire alarm control panel with manual test functions and battery backing. Configured for smoke/heat detector circuits plus call points.",
    availability: "INDENT",
    images: [{ url: "https://images.unsplash.com/photo-1697952438910-b22a06a75501?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg", alt: "Fire alarm control panel 8-zone" }],
    specs: [
      { name: "Zones", value: "8" },
      { name: "Input Voltage", value: "220", unit: "V AC" },
      { name: "Backup Battery", value: "12", unit: "V/7Ah" },
    ],
  },
  {
    sku: "EMG-EXIT-LED",
    name: "LED Emergency Exit Sign",
    brand: "LumaSafe",
    modelNumber: "LS-EXIT",
    category: "Emergency Lighting",
    shortDescription: "Self-contained LED exit sign with battery backup.",
    description:
      "A self-contained LED exit sign with internal battery backup for power-out conditions. Green pictogram, ceiling or wall mount.",
    availability: "IN_STOCK",
    images: [{ url: "https://images.unsplash.com/photo-1732812837481-3ff6c4235995?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg", alt: "LED emergency exit sign" }],
    specs: [
      { name: "Light Source", value: "LED" },
      { name: "Backup Time", value: "90", unit: "min" },
      { name: "Input Voltage", value: "220", unit: "V AC" },
    ],
  },
  {
    sku: "BLN-FB-1218",
    name: "Fire Blanket 1.2m x 1.8m",
    brand: "LumaSafe",
    modelNumber: "LS-FB12",
    category: "Fire Blankets",
    shortDescription: "Wall-mounted fire blanket for kitchen and workshop use.",
    description:
      "A 1.2 x 1.8m fire blanket in a quick-release wall case. Suitable for smothering small fires or wrapping around a person during evacuation.",
    availability: "LOCAL",
    images: [{ url: "https://images.unsplash.com/photo-1618607779902-5e491bf83477?q=80&w=600&h=400&fit=crop&auto=format&fm=jpg", alt: "Fire blanket 1.2m x 1.8m" }],
    specs: [
      { name: "Size", value: "1.2 x 1.8", unit: "m" },
      { name: "Material", value: "Fiberglass" },
      { name: "Case", value: "Quick-release wall case" },
    ],
  },
];

async function main() {
  // Users -------------------------------------------------------------
  const users = [
    {
      name: "System Admin",
      email: "admin@firelink.local",
      passwordHash: bcrypt.hashSync("admin123", 10),
      role: "ADMIN" as const,
    },
    {
      name: "Sales Staff",
      email: "sales@firelink.local",
      passwordHash: bcrypt.hashSync("sales123", 10),
      role: "SALES" as const,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash: user.passwordHash, role: user.role, active: true },
      create: user,
    });
  }

  // Categories --------------------------------------------------------
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }

  // Products ----------------------------------------------------------
  for (const p of products) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { name: p.category },
    });

    const base = {
      sku: p.sku,
      name: p.name,
      slug: slugify(p.name),
      brand: p.brand,
      modelNumber: p.modelNumber ?? null,
      categoryId: category.id,
      shortDescription: p.shortDescription,
      description: p.description,
      availabilityStatus: p.availability,
      active: true,
    };

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        brand: p.brand,
        modelNumber: p.modelNumber ?? null,
        categoryId: category.id,
        shortDescription: p.shortDescription,
        description: p.description,
        availabilityStatus: p.availability,
        active: true,
      },
      create: base,
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productSpecification.deleteMany({ where: { productId: product.id } });

    await prisma.productImage.createMany({
      data: p.images.map((img, i) => ({
        productId: product.id,
        imageUrl: img.url,
        altText: img.alt,
        displayOrder: i,
      })),
    });

    await prisma.productSpecification.createMany({
      data: p.specs.map((spec, i) => ({
        productId: product.id,
        specName: spec.name,
        specValue: spec.value,
        unit: spec.unit ?? null,
        displayOrder: i,
      })),
    });
  }

  const [usersCount, categoriesCount, productsCount, imagesCount, specsCount] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.productSpecification.count(),
  ]);

  console.log(
    `Seeded: ${usersCount} users, ${categoriesCount} categories, ${productsCount} products, ${imagesCount} images, ${specsCount} specs.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });