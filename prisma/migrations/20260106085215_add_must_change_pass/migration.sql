/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `companies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `companies` ADD COLUMN `code` VARCHAR(191) NOT NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `mustChangePassword` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `companies_code_key` ON `companies`(`code`);
