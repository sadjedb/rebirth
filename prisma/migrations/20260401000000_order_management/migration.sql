-- Order Management (Module 2).
--
-- This is a breaking change against the existing flat Order/OrderItem
-- shape, migrated forward rather than dropped/recreated:
--   * Order.status (free text)        -> OrderStatus / PaymentStatus /
--                                          FulfillmentStatus (three
--                                          independent enums)
--   * Order.paymentMethod (free text) -> PaymentMethod enum
--   * flat Order.address* columns     -> OrderAddress child rows
--                                          (type = SHIPPING)
--   * (new) Order.orderNumber          -> sequential, backfilled in
--                                          existing createdAt order
--   * (new) Order.currency, placedBy, discountTotal, taxTotal,
--     shippingTotal, total, updatedAt, paidAt, completedAt, cancelledAt
--   * (new) OrderItem.sku, discount, lineTotal (backfilled as
--     price * quantity — no historical per-line discounts existed, so
--     this is exact, not an approximation)
--
-- Order.id is untouched: it was already a plain String @id with no
-- format guarantee baked into the database (the old "MN-XXXXX" shape was
-- generated in application code, not enforced here), so adding
-- @default(cuid()) only changes how *future* rows get their id — no
-- existing row's primary key needs to change.

-- ── New enum types ──────────────────────────────────────────────────────

CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED');
CREATE TYPE "FulfillmentStatus" AS ENUM ('UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_DELIVERY');
CREATE TYPE "CurrencyCode" AS ENUM ('USD');
CREATE TYPE "PlacedBy" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING');

-- ── Order: new columns ──────────────────────────────────────────────────

ALTER TABLE "Order" ADD COLUMN "placedBy" "PlacedBy" NOT NULL DEFAULT 'CUSTOMER';
ALTER TABLE "Order" ADD COLUMN "currency" "CurrencyCode" NOT NULL DEFAULT 'USD';
ALTER TABLE "Order" ADD COLUMN "discountTotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "taxTotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "shippingTotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "total" INTEGER;
ALTER TABLE "Order" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED';
ALTER TABLE "Order" ADD COLUMN "updatedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- total: no historical discount/tax/shipping breakdown existed, so the
-- exact prior charge is preserved as subtotal with nothing added.
UPDATE "Order" SET "total" = "subtotal";
ALTER TABLE "Order" ALTER COLUMN "total" SET NOT NULL;

-- updatedAt: backfilled to createdAt (never modified since), then Prisma
-- (@updatedAt) takes over stamping it on every future write — no DB-level
-- trigger/default needed going forward.
UPDATE "Order" SET "updatedAt" = "createdAt";
ALTER TABLE "Order" ALTER COLUMN "updatedAt" SET NOT NULL;

-- paidAt / completedAt / cancelledAt are left NULL for existing rows: the
-- old flat schema had no structured record of when (or whether) those
-- lifecycle events happened, and inventing timestamps that don't reflect
-- real history would be worse than leaving them unknown.

-- ── Order: orderNumber (sequential, backfilled) ─────────────────────────

CREATE SEQUENCE "Order_orderNumber_seq";
ALTER TABLE "Order" ADD COLUMN "orderNumber" INTEGER;

-- Assign existing orders numbers in the order they were actually placed.
WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt") AS "rn" FROM "Order"
)
UPDATE "Order" o SET "orderNumber" = numbered."rn"
FROM numbered
WHERE o."id" = numbered."id";

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET DEFAULT nextval('"Order_orderNumber_seq"');
ALTER SEQUENCE "Order_orderNumber_seq" OWNED BY "Order"."orderNumber";
-- Continue the sequence after the highest backfilled number so the next
-- checkout doesn't collide with existing orders.
SELECT setval('"Order_orderNumber_seq"', COALESCE((SELECT MAX("orderNumber") FROM "Order"), 0) + 1, false);
ALTER TABLE "Order" ADD CONSTRAINT "Order_orderNumber_key" UNIQUE ("orderNumber");

-- ── Order: paymentMethod, free text -> enum ─────────────────────────────

ALTER TABLE "Order" ADD COLUMN "paymentMethod_new" "PaymentMethod";
UPDATE "Order" SET "paymentMethod_new" = 'CASH_ON_DELIVERY';
ALTER TABLE "Order" ALTER COLUMN "paymentMethod_new" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "paymentMethod_new" SET DEFAULT 'CASH_ON_DELIVERY';
ALTER TABLE "Order" DROP COLUMN "paymentMethod";
ALTER TABLE "Order" RENAME COLUMN "paymentMethod_new" TO "paymentMethod";

-- ── Order: status, free text -> enum ────────────────────────────────────

ALTER TABLE "Order" ADD COLUMN "status_new" "OrderStatus";
-- Every existing row's status is the old default ("pending_confirmation");
-- nothing in the application ever wrote a different value, so a single
-- mapping to PENDING is exact, not a guess.
UPDATE "Order" SET "status_new" = 'PENDING';
ALTER TABLE "Order" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "status_new" SET DEFAULT 'PENDING';
ALTER TABLE "Order" DROP COLUMN "status";
ALTER TABLE "Order" RENAME COLUMN "status_new" TO "status";

-- ── OrderAddress (extracted from Order's flat address columns) ─────────

CREATE TABLE "OrderAddress" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "type" "AddressType" NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "company" TEXT,
  "phone" TEXT,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "city" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "country" TEXT NOT NULL
);
CREATE UNIQUE INDEX "OrderAddress_orderId_type_key" ON "OrderAddress"("orderId", "type");
CREATE INDEX "OrderAddress_orderId_idx" ON "OrderAddress"("orderId");

-- Every existing order only ever had one (shipping) address. Deterministic
-- id (no UUID-generation extension dependency) since exactly one SHIPPING
-- row is created per order.
INSERT INTO "OrderAddress"
  ("id", "orderId", "type", "firstName", "lastName", "phone", "addressLine1", "addressLine2", "city", "region", "postalCode", "country")
SELECT
  "id" || '_shipping', "id", 'SHIPPING', "firstName", "lastName", "phone", "addressLine1", "addressLine2", "city", "region", "postalCode", "country"
FROM "Order";

ALTER TABLE "Order" DROP COLUMN "addressLine1";
ALTER TABLE "Order" DROP COLUMN "addressLine2";
ALTER TABLE "Order" DROP COLUMN "city";
ALTER TABLE "Order" DROP COLUMN "region";
ALTER TABLE "Order" DROP COLUMN "postalCode";
ALTER TABLE "Order" DROP COLUMN "country";

-- ── Order: new indexes ───────────────────────────────────────────────────

CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_fulfillmentStatus_idx" ON "Order"("fulfillmentStatus");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_email_idx" ON "Order"("email");

-- ── OrderItem: sku, discount, lineTotal ─────────────────────────────────

ALTER TABLE "OrderItem" ADD COLUMN "sku" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "discount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "lineTotal" INTEGER;

-- No historical per-line discounts existed, so price * quantity is the
-- exact original line total, not an approximation.
UPDATE "OrderItem" SET "lineTotal" = "price" * "quantity";
ALTER TABLE "OrderItem" ALTER COLUMN "lineTotal" SET NOT NULL;

CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
