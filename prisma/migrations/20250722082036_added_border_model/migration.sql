-- CreateTable
CREATE TABLE `Border` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `price` DOUBLE NOT NULL DEFAULT 0.0,
    `comparePrice` DOUBLE NOT NULL DEFAULT 0.0,
    `position` INTEGER NULL,
    `info` LONGTEXT NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `customizerId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BorderSwatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customizerId` INTEGER NULL,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `price` JSON NULL,
    `comparePrice` JSON NULL,
    `image` VARCHAR(191) NULL,
    `image64` LONGTEXT NULL,
    `position` INTEGER NULL,
    `info` LONGTEXT NULL,
    `shortInfo` MEDIUMTEXT NULL,
    `activeStatus` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `borderId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Border` ADD CONSTRAINT `Border_customizerId_fkey` FOREIGN KEY (`customizerId`) REFERENCES `Customizer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BorderSwatch` ADD CONSTRAINT `BorderSwatch_borderId_fkey` FOREIGN KEY (`borderId`) REFERENCES `Border`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
