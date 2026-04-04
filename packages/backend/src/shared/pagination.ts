import type { Context } from "hono";

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(c: Context): PaginationParams {
  const rawLimit = c.req.query("limit");
  const rawOffset = c.req.query("offset");

  let limit = rawLimit ? parseInt(rawLimit, 10) : DEFAULT_LIMIT;
  let offset = rawOffset ? parseInt(rawOffset, 10) : 0;

  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (isNaN(offset) || offset < 0) offset = 0;

  return { limit, offset };
}

export function paginated<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      limit: params.limit,
      offset: params.offset,
      total,
      hasMore: params.offset + params.limit < total,
    },
  };
}
