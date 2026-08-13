-- Module 6 (Inventory), Phase 3 — the coordinated inventory cutover.
--
-- Order of operations matters: new tables/columns are created first,
-- then the legacy ProductVariant backfill runs (reading Product's
-- still-present stock/sku/etc. columns), and only THEN are those columns
-- dropped from Product. Backfilling after the drop would have nothing
-- left to read.

-- ── New enum ─────────────────────────────────────────────────────────────

CREATE TYPE "StockMovementReason" AS ENUM (
  'ORDER_PLACED',
  'ORDER_CANCELLED',
  'MANUAL_ADJUSTMENT',
  'BULK_ADJUSTMENT',
  'RESTOCK'
);

-- ── New tables: StockMovement, Warehouse ────────────────────────────────

CREATE TABLE "Warehouse" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "code"      TEXT NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");
CREATE INDEX "Warehouse_deletedAt_idx" ON "Warehouse"("deletedAt");

CREATE TABLE "StockMovement" (
    "id"             TEXT NOT NULL,
    "variantId"      TEXT NOT NULL,
    "productId"      TEXT NOT NULL,
    "quantityDelta"  INTEGER NOT NULL,
    "resultingStock" INTEGER NOT NULL,
    "reason"         "StockMovementReason" NOT NULL,
    "note"           TEXT,
    "orderId"        TEXT,
    "warehouseId"    TEXT,
    "actorId"        TEXT,
    "actorEmail"     TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StockMovement_variantId_createdAt_idx" ON "StockMovement"("variantId", "createdAt");
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");
CREATE INDEX "StockMovement_orderId_idx" ON "StockMovement"("orderId");
CREATE INDEX "StockMovement_warehouseId_idx" ON "StockMovement"("warehouseId");
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── OrderItem: variantId + color snapshot ───────────────────────────────

ALTER TABLE "OrderItem"
    ADD COLUMN "variantId" TEXT,
    ADD COLUMN "color"     TEXT;

CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Legacy migration: exactly one default ProductVariant per existing
-- Product, carrying its current stock/sku/threshold/tracking flags
-- unsplit. Product.sizes is NOT interpreted as a stock split — see the
-- Module 6 architecture notes on why that would fabricate data. The
-- variant id is deterministic ('legacyvar_' + the product's own id)
-- rather than randomly generated: this is a plain SQL backfill with no
-- access to Prisma's cuid() generator, and a deterministic id tied to
-- the product it belongs to is simpler and just as safe as a random one
-- for this one-variant-per-product backfill.

INSERT INTO "ProductVariant"
  ("id", "productId", "color", "size", "variantKey", "sku", "stock",
   "lowStockThreshold", "trackInventory", "continueSellingOutOfStock",
   "isActive", "position", "createdAt", "updatedAt")
SELECT
  'legacyvar_' || "id",
  "id",
  NULL,
  NULL,
  '-::-',
  "sku",
  "stock",
  "lowStockThreshold",
  "trackInventory",
  "continueSellingOutOfStock",
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Product";

-- ── Product: remove the five fields ProductVariant now owns ────────────
-- DROP COLUMN also drops any constraint/index that depends solely on
-- that column (e.g. the Product_sku_key unique constraint) — no separate
-- DROP CONSTRAINT needed first.

ALTER TABLE "Product"
    DROP COLUMN "sku",
    DROP COLUMN "stock",
    DROP COLUMN "lowStockThreshold",
    DROP COLUMN "trackInventory",
    DROP COLUMN "continueSellingOutOfStock",
    DROP COLUMN "sizes";
