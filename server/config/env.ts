import { z } from 'zod';
import { inspectDatabaseConfig, type DatabaseConfigStatus } from '@/server/db/config';

/**
 * Server Environment Variables Schema
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_BASE_DOMAIN: z.string().default('messmate.com'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export interface EnvironmentValidationReport {
  valid: boolean;
  environment: EnvConfig['NODE_ENV'];
  issues: string[];
  database: DatabaseConfigStatus;
}

/**
 * Validates the current runtime environment variables safely.
 * Never prints database credentials, passwords, or tokens in logs or outputs.
 */
export function validateEnvironment(): EnvironmentValidationReport {
  const parsed = envSchema.safeParse(process.env);
  const issues: string[] = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push(`ENV[${issue.path.join('.')}]: ${issue.message}`);
    }
  }

  const dbConfig = inspectDatabaseConfig();
  for (const dbIssue of dbConfig.issues) {
    if (dbIssue.severity === 'error') {
      issues.push(`DATABASE: ${dbIssue.message}`);
    }
  }

  return {
    valid: issues.length === 0 && dbConfig.configured,
    environment: (parsed.success ? parsed.data.NODE_ENV : process.env.NODE_ENV || 'development') as EnvConfig['NODE_ENV'],
    issues,
    database: dbConfig,
  };
}

/**
 * Returns validated environment settings with safe fallbacks.
 */
export function getEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    return {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      NEXT_PUBLIC_BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN || 'messmate.com',
      PORT: Number(process.env.PORT) || 3000,
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
    };
  }
  return result.data;
}
