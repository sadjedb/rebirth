CREATE TYPE "ProductCategory" AS ENUM ('outerwear', 'tops', 'bottoms');
CREATE TYPE "ProductIcon" AS ENUM ('jacket', 'trouser', 'tee');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Product" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "category" "ProductCategory" NOT NULL,
  "icon" "ProductIcon" NOT NULL,
  "tone" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "details" TEXT[] NOT NULL,
  "sizes" TEXT[] NOT NULL,
  "inStock" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Product_category_idx" ON "Product"("category");

CREATE TABLE "Order" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id"),
  "subtotal" INTEGER NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "city" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "notes" TEXT,
  "paymentMethod" TEXT NOT NULL DEFAULT 'cash_on_delivery',
  "status" TEXT NOT NULL DEFAULT 'pending_confirmation',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

CREATE TABLE "OrderItem" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"("id"),
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "tone" TEXT NOT NULL,
  "icon" "ProductIcon" NOT NULL,
  "size" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL
);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

CREATE TABLE "ContactMessage" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
