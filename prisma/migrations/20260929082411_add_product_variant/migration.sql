-- CreateEnum
CREATE TYPE "VariantReviewStatus" AS ENUM ('PENDING', 'NEEDS_REVIEW');

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "size" TEXT NOT NULL DEFAULT '',
    "series" TEXT NOT NULL DEFAULT '',
    "unit" TEXT,
    "unitPrice" DECIMAL(12,2),
    "priceHigh" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "reviewStatus" "VariantReviewStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "ambiguityNote" TEXT,
    "sourceSlide" INTEGER,
    "sourceTable" INTEGER,
    "sourceRow" INTEGER,
    "sourceColumn" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_active_idx" ON "ProductVariant"("active");

-- CreateIndex
CREATE INDEX "ProductVariant_reviewStatus_idx" ON "ProductVariant"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_size_series_key" ON "ProductVariant"("productId", "size", "series");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
