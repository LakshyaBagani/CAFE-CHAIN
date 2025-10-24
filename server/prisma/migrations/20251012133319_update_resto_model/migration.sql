-- AlterTable
ALTER TABLE "menu" ADD COLUMN     "availability" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "resto" ADD COLUMN     "open" BOOLEAN NOT NULL DEFAULT true;
