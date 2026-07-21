"use client";

interface LoadingSpinnerProps {
  message?: string;
  /** Modal / tablo içi: tam ekran fixed kaplamaz; Next.js layout-router scroll uyarısını tetiklemez */
  compact?: boolean;
}

export default function LoadingSpinner({
  message = "Yükleniyor...",
  compact = false,
}: LoadingSpinnerProps) {
  const shellClass = compact
    ? "flex flex-col items-center justify-center"
    : "min-h-dvh w-full flex flex-col items-center justify-center bg-v3-bg z-50";

  return (
    <div className={shellClass} role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-v3-border bg-v3-surface px-7 py-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-4 border-black/10 dark:border-white/10"></div>
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"></div>
          <div
            className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-transparent border-r-indigo-400 animate-spin"
            style={{ animationDelay: "0.12s", animationDuration: "1.4s" }}
          ></div>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse [animation-delay:120ms]"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse [animation-delay:240ms]"></span>
        </div>

        {message && <p className="mt-3 text-v3-text text-sm">{message}</p>}
      </div>
    </div>
  );
}
