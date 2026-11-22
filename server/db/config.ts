/**
 * Pure, server-side database configuration & Neon PostgreSQL URL validation helpers.
 *
 * Intentionally kept side-effect-free (no `server-only` import or network calls)
 * so it can be deterministically unit-tested via `node:test`. Runtime database
 * access MUST go through `server/db/prisma.ts` which enforces `import 'server-only'`.
 */

export type DatabaseConfigIssueCode =
  | 'MISSING_DATABASE_URL'
  | 'PLACEHOLDER_DATABASE_URL'
  | 'INVALID_DATABASE_URL'
  | 'INSECURE_SSL_MODE'
  | 'MISSING_DIRECT_URL'
  | 'PLACEHOLDER_DIRECT_URL'
  | 'INVALID_DIRECT_URL'
  | 'POOLED_DIRECT_URL_WARNING'
  | 'UNPOOLED_DATABASE_URL_WARNING';

export interface DatabaseConfigIssue {
  code: DatabaseConfigIssueCode;
  severity: 'error' | 'warning';
  message: string;
}

export interface ParsedDatabaseTarget {
  host: string;
  port: number;
  database: string;
  sslMode: string | null;
  isNeonHost: boolean;
  isPooledHost: boolean;
  redactedUrl: string;
  protocol?: string;
}

export interface DatabaseConfigStatus {
  configured: boolean;
  runtimeUrl: string | null;
  directUrl: string | null;
  runtimeTarget: ParsedDatabaseTarget | null;
  directTarget: ParsedDatabaseTarget | null;
  issues: DatabaseConfigIssue[];
}

const PLACEHOLDER_TOKENS = [
  'YOUR_NEON_DATABASE_URL',
  'YOUR_NEON_DIRECT_DATABASE_URL',
  'YOUR_DATABASE_URL',
  'CHANGEME',
  'REPLACE_ME',
];

const POSTGRES_PROTOCOLS = new Set(['postgresql:', 'postgres:']);
const MYSQL_PROTOCOLS = new Set(['mysql:', 'mysql2:', 'mariadb:']);

export function isPlaceholderConnectionString(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const upper = trimmed.toUpperCase();
  return PLACEHOLDER_TOKENS.some((token) => upper.includes(token));
}

export function redactDatabaseUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.password) {
      parsed.password = '***';
    }
    if (parsed.username) {
      parsed.username =
        parsed.username.length <= 2
          ? '***'
          : `${parsed.username.slice(0, 2)}***`;
    }
    return parsed.toString();
  } catch {
    return '[unparseable-database-url]';
  }
}

export function parsePostgresUrl(rawUrl: string): ParsedDatabaseTarget | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    if (!parsed.hostname) {
      return null;
    }

    const database = parsed.pathname.replace(/^\/+/, '');
    if (!database) {
      return null;
    }

    const port = parsed.port ? Number(parsed.port) : 5432;
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return null;
    }

    const hostLower = parsed.hostname.toLowerCase();
    const isNeonHost = hostLower.endsWith('.neon.tech');
    const isPooledHost = hostLower.includes('-pooler.');
    const sslMode = parsed.searchParams.get('sslmode');

    return {
      host: parsed.hostname,
      port,
      database,
      sslMode,
      isNeonHost,
      isPooledHost,
      redactedUrl: redactDatabaseUrl(rawUrl.trim()),
      protocol: parsed.protocol,
    };
  } catch {
    return null;
  }
}

export function parseDatabaseUrl(rawUrl: string): ParsedDatabaseTarget | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (POSTGRES_PROTOCOLS.has(parsed.protocol)) {
      return parsePostgresUrl(rawUrl);
    }
    if (!MYSQL_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    if (!parsed.hostname) {
      return null;
    }

    const database = parsed.pathname.replace(/^\/+/, '');
    if (!database) {
      return null;
    }

    const port = parsed.port ? Number(parsed.port) : 3306;
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return null;
    }

    return {
      host: parsed.hostname,
      port,
      database,
      sslMode: parsed.searchParams.get('sslmode'),
      isNeonHost: false,
      isPooledHost: false,
      redactedUrl: redactDatabaseUrl(rawUrl.trim()),
      protocol: parsed.protocol,
    };
  } catch {
    return null;
  }
}

export function inspectDatabaseConfig(
  env: Record<string, string | undefined> = process.env
): DatabaseConfigStatus {
  const issues: DatabaseConfigIssue[] = [];
  const rawRuntime = env.DATABASE_URL?.trim() ?? '';
  const rawDirect = env.DIRECT_URL?.trim() ?? '';

  let runtimeTarget: ParsedDatabaseTarget | null = null;
  let directTarget: ParsedDatabaseTarget | null = null;

  // 1. Validate runtime pooled DATABASE_URL
  if (!rawRuntime) {
    issues.push({
      code: 'MISSING_DATABASE_URL',
      severity: 'error',
      message:
        'DATABASE_URL is not set. Add your Neon pooled PostgreSQL connection string to your local .env file.',
    });
  } else if (isPlaceholderConnectionString(rawRuntime)) {
    issues.push({
      code: 'PLACEHOLDER_DATABASE_URL',
      severity: 'error',
      message:
        'DATABASE_URL still contains a placeholder value. Replace it with your actual Neon pooled PostgreSQL connection string in .env.',
    });
  } else {
    runtimeTarget = parseDatabaseUrl(rawRuntime);
    if (!runtimeTarget) {
      issues.push({
        code: 'INVALID_DATABASE_URL',
        severity: 'error',
        message:
          'DATABASE_URL must be a valid postgresql://, postgres://, or mysql:// URL including host and database name.',
      });
    } else {
      if (
        runtimeTarget.isNeonHost &&
        runtimeTarget.sslMode !== 'require' &&
        runtimeTarget.sslMode !== 'verify-full' &&
        runtimeTarget.sslMode !== 'verify-ca'
      ) {
        issues.push({
          code: 'INSECURE_SSL_MODE',
          severity: 'error',
          message:
            'Neon connections require TLS. Append ?sslmode=require to DATABASE_URL.',
        });
      }

      if (runtimeTarget.isNeonHost && !runtimeTarget.isPooledHost) {
        issues.push({
          code: 'UNPOOLED_DATABASE_URL_WARNING',
          severity: 'warning',
          message:
            'DATABASE_URL appears to point to an unpooled Neon host. Use the pooled Neon connection string (host containing "-pooler") for application runtime traffic.',
        });
      }
    }
  }

  // 2. Validate DIRECT_URL (recommended for Prisma CLI & migrations on PostgreSQL / Neon)
  const isMysqlTarget =
    runtimeTarget?.protocol?.startsWith('mysql') ||
    runtimeTarget?.protocol === 'mariadb:';

  if (!isMysqlTarget) {
    if (!rawDirect) {
      issues.push({
        code: 'MISSING_DIRECT_URL',
        severity: 'warning',
        message:
          'DIRECT_URL is not set. Set DIRECT_URL to your unpooled Neon connection string before running Prisma migrations.',
      });
    } else if (isPlaceholderConnectionString(rawDirect)) {
      issues.push({
        code: 'PLACEHOLDER_DIRECT_URL',
        severity: 'warning',
        message:
          'DIRECT_URL still contains a placeholder value. Replace it with your unpooled Neon connection string in .env.',
      });
    } else {
      directTarget = parseDatabaseUrl(rawDirect);
      if (!directTarget) {
        issues.push({
          code: 'INVALID_DIRECT_URL',
          severity: 'error',
          message:
            'DIRECT_URL must be a valid postgresql://, postgres://, or mysql:// URL including host and database name.',
        });
      } else if (directTarget.isNeonHost && directTarget.isPooledHost) {
        issues.push({
          code: 'POOLED_DIRECT_URL_WARNING',
          severity: 'warning',
          message:
            'DIRECT_URL points to a pooled Neon host ("-pooler"). Prisma CLI migrations require the direct (unpooled) Neon connection string.',
        });
      }
    }
  }

  const hasErrors = issues.some((issue) => issue.severity === 'error');

  return {
    configured: !hasErrors && runtimeTarget !== null,
    runtimeUrl: !hasErrors && runtimeTarget ? rawRuntime : null,
    directUrl: directTarget ? rawDirect : null,
    runtimeTarget,
    directTarget,
    issues,
  };
}

export function getRequiredRuntimeDatabaseUrl(
  env: Record<string, string | undefined> = process.env
): string {
  const status = inspectDatabaseConfig(env);
  if (!status.configured || !status.runtimeUrl) {
    const errorMessages = status.issues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => issue.message)
      .join(' ');
    throw new Error(
      `Neon PostgreSQL database is not configured. ${errorMessages || 'Set DATABASE_URL in your local .env file.'}`
    );
  }
  return status.runtimeUrl;
}
