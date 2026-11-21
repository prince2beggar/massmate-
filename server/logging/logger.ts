/**
 * MessMate — Structured Server-Side Logger (Task 23)
 *
 * Implements lightweight, structured server-side logging.
 *
 * Security Requirements:
 * - Automatically redacts passwords, tokens, authorization headers, and payment secrets.
 * - Emits clean ISO-8601 timestamps and optional correlation/request IDs.
 * - Zero third-party runtime monitoring dependencies.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /hash/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /card/i,
  /cvv/i,
];

/**
 * Recursively redacts sensitive keys from log metadata.
 */
export function sanitizeLogData(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact postgres connection strings containing passwords
    return data.replace(/(:)([^:@/]+)(@)/g, '$1[REDACTED]$3');
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(val);
      }
    }
    return sanitized;
  }

  return data;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  context?: unknown;
}

export class Logger {
  private formatLog(level: LogLevel, message: string, context?: unknown, correlationId?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      context: context ? sanitizeLogData(context) : undefined,
    };
  }

  debug(message: string, context?: unknown, correlationId?: string) {
    if (process.env.NODE_ENV !== 'production') {
      const entry = this.formatLog('debug', message, context, correlationId);
      console.debug(JSON.stringify(entry));
    }
  }

  info(message: string, context?: unknown, correlationId?: string) {
    const entry = this.formatLog('info', message, context, correlationId);
    console.info(JSON.stringify(entry));
  }

  warn(message: string, context?: unknown, correlationId?: string) {
    const entry = this.formatLog('warn', message, context, correlationId);
    console.warn(JSON.stringify(entry));
  }

  error(message: string, context?: unknown, correlationId?: string) {
    const entry = this.formatLog('error', message, context, correlationId);
    console.error(JSON.stringify(entry));
  }
}

export const logger = new Logger();
