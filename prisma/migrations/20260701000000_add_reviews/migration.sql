-- Module 4 (Reviews), Phase 2 — new Review model + ReviewStatus enum.
--
-- Review.productId is intentionally NOT nullable and has no ON DELETE
-- override (defaults to RESTRICT): a Review's entire subject is the
-- product it's about, unlike OrderItem.productId (which is nullable/
-- SET NULL because OrderItem only needs productId as a convenience link
-- back to the live product page — everything OrderItem actually needs is
-- already snapshotted on the row). Permanently deleting a Product that
-- still has Reviews is blocked at the application layer
-- (permanentlyDeleteProduct now checks for existing reviews before the
-- database would ever reject it) — see app/admin/products/[id]/actions.ts.
--
-- Review.orderItemId is a plain FK, NOT unique — the duplicate-review
-- rule is @@unique(userId, productId), not per-purchase. See the model's
-- doc comment in schema.prisma.

-- ── New enum type ────────────────────────────────────────────────────────

CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SPAM');

-- ── New table ────────────────────────────────────────────────────────────

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- ── Indexes ──────────────────────────────────────────────────────────────

-- One review per customer per product (see schema.prisma doc comment).
CREATE UNIQUE INDEX "Review_userId_productId_key" ON "Review"("userId", "productId");

-- Storefront product-page query: productId + status filter, createdAt sort.
CREATE INDEX "Review_productId_status_createdAt_idx" ON "Review"("productId", "status", "createdAt");

-- Admin moderation queue without a product filter.
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");

-- Eligibility query's reverse-relation check on OrderItem.
CREATE INDEX "Review_orderItemId_idx" ON "Review"("orderItemId");

-- ── Foreign keys ─────────────────────────────────────────────────────────

ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Review" ADD CONSTRAINT "Review_orderItemId_fkey"
    FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Rating range invariant ───────────────────────────────────────────────
-- Not expressible in schema.prisma (no native range-constraint attribute)
-- — hand-appended per the Module 4 architecture decision. Application
-- validation (Zod, see lib/reviews/validators.ts) provides the
-- user-friendly error; this is the database-level backstop.

ALTER TABLE "Review" ADD CONSTRAINT "Review_rating_range"
    CHECK ("rating" >= 1 AND "rating" <= 5);
