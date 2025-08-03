-- CreateTable
CREATE TABLE `GeneratedProducts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `handle` VARCHAR(191) NULL,
    `pid` VARCHAR(191) NULL,
    `gid` VARCHAR(191) NULL,
    `price` DOUBLE NULL DEFAULT 0.0,
    `type` VARCHAR(191) NULL DEFAULT 'curtain-app',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `price` DOUBLE NULL DEFAULT 0.0,
    `data` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
