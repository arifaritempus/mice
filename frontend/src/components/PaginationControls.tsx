"use client";

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/types/pagination";
import { useEffect } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  preferenceKey?: string;
  compactRight?: boolean;
  loadingHint?: string | null;
}

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
};

const setCookie = (name: string, value: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
};

export default function PaginationControls({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  preferenceKey = "list_page_size",
  compactRight = false,
  loadingHint = null,
}: PaginationControlsProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const cookieSize = Number(getCookie(preferenceKey) || "");
    if (
      PAGE_SIZE_OPTIONS.includes(cookieSize as any) &&
      cookieSize !== pageSize
    ) {
      onPageSizeChange(cookieSize);
    }
  }, [pageSize, onPageSizeChange, preferenceKey]);

  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = total > 0 ? Math.min(total, page * pageSize) : 0;

  if (total <= 0) {
    return (
      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 border-t border-gray-200 p-2 dark:border-gray-700 sm:gap-3 bg-v3-surface rounded-b-lg">
        <span className="shrink-0 whitespace-nowrap text-xs text-v3-muted">
          {t('pagination.totalZeroRecords') || "Toplam 0 kayıt"}
        </span>
        <span className="shrink-0 whitespace-nowrap text-xs text-v3-muted">
          {t('pagination.perPage') || "Sayfa başına"}
        </span>
        <select
          value={pageSize}
          className="shrink-0 rounded border border-v3-border bg-v3-surface px-2 py-1 text-xs text-v3-text border-v3-border dark:bg-gray-800 dark:text-v3-text"
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
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="rounded border border-v3-border px-2 py-1 text-xs disabled:opacity-40 text-v3-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            disabled={true}
          >
            {t('pagination.previous') || "Önceki"}
          </button>
          <span className="px-1 text-xs text-v3-text dark:text-gray-200">
            1 / 1
          </span>
          <button
            type="button"
            className="rounded border border-v3-border px-2 py-1 text-xs disabled:opacity-40 text-v3-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            disabled={true}
          >
            {t('pagination.next') || "Sonraki"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 border-t border-gray-200 p-2 dark:border-gray-700 sm:gap-3 bg-v3-surface rounded-b-lg">
      {loadingHint ? (
        <span className="flex shrink-0 flex-nowrap items-center gap-1.5 text-xs text-v3-muted">
          <span className="relative h-3.5 w-3.5 shrink-0" aria-hidden>
            <span className="absolute inset-0 rounded-full border border-gray-200 border-v3-border" />
            <span className="absolute inset-0 rounded-full border border-transparent border-t-blue-600 animate-spin dark:border-t-blue-400" />
          </span>
          <span className="max-w-[10rem] truncate whitespace-nowrap sm:max-w-none">
            {loadingHint}
          </span>
        </span>
      ) : null}
      <span className="shrink-0 whitespace-nowrap text-xs text-v3-muted">
        {total > 0 ? `${start}-${end} / ${total} ${t('pagination.records') || "kayıt"}` : (t('pagination.totalZeroRecords') || "Toplam 0 kayıt")}
      </span>
      <span className="shrink-0 whitespace-nowrap text-xs text-v3-muted">
        {t('pagination.perPage') || "Sayfa başına"}
      </span>
      <select
        value={pageSize}
        className="shrink-0 rounded border border-v3-border bg-v3-surface px-2 py-1 text-xs text-v3-text border-v3-border dark:bg-gray-800 dark:text-v3-text"
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
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="rounded border border-v3-border px-2 py-1 text-xs disabled:opacity-40 text-v3-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          disabled={page <= 1 || total <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          {t('pagination.previous') || "Önceki"}
        </button>
        <span className="px-1 text-xs text-v3-text dark:text-gray-200">
          {page} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          className="rounded border border-v3-border px-2 py-1 text-xs disabled:opacity-40 text-v3-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          disabled={page >= totalPages || total <= 0}
          onClick={() => onPageChange(page + 1)}
        >
          {t('pagination.next') || "Sonraki"}
        </button>
      </div>
    </div>
  );
}
