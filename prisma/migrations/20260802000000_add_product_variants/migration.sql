-- Module 6 (Inventory), Phase 2 prerequisite — new ProductVariant table
-- only.
--
-- Per the approved Module 6 Phase 1 architecture, ProductVariant is the
-- future authoritative per-color/size stock unit (not Product). This
-- migration adds only the table itself so the read-only Phase 2 Stock
-- Dashboard has something to query against. It deliberately does NOT:
--   - create StockMovement or Warehouse (Phase 3/4),
--   - remove or touch Product.stock / lowStockThreshold / trackInventory
--     / continueSellingOutOfStock / sku / sizes (Phase 3),
--   - add OrderItem.variantId / color (Phase 3),
--   - backfill any rows (Phase 3's legacy migration).
-- The table is created empty and will show zero variants until Phase 3
-- runs its backfill. See the Module 6 architecture notes for the full
-- migration strategy.
--
-- productId uses ON DELETE CASCADE (unlike OrderItem.productId's SET
-- NULL): a variant's entire subject is the product it belongs to, so a
-- variant without a product is meaningless — same reasoning Review.productId
-- already uses for RESTRICT-by-default, just Cascade here since variants
-- are a sub-entity of Product rather than an independent record with its
-- own snapshot. (Phase 3 will add a hard-delete precondition on Product so
-- this cascade can't silently destroy inventory movement history once
-- StockMovement exists — not a concern yet, since StockMovement doesn't
-- exist in this migration.)

-- ── New table ────────────────────────────────────────────────────────────

CREATE TABLE "ProductVariant" (
    "id"                        TEXT NOT NULL,
    "productId"                 TEXT NOT NULL,
    "color"                     TEXT,
    "size"                      TEXT,
    "variantKey"                TEXT NOT NULL,
    "sku"                       TEXT,
    "stock"                     INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold"         INTEGER,
    "trackInventory"            BOOLEAN NOT NULL DEFAULT true,
    "continueSellingOutOfStock" BOOLEAN NOT NULL DEFAULT false,
    "isActive"                  BOOLEAN NOT NULL DEFAULT true,
    "position"                  INTEGER NOT NULL DEFAULT 0,
    "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                 TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- ── Indexes ──────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE UNIQUE INDEX "ProductVariant_productId_variantKey_key" ON "ProductVariant"("productId", "variantKey");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- ── Foreign key ──────────────────────────────────────────────────────────

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
