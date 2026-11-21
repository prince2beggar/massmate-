import { z } from 'zod';
import { ValidationError } from './errors';
import type { ApiErrorDetail } from '@/types/api';

/**
 * Reusable Zod Validation Schemas
 */
export const cuidSchema = z
  .string()
  .min(20, 'Invalid CUID identifier')
  .max(32, 'CUID identifier too long');

export const slugSchema = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(64, 'Slug cannot exceed 64 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase alphanumeric characters and hyphens');

export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(255, 'Email cannot exceed 255 characters');

export const phoneSchema = z
  .string()
  .regex(/^[+]?[\d\s\-()]{8,20}$/, 'Please enter a valid international or local phone number');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Converts ZodIssues into standardized ApiErrorDetail objects.
 */
export function formatZodIssues(issues: z.ZodIssue[]): ApiErrorDetail[] {
  return issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Validates JSON request body against a Zod schema.
 * Throws ValidationError with structured details if invalid.
 */
export async function validateBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError('Malformed JSON in request body');
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(
      'Invalid request payload',
      formatZodIssues(result.error.issues)
    );
  }

  return result.data;
}

/**
 * Validates URL query parameters against a Zod schema.
 */
export function validateQuery<T>(
  reqOrParams: Request | URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const searchParams =
    reqOrParams instanceof Request
      ? new URL(reqOrParams.url).searchParams
      : reqOrParams;

  const rawObj: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    rawObj[key] = val;
  });

  const result = schema.safeParse(rawObj);
  if (!result.success) {
    throw new ValidationError(
      'Invalid query parameters',
      formatZodIssues(result.error.issues)
    );
  }

  return result.data;
}

/**
 * Validates route parameters (e.g., params in dynamic Next.js routes).
 */
export function validateParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): T {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new ValidationError(
      'Invalid route parameters',
      formatZodIssues(result.error.issues)
    );
  }

  return result.data;
}
