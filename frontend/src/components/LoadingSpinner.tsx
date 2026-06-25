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
    : "min-h-dvh w-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top_right,#1e3a8a33,transparent_40%),radial-gradient(circle_at_bottom_left,#7e22ce2e,transparent_45%),#030712] z-50";

  return (
    <div className={shellClass} role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0e1a2f]/80 px-7 py-6 shadow-[0_20px_50px_-30px_rgba(59,130,246,0.7)] backdrop-blur-xl">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-4 border-slate-700/60"></div>
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

        {message && <p className="mt-3 text-white text-sm">{message}</p>}
      </div>
    </div>
  );
}
