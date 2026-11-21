-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'SUPPORT_STAFF', 'FINANCE_STAFF');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "platformRole" "PlatformRole";

-- CreateIndex
CREATE INDEX "users_platformRole_idx" ON "users"("platformRole");
