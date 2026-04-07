/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "ListItem" ADD COLUMN     "priceAtAdd" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Item_barcode_key" ON "Item"("barcode");
