/*
  Warnings:

  - You are about to drop the column `logo` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionEnd` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `taxId` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `subscription_plans` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(191)`.
  - You are about to drop the `employees` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `activity_logs` DROP FOREIGN KEY `activity_logs_userId_fkey`;

-- DropForeignKey
ALTER TABLE `employees` DROP FOREIGN KEY `employees_companyId_fkey`;

-- DropIndex
DROP INDEX `activity_logs_userId_fkey` ON `activity_logs`;

-- AlterTable
ALTER TABLE `companies` DROP COLUMN `logo`,
    DROP COLUMN `subscriptionEnd`,
    DROP COLUMN `taxId`,
    DROP COLUMN `website`,
    MODIFY `subscriptionPlanId` INTEGER NOT NULL DEFAULT 1,
    MODIFY `address` TEXT NULL;

-- AlterTable
ALTER TABLE `subscription_plans` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    MODIFY `type` VARCHAR(191) NOT NULL,
    MODIFY `maxEmployees` INTEGER NOT NULL DEFAULT 5,
    MODIFY `durationDays` INTEGER NOT NULL DEFAULT 30,
    MODIFY `features` TEXT NULL,
    MODIFY `price` DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `users` MODIFY `name` VARCHAR(191) NULL,
    MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'USER',
    MODIFY `address` TEXT NULL,
    MODIFY `bio` TEXT NULL;

-- DropTable
DROP TABLE `employees`;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
