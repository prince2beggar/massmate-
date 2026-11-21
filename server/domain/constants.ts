/**
 * MessMate — Domain Management Constants & Specifications
 *
 * Defines canonical platform base domain, reserved subdomains,
 * verification challenge rules, and DNS guidance.
 */

export const PLATFORM_BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'messmate.com';

/**
 * Platform-reserved subdomains that can NEVER be claimed as tenant subdomains.
 */
export const RESERVED_SUBDOMAINS: readonly string[] = [
  'www',
  'app',
  'admin',
  'super-admin',
  'superadmin',
  'api',
  'auth',
  'login',
  'register',
  'portal',
  'dashboard',
  'help',
  'support',
  'docs',
  'billing',
  'status',
  'mail',
  'assets',
  'cdn',
  'static',
  'download',
  'test',
  'staging',
  'dev',
] as const;

export const RESERVED_SUBDOMAIN_SET = new Set<string>(RESERVED_SUBDOMAINS);

/**
 * Custom Domain DNS TXT verification token specifications.
 */
export const VERIFICATION_TXT_PREFIX = 'messmate-verify=';
export const VERIFICATION_CHALLENGE_SUBDOMAIN = '_messmate-challenge';
export const VERIFICATION_TTL_HOURS = 72; // 72-hour challenge expiration
export const MAX_VERIFICATION_ATTEMPTS = 10;

/**
 * Standard DNS Configuration guidance templates
 */
export const DNS_CONFIGURATION_GUIDANCE = {
  cname: {
    recordType: 'CNAME',
    host: 'www (or subdomain)',
    value: 'cname.messmate.com',
    description: 'Point your custom subdomain to the MessMate multi-tenant ingress.',
    statusNotice: 'Provider ingress mapping is managed centrally. Custom CNAME routing takes effect upon DNS propagation.',
  },
  txt: {
    recordType: 'TXT',
    host: '_messmate-challenge',
    valuePrefix: VERIFICATION_TXT_PREFIX,
    description: 'Unique ownership challenge token to verify DNS control.',
  },
};
