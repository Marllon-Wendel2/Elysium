/*
  Warnings:

  - Added the required column `type` to the `cards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "evolvesFromId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_evolvesFromId_fkey" FOREIGN KEY ("evolvesFromId") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
