# Subdomain & Custom Domain Management System

## Overview

The MessMate Domain Management System governs tenant subdomains and custom apex/sub-domains within the centralized Multi-Tenant SaaS platform. It provides high-assurance hostname resolution, reserved platform protection, cryptographic domain ownership verification via DNS TXT records, subscription entitlement gating, primary domain assignment, and full administrative governance via the Super Admin Panel.

---

## 1. Domain Architecture & Relational Model

### Data Model (`Domain` in `prisma/schema.prisma`)

```prisma
enum DomainType {
  PLATFORM_SUBDOMAIN
  CUSTOM_DOMAIN
}

enum DomainVerificationStatus {
  NOT_REQUIRED
  PENDING
  VERIFIED
  FAILED
  EXPIRED
}

enum DnsStatus {
  PENDING_CONFIGURATION
  CONFIGURED
  FAILED
}

enum SslStatus {
  NOT_CONFIGURED
  PENDING
  ACTIVE
  FAILED
  EXPIRED
}

enum DomainStatus {
  ACTIVE
  PENDING_VERIFICATION
  SUSPENDED
  REMOVED
}

model Domain {
  id                   String                   @id @default(cuid())
  domainName           String                   @unique @map("domain_name")
  tenantId             String                   @map("tenant_id")
  domainType           DomainType               @map("domain_type")
  isPrimary            Boolean                  @default(false) @map("is_primary")
  verificationStatus   DomainVerificationStatus @default(PENDING) @map("verification_status")
  verificationToken    String?                  @map("verification_token")
  verificationMethod   String?                  @default("DNS_TXT") @map("verification_method")
  verificationAttempts Int                      @default(0) @map("verification_attempts")
  lastVerifiedAt       DateTime?                @map("last_verified_at")
  expiresAt            DateTime?                @map("expires_at")
  dnsStatus            DnsStatus                @default(PENDING_CONFIGURATION) @map("dns_status")
  sslStatus            SslStatus                @default(NOT_CONFIGURED) @map("ssl_status")
  status               DomainStatus             @default(PENDING_VERIFICATION) @map("status")
  createdAt            DateTime                 @default(now()) @map("created_at")
  updatedAt            DateTime                 @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([status])
  @@index([verificationStatus])
  @@index([domainType])
  @@map("domains")
}
```

### Relational Invariants
- **Unique Domain Names:** A domain string (`domainName`) is unique across the entire platform.
- **Tenant Cascade:** Deleting a tenant automatically cleans up all associated domain records.
- **Single Primary Domain Invariant:** Each tenant may possess at most one primary domain at any time. Promoting a verified domain to primary atomically demotes all other domains of that tenant.

---

## 2. Platform Subdomain Management

### Format & Governance
- **Base Domain:** Configured as `messmate.com` (customizable via `PLATFORM_BASE_DOMAIN` environment variable).
- **Subdomain Syntax:** Follows `<slug>.messmate.com`.
- **Slug Validation:**
  - Length: 3 to 63 characters.
  - Characters: Lowercase alphanumeric and hyphens (`[a-z0-9]([a-z0-9-]*[a-z0-9])?`).
  - No leading or trailing hyphens; no consecutive hyphens.
- **Automatic Provisioning:** On tenant creation, a canonical platform subdomain is provisioned with `verificationStatus = NOT_REQUIRED`, `isPrimary = true`, and `status = ACTIVE`.

### Reserved Subdomain Protection
To prevent tenant hijacking of critical platform infrastructure and super admin routing, reserved names are hard-blocked at validation:
```typescript
export const RESERVED_SUBDOMAINS = [
  'admin', 'super-admin', 'superadmin', 'api', 'app', 'auth', 'billing', 'cdn',
  'dashboard', 'dev', 'dns', 'docs', 'help', 'login', 'mail', 'metrics',
  'monitor', 'portal', 'root', 'security', 'smtp', 'ssl', 'staging', 'static',
  'status', 'support', 'sysadmin', 'system', 'test', 'vpn', 'webmail', 'www',
] as const;
```
Any attempt to claim a reserved subdomain triggers a `RESERVED_SUBDOMAIN` validation error.

---

## 3. Custom Domain Workflow & Verification

### A. Custom Domain Request
1. **Entitlement Check:** Tenants must have the `custom_domain` entitlement in their subscription plan (`entitlementService.checkPlanEntitlement(tenantId, 'custom_domain')`). Tenants on plans lacking this feature are rejected.
2. **FQDN Syntax Normalization:**
   - Case conversion: lowercased.
   - Whitespace and port stripping (`:80`, `:3000`, `:8080`).
   - Trailing dot stripping (`example.com.` -> `example.com`).
   - RFC 1035 / RFC 1123 label constraints: Max 253 total characters, 1–63 characters per label, no hyphens at boundaries, at least 2 labels (TLD required).
3. **Collision Check:** Rejects requests if the domain is already assigned or matches the platform base domain.
4. **Challenge Generation:**
   - 32-byte hex cryptographic random token (`randomBytes(32).toString('hex')`).
   - Token payload stored in `verificationToken`.
   - Challenge TTL set to **72 hours** (`expiresAt`).
   - Initial state: `verificationStatus = PENDING`, `status = PENDING_VERIFICATION`.

### B. Ownership Verification via DNS TXT Challenge
Tenants configure a TXT record in their DNS provider:
- **Host / Name:** `_messmate-challenge.<custom-domain>` (or apex `@` if preferred)
- **Record Type:** `TXT`
- **Value:** `messmate-verify=<token>`
- **TTL:** 300 seconds (recommended)

#### Verification Engine (`domainService.verifyDomain`):
- Queries DNS TXT records for `_messmate-challenge.<domain>` and `<domain>`.
- Supports dependency injection (`customDnsResolver`) for automated testing and isolated mocking.
- Inspects TXT chunks matching prefix `messmate-verify=`.
- Enforces a maximum of **10 verification attempts** to prevent denial-of-service or brute-force loops.
- Enforces challenge expiration (**72-hour TTL**). Expired challenges transition to `EXPIRED`.
- Upon successful match:
  - `verificationStatus = VERIFIED`
  - `status = ACTIVE`
  - `lastVerifiedAt = new Date()`
- Safe failure handling: Never leaks internal tokens or system exceptions to unauthenticated clients.

---

## 4. Multi-Tenant Ingress & Hostname Resolution

Routing resolution is implemented in `domainService.resolveTenantFromHost(hostname)`:

1. **Host Normalization:** Strips trailing dot, lowercases, and removes port numbers (`req.headers.get('host')`).
2. **Reserved Host Detection:** Returns `{ isPlatform: true }` for bare IP addresses (`localhost`, `127.0.0.1`), root apex domain (`messmate.com`), or reserved platform subdomains (`admin.messmate.com`, `api.messmate.com`).
3. **Subdomain Matching:**
   - Extracts slug from `<slug>.messmate.com`.
   - Looks up active tenant by slug.
   - If tenant is suspended or inactive, routing is denied with appropriate reason.
4. **Custom Domain Matching:**
   - Queries `Domain` table for matching `domainName`.
   - Verifies `status === 'ACTIVE'` and `verificationStatus === 'VERIFIED'`.
   - Verifies associated tenant status (`ACTIVE`).
   - Unverified (`PENDING`, `FAILED`, `EXPIRED`) or suspended domains cannot route traffic to tenants.

---

## 5. Reverse Proxy Ingress & SSL Guidance

### DNS Ingress Setup
Once ownership is verified, tenants direct production traffic using either:
- **CNAME Record (Recommended for subdomains):**
  - Name: `mess.example.com` -> Target: `ingress.messmate.com`
- **A Record (For apex domains where CNAME is unsupported):**
  - Name: `@` -> Value: `<PLATFORM_EDGE_IP>`

### SSL Status Integration
- The database model tracks `sslStatus` (`NOT_CONFIGURED`, `PENDING`, `ACTIVE`, `FAILED`, `EXPIRED`).
- **Production Truthfulness:** Automated SSL certificate provisioning requires an edge reverse proxy (such as Caddy on-demand TLS, Cloudflare for SaaS Custom Hostnames, or an ACME cert-manager).
- In the current application phase, SSL lifecycle states are tracked in database state and visible in the Super Admin UI, ready for webhook integration with edge TLS providers.

---

## 6. Super Admin Domain Management

The central Super Admin Panel provides a dedicated domain governance portal at `/super-admin/domains`:

- **Directory Table:** Displays Domain Name, Tenant Slug, Domain Type badge, Primary status, Verification status badge, DNS status badge, SSL status badge, and Operational status badge.
- **Search & Filters:** Search by domain or tenant slug; filter by Domain Type, Verification Status, and Operational Status.
- **Inspection & DNS Guidance Modal:** Displays step-by-step TXT challenge instructions, expected CNAME target, copyable verification token, attempt counters, and expiration countdown.
- **Manual Verification Trigger:** One-click "Check DNS Now" button to execute immediate verification queries.
- **Primary Domain Switcher:** Safely promotes verified active domains to primary for their respective tenant.
- **Domain Status Management:** Allows authorized administrators to activate, suspend, or remove domains with a **mandatory audit reason** logged to `AuditLog`.
