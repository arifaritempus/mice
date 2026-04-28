'use client';

import { useEffect } from 'react';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/types/pagination';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  preferenceKey?: string;
  compactRight?: boolean;
}

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
};

const setCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
};

export default function PaginationControls({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  preferenceKey = 'list_page_size',
  compactRight = false
}: PaginationControlsProps) {
  // Cookie'den otomatik boyut yüklemeyi kaldırdık. Kullanıcı her girişinde
  // standart 20'lik liste açılsın, isterse çoğaltsın şeklinde talep etti.

  if (total <= 0) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  if (compactRight) {
    return (
      <div className="mt-2 flex justify-end border-t border-gray-200 pt-2 dark:border-gray-700">
        <div className="flex flex-nowrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <span className="whitespace-nowrap">{start}-{end} / {total} kayıt</span>
          <span className="whitespace-nowrap">Sayfa başına</span>
          <select
            value={pageSize}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            onChange={(e) => {
              const size = Number(e.target.value) || DEFAULT_PAGE_SIZE;
              setCookie(preferenceKey, String(size));
              onPageSizeChange(size);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-gray-600"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Önceki
          </button>
          <span className="px-1 text-xs text-gray-700 dark:text-gray-200">{page} / {totalPages}</span>
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-gray-600"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Sonraki
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="text-xs text-gray-600 dark:text-gray-300">
        {start}-{end} / {total} kayıt
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 dark:text-gray-300">Sayfa başına</span>
        <select
          value={pageSize}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          onChange={(e) => {
            const size = Number(e.target.value) || DEFAULT_PAGE_SIZE;
            setCookie(preferenceKey, String(size));
            onPageSizeChange(size);
          }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-gray-600"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Önceki
        </button>
        <span className="px-2 text-xs text-gray-700 dark:text-gray-200">
          {page} / {totalPages}
        </span>
        <button
          className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-gray-600"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}

