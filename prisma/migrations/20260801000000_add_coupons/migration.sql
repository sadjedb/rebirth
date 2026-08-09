-- Module 5 (Coupons & Discounts), Phase 2 — new Coupon model +
-- CouponDiscountType/CouponStatus enums, plus Order.couponId.
--
-- Order.couponId is nullable with ON DELETE SET NULL (unlike
-- Review.productId's RESTRICT): a coupon is a supporting reference on
-- an order, not the order's subject. discountTotal/total are
-- snapshotted at order-creation time and never recomputed, so a
-- historical order stays fully readable even if its coupon is later
-- archived or (in principle) deleted.
--
-- No CouponRedemption table: Order.couponId + Order's existing
-- userId/email/createdAt already answer every "which order, when, which
-- customer" usage-tracking question (Module 5 Phase 4).

-- ── New enum types ───────────────────────────────────────────────────────

CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
CREATE TYPE "CouponStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- ── New table ────────────────────────────────────────────────────────────

CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "CouponDiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "minOrderValue" INTEGER,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" "CouponStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- ── Indexes ──────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_status_idx" ON "Coupon"("status");
CREATE INDEX "Coupon_createdAt_idx" ON "Coupon"("createdAt");

-- ── Conditional rating-style range constraint ───────────────────────────
-- discountValue's valid range depends on discountType: 1-100 for
-- PERCENTAGE (a percentage), >0 for FIXED_AMOUNT (a whole-dollar
-- amount — see lib/money.ts, this project has not adopted cents
-- precision). Not expressible as a plain range in schema.prisma (no
-- native per-type conditional constraint), so hand-appended here, same
-- approach as Review.rating's CHECK constraint.

ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_discountValue_range"
    CHECK (
        ("discountType" = 'PERCENTAGE' AND "discountValue" BETWEEN 1 AND 100)
        OR ("discountType" = 'FIXED_AMOUNT' AND "discountValue" > 0)
    );

-- ── Order.couponId ───────────────────────────────────────────────────────

ALTER TABLE "Order" ADD COLUMN "couponId" TEXT;

CREATE INDEX "Order_couponId_createdAt_idx" ON "Order"("couponId", "createdAt");

ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
