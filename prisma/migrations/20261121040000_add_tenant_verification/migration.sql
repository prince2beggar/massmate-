-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING_REVIEW', 'ADDITIONAL_INFO_REQUIRED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('TRADE_LICENSE', 'NATIONAL_ID', 'UTILITY_BILL', 'RENTAL_AGREEMENT', 'OTHER');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED';
ALTER TABLE "tenants" ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "tenant_verifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "documentType" "VerificationDocumentType",
    "documentNumber" TEXT,
    "documentFileUrl" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewerUserId" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_verifications_tenantId_key" ON "tenant_verifications"("tenantId");
CREATE INDEX "tenant_verifications_status_idx" ON "tenant_verifications"("status");
CREATE INDEX "tenant_verifications_submittedAt_idx" ON "tenant_verifications"("submittedAt");
CREATE INDEX "tenants_verificationStatus_idx" ON "tenants"("verificationStatus");

-- AddForeignKey
ALTER TABLE "tenant_verifications" ADD CONSTRAINT "tenant_verifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tenant_verifications" ADD CONSTRAINT "tenant_verifications_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
