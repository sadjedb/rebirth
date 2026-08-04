import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { slug: "outerwear", name: "Outerwear" },
  { slug: "tops", name: "Tops" },
  { slug: "bottoms", name: "Bottoms" },
];

const products = [
  {
    slug: "overshirt-waxed-cotton",
    name: "Overshirt — Waxed Cotton",
    code: "MN-014 / BLK",
    price: 420,
    categorySlug: "outerwear",
    icon: "jacket" as const,
    tone: "#DDD8CC",
    description:
      "A boxy overshirt cut from waxed cotton canvas, built to soften and darken with wear. Sits between a shirt and a jacket — worn open over the tee, or layered under the trouser's cargo.",
    details: [
      "12oz waxed cotton canvas, made in Japan",
      "Boxy fit — size down for a closer layer",
      "Corozo buttons, single chest pocket",
      "Re-wax annually to maintain water resistance",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 24,
  },
  {
    slug: "cargo-trouser-ripstop",
    name: "Cargo Trouser — Ripstop",
    code: "MN-021 / STN",
    price: 340,
    categorySlug: "bottoms",
    icon: "trouser" as const,
    tone: "#C9C3B4",
    description:
      "A tapered cargo built from mid-weight ripstop, with utility pockets set flat to the leg so the silhouette stays clean rather than bulky.",
    details: [
      "Mid-weight cotton ripstop",
      "Tapered leg, mid-rise",
      "Flat-set cargo pockets, YKK zip fly",
      "Made in Portugal",
    ],
    sizes: ["28", "30", "32", "34", "36"],
    stock: 18,
  },
  {
    slug: "boxy-tee-heavyweight-jersey",
    name: "Boxy Tee — Heavyweight Jersey",
    code: "MN-006 / WSH",
    price: 145,
    categorySlug: "tops",
    icon: "tee" as const,
    tone: "#E4E0D6",
    description:
      "260gsm loopback jersey, garment-dyed and boxy through the body with a dropped shoulder. The weight a t-shirt needs to hold its own shape.",
    details: [
      "260gsm cotton loopback jersey",
      "Garment-dyed for tonal, non-uniform fade",
      "Dropped shoulder, boxy body",
      "Made in Portugal",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 40,
  },
  {
    slug: "field-jacket-nylon",
    name: "Field Jacket — Coated Nylon",
    code: "MN-018 / KAC",
    price: 480,
    categorySlug: "outerwear",
    icon: "jacket" as const,
    tone: "#B9C0C4",
    description:
      "A four-pocket field jacket in coated nylon with a fully taped seam construction. Cut long enough to layer, narrow enough to stay sharp.",
    details: [
      "Coated nylon shell, taped seams",
      "Regular fit, extended back hem",
      "Storm flap, YKK Aquaguard zip",
      "Made in Japan",
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 12,
  },
  {
    slug: "wide-trouser-wool",
    name: "Wide Trouser — Wool Suiting",
    code: "MN-011 / SUM",
    price: 380,
    categorySlug: "bottoms",
    icon: "trouser" as const,
    tone: "#D6CFC0",
    description:
      "A wide-leg trouser in wool suiting cloth, pressed with a permanent center crease. Formal fabric, off-duty proportion.",
    details: [
      "Wool suiting, Italian mill",
      "Wide leg, single pleat, permanent crease",
      "Side-adjuster waist, no belt loops",
      "Made in Portugal",
    ],
    sizes: ["28", "30", "32", "34", "36"],
    stock: 0,
  },
  {
    slug: "long-sleeve-rib-tee",
    name: "Long Sleeve — Rib Jersey",
    code: "MN-009 / BLK",
    price: 165,
    categorySlug: "tops",
    icon: "tee" as const,
    tone: "#B7B2A6",
    description:
      "A close, ribbed long sleeve made to be the first layer, not the only one. Deep collar, extended cuffs that sit past the wrist.",
    details: [
      "2x1 rib cotton jersey",
      "Close fit, deep crew collar",
      "Extended cuff length",
      "Made in Portugal",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 30,
  },
];

async function main() {
  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    categoryIds.set(category.slug, row.id);
  }

  const now = new Date();
  for (const { categorySlug, ...product } of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product, categoryId: categoryIds.get(categorySlug) },
      create: {
        ...product,
        categoryId: categoryIds.get(categorySlug),
        status: "ACTIVE",
        publishedAt: now,
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
