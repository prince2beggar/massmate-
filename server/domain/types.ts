import type {
  DomainType,
  DomainVerificationStatus,
  DnsStatus,
  SslStatus,
  DomainStatus,
} from '@/types/database';

export interface DomainDto {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  domainName: string;
  domainType: DomainType;
  isPrimary: boolean;
  verificationStatus: DomainVerificationStatus;
  verificationToken: string | null;
  verificationTokenMasked: string | null;
  verificationExpiresAt: string | null;
  verificationAttempts: number;
  verificationFailedReason: string | null;
  dnsStatus: DnsStatus;
  sslStatus: SslStatus;
  status: DomainStatus;
  verifiedAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DomainFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  domainType?: DomainType | 'ALL';
  verificationStatus?: DomainVerificationStatus | 'ALL';
  status?: DomainStatus | 'ALL';
  tenantId?: string;
}

export interface DnsVerificationResult {
  verified: boolean;
  domainName: string;
  verificationStatus: DomainVerificationStatus;
  reason?: string;
  dnsEvidence?: string[];
  checkedAt: string;
}

export interface DomainResolutionResult {
  tenantId: string;
  tenantSlug: string;
  domainName: string;
  domainType: DomainType;
  isPrimary: boolean;
  isActive: boolean;
}
