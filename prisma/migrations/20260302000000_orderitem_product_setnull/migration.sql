-- AlterTable: OrderItem.productId becomes nullable with ON DELETE SET NULL.
-- Every field an order actually needs (name/code/price/tone/icon/size/
-- quantity) is already snapshotted on OrderItem — productId was only a
-- convenience link back to the current product page. Without this,
-- permanently deleting a product with any order history would fail
-- outright on the existing NOT NULL foreign key.
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL;
