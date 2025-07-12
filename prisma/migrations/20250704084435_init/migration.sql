-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `scope` VARCHAR(191) NULL,
    `expires` DATETIME(3) NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `userId` BIGINT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `accountOwner` BOOLEAN NOT NULL DEFAULT false,
    `locale` VARCHAR(191) NULL,
    `collaborator` BOOLEAN NULL DEFAULT false,
    `emailVerified` BOOLEAN NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customizer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `image64` LONGTEXT NULL,
    `showPremadeImage` BOOLEAN NOT NULL DEFAULT false,
    `position` INTEGER NULL,
    `info` LONGTEXT NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Collection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `price` DOUBLE NOT NULL DEFAULT 0.0,
    `comparePrice` DOUBLE NOT NULL DEFAULT 0.0,
    `position` INTEGER NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `image` VARCHAR(191) NULL,
    `image64` LONGTEXT NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `customizerId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CollectionList` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `collectionId` INTEGER NULL,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `minPrice` DOUBLE NOT NULL DEFAULT 0.0,
    `maxPrice` DOUBLE NOT NULL DEFAULT 0.0,
    `price` DOUBLE NOT NULL DEFAULT 0.0,
    `comparePrice` DOUBLE NOT NULL DEFAULT 0.0,
    `position` INTEGER NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `image` VARCHAR(191) NULL,
    `image64` LONGTEXT NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Swatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `collectionListId` INTEGER NULL,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `price` DOUBLE NOT NULL DEFAULT 0.0,
    `comparePrice` DOUBLE NOT NULL DEFAULT 0.0,
    `image` VARCHAR(191) NULL,
    `image64` LONGTEXT NULL,
    `premadeImage` VARCHAR(191) NULL,
    `showPremadeImage` BOOLEAN NOT NULL DEFAULT false,
    `color` VARCHAR(191) NULL,
    `position` INTEGER NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Trim` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
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
    `customizerId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `alt` VARCHAR(191) NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SinglePanelSize` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `price` DOUBLE NOT NULL DEFAULT 0.0,
    `comparePrice` DOUBLE NOT NULL DEFAULT 0.0,
    `group` JSON NULL,
    `widthGroup` JSON NULL,
    `lengthGroup` JSON NULL,
    `image` VARCHAR(191) NULL,
    `image64` LONGTEXT NULL,
    `position` INTEGER NULL,
    `info` LONGTEXT NULL,
    `widthInfo` LONGTEXT NULL,
    `lengthInfo` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `customizerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PanelType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `singleImage` LONGTEXT NULL,
    `pairImage` LONGTEXT NULL,
    `panelPosition` JSON NULL,
    `isSingle` BOOLEAN NULL DEFAULT true,
    `activeStatus` BOOLEAN NOT NULL DEFAULT false,
    `singlePanelTitle` VARCHAR(191) NULL DEFAULT 'Single Panel',
    `pairPanelTitle` VARCHAR(191) NULL DEFAULT 'Pair Panel',
    `metadata` JSON NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `customizerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiningType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `customizerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiningItems` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `image64` LONGTEXT NULL,
    `title` VARCHAR(191) NULL,
    `sr` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `text` LONGTEXT NULL,
    `activeStatus` BOOLEAN NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `liningTypeId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tieback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `primaryImage` LONGTEXT NULL,
    `secondaryImage` LONGTEXT NULL,
    `primaryPrice` DOUBLE NOT NULL DEFAULT 0.0,
    `secondaryPrice` DOUBLE NOT NULL DEFAULT 0.0,
    `primaryTitle` VARCHAR(191) NULL,
    `secondaryTitle` VARCHAR(191) NULL,
    `isTie` BOOLEAN NULL DEFAULT true,
    `activeStatus` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `customizerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MemoryShaped` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `primaryImage` LONGTEXT NULL,
    `secondaryImage` LONGTEXT NULL,
    `primaryPrice` DOUBLE NOT NULL DEFAULT 0.0,
    `secondaryPrice` DOUBLE NOT NULL DEFAULT 0.0,
    `primaryTitle` VARCHAR(191) NULL,
    `secondaryTitle` VARCHAR(191) NULL,
    `isTie` BOOLEAN NULL DEFAULT true,
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
ALTER TABLE `Collection` ADD CONSTRAINT `Collection_customizerId_fkey` FOREIGN KEY (`customizerId`) REFERENCES `Customizer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CollectionList` ADD CONSTRAINT `CollectionList_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Swatch` ADD CONSTRAINT `Swatch_collectionListId_fkey` FOREIGN KEY (`collectionListId`) REFERENCES `CollectionList`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trim` ADD CONSTRAINT `Trim_customizerId_fkey` FOREIGN KEY (`customizerId`) REFERENCES `Customizer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SinglePanelSize` ADD CONSTRAINT `SinglePanelSize_customizerId_fkey` FOREIGN KEY (`customizerId`) REFERENCES `Customizer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PanelType` ADD CONSTRAINT `PanelType_customizerId_fkey` FOREIGN KEY (`customizerId`) REFERENCES `Customizer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiningType` ADD CONSTRAINT `LiningType_customizerId_fkey` FOREIGN KEY (`customizerId`) REFERENCES `Customizer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiningItems` ADD CONSTRAINT `LiningItems_liningTypeId_fkey` FOREIGN KEY (`liningTypeId`) REFERENCES `LiningType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tieback` ADD CONSTRAINT `Tieback_customizerId_fkey` FOREIGN KEY (`customizerId`) REFERENCES `Customizer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MemoryShaped` ADD CONSTRAINT `MemoryShaped_customizerId_fkey` FOREIGN KEY (`customizerId`) REFERENCES `Customizer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
