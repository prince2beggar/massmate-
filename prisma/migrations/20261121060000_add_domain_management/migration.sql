-- CreateEnum
CREATE TYPE "DomainType" AS ENUM ('PLATFORM_SUBDOMAIN', 'CUSTOM_DOMAIN');

-- CreateEnum
CREATE TYPE "DomainVerificationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DnsStatus" AS ENUM ('PENDING_CONFIGURATION', 'CONFIGURED', 'FAILED');

-- CreateEnum
CREATE TYPE "SslStatus" AS ENUM ('NOT_CONFIGURED', 'PENDING', 'ACTIVE', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'REMOVED');

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "domainType" "DomainType" NOT NULL DEFAULT 'PLATFORM_SUBDOMAIN',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "DomainVerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "verificationToken" TEXT,
    "verificationExpiresAt" TIMESTAMP(3),
    "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "verificationFailedReason" TEXT,
    "dnsStatus" "DnsStatus" NOT NULL DEFAULT 'PENDING_CONFIGURATION',
    "sslStatus" "SslStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "status" "DomainStatus" NOT NULL DEFAULT 'ACTIVE',
    "verifiedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domains_domainName_key" ON "domains"("domainName");

-- CreateIndex
CREATE INDEX "domains_tenantId_idx" ON "domains"("tenantId");

-- CreateIndex
CREATE INDEX "domains_status_idx" ON "domains"("status");

-- CreateIndex
CREATE INDEX "domains_verificationStatus_idx" ON "domains"("verificationStatus");

-- CreateIndex
CREATE INDEX "domains_domainType_idx" ON "domains"("domainType");

-- AddForeignKey
ALTER TABLE "domains" ADD CONSTRAINT "domains_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
