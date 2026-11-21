/**
 * MessMate — Tenant Routing & Hostname Resolution Foundation (Task 22)
 *
 * Implements tenant resolution abstraction supporting:
 * - Subdomain-based routing (e.g. prince-mess.messmate.com, greenview.messmate.com)
 * - Localhost subdomain testing (e.g. prince-mess.localhost:3000)
 * - Path / slug-based routing (e.g. /m/[tenantSlug])
 * - Development headers (x-tenant-slug, x-tenant-id)
 *
 * Security Requirements:
 * - Never assume an arbitrary hostname belongs to a tenant without database verification.
 * - Reserved platform subdomains (app, admin, api, etc.) must never be treated as tenant slugs.
 * - Protect against DNS/host header spoofing.
 */

export const RESERVED_PLATFORM_SUBDOMAINS = new Set<string>([
  'www',
  'app',
  'admin',
  'api',
  'auth',
  'superadmin',
  'status',
  'mail',
  'assets',
  'cdn',
  'billing',
  'support',
  'docs',
]);

export interface TenantResolutionRequest {
  hostname?: string | null;
  slug?: string | null;
  tenantId?: string | null;
  headers?: Headers | Record<string, string | string[] | undefined> | null;
}

/**
 * Extracts a tenant slug from an incoming request hostname.
 *
 * Examples:
 * - 'prince-mess.messmate.com' -> 'prince-mess'
 * - 'green-view.messmate.com'  -> 'green-view'
 * - 'prince-mess.localhost:3000' -> 'prince-mess'
 * - 'messmate.com'             -> null (Platform root)
 * - 'app.messmate.com'         -> null (Reserved platform subdomain)
 * - 'localhost:3000'           -> null (Local root)
 */
export function extractTenantSlugFromHost(
  hostname?: string | null,
  baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'messmate.com'
): string | null {
  if (!hostname) return null;

  // Strip port number if present (e.g., 'prince-mess.localhost:3000' -> 'prince-mess.localhost')
  const hostWithoutPort = hostname.split(':')[0]?.trim().toLowerCase();
  if (!hostWithoutPort) return null;

  // Ignore bare IP addresses
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostWithoutPort)) {
    return null;
  }

  // Handle localhost development subdomains (e.g., 'prince-mess.localhost')
  if (hostWithoutPort.endsWith('.localhost')) {
    const sub = hostWithoutPort.replace(/\.localhost$/, '').trim();
    if (sub && !RESERVED_PLATFORM_SUBDOMAINS.has(sub)) {
      return sub;
    }
    return null;
  }

  // Handle production / staging base domain (e.g., 'prince-mess.messmate.com')
  const cleanBase = baseDomain.split(':')[0]?.toLowerCase();
  if (cleanBase && hostWithoutPort.endsWith(`.${cleanBase}`)) {
    const sub = hostWithoutPort.slice(0, hostWithoutPort.length - cleanBase.length - 1).trim();
    if (sub && !RESERVED_PLATFORM_SUBDOMAINS.has(sub) && !sub.includes('.')) {
      return sub;
    }
  }

  return null;
}

/**
 * Resolves a raw tenant identifier (slug or ID) from a flexible request object.
 * Evaluates in priority order:
 * 1. Explicit slug/tenantId passed via route params
 * 2. Headers ('x-tenant-slug', 'x-tenant-id')
 * 3. Subdomain extracted from Host / Hostname header
 */
export function resolveTenantIdentifier(input: TenantResolutionRequest): string | null {
  // 1. Explicit slug or ID from route parameter
  if (input.slug && typeof input.slug === 'string' && input.slug.trim()) {
    return input.slug.trim().toLowerCase();
  }
  if (input.tenantId && typeof input.tenantId === 'string' && input.tenantId.trim()) {
    return input.tenantId.trim();
  }

  // 2. Safe request headers
  if (input.headers) {
    const getHeader = (name: string): string | null => {
      if (typeof (input.headers as Headers)?.get === 'function') {
        return (input.headers as Headers).get(name);
      }
      const val = (input.headers as Record<string, any>)[name] ||
        (input.headers as Record<string, any>)[name.toLowerCase()];
      if (Array.isArray(val)) return val[0] || null;
      return typeof val === 'string' ? val : null;
    };

    const headerSlug = getHeader('x-tenant-slug');
    if (headerSlug && headerSlug.trim()) {
      return headerSlug.trim().toLowerCase();
    }

    const headerId = getHeader('x-tenant-id');
    if (headerId && headerId.trim()) {
      return headerId.trim();
    }

    const hostHeader = getHeader('host') || getHeader('x-forwarded-host');
    if (hostHeader) {
      const fromHost = extractTenantSlugFromHost(hostHeader);
      if (fromHost) return fromHost;
    }
  }

  // 3. Fallback to direct hostname string
  if (input.hostname) {
    const fromHost = extractTenantSlugFromHost(input.hostname);
    if (fromHost) return fromHost;
  }

  return null;
}
