-- AlterTable
ALTER TABLE `Border` ADD COLUMN `bottomTitle` VARCHAR(191) NULL DEFAULT 'Bottom',
    ADD COLUMN `leadingEdgeBottomTitle` VARCHAR(191) NULL DEFAULT 'Leading Edge Bottom',
    ADD COLUMN `leadingEdgeTitle` VARCHAR(191) NULL DEFAULT 'Leading Edge';
