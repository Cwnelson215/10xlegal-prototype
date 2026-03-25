import type { Response } from 'express';

export function apiResponse<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

export function apiError(res: Response, message: string, statusCode = 400): void {
  res.status(statusCode).json({
    success: false,
    error: message,
    message,
  });
}

interface PaginationParams {
  page: number;
  pageSize: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1);
  const maxSize = Number(query.pageSize) === 0 ? 10 : Number(query.pageSize);
  const pageSize = Math.max(1, maxSize || 10);
  return { page, pageSize };
}

export function paginatedResponse<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): void {
  res.status(200).json({
    data: items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
