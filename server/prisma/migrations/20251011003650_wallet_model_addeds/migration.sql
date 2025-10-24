/*
  Warnings:

  - You are about to drop the column `balance` on the `userWallet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."userWallet" DROP CONSTRAINT "userWallet_userId_fkey";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "balance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "userWallet" DROP COLUMN "balance";
