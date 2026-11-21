import { NextResponse } from 'next/server';
import { apiError } from './response';
import type { ApiErrorCode, ApiErrorDetail } from '@/types/api';
import { TenantSecurityError } from '@/server/tenant/errors';
import { AuthorizationError } from '@/server/rbac/errors';

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details: ApiErrorDetail[];

  constructor(
    message: string,
    code: ApiErrorCode = 'INTERNAL_SERVER_ERROR',
    statusCode = 500,
    details: ApiErrorDetail[] = []
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Request validation failed', details: ApiErrorDetail[] = []) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource was not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'A resource with these details already exists') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden.') {
    super(message, 'PERMISSION_DENIED', 403);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, 'UNAUTHENTICATED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'A database error occurred while processing the request.') {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
  }
}

/**
 * Centralized API Error Handler
 *
 * Translates application exceptions, Prisma database errors, and RBAC/Tenant violations
 * into consistent, sanitized JSON responses.
 *
 * Security Requirements:
 * - Never leak database passwords, SQL statements, or file paths in error responses.
 * - Log internal error details server-side.
 */
export function handleApiError(error: unknown, correlationId?: string): NextResponse {
  // 1. Explicit AppError instances
  if (error instanceof AppError) {
    return apiError(error.code, error.message, error.details, error.statusCode);
  }

  // 2. Multi-Tenant Security Errors (Task 22)
  if (error instanceof TenantSecurityError) {
    return apiError(
      error.code as ApiErrorCode,
      error.message,
      [],
      error.statusCode
    );
  }

  // 3. RBAC Authorization Errors (Task 21)
  if (error instanceof AuthorizationError) {
    return apiError(
      error.code === 'FORBIDDEN' ? 'PERMISSION_DENIED' : (error.code as ApiErrorCode),
      error.message,
      [],
      error.statusCode
    );
  }

  // 4. Prisma / Database Errors (safe mapping without SQL exposure)
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaErr = error as { code: string; message?: string; meta?: any };

    // P2002: Unique constraint violation
    if (prismaErr.code === 'P2002') {
      const target = prismaErr.meta?.target;
      const field = Array.isArray(target) ? target.join(', ') : target;
      return apiError(
        'CONFLICT',
        field
          ? `A record with this ${field} already exists.`
          : 'A duplicate record conflict occurred.',
        [],
        409
      );
    }

    // P2025: Record not found
    if (prismaErr.code === 'P2025') {
      return apiError('NOT_FOUND', 'Requested record does not exist.', [], 404);
    }

    // P2003: Foreign key constraint failure
    if (prismaErr.code === 'P2003') {
      return apiError(
        'CROSS_TENANT_VIOLATION',
        'Referenced entity does not exist or belongs to another scope.',
        [],
        400
      );
    }

    // Generic DB error
    console.error(`[DB_ERROR][${correlationId || 'unknown'}]:`, prismaErr.code, prismaErr.message);
    return apiError(
      'DATABASE_ERROR',
      'A database operation failed. Please try again later.',
      [],
      500
    );
  }

  // 5. Generic / Unexpected Internal Error
  const message = error instanceof Error ? error.message : 'An unexpected server error occurred';
  console.error(`[INTERNAL_ERROR][${correlationId || 'unknown'}]:`, error);

  return apiError(
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'development' ? message : 'An unexpected server error occurred.',
    [],
    500
  );
}
