/*
  Warnings:

  - Added the required column `deliveryType` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."menu_name_key";

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "deliveryType" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Pending',
ALTER COLUMN "paymentMethod" DROP DEFAULT;
