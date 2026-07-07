"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { usePermissions, Module } from "@/lib/permissions";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SettingsPage() {
  const { canView, loading: permissionsLoading } = usePermissions();

  const [settings, setSettings] = useState({
    // Şirket Bilgileri
    companyName:
      typeof document !== "undefined"
        ? document.title.split("-")[0].trim()
        : "Firma",
    companyEmail: "info@tempustravel.com",
    companyPhone: "+90 212 555 0000",
    companyAddress: "İstanbul, Türkiye",

    // Sistem Ayarları
    defaultCurrency: "EUR",
    timezone: "Europe/Istanbul",
    dateFormat: "DD.MM.YYYY",
    language: "tr",

    // Mail Ayarları
    smtpServer: "smtp.mailgun.org",
    smtpPort: "587",
    smtpUser: "postmaster@mail.tempustravel.com",
    smtpPass: "********",
    smtpSecure: "tls",
    mailFromName: "Tempus Travel",
    mailFromEmail: "noreply@tempustravel.com",
    mailReplyTo: "info@tempustravel.com",

    // AI Asistan
    aiAssistantEnabled: true,

    // Renk Ayarları (Genel)
    colorPrimary: "#2563eb",
    colorSecondary: "#6b7280",
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInfo: "#3b82f6",

    // Koyu Tema Renkleri
    darkBgMain: "#101927",
    darkBgSecondary: "#101927",
    darkCard: "#1f2937",
    darkSidebar: "#1f2937",
    darkSidebarHeader: "#1f2937",
    darkText: "#f9fafb",
    darkSidebarBorder: "#1f2937",

    // Açık Tema Renkleri
    lightBgMain: "#d3cbbe",
    lightBgSecondary: "#d3cbbe",
    lightCard: "#e7e7e5",
    lightSidebar: "#e7e7e5",
    lightSidebarHeader: "#e7e7e5",
    lightText: "#101827",
    lightSidebarBorder: "#e7e7e5",
  });

  const [activeTab, setActiveTab] = useState("company");

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.SETTINGS)) {
    return (
      <div className="h-full w-full p-6 sm:p-8 flex items-center justify-center font-sans text-white">
        <div className="text-center">
          <h1 className="text-2xl font-light text-white glow-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Sistem Ayarları sayfasına erişim için yetkiniz bulunmuyor.
          </p>
          <a
            href="/"
            className="px-6 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] uppercase inline-block"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    const loadingToast = toast.loading("Ayarlar kaydediliyor...");
    try {
      const res = await fetch("/api/theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Ayarlar başarıyla kaydedildi!", { id: loadingToast });
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        toast.error("Ayarlar kaydedilirken hata oluştu!", { id: loadingToast });
      }
    } catch (e) {
      toast.error("Beklenmeyen bir hata oluştu!", { id: loadingToast });
    }
  };

  const handleTestMail = () => {
    toast.success("Test maili başarıyla gönderildi!");
  };

  const tabs = [
    { id: "company", label: "Şirket & Sistem" },
    { id: "logos", label: "Logolar" },
    { id: "mail", label: "Mail Ayarları" },
    { id: "ai", label: "AI Asistan" },
    { id: "colors", label: "Renk Ayarları" },
  ];

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4 shrink-0">
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-white glow-text uppercase">
                Ayarlar
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Sistem genelinde ayarları yapılandırın
              </p>
            </div>
          </div>
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            <button
              onClick={handleSave}
              className="h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              AYARLARI KAYDET
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${activeTab === tab.id ? "bg-blue-500/20 border border-blue-500/30 text-blue-300" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8">
          {/* TAB: ŞİRKET & SİSTEM */}
          {activeTab === "company" && (
            <div className="space-y-6">
              {/* Şirket Bilgileri */}
              <div className="bg-[#0f172a]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/10 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Şirket Bilgileri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Şirket Adı *
                    </label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          companyName: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      E-posta *
                    </label>
                    <input
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          companyEmail: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Telefon
                    </label>
                    <input
                      type="text"
                      value={settings.companyPhone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          companyPhone: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Adres
                    </label>
                    <textarea
                      rows={2}
                      value={settings.companyAddress}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          companyAddress: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sistem Ayarları */}
              <div className="bg-[#0f172a]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/10 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  Sistem Ayarları
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Varsayılan Para Birimi
                    </label>
                    <select
                      value={settings.defaultCurrency}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultCurrency: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all appearance-none"
                    >
                      <option value="EUR" className="bg-[#0f172a]">
                        EUR (Euro)
                      </option>
                      <option value="USD" className="bg-[#0f172a]">
                        USD (Dolar)
                      </option>
                      <option value="TRY" className="bg-[#0f172a]">
                        TRY (Türk Lirası)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Saat Dilimi
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) =>
                        setSettings({ ...settings, timezone: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all appearance-none"
                    >
                      <option value="Europe/Istanbul" className="bg-[#0f172a]">
                        Europe/Istanbul (GMT+3)
                      </option>
                      <option value="Europe/London" className="bg-[#0f172a]">
                        Europe/London (GMT+0)
                      </option>
                      <option value="UTC" className="bg-[#0f172a]">
                        UTC
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Tarih Formatı
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) =>
                        setSettings({ ...settings, dateFormat: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all appearance-none"
                    >
                      <option value="DD.MM.YYYY" className="bg-[#0f172a]">
                        DD.MM.YYYY (31.12.2023)
                      </option>
                      <option value="MM/DD/YYYY" className="bg-[#0f172a]">
                        MM/DD/YYYY (12/31/2023)
                      </option>
                      <option value="YYYY-MM-DD" className="bg-[#0f172a]">
                        YYYY-MM-DD (2023-12-31)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Dil
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) =>
                        setSettings({ ...settings, language: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all appearance-none"
                    >
                      <option value="tr" className="bg-[#0f172a]">
                        Türkçe
                      </option>
                      <option value="en" className="bg-[#0f172a]">
                        English
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LOGOLAR */}
          {activeTab === "logos" && (
            <div className="space-y-6">
              <div className="bg-[#0f172a]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm">
                <div className="mb-6 pb-4 border-b border-white/10">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Logolar
                  </h2>
                  <p className="text-xs text-slate-400 mt-2">
                    PNG tercih edilir. İkon logo kare, wordmark logo yatay, menü
                    logo yatay önerilir. Tema değişikliklerinde logolar otomatik
                    olarak güncellenir.
                  </p>
                </div>

                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest mb-4">
                  Koyu Tema Logoları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    "Koyu Tema İkon Logo (Dark Icon)",
                    "Koyu Tema Wordmark Logo (Dark Wordmark)",
                    "Koyu Tema Menü Logo (Dark Menu)",
                  ].map((l, i) => (
                    <div
                      key={i}
                      className="border border-white/10 bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-4 text-center"
                    >
                      <div className="w-full aspect-[4/3] bg-[#0a0f18] rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500">
                        <svg
                          className="w-8 h-8 mb-2 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                          />
                        </svg>
                        <span className="text-[10px] px-2">{l}</span>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 text-[10px] py-1.5 rounded-lg uppercase tracking-wider font-bold transition-all">
                          Yükle
                        </button>
                        <button className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-[10px] py-1.5 rounded-lg uppercase tracking-wider font-bold transition-all">
                          Kaldır
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest mb-4">
                  Açık Tema Logoları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    "Açık Tema İkon Logo (Light Icon)",
                    "Açık Tema Wordmark Logo (Light Wordmark)",
                    "Açık Tema Menü Logo (Light Menu)",
                  ].map((l, i) => (
                    <div
                      key={i}
                      className="border border-white/10 bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-4 text-center"
                    >
                      <div className="w-full aspect-[4/3] bg-white rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <svg
                          className="w-8 h-8 mb-2 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                          />
                        </svg>
                        <span className="text-[10px] px-2">{l}</span>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 text-[10px] py-1.5 rounded-lg uppercase tracking-wider font-bold transition-all">
                          Yükle
                        </button>
                        <button className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-[10px] py-1.5 rounded-lg uppercase tracking-wider font-bold transition-all">
                          Kaldır
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MAIL AYARLARI */}
          {activeTab === "mail" && (
            <div className="bg-[#0f172a]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm">
              <div className="mb-6 pb-4 border-b border-white/10">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Mail Ayarları
                </h2>
                <p className="text-xs text-slate-400 mt-2">
                  Sistem otomatik mail gönderimi için SMTP ayarları. Bu ayarlar
                  sistem genelinde kullanılacaktır.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    SMTP Sunucu
                  </label>
                  <input
                    type="text"
                    value={settings.smtpServer}
                    onChange={(e) =>
                      setSettings({ ...settings, smtpServer: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    SMTP Port
                  </label>
                  <input
                    type="text"
                    value={settings.smtpPort}
                    onChange={(e) =>
                      setSettings({ ...settings, smtpPort: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    SMTP Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    value={settings.smtpUser}
                    onChange={(e) =>
                      setSettings({ ...settings, smtpUser: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    SMTP Şifre
                  </label>
                  <input
                    type="password"
                    value={settings.smtpPass}
                    onChange={(e) =>
                      setSettings({ ...settings, smtpPass: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Güvenli Bağlantı (SSL/TLS)
                  </label>
                  <select
                    value={settings.smtpSecure}
                    onChange={(e) =>
                      setSettings({ ...settings, smtpSecure: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all appearance-none"
                  >
                    <option value="tls" className="bg-[#0f172a]">
                      TLS
                    </option>
                    <option value="ssl" className="bg-[#0f172a]">
                      SSL
                    </option>
                    <option value="none" className="bg-[#0f172a]">
                      None
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-white/10 pt-6">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Gönderen Adı
                  </label>
                  <input
                    type="text"
                    value={settings.mailFromName}
                    onChange={(e) =>
                      setSettings({ ...settings, mailFromName: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Gönderen E-posta
                  </label>
                  <input
                    type="email"
                    value={settings.mailFromEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mailFromEmail: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Yanıt Adresi
                  </label>
                  <input
                    type="email"
                    value={settings.mailReplyTo}
                    onChange={(e) =>
                      setSettings({ ...settings, mailReplyTo: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Mail Ayarlarını Test Et
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Test maili göndererek ayarların doğru çalıştığını kontrol
                    edin
                  </p>
                </div>
                <button
                  onClick={handleTestMail}
                  className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 text-[10px] px-6 py-2.5 rounded-xl uppercase tracking-wider font-bold transition-all shadow-sm"
                >
                  Test Gönder
                </button>
              </div>
            </div>
          )}

          {/* TAB: AI ASİSTAN */}
          {activeTab === "ai" && (
            <div className="bg-[#0f172a]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm">
              <div className="mb-6 pb-4 border-b border-white/10">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  AI Asistan Ayarları
                </h2>
              </div>
              <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-medium text-white">
                    Sistemde Yapay Zeka Asistanını Göster
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Aktif edildiğinde ekranın sağ alt köşesinde AI asistan
                    butonu belirir. Pasif edilirse sistemden gizlenir.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.aiAssistantEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiAssistantEnabled: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB: RENK AYARLARI */}
          {activeTab === "colors" && (
            <div className="space-y-6">
              {/* Genel Renkler */}
              <div className="bg-[#0f172a]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm">
                <div className="mb-6 pb-4 border-b border-white/10">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    Renk Ayarları
                  </h2>
                  <p className="text-xs text-slate-400 mt-2">
                    Sistem genelinde kullanılacak renkleri özelleştirin. Renkler
                    CSS değişkenleri olarak uygulanır.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                  {[
                    { label: "Ana Renk (Primary)", key: "colorPrimary" },
                    { label: "İkincil (Secondary)", key: "colorSecondary" },
                    { label: "Başarı (Success)", key: "colorSuccess" },
                    { label: "Uyarı (Warning)", key: "colorWarning" },
                    { label: "Hata (Error)", key: "colorError" },
                    { label: "Bilgi (Info)", key: "colorInfo" },
                  ].map((color) => (
                    <div key={color.key} className="flex flex-col gap-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {color.label}
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={(settings as any)[color.key]}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              [color.key]: e.target.value,
                            })
                          }
                          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={(settings as any)[color.key]}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              [color.key]: e.target.value,
                            })
                          }
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500/50 outline-none uppercase font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 border-t border-white/10 pt-4">
                  Renk Önizleme
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                    style={{ backgroundColor: settings.colorPrimary }}
                  >
                    Primary
                  </span>
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                    style={{ backgroundColor: settings.colorSecondary }}
                  >
                    Secondary
                  </span>
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                    style={{ backgroundColor: settings.colorSuccess }}
                  >
                    Success
                  </span>
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                    style={{ backgroundColor: settings.colorWarning }}
                  >
                    Warning
                  </span>
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                    style={{ backgroundColor: settings.colorError }}
                  >
                    Error
                  </span>
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                    style={{ backgroundColor: settings.colorInfo }}
                  >
                    Info
                  </span>
                </div>
              </div>

              {/* Koyu/Açık Tema Renkleri Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Koyu Tema */}
                <div className="bg-[#0f172a]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                    Koyu Tema Renk Ayarları
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-6 pb-4 border-b border-white/10">
                    Koyu tema için zemin, kart, sidebar ve yazı renklerini
                    özelleştirin.
                  </p>

                  <div className="space-y-4">
                    {[
                      { label: "Ana Zemin Rengi", key: "darkBgMain" },
                      { label: "İkincil Zemin Rengi", key: "darkBgSecondary" },
                      { label: "Kart Rengi", key: "darkCard" },
                      { label: "Sidebar Menü Rengi", key: "darkSidebar" },
                      {
                        label: "Sidebar Header Rengi",
                        key: "darkSidebarHeader",
                      },
                      { label: "Yazı Rengi", key: "darkText" },
                      {
                        label: "Sidebar Çerçeve Rengi",
                        key: "darkSidebarBorder",
                      },
                    ].map((c) => (
                      <div
                        key={c.key}
                        className="flex items-center justify-between gap-4"
                      >
                        <label className="text-xs font-medium text-white w-1/2">
                          {c.label}
                        </label>
                        <div className="flex gap-2 items-center flex-1">
                          <input
                            type="color"
                            value={(settings as any)[c.key]}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                [c.key]: e.target.value,
                              })
                            }
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input
                            type="text"
                            value={(settings as any)[c.key]}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                [c.key]: e.target.value,
                              })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500/50 outline-none uppercase font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Açık Tema */}
                <div className="bg-white/95 border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden text-slate-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-white -z-10"></div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">
                    Açık Tema Renk Ayarları
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-6 pb-4 border-b border-slate-200">
                    Açık tema için zemin, kart, sidebar ve yazı renklerini
                    özelleştirin.
                  </p>

                  <div className="space-y-4">
                    {[
                      { label: "Ana Zemin Rengi", key: "lightBgMain" },
                      { label: "İkincil Zemin Rengi", key: "lightBgSecondary" },
                      { label: "Kart Rengi", key: "lightCard" },
                      { label: "Sidebar Menü Rengi", key: "lightSidebar" },
                      {
                        label: "Sidebar Header Rengi",
                        key: "lightSidebarHeader",
                      },
                      { label: "Yazı Rengi", key: "lightText" },
                      {
                        label: "Sidebar Çerçeve Rengi",
                        key: "lightSidebarBorder",
                      },
                    ].map((c) => (
                      <div
                        key={c.key}
                        className="flex items-center justify-between gap-4"
                      >
                        <label className="text-xs font-medium text-slate-600 w-1/2">
                          {c.label}
                        </label>
                        <div className="flex gap-2 items-center flex-1">
                          <input
                            type="color"
                            value={(settings as any)[c.key]}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                [c.key]: e.target.value,
                              })
                            }
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0 border border-slate-300"
                          />
                          <input
                            type="text"
                            value={(settings as any)[c.key]}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                [c.key]: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500/50 outline-none uppercase font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
