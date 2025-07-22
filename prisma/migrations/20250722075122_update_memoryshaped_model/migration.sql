/*
  Warnings:

  - You are about to drop the column `lengthRules` on the `MemoryShaped` table. All the data in the column will be lost.
  - You are about to drop the column `widthRules` on the `MemoryShaped` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `MemoryShaped` DROP COLUMN `lengthRules`,
    DROP COLUMN `widthRules`,
    ADD COLUMN `displayRules` JSON NULL;
