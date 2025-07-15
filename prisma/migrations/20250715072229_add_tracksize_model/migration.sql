-- CreateTable
CREATE TABLE `TrackSize` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `options` JSON NULL,
    `title` VARCHAR(191) NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `customizerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TrackSize` ADD CONSTRAINT `TrackSize_customizerId_fkey` FOREIGN KEY (`customizerId`) REFERENCES `Customizer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
