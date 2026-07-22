"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authService } from "@/lib/auth";
import { useTheme } from "@/components/providers/ThemeProvider";
import { SettingsService } from "@/lib/supabaseService";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const { isDark } = useTheme();
  const [appSettings, setAppSettings] = useState<any>(null);
  const [menuLogo, setMenuLogo] = useState<string>("");
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    const loadMenuLogo = async () => {
      try {
        const settings = await SettingsService.getSettings();
        const generalSettings = settings.general_settings || {};
        setAppSettings(generalSettings);

        const currentLogo =
          generalSettings.darkMenuLogo ||
          generalSettings.dark_menu_logo ||
          generalSettings.darkIconLogo ||
          generalSettings.dark_icon_logo ||
          generalSettings.darkWordmarkLogo ||
          generalSettings.dark_wordmark_logo ||
          generalSettings.lightMenuLogo ||
          generalSettings.light_menu_logo ||
          generalSettings.lightIconLogo ||
          generalSettings.light_icon_logo ||
          generalSettings.lightWordmarkLogo ||
          generalSettings.light_wordmark_logo;
        setMenuLogo(currentLogo || "");
      } catch {
        setMenuLogo("");
      } finally {
        setLogoLoading(false);
      }
    };
    loadMenuLogo();
  }, [isDark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await authService.resetPassword(email);
      setSuccess(true);
    } catch (error: any) {
      console.error("Şifre sıfırlama hatası:", error);
      setError(
        error.message ||
          "Şifre sıfırlama e-postası gönderilirken bir hata oluştu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-v3-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-v3-bg/80 to-v3-bg z-0" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel backdrop-blur-2xl bg-v3-border border border-v3-border shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-2xl p-8 sm:p-10 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="text-center mb-8 flex flex-col items-center">
            {!logoLoading && menuLogo ? (
              <div className="mb-6 relative h-16 w-full flex justify-center">
                <img
                  src={menuLogo}
                  alt="System Logo"
                  className="h-full object-contain drop-shadow-2xl"
                  key={menuLogo}
                />
              </div>
            ) : !logoLoading ? (
              <div className="mb-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                <span className="text-v3-text text-2xl font-bold">
                  {appSettings?.company_name
                    ? appSettings.company_name.substring(0, 2).toUpperCase()
                    : process.env.NEXT_PUBLIC_AGENCY_NAME
                      ? process.env.NEXT_PUBLIC_AGENCY_NAME.substring(0, 2).toUpperCase()
                      : "TT"}
                </span>
              </div>
            ) : (
              <div className="mb-6 h-16 w-16" />
            )}
            
            <h1 className="text-3xl font-light tracking-[0.2em] text-v3-text mb-2">
              Şifremi Unuttum
            </h1>
            <p className="text-sm text-v3-muted mt-1">
              {success
                ? "Sıfırlama bağlantısı gönderildi"
                : "Kayıtlı e-posta adresinizi girin"}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
              <span className="text-sm leading-relaxed">{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-5">
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm">
                E-posta adresinize şifre sıfırlama bağlantısı gönderdik. Lütfen
                gelen kutunuzu kontrol edin.
              </div>
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-v3-text bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center"
              >
                Giriş Ekranına Dön
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-v3-muted mb-1.5"
                >
                  E-posta Adresi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-v3-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-v3-surface border border-v3-border rounded-lg text-sm text-v3-text placeholder:text-v3-muted focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  placeholder="e.g., alex.chen@nexus.co"
                />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Link
                  href="/login"
                  className="text-xs text-v3-muted hover:text-v3-text transition-colors duration-200"
                >
                  Geri dön
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-v3-text bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#020617] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
