/**
 * MessMate — Standard API Type Definitions (Task 23)
 *
 * Defines consistent response contracts, error categories, and pagination metadata
 * across all current and future MessMate backend routes.
 */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'PERMISSION_DENIED'
  | 'TENANT_ACCESS_DENIED'
  | 'TENANT_SUSPENDED'
  | 'TENANT_INACTIVE'
  | 'MEMBERSHIP_INACTIVE'
  | 'CROSS_TENANT_VIOLATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'DATABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorPayload {
  code: ApiErrorCode;
  details?: ApiErrorDetail[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Canonical Standard API Response Contract
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta | Record<string, unknown> | null;
  error?: ApiErrorPayload;
}
