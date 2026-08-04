-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL', 'SUBSCRIPTION');
CREATE TYPE "ProductMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable: Category, Collection, Tag
CREATE TABLE "Category" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

CREATE TABLE "Collection" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX "Collection_deletedAt_idx" ON "Collection"("deletedAt");

CREATE TABLE "Tag" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX "Tag_deletedAt_idx" ON "Tag"("deletedAt");

-- Backfill categories from the old enum's three values
INSERT INTO "Category" (id, name, slug) VALUES
  ('cat_outerwear', 'Outerwear', 'outerwear'),
  ('cat_tops', 'Tops', 'tops'),
  ('cat_bottoms', 'Bottoms', 'bottoms');

-- AlterTable: expand Product
ALTER TABLE "Product"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "type" "ProductType" NOT NULL DEFAULT 'PHYSICAL',
  ADD COLUMN "sku" TEXT,
  ADD COLUMN "compareAtPrice" INTEGER,
  ADD COLUMN "costPrice" INTEGER,
  ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lowStockThreshold" INTEGER,
  ADD COLUMN "trackInventory" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "continueSellingOutOfStock" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "categoryId" TEXT,
  ADD COLUMN "metaTitle" TEXT,
  ADD COLUMN "metaDescription" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "salesCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill categoryId from the old category enum column
UPDATE "Product" SET "categoryId" = 'cat_' || "category"::text;

-- Backfill stock from the old inStock boolean (best-effort placeholder —
-- admin should set real stock counts once this ships)
UPDATE "Product" SET "stock" = CASE WHEN "inStock" THEN 10 ELSE 0 END;

-- Existing products were already live on the storefront — backfill as ACTIVE.
UPDATE "Product" SET "publishedAt" = "createdAt" WHERE "status" = 'ACTIVE';

-- Now that existing rows are backfilled, new inserts should default to
-- DRAFT going forward (matches schema.prisma) — 'ACTIVE' above was only a
-- backfill convenience for the ADD COLUMN step.
ALTER TABLE "Product" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id");
ALTER TABLE "Product" ADD CONSTRAINT "Product_sku_key" UNIQUE ("sku");

ALTER TABLE "Product" DROP COLUMN "category";
ALTER TABLE "Product" DROP COLUMN "inStock";

DROP TYPE "ProductCategory";

CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateTable: implicit many-to-many join tables (Prisma naming convention:
-- alphabetical model order, "_AToB")
CREATE TABLE "_CollectionToProduct" (
  "A" TEXT NOT NULL REFERENCES "Collection"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "_CollectionToProduct_AB_unique" ON "_CollectionToProduct"("A", "B");
CREATE INDEX "_CollectionToProduct_B_index" ON "_CollectionToProduct"("B");

CREATE TABLE "_ProductToTag" (
  "A" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "_ProductToTag_AB_unique" ON "_ProductToTag"("A", "B");
CREATE INDEX "_ProductToTag_B_index" ON "_ProductToTag"("B");

-- CreateTable: ProductMedia
CREATE TABLE "ProductMedia" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "type" "ProductMediaType" NOT NULL DEFAULT 'IMAGE',
  "url" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "providerId" TEXT NOT NULL,
  "altText" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ProductMedia_productId_idx" ON "ProductMedia"("productId");

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT,
  "actorEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
