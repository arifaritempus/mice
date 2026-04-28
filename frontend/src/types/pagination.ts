export const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 1000] as const;
export const DEFAULT_PAGE_SIZE = 20;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const safePageSize = Math.max(1, Number(pageSize || DEFAULT_PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, Number(page || 1)), totalPages);
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;

  return {
    items: items.slice(start, end),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages
  };
}

