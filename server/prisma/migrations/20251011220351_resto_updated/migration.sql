/*
  Warnings:

  - You are about to drop the column `createdAt` on the `resto` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `resto` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `resto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `resto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "menu" ALTER COLUMN "veg" DROP DEFAULT;

-- AlterTable
ALTER TABLE "resto" DROP COLUMN "createdAt",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "resto_email_key" ON "resto"("email");
