-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "inventoryUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "inventoryUpdatedById" TEXT;

-- CreateIndex
CREATE INDEX "Product_inventoryUpdatedById_idx" ON "Product"("inventoryUpdatedById");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_inventoryUpdatedById_fkey" FOREIGN KEY ("inventoryUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
