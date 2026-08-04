-- AlterTable: icon/tone are a fallback placeholder (CSS panel + line icon)
-- for products with no real media, not a hard requirement — admin-created
-- products with real ProductMedia never need them.
ALTER TABLE "Product" ALTER COLUMN "icon" DROP NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "tone" DROP NOT NULL;
