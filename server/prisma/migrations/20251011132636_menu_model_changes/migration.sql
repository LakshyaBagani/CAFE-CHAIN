-- CreateTable
CREATE TABLE "ads" (
    "id" SERIAL NOT NULL,
    "restoId" INTEGER NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "menuId" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_restoId_fkey" FOREIGN KEY ("restoId") REFERENCES "resto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
