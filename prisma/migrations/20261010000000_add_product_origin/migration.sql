-- CreateEnum
CREATE TYPE "ProductOrigin" AS ENUM ('LOCAL', 'INTERNATIONAL');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "origin" "ProductOrigin";
