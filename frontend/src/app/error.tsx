"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
      <div className="text-center">
        <div className="text-red-500 dark:text-red-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('error.title') || "Bir Hata Oluştu"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error.message || t('error.unexpected') || "Beklenmeyen bir hata oluştu"}
        </p>
        <button
          onClick={reset}
          className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
        >
          {t('error.retry') || "Tekrar Dene"}
        </button>
      </div>
    </div>
  );
}
