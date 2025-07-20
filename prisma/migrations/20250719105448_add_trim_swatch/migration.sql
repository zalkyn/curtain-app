/*
  Warnings:

  - You are about to drop the column `image` on the `Trim` table. All the data in the column will be lost.
  - You are about to drop the column `image64` on the `Trim` table. All the data in the column will be lost.
  - You are about to drop the column `shortInfo` on the `Trim` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Trim` DROP COLUMN `image`,
    DROP COLUMN `image64`,
    DROP COLUMN `shortInfo`;

-- CreateTable
CREATE TABLE `TrimSwatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customizerId` INTEGER NULL,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `price` DOUBLE NOT NULL DEFAULT 0.0,
    `comparePrice` DOUBLE NOT NULL DEFAULT 0.0,
    `image` VARCHAR(191) NULL,
    `image64` LONGTEXT NULL,
    `position` INTEGER NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `trimId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TrimSwatch` ADD CONSTRAINT `TrimSwatch_trimId_fkey` FOREIGN KEY (`trimId`) REFERENCES `Trim`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
