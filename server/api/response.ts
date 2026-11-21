import { NextResponse } from 'next/server';
import type { ApiResponse, ApiErrorCode, ApiErrorDetail, PaginationMeta } from '@/types/api';

/**
 * Constructs a standardized JSON successful response.
 *
 * @param data - Payload object or array
 * @param message - User-friendly confirmation message
 * @param meta - Optional metadata or pagination
 * @param statusCode - HTTP status code (default: 200)
 */
export function apiSuccess<T>(
  data: T,
  message = 'Request completed successfully',
  meta: PaginationMeta | Record<string, unknown> | null = null,
  statusCode = 200
): NextResponse<ApiResponse<T>> {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return NextResponse.json(payload, { status: statusCode });
}

/**
 * Constructs a standardized JSON error response.
 *
 * @param code - Standardized error code from ApiErrorCode
 * @param message - Sanitized user-facing error narrative
 * @param details - Optional list of validation or context details
 * @param statusCode - HTTP status code (e.g. 400, 403, 404, 500)
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  details: ApiErrorDetail[] = [],
  statusCode = 400
): NextResponse<ApiResponse<null>> {
  const payload: ApiResponse<null> = {
    success: false,
    message,
    error: {
      code,
      details: details.length > 0 ? details : undefined,
    },
  };
  return NextResponse.json(payload, { status: statusCode });
}

/**
 * Constructs a standardized paginated list response.
 */
export function apiPaginated<T>(
  data: T[],
  pagination: PaginationMeta,
  message = 'Records retrieved successfully'
): NextResponse<ApiResponse<T[]>> {
  return apiSuccess(data, message, pagination, 200);
}
