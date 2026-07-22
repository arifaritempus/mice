"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import moment from "moment";
import "moment/locale/tr";
import {
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
}

export default function NotificationModal({
  isOpen,
  onClose,
  notification,
}: NotificationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, mounted, onClose]);

  if (!isOpen || !notification || !mounted) return null;

  const typeConfig: Record<
    string,
    {
      container: string;
      iconBg: string;
      iconColor: string;
      icon: any;
      border: string;
      glow: string;
    }
  > = {
    info: {
      container: "bg-blue-500/10 dark:bg-blue-900/10",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: Info,
      border: "border-blue-100 dark:border-blue-800/50",
      glow: "shadow-blue-500/10",
    },
    warning: {
      container: "bg-amber-50 dark:bg-amber-900/10",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      icon: AlertTriangle,
      border: "border-amber-100 dark:border-amber-800/50",
      glow: "shadow-amber-500/10",
    },
    error: {
      container: "bg-red-50 dark:bg-red-900/10",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      icon: AlertCircle,
      border: "border-red-100 dark:border-red-800/50",
      glow: "shadow-red-500/10",
    },
    success: {
      container: "bg-emerald-50 dark:bg-emerald-900/10",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle2,
      border: "border-emerald-100 dark:border-emerald-800/50",
      glow: "shadow-emerald-500/10",
    },
  };

  const config = typeConfig[notification.type] || typeConfig.info;
  const Icon = config.icon;

  const isHtml = (str: string) => /<[a-z][\s\S]*>/i.test(str);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-3xl bg-white dark:bg-v3-surface rounded-[2rem] shadow-2xl overflow-hidden border ${config.border} animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]`}
      >
        {/* Header Section */}
        <div
          className={`p-6 md:p-8 flex items-start justify-between ${config.container} border-b ${config.border}`}
        >
          <div className="flex items-start gap-4 md:gap-6">
            <div
              className={`flex-shrink-0 w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center ${config.iconColor} shadow-lg ${config.glow}`}
            >
              <Icon size={32} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-v3-text leading-tight tracking-tight">
                {notification.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-v3-muted dark:text-v3-muted">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <Calendar size={14} className="opacity-70" />
                  {moment
                    .utc(notification.created_at)
                    .local()
                    .format("DD MMMM YYYY")}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <Clock size={14} className="opacity-70" />
                  {moment.utc(notification.created_at).local().format("HH:mm")}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-v3-border0 dark:bg-v3-border hover:bg-white/80 dark:hover:bg-v3-surface text-v3-muted hover:text-slate-600 dark:hover:text-v3-text rounded-full transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div
            className={`prose dark:prose-invert max-w-none 
            prose-headings:font-black prose-headings:tracking-tight
            prose-p:text-slate-600 dark:prose-p:text-v3-text prose-p:leading-relaxed
            prose-table:border prose-table:border-slate-200 dark:prose-table:border-slate-800 prose-table:rounded-xl prose-table:overflow-hidden
            prose-th:bg-slate-50 dark:prose-th:bg-v3-surface/50 prose-th:px-4 prose-th:py-3 prose-th:text-xs prose-th:font-black prose-th:uppercase prose-th:tracking-widest
            prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:border-t prose-td:border-slate-100 dark:prose-td:border-slate-800
          `}
          >
            {isHtml(notification.message) ? (
              <div
                dangerouslySetInnerHTML={{ __html: notification.message }}
                className="notification-html-content"
              />
            ) : (
              <p className="text-lg font-medium whitespace-pre-wrap">
                {notification.message}
              </p>
            )}
          </div>
        </div>

        {/* Action / Footer Section */}
        <div className="p-6 md:p-8 bg-v3-surface border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-v3-muted font-medium">
            Bu bildirim sistem tarafından otomatik olarak oluşturulmuştur.
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {notification.action_url && (
              <a
                href={notification.action_url}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-500/90 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Detaylara Git
                <ExternalLink size={18} />
              </a>
            )}
            <button
              onClick={onClose}
              className="flex-1 md:flex-none px-8 py-3 bg-white dark:bg-v3-surface text-slate-700 dark:text-v3-text rounded-2xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all active:scale-95"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .notification-html-content table {
          width: 100% !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          margin: 1.5rem 0 !important;
        }
        .notification-html-content th, 
        .notification-html-content td {
          border: 1px solid rgba(148, 163, 184, 0.1) !important;
        }
        .dark .notification-html-content th,
        .dark .notification-html-content td,
        .dark .notification-html-content p,
        .dark .notification-html-content div,
        .dark .notification-html-content span,
        .dark .notification-html-content strong,
        .dark .notification-html-content h1,
        .dark .notification-html-content h2,
        .dark .notification-html-content h3,
        .dark .notification-html-content h4,
        .dark .notification-html-content h5,
        .dark .notification-html-content h6 {
          color: #e2e8f0 !important;
          background-color: transparent !important;
        }
        .notification-html-content a[style*="display: inline-block"] {
          display: none !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.3); }
      `,
        }}
      />
    </div>,
    document.body,
  );
}
