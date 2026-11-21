import { z } from 'zod';
import { RESERVED_SUBDOMAIN_SET } from './constants';

// RFC 1035 / RFC 1123 compliant FQDN regex
const FQDN_PATTERN = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;

/**
 * Normalizes a domain name to standard lowercase form without trailing dots or ports.
 */
export function normalizeDomainName(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw.trim().toLowerCase();
  clean = clean.replace(/\.$/, '');
  clean = clean.replace(/:\d+$/, '');
  clean = clean.replace(/\.$/, '');
  return clean;
}

/**
 * Checks if a domain name is syntactically valid FQDN (RFC 1035 / RFC 1123).
 */
export function isValidDomainName(domain: string): boolean {
  const normalized = normalizeDomainName(domain);
  if (!normalized || normalized.length > 253) return false;

  // Ignore IP addresses
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(normalized)) return false;

  // Split into constituent labels
  const labels = normalized.split('.');
  if (labels.length < 2) return false;

  for (const label of labels) {
    if (!label || label.length > 63) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
    if (!/^[a-z0-9-]+$/.test(label)) return false;
  }

  // TLD must be alphabetic and at least 2 characters
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,24}$/.test(tld)) return false;

  return true;
}

/**
 * Validates a subdomain slug.
 */
export function isValidSubdomainSlug(slug: string): boolean {
  const trimmed = slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) return false;
  if (trimmed.length < 2 || trimmed.length > 63) return false;
  return !RESERVED_SUBDOMAIN_SET.has(trimmed);
}

export const requestCustomDomainSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  domainName: z
    .string()
    .min(3, 'Domain must be at least 3 characters')
    .max(253, 'Domain cannot exceed 253 characters')
    .refine(isValidDomainName, {
      message: 'Please enter a valid Fully Qualified Domain Name (e.g. mess.example.com)',
    }),
});

export const updateDomainStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'REMOVED']),
  reason: z.string().min(5, 'A clear reason (minimum 5 characters) is required for domain status change'),
});

export const setPrimaryDomainSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
});
