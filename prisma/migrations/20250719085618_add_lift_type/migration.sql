-- AlterTable
ALTER TABLE `SinglePanelSize` ADD COLUMN `lengthFraction` MEDIUMTEXT NULL,
    ADD COLUMN `widthFraction` MEDIUMTEXT NULL;

-- CreateTable
CREATE TABLE `LiftType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `manualImage` LONGTEXT NULL,
    `motorizedImage` LONGTEXT NULL,
    `remoteControlTypes` JSON NULL,
    `manualPrice` DOUBLE NOT NULL DEFAULT 0.0,
    `motorizedPrice` DOUBLE NOT NULL DEFAULT 0.0,
    `isManual` BOOLEAN NULL DEFAULT true,
    `activeStatus` BOOLEAN NOT NULL DEFAULT false,
    `manualPanelTitle` VARCHAR(191) NULL DEFAULT 'Cordless (Manual)',
    `motorizedPanelTitle` VARCHAR(191) NULL DEFAULT 'Motorized (Automated)',
    `metadata` JSON NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `customizerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LiftType` ADD CONSTRAINT `LiftType_customizerId_fkey` FOREIGN KEY (`customizerId`) REFERENCES `Customizer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
