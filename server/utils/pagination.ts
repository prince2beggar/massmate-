import type { PaginationMeta } from '@/types/api';

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

/**
 * Parses and sanitizes page and limit numbers from search params or raw objects.
 * Prevents negative, NaN, or unbounded limits.
 */
export function parsePaginationParams(
  query: URLSearchParams | { page?: any; limit?: any } | null | undefined,
  options: PaginationOptions = {}
): ParsedPagination {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;

  let rawPage: any;
  let rawLimit: any;

  if (query instanceof URLSearchParams) {
    rawPage = query.get('page');
    rawLimit = query.get('limit');
  } else if (query && typeof query === 'object') {
    rawPage = query.page;
    rawLimit = query.limit;
  }

  const parsedPage = Math.floor(Number(rawPage));
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const parsedLimit = Math.floor(Number(rawLimit));
  let limit = Number.isFinite(parsedLimit) && parsedLimit >= 1 ? parsedLimit : defaultLimit;

  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;
  const take = limit;

  return { page, limit, skip, take };
}

/**
 * Builds standard PaginationMeta from total record count, page, and limit.
 */
export function buildPaginationMeta(
  totalCount: number,
  page: number,
  limit: number
): PaginationMeta {
  const safeTotal = Math.max(0, Math.floor(totalCount));
  const safeLimit = Math.max(1, Math.floor(limit));
  const safePage = Math.max(1, Math.floor(page));

  const totalPages = Math.ceil(safeTotal / safeLimit) || 1;
  const hasNextPage = safePage < totalPages;
  const hasPreviousPage = safePage > 1 && safePage <= totalPages + 1;

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}
